/**
 * Moteur de remplacement des champs dynamiques EasyCFA
 * Remplace {{CHAMP}} par la valeur correspondante
 */
export function remplirModele(modele: string, donnees: Record<string, string>): string {
  let resultat = modele;
  for (const [cle, valeur] of Object.entries(donnees)) {
    const regex = new RegExp(`{{${cle}}}`, 'g');
    resultat = resultat.replace(regex, valeur || '');
  }
  return resultat;
}

/**
 * Champs manquants — retourne la liste des champs non remplis
 */
export function champsManquants(modele: string, donnees: Record<string, string>): string[] {
  const regex = /{{([A-Z_0-9]+)}}/g;
  const manquants: string[] = [];
  let match;
  while ((match = regex.exec(modele)) !== null) {
    if (!donnees[match[1]] || donnees[match[1]].trim() === '') {
      manquants.push(match[1]);
    }
  }
  return manquants;
}