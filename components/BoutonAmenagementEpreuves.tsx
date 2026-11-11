'use client';

// Demande d'aménagements d'épreuves — modèle officiel du ministère du Travail
// (L5211-4 et D5211-2 du Code du travail), pré-rempli par EasyCFA.
//
// Modèle : public/modeles/amenagement-epreuves-tp.pdf (formulaire remplissable).
// - La page de garde du guide (« Exemple de fiche… ») est retirée.
// - Parties candidat + centre de formation : pré-remplies depuis la fiche apprenant.
// - Partie médicale : seule l'identité est pré-remplie, le reste est laissé au médecin.
// Le PDF reste remplissable : le médecin ou l'équipe peut compléter à l'écran.

import React from 'react';
import { PDFDocument, PDFTextField, StandardFonts, rgb } from 'pdf-lib';
import { chargerExamens } from '../data/examensSupabase';
import { CFA_IDENTITE_DEFAUT as CFA_CONFIG, REFERENT_HANDICAP_DEFAUT } from '../lib/cfaConfig';
import { AMENAGEMENTS_EPREUVES, EPREUVES_TP } from '../lib/handicap';

const CHEMIN_MODELE = '/modeles/amenagement-epreuves-tp.pdf';

const LIBELLES_TP: Record<string, string> = {
  SC: 'Titre professionnel Secrétaire comptable',
  ARH: 'Titre professionnel Assistant(e) ressources humaines',
  AD: 'Titre professionnel Assistant(e) de direction',
  GCF: 'Titre professionnel Gestionnaire comptable et fiscal',
  CATL: "Titre professionnel Chargé(e) d'accueil touristique et de loisirs",
  EC: 'Titre professionnel Employé(e) commercial(e)',
  CV: 'Titre professionnel Conseiller(ère) de vente',
  FPA: "Titre professionnel Formateur(trice) professionnel(le) d'adultes",
};

/** Date JJ/MM/AAAA depuis ISO ou JJ/MM/AAAA. */
function dateFr(v?: string): string {
  const t = String(v || '').trim();
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : t;
}
function versTemps(v?: string): number {
  const t = String(v || '').trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  return 0;
}

/**
 * Date de la prochaine session d'examen de l'apprenant :
 * 1) un examen où il/elle est inscrit(e) comme candidat(e) ;
 * 2) à défaut, l'examen rattaché à sa session de formation.
 */
export async function trouverDateExamen(apprenant: any): Promise<string> {
  try {
    const examens = await chargerExamens();
    const aujourdhui = new Date(); aujourdhui.setHours(0, 0, 0, 0);
    const avenir = examens
      .filter(e => versTemps(e.dateDebut) >= aujourdhui.getTime())
      .sort((a, b) => versTemps(a.dateDebut) - versTemps(b.dateDebut));
    const parCandidat = avenir.find(e => (e.candidats || []).some(c => c.apprenantId === apprenant.id));
    if (parCandidat) return dateFr(parCandidat.dateDebut);
    const parSession = avenir.find(e => apprenant.sessionId && e.sessionFormationId === apprenant.sessionId);
    return parSession ? dateFr(parSession.dateDebut) : '';
  } catch {
    return '';
  }
}

export async function genererAmenagementEpreuves(a: any, dateExamen: string): Promise<Blob> {
  const rep = await fetch(CHEMIN_MODELE);
  if (!rep.ok) throw new Error(`Modèle introuvable (${rep.status}). Vérifiez public/modeles/amenagement-epreuves-tp.pdf.`);
  const doc = await PDFDocument.load(await rep.arrayBuffer());
  const police = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();
  const am = a.amenagementRqth || {};
  const dem = am.demandeAmenagement || {};
  const tp = String(a.formation || '').replace(/^TP\s+/i, '').trim().toUpperCase();
  const epreuves = EPREUVES_TP[tp];
  const aujourdhui = new Date().toLocaleDateString('fr-FR');

  const texte = (nom: string, valeur?: string) => {
    try { const f = form.getTextField(nom); f.setText(valeur ? String(valeur) : ''); } catch { /* champ absent */ }
  };
  const caseACocher = (nom: string, coche: boolean) => {
    try { const f = form.getCheckBox(nom); coche ? f.check() : f.uncheck(); } catch { /* champ absent */ }
  };

  // ── Partie candidat ──
  texte('Prénom', a.prenom);
  texte('Nom de naissance', (a.nom || '').toUpperCase());
  texte('Nom dusage', a.nomUsage || '');
  texte('Adresse', a.adresse);
  texte('Complément dadresse', a.complementAdresse || '');
  texte('Ville', a.ville);
  texte('Code postal', a.codePostal);
  texte('Adresse mail', a.email);
  texte('Téléphone', a.telephone);
  texte('Certification présentée Titre CCS CCP', LIBELLES_TP[tp] || a.formation || '');
  texte('Nom et coordonnées du Centre de Formation',
    `${CFA_CONFIG.denominationUsuelle} — ${CFA_CONFIG.adresse1} ${CFA_CONFIG.codePostal} Saint-Leu — ${REFERENT_HANDICAP_DEFAUT.telephone} — ${REFERENT_HANDICAP_DEFAUT.email}`);
  texte('Date prévisionnelle examen', dateExamen);

  // Aménagements demandés (cases 1 à 7) + précisions regroupées dans « Autres »
  const demandes: string[] = Array.isArray(dem.amenagements) ? dem.amenagements : [];
  const precisions: Record<string, string> = dem.precisions || {};
  AMENAGEMENTS_EPREUVES.forEach((x, i) => caseACocher(`Check Box${i + 1}`, demandes.includes(x.value)));
  const lignesPrecision = AMENAGEMENTS_EPREUVES
    .filter(x => demandes.includes(x.value) && (precisions[x.value] || '').trim())
    .map(x => (x.value === 'autres' ? '' : x.label + ' : ') + precisions[x.value].trim());
  texte('Text8', lignesPrecision.join(' — '));
  texte('Text1', 'Saint-Leu');
  texte('Date', aujourdhui);

  // ── Observations du centre de formation ──
  texte('nature_epreuve', 'Sans objet (pas d’épreuve écrite distincte)');
  texte('autre', '');
  texte('Durée_3', '');
  if (epreuves) {
    const lignes = [epreuves.mspDetail];
    if (epreuves.qp) lignes.push(`+ Questionnement à partir de production(s) : ${epreuves.qp}`);
    texte('travaux_realiser', lignes.join('\n'));
    texte('Durée_4', epreuves.msp + (epreuves.qp ? `\n+ ${epreuves.qp}` : ''));
    caseACocher('Entre_techn', !!epreuves.et);
    texte('duree_entr_tech', epreuves.et || '');
    caseACocher('Entr_final', true);
    texte('duree_entr_final', epreuves.ef);
  }
  const amFormation: string[] = Array.isArray(am.amenagementsFormation) ? am.amenagementsFormation : [];
  try {
    form.getRadioGroup('Group14').select(amFormation.length > 0 ? 'Choix20' : 'Choix19'); // Choix20 = OUI, Choix19 = NON
  } catch { /* ignore */ }
  texte('Le candidat atil bénéficié daménagements particuliers pendant la formation',
    [amFormation.filter(v => v !== 'Autre').join(', '), am.amenagementsFormationDetail].filter(Boolean).join(' — '));
  const diff: string[] = Array.isArray(dem.difficultes) ? dem.difficultes : [];
  const casesDiff: Record<string, string> = { manutention: 'pb_manut', charges: 'port_lourd', langue: 'francais', images: 'lecture_images_cartes', textes: 'lecture_textes', comprehension: 'comprehension_texte_lu', autres: 'Check Box11' };
  Object.entries(casesDiff).forEach(([cle, champ]) => caseACocher(champ, diff.includes(cle)));
  texte('Text12', diff.includes('autres') ? (dem.difficultesAutres || '') : '');
  texte('Lieu_test', 'Saint-Leu');
  texte('date_test', aujourdhui);
  texte('signature_cachet_etabliss', '');

  // ── Formulaire médical : identité seulement ──
  texte('NOM_Prenom_patient', `${(a.nom || '').toUpperCase()} ${a.prenom || ''}`.trim());
  texte('Date_naissance_patient', [dateFr(a.dateNaissance), a.lieuNaissance].filter(Boolean).join(' — '));
  texte('certification_visee', LIBELLES_TP[tp] || a.formation || '');

  // ── Situation du demandeur : pas de case dans le modèle → croix dessinée ──
  const pages = doc.getPages();
  const page2 = pages[1];
  const croix = (y: number) => {
    page2.drawRectangle({ x: 62, y: y - 1, width: 10, height: 10, borderColor: rgb(0, 0.42, 0.41), borderWidth: 1 });
    page2.drawText('X', { x: 64.2, y: y + 0.6, size: 9, font: police, color: rgb(0, 0.42, 0.41) });
  };
  if (am.typeReconnaissance === 'TROUBLE_TEMPORAIRE') croix(429); else croix(462);

  // Apparences : on régénère seulement les champs texte (police Helvetica),
  // les cases gardent la coche d'origine du modèle officiel.
  form.getFields().forEach(f => {
    if (f instanceof PDFTextField) { try { f.updateAppearances(police); } catch { /* ignore */ } }
  });
  doc.removePage(0); // page de garde du guide
  const octets = await doc.save({ updateFieldAppearances: false });
  return new Blob([octets as BlobPart], { type: 'application/pdf' });
}

export default function BoutonAmenagementEpreuves({ apprenant, style }: { apprenant: any; style?: React.CSSProperties }) {
  const [enCours, setEnCours] = React.useState(false);

  async function telecharger() {
    try {
      setEnCours(true);
      const dateExamen = await trouverDateExamen(apprenant);
      const blob = await genererAmenagementEpreuves(apprenant, dateExamen);
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `Demande_amenagement_epreuves_${apprenant.nom || ''}_${apprenant.prenom || ''}.pdf`.replace(/\s+/g, '_');
      lien.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (!dateExamen) alert("ℹ️ Aucune session d'examen à venir n'est rattachée à cet apprenant : la date prévisionnelle d'examen est restée vide sur le formulaire.");
    } catch (e) {
      console.error('[AmenagementEpreuves] Erreur :', e);
      alert('⚠️ Erreur lors de la génération du formulaire. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button onClick={telecharger} disabled={enCours} style={style}>
      {enCours ? '⏳ Génération…' : '📝 Demande d’aménagement des épreuves'}
    </button>
  );
}
