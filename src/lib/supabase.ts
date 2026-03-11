import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnonKey = 'placeholder';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseConfigError(): Error | null {
	if (isSupabaseConfigured) return null;

	const missing: string[] = [];
	if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
	if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

	return new Error(`Missing Supabase env: ${missing.join(', ')}. Please set them in Vercel Project Settings → Environment Variables and redeploy.`);
}

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackAnonKey);
