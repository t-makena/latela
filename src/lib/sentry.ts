import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      // Don't send PII
      beforeSend(event) {
        // Remove sensitive data
        if (event.request?.data) {
          delete event.request.data;
        }
        return event;
      },
    });
  }
}