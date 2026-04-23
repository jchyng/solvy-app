import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Bindings } from '../types/env.js'

export function getSupabase(env: Bindings): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
}
