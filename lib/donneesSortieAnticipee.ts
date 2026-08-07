/**
 * Helper d'assemblage des données de Sortie Anticipée
 * (Attestation pour quitter le CFA en cours de journée — décharge de responsabilité)
 */

import { formaterDateFR } from './dates';

export type MotifSortie = 'rdv_medical' | 'rdv_france_travail' | 'activite_entreprise' | 'urgence_familiale' | 'autre';

export const MOTIFS_SORTIE_ANTICIPEE: Array<{ cle: MotifSortie; label: string }> = [
  { cle: 'rdv_medical', label: 'RDV médical' },
  { cle: 'rdv_france_travail', label: 'RDV France Travail' },
  { cle: 'activite_entreprise', label: "Activité organisée par l'entreprise" },
  { cle: 'urgence_familiale', label: 'Urgence familiale' },
  { cle: 'autre', label: 'Autre' },
];

const FORMATION_LIBELLES: Record<string, string> = {
  'SC': 'TP Secrétaire Comptable',
  'GCF': 'TP Gestionnaire Comptable et Fiscal',
  'AD': 'TP Assistant(e) de Direction',
  'ARH': 'TP Assistant(e) en Ressources Humaines',
  'CATL': "TP Chargé(e) d'Accueil Touristique et de Loisirs",
  'EC': 'TP Employé(e) Commercial(e)',
  'CV': 'TP Conseiller(ère) de Vente',
  'FPA': "TP Formateur(trice) Professionnel(le) d'Adultes",
};

export interface SortieAnticipee {
  id: string;
  date: string;        // dd/mm/yyyy
  heure: string;       // HH:MM
  motifCle: MotifSortie;
  motifLabel: string;
  commentaire?: string;
  statut: 'a_generer' | 'en_attente' | 'signee';
  dateCreation: string;
  dateEnvoiEmail?: string;
  dateSignature?: string;
  fichierSigneNom?: string;
  fichierSigneUrl?: string;
  cheminStorageSigne?: string;
  archive?: boolean;
}

export function assemblerDonneesSortieAnticipee(
  apprenant: any,
  entreprise: any | null,
  sortie: SortieAnticipee
): Record<string, string> {
  const formationLib = FORMATION_LIBELLES[apprenant.formation] || apprenant.formation || '';
  return {
    APPRENANT_NOM_COMPLET: `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),
    APPRENANT_DATE_NAISSANCE: formaterDateFR(apprenant.dateNaissance),
    FORMATION_LIBELLE: formationLib,
    ENTREPRISE_RAISON_SOCIALE: entreprise?.raisonSociale || apprenant.entreprise || '',
    ENTREPRISE_SIRET: entreprise?.siret || '',
    MAITRE_APPRENTISSAGE_NOM_COMPLET: `${entreprise?.tuteurPrenom || ''} ${entreprise?.tuteurNom || ''}`.trim(),
    DATE_SORTIE: sortie.date,
    HEURE_SORTIE: sortie.heure,
    MOTIF_CLE: sortie.motifCle,
    MOTIF_LABEL: sortie.motifLabel,
    COMMENTAIRE: sortie.commentaire || '',
    LIEU_SIGNATURE: 'Saint-Leu',
    DATE_SIGNATURE: new Date().toLocaleDateString('fr-FR'),
    CFA_DIRECTRICE: 'Gaëlle MAILLOT',
  };
}