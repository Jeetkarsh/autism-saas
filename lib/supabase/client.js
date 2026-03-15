'use client'

import { createBrowserClient } from '@supabase/ssr'

let client = null

export function createClient() {
  if (client) return client
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null if env vars are not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured - using localStorage only')
    return null
  }
  
  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}