// lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { env, validateEnv } from './env';

// Only validate in production builds
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey
);