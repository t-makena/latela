// lib/env.js
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || (
    typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000'
  ),
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Latela',
};

// Validate required environment variables
export function validateEnv() {
  const required = ['supabaseUrl', 'supabaseAnonKey'];
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}