import type { Apprenti } from '../data/apprentisSupabase';
import { formaterDateFR } from './dates';

/**
 * Mapping formation → Google Doc template ID
 */
export const TEMPLATES_LIVRET: Record<string, { templateId: string; nomFormation: string }> = {
  'SC':   { templateId: '1iRHWuOb5EYT5Yy7v4YXy5rFBAA5KPOeNW88VpZUkkA4', nomFormation: 'TP Secrétaire Comptable' },
  'GCF':  { templateId: '1mEW1o_VYrU5GexbSRHJQNFetJhBUHozVq3jZJeyy8IA', nomFormation: 'TP Gestionnaire Comptable et Fiscal' },
  'AD':   { templateId: '16oAKKIBW5YwL3sXTZ1Be1bhlEMvwOsleByH8cvjY8a4', nomFormation: 'TP Assistant(e) de Direction' },
  'ARH':  { templateId: '13m_VmguC9M4sbMksiI6q8kcNMSGrCDIlveVPPoBsac8', nomFormation: 'TP Assistant(e) en Ressources Humaines' },
  'CATL': { templateId: '1WM0qKJA2krngqCo4l9NNEPnFc-HGmRhEhNKftl65eaA', nomFormation: 'TP Chargé(e) d\'Accueil Touristique et de Loisirs' },
  'EC':   { templateId: '1M4-mFr49q9NnBvK5BjTJ_9gh2YFRQ-fhbodb1h0DpVA', nomFormation: 'TP Employé(e) Commercial(e)' },
  'CV':   { templateId: '1xFJxdfirIX2ZUzG7WmxB5eZkq6_yl_uw9UOdm80lcXg', nomFormation: 'TP Conseiller(ère) de Vente' },
};

/**
 * Assemble les données du livret apprenant pour le remplissage Google Docs.
 * Utilise les VRAIES données depuis Supabase (apprenant + entreprise + NPEC).
 */
export function assemblerDonneesLivret(
  apprenant: any,
  entreprise: any | null,
  npec: any | null
): Record<string, string> {
  const civilite = apprenant.sexe === 'F' ? 'Mme' : apprenant.sexe === 'M' ? 'M.' : '';
  const tpl = TEMPLATES_LIVRET[apprenant.formation];
  const formationLib = tpl?.nomFormation || apprenant.formation || '';

  return {
    // === APPRENANT ===
    APPRENANT_CIVILITE: civilite,
    APPRENANT_NOM: apprenant.nom || '',
    APPRENANT_PRENOM: apprenant.prenom || '',
    APPRENANT_NOM_COMPLET: `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),
    APPRENANT_DATE_NAISSANCE: formaterDateFR(apprenant.dateNaissance),
    APPRENANT_LIEU_NAISSANCE: apprenant.lieuNaissance || '',
    APPRENANT_ADRESSE: apprenant.adresse || '',
    APPRENANT_CP: apprenant.codePostal || '',
    APPRENANT_VILLE: apprenant.ville || '',
    APPRENANT_TELEPHONE: apprenant.telephone || '',
    APPRENANT_EMAIL: apprenant.email || '',
    APPRENANT_NSS: apprenant.nir || '',
    'NOM_APPRENTI(E)': `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),

    // === REPRÉSENTANT LÉGAL ===
    REPRESENTANT_LEGAL_NOM: apprenant.representantNom || '',
    REPRESENTANT_LEGAL_PRENOM: apprenant.representantPrenom || '',
    REPRESENTANT_LEGAL_LIEN: apprenant.representantLien || '',
    REPRESENTANT_LEGAL_ADRESSE: apprenant.representantAdresse || '',
    REPRESENTANT_LEGAL_TELEPHONE: apprenant.representantTelephone || '',
    REPRESENTANT_LEGAL_EMAIL: apprenant.representantEmail || '',

    // === ENTREPRISE ===
    ENTREPRISE_RAISON_SOCIALE: entreprise?.raisonSociale || apprenant.entreprise || '',
    ENTREPRISE_ACTIVITE: entreprise?.activitePrincipale || entreprise?.secteur || '',
    ENTREPRISE_ADRESSE: entreprise?.adresse || '',
    ENTREPRISE_CP: entreprise?.codePostal || '',
    ENTREPRISE_VILLE: entreprise?.ville || '',
    ENTREPRISE_SIRET: entreprise?.siret || '',
    ENTREPRISE_IDCC: entreprise?.idcc || '',
    ENTREPRISE_OPCO: entreprise?.opco || apprenant.opco || '',
    ADRESSE_ENTREPRISE: entreprise?.adresse || '',
    Code_Postal_ENTREPRISE: entreprise?.codePostal || '',
    Ville_ENTREPRISE: entreprise?.ville || '',
    SIRET_ENTREPRISE: entreprise?.siret || '',
    ACTIVITE_ENTREPRISE: entreprise?.activitePrincipale || entreprise?.secteur || '',
    IDCC_ENTREPRISE: entreprise?.idcc || '',
    OPCO: entreprise?.opco || apprenant.opco || '',
    QUALITE_SIGNATAIRE_ENTREPRISE: entreprise?.qualiteSignataire || 'Gérant',
    DIRIGEANT_NOM_COMPLET: `${entreprise?.dirigeantPrenom || ''} ${entreprise?.dirigeantNom || ''}`.trim(),

    // === MAÎTRE D'APPRENTISSAGE (TUTEUR) ===
    // Lecture prioritaire sur l'entreprise, fallback sur l'apprenant
    MAITRE_APPRENTISSAGE_NOM_COMPLET: `${entreprise?.tuteurPrenom || apprenant.tuteurPrenom || ''} ${entreprise?.tuteurNom || apprenant.tuteurNom || ''}`.trim(),
    MAITRE_APPRENTISSAGE_TELEPHONE: entreprise?.tuteurTelephone || apprenant.tuteurTelephone || '',
    MAITRE_APPRENTISSAGE_EMAIL: entreprise?.tuteurEmail || apprenant.tuteurEmail || '',
    MAITRE_APPRENTISSAGE_POSTE: entreprise?.tuteurFonction || apprenant.tuteurFonction || apprenant.tuteurPoste || '',
    TUTEUR_NOM_COMPLET: `${entreprise?.tuteurPrenom || apprenant.tuteurPrenom || ''} ${entreprise?.tuteurNom || apprenant.tuteurNom || ''}`.trim(),
    POSTE_TUTEUR: entreprise?.tuteurFonction || apprenant.tuteurFonction || apprenant.tuteurPoste || '',
    'Mail_TUTEUR': entreprise?.tuteurEmail || apprenant.tuteurEmail || '',
    'N° Tel_TUTEUR': entreprise?.tuteurTelephone || apprenant.tuteurTelephone || '',

    // === RÉFÉRENT APPRENTI (CFA) ===
    REFERENT_APPRENTI_NOM_COMPLET: 'Betty REBOUL',
    REFERENT_APPRENTI_TELEPHONE: '0693 55 64 97',
    REFERENT_APPRENTI_EMAIL: 'pedagogie@pamoi.re',

    // === CONTRAT ===
    DATE_DEBUT_CONTRAT: formaterDateFR(apprenant.dateDebutContrat),
    DATE_FIN_CONTRAT: formaterDateFR(apprenant.dateFinContrat),
    DATE_DEBUT_FORMATION: formaterDateFR(apprenant.dateDebutFormation),
    DATE_FIN_FORMATION: formaterDateFR(apprenant.dateFinFormation),
    DATE_RUPTURE_CONTRAT: formaterDateFR(apprenant.dateRupture),
    N_DECA: apprenant.numeroDeca || '',

    // === FORMATION ===
    FORMATION_LIBELLE: formationLib,
    RNCP_CODE: npec?.codeRncp || '',
    CODE_DIPLOME: npec?.codeDiplome || '',
    NB_HEURES_FORMATION: npec?.nbHeuresFormation ? String(npec.nbHeuresFormation) : '',
    VOLUME_HORAIRE_TOTAL: npec?.nbHeuresFormation ? String(npec.nbHeuresFormation) : '',
    DUREE_FORMATION: npec?.dureeMois ? `${npec.dureeMois} mois` : '',

    // === CFA ===
    CFA_RAISON_SOCIALE: 'PAM OI Formation',
    CFA_DIRECTRICE: 'Gaëlle MAILLOT',
    CFA_TELEPHONE: '0693 55 64 92',
    CFA_EMAIL: 'pamelamaillot@pamoi.re',
    CFA_SIRET: '881 279 392 00016',
    LIEU_FORMATION: '1 Chemin Dubuisson 97436 Saint-Leu',
    LIEU_SIGNATURE_DOC: 'Saint-Leu',
    DATE_SIGNATURE_DOC: new Date().toLocaleDateString('fr-FR'),
  };
}