import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxobwjouwpwkkyfeleog.supabase.co';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_aojBCYarUIxP20t-_J6MnA_QbAxqJFx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
