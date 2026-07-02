import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ayucatrmlenxbojnrnde.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key'

console.group('🛠️ [SUPABASE CLIENT INIT]')
console.log('VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_URL:', supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('VITE_SUPABASE_ANON_KEY (slice):', supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : 'undefined')
console.groupEnd()

let client = null
try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
}

export const supabase = client
