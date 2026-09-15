import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';

import 'leaflet/dist/leaflet.css';
import './index.css';
import './lib/posthog';
import App from './App';
import { AuthProvider } from './context/AuthContext';

Sentry.init({
  dsn: 'https://5a827c26800cc629374653cc345f9f14@o4512084899921920.ingest.us.sentry.io/4512084910473216',
  release: `ais-vessel-map-frontend@${__APP_VERSION__}`,
debug: true,
enableLogs: true,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],

  // Record 10% of normal user sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

});
if (import.meta.env.DEV) {
  window.Sentry = Sentry; // debug only — remove before shipping
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);