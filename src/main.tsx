import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { getTrackingConsent } from '@/shared/components/CookieBanner'

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,
    opt_out_capturing_by_default: true,
  })
  // 이미 동의한 사용자는 즉시 opt-in
  if (getTrackingConsent()) {
    posthog.opt_in_capturing()
  }
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
