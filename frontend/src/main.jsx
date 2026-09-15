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
      // The live vessel map can render thousands of Leaflet markers, and a
      // single vessel:snapshot burst mutates the DOM far more per batch
      // than Replay's defaults allow (mutationBreadcrumbLimit: 750,
      // mutationLimit: 10_000), which stops and discards the recording.
      // The vessel count only grows over a session, so any fixed cap gets
      // exceeded again eventually -- mutationLimit: 0 disables the
      // stop-on-mutation-storm behavior entirely (falsy short-circuits the
      // check in the SDK). mutationBreadcrumbLimit still bounds how many
      // breadcrumbs get created per batch, so it's kept generous rather
      // than disabled.
      mutationBreadcrumbLimit: 10000,
      mutationLimit: 0,
    }),
  ],

  // Record 10% of normal user sessions
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,

});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);