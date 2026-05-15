export type StatutPresence = 'Présent' | 'Absent' | 'Retard' | 'Absent justifié' | 'Non saisi';

export type PresenceApprenant = {
  apprenantId: string;
  nom: string;
  prenom: string;
  entreprise: string;
  emailApprenant: string;
  emailEntreprise: string;
  statut: StatutPresence;
  heureArrivee?: string;
  heuresComptees: number;
  justificatifRecu: boolean;
  emailEnvoye: boolean;
};

export type DemiJournee = {
  id: string;
  type: 'Matin' | 'Après-midi';
  heureDebut: string;
  heureFin: string;
  heures: number;
  formateur: string;
  theme: string;
  modalite: 'Présentiel' | 'Distanciel';
  valide: boolean;
  heureValidation?: string;
  presences: PresenceApprenant[];
};

export type FeuilleEmargement = {
  id: string;
  sessionId: string;
  formation: string;
  date: string;
  jour: string;
  salle: string;
  demiJournees: DemiJournee[];
};

export const FEUILLES_EMARGEMENT: FeuilleEmargement[] = [];

export const EMAIL_ABSENCE_TEMPLATE = {
  sujet: 'Absence/Retard en formation — Action requise',
  expediteur: 'pedagogie@pamoi.re',
  corps: `Bonjour,

Nous vous informons que {{APPRENANT_PRENOM}} {{APPRENANT_NOM}} a été signalé(e) {{STATUT}} lors de la séance de formation du {{DATE}} ({{DEMI_JOURNEE}}) — {{FORMATION}}.

{{MESSAGE_SPECIFIQUE}}

Nous vous rappelons que tout justificatif doit nous être transmis dans les 48 heures à l'adresse pedagogie@pamoi.re. 
Sans justificatif reçu dans ce délai, l'absence sera considérée comme injustifiée et comptabilisée dans le calcul du taux d'assiduité.

Cordialement,
L'équipe pédagogique PAM OI Formation
pedagogie@pamoi.re | 0693 55 64 92
1 Chemin Dubuisson — 97436 Saint-Leu

---
Ce message est envoyé automatiquement par EasyCFA — solution éditée par PAM GROUPE.
Un accusé de réception vous sera adressé dès réception de votre justificatif.`,
};