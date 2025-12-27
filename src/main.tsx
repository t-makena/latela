import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'

createRoot(document.getElementById("root")!).render(<App />);

import { initSentry } from '@/lib/sentry';

initSentry();

// ... rest of app