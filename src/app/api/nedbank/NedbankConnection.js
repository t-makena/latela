// pages/api/nedbank/connect.js
import nedbankService from '../../../lib/nedbankService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Generate state for OAuth security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Generate OAuth URL
    const oauthUrl = nedbankService.generateOAuthUrl(userId, state);

    res.status(200).json({ oauthUrl, state });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// pages/api/nedbank/callback.js
import nedbankService from '../../../lib/nedbankService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code, state, intent_id } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Extract user ID from state
    const [userId] = state.split('_');

    // Step 1: Get light token
    const lightTokenResponse = await fetch(`https://apim.nedbank.co.za/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.NEDBANK_CLIENT_ID}:${process.env.NEDBANK_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nedbank/callback`
      })
    });

    const lightToken = await lightTokenResponse.json();

    // Step 2: Create intent (if not already created)
    let intentId = intent_id;
    if (!intentId) {
      const intentResponse = await fetch(`https://apim.nedbank.co.za/api/v1/intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lightToken.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissions: ['ReadAccountsBasic', 'ReadAccountsDetail', 'ReadBalances', 'ReadTransactionsBasic'],
          accountTypes: ['current', 'savings'],
          expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });

      const intent = await intentResponse.json();
      intentId = intent.intentId;

      // Redirect to authorize intent
      const authUrl = nedbankService.generateOAuthUrl(userId, state) + `&intent_id=${intentId}`;
      return res.redirect(authUrl);
    }

    // Step 3: Get heavy token
    const heavyTokenResponse = await fetch(`https://apim.nedbank.co.za/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.NEDBANK_CLIENT_ID}:${process.env.NEDBANK_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nedbank/callback`,
        intent_id: intentId
      })
    });

    const heavyToken = await heavyTokenResponse.json();

    // Step 4: Store connection in Supabase
    await nedbankService.storeUserConnection(userId, heavyToken, intentId);

    // Step 5: Fetch and store accounts
    const accountsResponse = await fetch(`https://apim.nedbank.co.za/api/v1/accounts`, {
      headers: {
        'Authorization': `Bearer ${heavyToken.access_token}`
      }
    });

    const accounts = await accountsResponse.json();
    await nedbankService.storeAccounts(userId, accounts.data || []);

    // Redirect to success page
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?connected=nedbank`);
  } catch (error) {
    console.error('Error in Nedbank callback:', error);
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=connection_failed`);
  }
}

// pages/api/nedbank/sync-transactions.js
import nedbankService from '../../../lib/nedbankService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, accountId, fromDate, toDate } = req.body;

    // Get user's connection
    const connection = await nedbankService.getUserConnection(userId);
    if (!connection || connection.connection_status !== 'active') {
      return res.status(401).json({ message: 'No active Nedbank connection' });
    }

    // Check if token needs refresh
    const needsRefresh = await nedbankService.checkTokenExpiry(userId);
    let accessToken = connection.access_token;

    if (needsRefresh) {
      // Refresh token logic here
      // For now, we'll use the existing token
    }

    // Fetch transactions from Nedbank
    const response = await fetch(`https://apim.nedbank.co.za/api/v1/accounts/${accountId}/transactions?fromDate=${fromDate}&toDate=${toDate}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const transactionsData = await response.json();
    
    // Store transactions in Supabase
    await nedbankService.storeTransactions(userId, accountId, transactionsData.data || []);

    res.status(200).json({ 
      message: 'Transactions synced successfully',
      count: transactionsData.data?.length || 0
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// pages/api/nedbank/disconnect.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    await nedbankService.disconnectUser(userId);

    res.status(200).json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}