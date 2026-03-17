import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

const GoogleSheetsCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "exporting" | "error">("processing");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        toast.error("Google authorization was denied");
        navigate("/reports", { replace: true });
        return;
      }

      if (!code) {
        toast.error("No authorization code received");
        navigate("/reports", { replace: true });
        return;
      }

      if (!state) {
        toast.error("Invalid OAuth response — missing state");
        navigate("/reports", { replace: true });
        return;
      }

      try {
        // Exchange code for tokens. The state (nonce) is validated server-side:
        // the edge function verifies it exists in oauth_nonces, belongs to the
        // authenticated user, is not expired, and has not been consumed before.
        const redirectUri = `${window.location.origin}/auth/google-sheets/callback`;
        const { data, error: fnError } = await supabase.functions.invoke("export-to-sheets", {
          body: { action: "exchange-code", code, redirectUri, state },
        });

        if (fnError || !data?.success) {
          throw new Error(fnError?.message || data?.error || "Token exchange failed");
        }

        toast.success("Google Sheets connected successfully!");

        // The export payload is returned directly from the nonce row — no sessionStorage.
        const exportPayload = data?.exportPayload;
        if (exportPayload) {
          setStatus("exporting");

          const { data: exportResult, error: exportError } = await supabase.functions.invoke(
            "export-to-sheets",
            { body: { action: "export", ...exportPayload } }
          );

          if (exportError || !exportResult?.url) {
            throw new Error(exportError?.message || exportResult?.error || "Export failed");
          }

          window.open(exportResult.url, "_blank");
          toast.success("Spreadsheet created and opened!");
        }

        navigate("/reports", { replace: true });
      } catch (err: any) {
        console.error("Google Sheets callback error:", err);
        setStatus("error");
        toast.error(err.message || "Failed to connect Google Sheets");
        setTimeout(() => navigate("/reports", { replace: true }), 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">
        {status === "processing" && "Connecting to Google Sheets..."}
        {status === "exporting" && "Creating your spreadsheet..."}
        {status === "error" && "Something went wrong. Redirecting..."}
      </p>
    </div>
  );
};

export default GoogleSheetsCallback;
