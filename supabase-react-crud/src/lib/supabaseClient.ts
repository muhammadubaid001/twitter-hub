import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
	// Fail fast in dev if env vars are missing
	console.warn('Missing Supabase env variables. Check .env');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
	autoRefreshToken: true,
	persistSession: true,
	detectSessionInUrl: true,
});
