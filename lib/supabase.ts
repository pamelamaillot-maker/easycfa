// ============================================================================
// CLIENT SUPABASE - EasyCFA
// Crée le client réutilisable partout dans l'application
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Récupère les variables d'environnement
// - En local : depuis .env.local
// - En production : depuis les variables Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Avertissement si les variables ne sont pas configurées
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variables Supabase manquantes. Vérifie ton fichier .env.local en local, ou les variables Vercel en production.'
  );
}

// Crée le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Garde la session après refresh
    autoRefreshToken: true,      // Rafraîchit auto le token avant expiration
    detectSessionInUrl: true,    // Pour le login via email (magic link)
  },
});

// Helper : vérifier si Supabase est bien configuré
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
