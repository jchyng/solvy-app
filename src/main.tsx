import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,
  })
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
