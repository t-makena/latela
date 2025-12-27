import { supabase } from './supabase';

type SecurityEvent = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DELETED'
  | 'SUSPICIOUS_ACTIVITY';

interface LogSecurityEventParams {
  event: SecurityEvent;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function logSecurityEvent({
  event,
  userId,
  metadata = {}
}: LogSecurityEventParams) {
  try {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Security Event]', { event, userId, metadata });
    }

    // In production, you could send to a logging service
    // or store in a security_events table
    
    // Example: Store in Supabase (requires security_events table)
    /*
    await supabase.from('security_events').insert({
      event_type: event,
      user_id: userId,
      metadata,
      created_at: new Date().toISOString(),
    });
    */
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Usage in auth flows:
// logSecurityEvent({ event: 'LOGIN_SUCCESS', userId: user.id });
// logSecurityEvent({ event: 'LOGIN_FAILURE', metadata: { email, reason: 'invalid_password' } });