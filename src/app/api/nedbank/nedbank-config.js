// nedbank-config.js
export const NEDBANK_CONFIG = {
  // Base API URL
  BASE_URL: 'https://apim.nedbank.co.za',
  
  // OAuth endpoints
  OAUTH_ENDPOINTS: {
    AUTHORIZE: '/oauth/authorize',
    TOKEN: '/oauth/token',
    REFRESH: '/oauth/refresh'
  },
  
  // API endpoints
  API_ENDPOINTS: {
    CREATE_INTENT: '/api/v1/intents',
    GET_INTENT: '/api/v1/intents/{intentId}',
    GET_ACCOUNTS: '/api/v1/accounts',
    GET_ACCOUNT_DETAILS: '/api/v1/accounts/{accountId}',
    GET_ACCOUNT_BALANCE: '/api/v1/accounts/{accountId}/balance',
    GET_TRANSACTIONS: '/api/v1/accounts/{accountId}/transactions'
  },
  
  // OAuth configuration
  OAUTH_CONFIG: {
    RESPONSE_TYPE: 'code',
    SCOPE: 'accounts',
    ITYPE: 'personal' // or 'business'
  },
  
  // Token types
  TOKEN_TYPES: {
    LIGHT: 'light', // For intent creation
    HEAVY: 'heavy'  // For account operations
  }
};

// Environment variables you'll need to set
export const NEDBANK_ENV = {
  CLIENT_ID: process.env.NEDBANK_CLIENT_ID,
  CLIENT_SECRET: process.env.NEDBANK_CLIENT_SECRET,
  REDIRECT_URI: process.env.NEDBANK_REDIRECT_URI || 'http://localhost:3000/callback/nedbank'
};