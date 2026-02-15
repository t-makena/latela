import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  return data.access_token;
}

async function createSpreadsheet(
  accessToken: string,
  title: string,
  headers: string[],
  rows: string[][]
): Promise<string> {
  // 1. Create spreadsheet
  const createRes = await fetch(SHEETS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: "Data" } }],
    }),
  });

  const sheet = await createRes.json();
  if (!createRes.ok) throw new Error(`Create sheet failed: ${JSON.stringify(sheet.error)}`);
  const spreadsheetId = sheet.spreadsheetId;

  // 2. Populate with data
  const values = [headers, ...rows];
  const range = `Data!A1:${String.fromCharCode(64 + headers.length)}${values.length}`;

  const updateRes = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ range, majorDimension: "ROWS", values }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(`Update values failed: ${JSON.stringify(err.error)}`);
  }

  // 3. Auto-resize columns and bold headers
  await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId: 0, dimension: "COLUMNS", startIndex: 0, endIndex: headers.length },
          },
        },
      ],
    }),
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action } = body;

    // ── GET AUTH URL ──
    if (action === "get-auth-url") {
      const { redirectUri } = body;
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: userId,
      });

      return jsonResponse({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ── EXCHANGE CODE ──
    if (action === "exchange-code") {
      const { code, redirectUri } = body;
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return jsonResponse(
          { error: `Token exchange failed: ${tokenData.error_description || tokenData.error}` },
          400
        );
      }

      // Store refresh token using service role to bypass RLS for this update
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: updateError } = await serviceClient
        .from("user_settings")
        .update({ google_sheets_refresh_token: tokenData.refresh_token })
        .eq("user_id", userId);

      if (updateError) {
        return jsonResponse({ error: `Failed to store token: ${updateError.message}` }, 500);
      }

      return jsonResponse({ success: true });
    }

    // ── EXPORT ──
    if (action === "export") {
      const { data: rows, headers, title } = body;

      // Get stored refresh token
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("google_sheets_refresh_token")
        .eq("user_id", userId)
        .single();

      if (settingsError || !settings?.google_sheets_refresh_token) {
        return jsonResponse({ needsAuth: true });
      }

      const accessToken = await refreshAccessToken(settings.google_sheets_refresh_token);

      // Convert data objects to rows
      const dataRows = rows.map((row: Record<string, unknown>) =>
        headers.map((h: string) => String(row[h] ?? ""))
      );

      const url = await createSpreadsheet(accessToken, title || "Latela Export", headers, dataRows);

      return jsonResponse({ url });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("export-to-sheets error:", err);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
