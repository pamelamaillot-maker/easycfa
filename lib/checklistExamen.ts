// lib/checklistExamen.ts
// Checklist réglementaire d'une session d'examen TP, en 3 phases.
// - points « auto » : calculés à partir des données déjà saisies dans EasyCFA
// - points « manuel » : case à cocher, horodatée avec l'auteur (examens.checklist)

export type Phase = 'avant' | 'jourJ' | 'apres';

export type PointChecklist = {
  id: string;
  phase: Phase;
  libelle: string;
  mode: 'auto' | 'manuel';
  ok: boolean;
  detail?: string;                 // explication du statut automatique
  par?: string;                    // auteur de la coche (manuel)
  le?: string;                     // date ISO de la coche (manuel)
  photo?: boolean;                 // point qui accepte une photo (ouverture des plis)
};

export const LIBELLE_PHASE: Record<Phase, string> = {
  avant: '📋 Avant la session',
  jourJ: '📝 Jour de la session',
  apres: '📮 Après la session',
};

// Points cochés à la main
export const POINTS_MANUELS: { id: string; phase: Phase; libelle: string; photo?: boolean }[] = [
  { id: 'avant_contrats', phase: 'avant', libelle: "Conditions d'inscription vérifiées pour chaque candidat (contrat en cours)" },
  { id: 'avant_decharges', phase: 'avant', libelle: 'Décharges ou accusés de réception des convocations conservés' },
  { id: 'avant_amenagements_jury', phase: 'avant', libelle: 'Aménagements des candidats en situation de handicap communiqués au jury' },
  { id: 'jj_plis', phase: 'jourJ', libelle: "Plis vérifiés cachetés, ouverts en présence d'un candidat témoin", photo: true },
  { id: 'jj_identites', phase: 'jourJ', libelle: 'Identité de chaque candidat contrôlée' },
  { id: 'jj_absences', phase: 'jourJ', libelle: 'Absences et retards notés' },
  { id: 'jj_telephones', phase: 'jourJ', libelle: 'Téléphones et objets connectés interdits pendant les épreuves' },
  { id: 'jj_postes', phase: 'jourJ', libelle: 'Postes informatiques sécurisés' },
  { id: 'jj_durees', phase: 'jourJ', libelle: 'Durées des épreuves respectées' },
  { id: 'jj_emargements', phase: 'jourJ', libelle: 'Feuilles d’émargement candidats et jury signées' },
  { id: 'jj_deliberation', phase: 'jourJ', libelle: 'Délibération en présence du seul jury' },
  { id: 'ap_dp_rendus', phase: 'apres', libelle: 'Dossiers professionnels rendus aux candidats' },
  { id: 'ap_destruction', phase: 'apres', libelle: 'Sujets et documents de travail détruits' },
  { id: 'ap_affichage', phase: 'apres', libelle: 'Affichage des résultats limité aux seuls lauréats' },
];

function dateIso(d?: string | null): string | null {
  if (!d) return null;
  const t = String(d);
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

export type ContexteChecklist = {
  agrements: any[];                // table agrements
  apprenants: any[];               // pour les candidats en situation de handicap
  conflits: number;                // nb de conflits responsable / formateur
  juryRouge: number;               // nb de points rouges du jury
};

export function calculerChecklist(s: any, ctx: ContexteChecklist): PointChecklist[] {
  const pts: PointChecklist[] = [];
  const cocher = s?.checklist ?? {};
  const debut = dateIso(s?.dateDebut);
  const candidats: any[] = s?.candidats ?? [];

  // ── AVANT (automatiques)
  const ag = ctx.agrements.find(a => !a.archive && a.formationCode === s?.formation);
  const finAg = dateIso(ag?.dateFin);
  pts.push({ id: 'avant_agrement', phase: 'avant', mode: 'auto', libelle: `Agrément ${s?.formation} valide à la date de la session`,
    ok: !!finAg && !!debut && finAg >= debut, detail: ag ? `valide jusqu'au ${ag.dateFin || '?'}` : 'aucun agrément enregistré' });
  pts.push({ id: 'avant_site', phase: 'avant', mode: 'auto', libelle: 'Session sur le site agréé (1 chemin Dubuisson, Saint-Leu)',
    ok: /dubuisson/i.test(s?.lieu ?? ''), detail: s?.lieu || 'lieu non renseigné' });
  pts.push({ id: 'avant_ceres', phase: 'avant', mode: 'auto', libelle: 'Session créée dans CERES (n° et date)',
    ok: !!s?.numeroCERES && !!s?.dateCreationCERES, detail: s?.numeroCERES ? `n° ${s.numeroCERES} du ${s.dateCreationCERES || '?'}` : undefined });
  pts.push({ id: 'avant_responsables', phase: 'avant', mode: 'auto', libelle: 'Responsable de session désigné et déclaré dans CERES',
    ok: !!s?.responsableTitulaireId && !!s?.responsablesSaisisCeres });
  pts.push({ id: 'avant_conflits', phase: 'avant', mode: 'auto', libelle: 'Aucun conflit responsable / formateur du groupe',
    ok: ctx.conflits === 0, detail: ctx.conflits ? `${ctx.conflits} conflit(s)` : undefined });
  pts.push({ id: 'avant_jury', phase: 'avant', mode: 'auto', libelle: 'Jury conforme (2 jurés, habilitations, non-lien)',
    ok: ctx.juryRouge === 0 && (s?.jures ?? []).filter((j: any) => j.confirme).length >= 2 });
  pts.push({ id: 'avant_dte', phase: 'avant', mode: 'auto', libelle: 'DTE commandés et reçus',
    ok: !!s?.dateReceptionDTE, detail: s?.dateReceptionDTE ? `reçus le ${s.dateReceptionDTE}` : s?.dateCmdDTE ? `commandés le ${s.dateCmdDTE}` : undefined });
  const sansDossier = candidats.filter(c => !c.dpFourni || !c.ecfFourni);
  pts.push({ id: 'avant_dossiers', phase: 'avant', mode: 'auto', libelle: 'Dossier professionnel et livret ECF complets pour chaque candidat',
    ok: candidats.length > 0 && sansDossier.length === 0, detail: sansDossier.length ? `manquant : ${sansDossier.map(c => `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()).join(', ')}` : undefined });
  pts.push({ id: 'avant_convocations', phase: 'avant', mode: 'auto', libelle: 'Convocations envoyées',
    ok: !!s?.dateEnvoiConvocations, detail: s?.dateEnvoiConvocations ? `le ${s.dateEnvoiConvocations}` : undefined });
  pts.push({ id: 'avant_reglement', phase: 'avant', mode: 'auto', libelle: 'Règlement général des sessions remis / affiché',
    ok: !!s?.affichageReglement });
  const psh = candidats.map(c => ctx.apprenants.find(a => a.id === c.apprenantId)).filter((a: any) => a && a.rqth === 'OUI');
  const pshNonTraites = psh.filter((a: any) => { const d = a.amenagementRqth?.demandeAmenagement || {}; return !d.sansObjet && !d.dateEnvoiDeets; });
  pts.push({ id: 'avant_handicap', phase: 'avant', mode: 'auto', libelle: "Demandes d'aménagement transmises à la DEETS",
    ok: pshNonTraites.length === 0, detail: psh.length === 0 ? 'aucun candidat concerné' : pshNonTraites.length ? `${pshNonTraites.length} à transmettre` : `${psh.length} transmise(s)` });

  // ── APRÈS (automatiques)
  pts.push({ id: 'ap_resultats_ceres', phase: 'apres', mode: 'auto', libelle: 'Résultats saisis dans CERES', ok: !!s?.dateResultatsCERES,
    detail: s?.dateResultatsCERES ? `le ${s.dateResultatsCERES}` : undefined });
  pts.push({ id: 'ap_pv_signe', phase: 'apres', mode: 'auto', libelle: 'PV général signé par les jurés importé', ok: !!(s?.pvSigneUrl || s?.pvSigne) });
  pts.push({ id: 'ap_pv_envoi', phase: 'apres', mode: 'auto', libelle: 'PV envoyé à la DEETS (15 jours maximum)', ok: !!(s?.pvEnvoiDemarche || s?.pvCourrierReco),
    detail: s?.pvEnvoiDemarche ? `démarches le ${s.pvEnvoiDemarche}` : s?.pvCourrierReco ? `recommandé le ${s.pvCourrierReco}` : undefined });

  // ── Manuels
  for (const m of POINTS_MANUELS) {
    const c = cocher[m.id] ?? {};
    pts.push({ id: m.id, phase: m.phase, mode: 'manuel', libelle: m.libelle, ok: !!c.fait, par: c.par, le: c.le, photo: m.photo });
  }
  const ordre: Phase[] = ['avant', 'jourJ', 'apres'];
  return pts.sort((a, b) => ordre.indexOf(a.phase) - ordre.indexOf(b.phase));
}

export function tauxChecklist(points: PointChecklist[]): number {
  if (!points.length) return 0;
  return Math.round((points.filter(p => p.ok).length / points.length) * 100);
}
