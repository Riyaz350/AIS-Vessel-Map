import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';

import 'leaflet/dist/leaflet.css';
import './lib/posthog';
import App from './App';
import { AuthProvider } from './context/AuthContext';

Sentry.init({
  dsn: 'https://5a827c26800cc629374653cc345f9f14@o4512084899921920.ingest.us.sentry.io/4512084910473216',

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Record 10% of normal user sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorRate: 1.0,
  // Record 100% of sessions where an error occurs
  replaysOnErrorSampleRate: 1.0,

});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);