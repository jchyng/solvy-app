export interface Bindings {
  RATE_LIMIT_KV: KVNamespace
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  JWT_SECRET: string
  SENTRY_DSN: string
  ENVIRONMENT: string
  // AI providers (실제 값은 Week 8에서 Cloudflare Secrets로 등록)
  ANTHROPIC_API_KEY: string
  GEMINI_API_KEY: string
  OPENROUTER_API_KEY: string
  MATHPIX_APP_ID: string
  MATHPIX_APP_KEY: string
  // R2 이미지 스토리지
  IMAGES_BUCKET: R2Bucket
  IMAGES_PUBLIC_URL: string
}
