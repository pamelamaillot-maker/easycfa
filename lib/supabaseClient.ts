// lib/supabaseClient.ts
// Client Supabase pour EasyCFA - CFA PAM OI Formation
// Utilisé pour les évaluations à chaud apprenants (Indicateurs 30/31 Qualiopi)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variables Supabase manquantes. Vérifiez .env.local et Vercel.\n' +
    'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requises.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
