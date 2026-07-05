import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vlfpijuhhsbiuesoimtv.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WRmTo8QFMYhw7oNTyyGISQ_hO4_O_ZX'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
