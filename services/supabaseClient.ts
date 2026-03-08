
import { createClient } from '@supabase/supabase-js';

// Replace these with your own Supabase project credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
