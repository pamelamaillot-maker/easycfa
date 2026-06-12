'use client';

import React from 'react';
import { Document, Page, View, Text, Image as PdfImage, pdf, StyleSheet } from '@react-pdf/renderer';

// ── Libellés des formations (code → intitulé TP officiel) ───────────────────
const LIBELLES_FORMATION: Record<string, string> = {
  SC: 'Secrétaire Comptable',
  GCF: 'Gestionnaire Comptable et Fiscal',
  ARH: 'Assistant(e) en Ressources Humaines',
  AD: 'Assistant(e) de Direction',
  CATL: "Chargé(e) d'Accueil Touristique et de Loisirs",
  EC: 'Employé(e) Commercial(e)',
  CV: 'Conseiller(ère) de Vente',
  FPA: "Formateur(trice) Professionnel(le) d'Adultes",
};

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ── Helpers dates (JJ/MM/AAAA) ──────────────────────────────────────────────
function parseDateFr(str?: string): Date | null {
  if (!str) return null;
  const p = str.split('/');
  if (p.length !== 3) return null;
  const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return isNaN(d.getTime()) ? null : d;
}

function calculerTableauFormation(
  sessions: any[],
  formateurId: string,
  formation: string,
  dateDebut?: string,
  dateFin?: string,
): { lignes: { mois: string; jours: string; heures: number }[]; totalJours: number; totalHeures: number } {
  const debut = parseDateFr(dateDebut);
  const fin = parseDateFr(dateFin);

  const datesVues = new Set<string>();
  const parMois: Record<string, number[]> = {};

  sessions
    .filter(s => s.formation === formation)
    .forEach(s => {
      (s.planning || []).forEach((p: any) => {
        if (p.formateurId !== formateurId) return;
        const d = parseDateFr(p.date);
        if (!d) return;
        if (debut && d < debut) return;
        if (fin && d > fin) return;
        if (datesVues.has(p.date)) return;
        datesVues.add(p.date);
        const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!parMois[cle]) parMois[cle] = [];
        parMois[cle].push(d.getDate());
      });
    });

  const lignes = Object.entries(parMois)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cle, jours]) => {
      const [an, m] = cle.split('-');
      const nomMois = `${MOIS_FR[parseInt(m) - 1]} ${an}`;
      const joursTries = jours.sort((a, b) => a - b);
      const joursStr = joursTries.map(j => String(j).padStart(2, '0')).join(', ');
      return { mois: nomMois.charAt(0).toUpperCase() + nomMois.slice(1), jours: joursStr, heures: joursTries.length * 7 };
    });

  const totalJours = lignes.reduce((s, l) => s + l.jours.split(',').length, 0);
  const totalHeures = lignes.reduce((s, l) => s + l.heures, 0);
  return { lignes, totalJours, totalHeures };
}

// ── Couleurs PAM OI ─────────────────────────────────────────────────────────
const VERT = '#006B68';
const OR = '#C8A23A';
const VERT_CLAIR = '#EAF4F3';

// ── Styles PDF (corps 12, titres 14) ────────────────────────────────────────
const styles = StyleSheet.create({
  page: { paddingTop: 78, paddingBottom: 64, paddingHorizontal: 44, fontSize: 12, lineHeight: 1.4, color: '#1a1a1a' },
  header: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  slogan: { fontSize: 8, color: VERT, fontWeight: 'bold', marginTop: 1 },
  h1: { fontSize: 16, fontWeight: 'bold', color: VERT, marginBottom: 14, textTransform: 'uppercase' },
  h2: { fontSize: 14, fontWeight: 'bold', color: VERT, marginTop: 14, marginBottom: 6, paddingBottom: 2, borderBottomWidth: 1, borderColor: OR },
  h3: { fontSize: 12, fontWeight: 'bold', color: VERT, marginTop: 8, marginBottom: 3, textDecoration: 'underline' },
  p: { marginBottom: 6, textAlign: 'justify' },
  li: { marginBottom: 3, marginLeft: 12, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  small: { fontSize: 9, color: '#555' },
  link: { color: VERT, fontSize: 10 },
  tableTitre: { fontSize: 12, fontWeight: 'bold', color: VERT, marginTop: 10, marginBottom: 3 },
  table: { marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  tr: { flexDirection: 'row' },
  thRow: { backgroundColor: VERT_CLAIR },
  cell: { flex: 1, padding: 6, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#333', fontSize: 11 },
  cellLast: { flex: 1.3, padding: 6, borderBottomWidth: 1, borderColor: '#333', fontSize: 11 },
  th: { fontWeight: 'bold' },
  emptyCell: { minHeight: 20 },
  signZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  signBox: { width: '46%' },
  footer: { position: 'absolute', bottom: 18, left: 44, right: 44, textAlign: 'center', fontSize: 7.5, color: '#555' },
});

function PageHeader({ logoUrl }: { logoUrl?: string }) {
  return (
    <View style={styles.header} fixed>
      {logoUrl ? <PdfImage src={logoUrl} style={styles.logo} /> : null}
      <Text style={styles.slogan}>Ensemble, nous irons plus loin</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>PAM OI Formation – 38B Rue des Canneliers 97436 St Leu</Text>
      <Text>Siret : 881 279 392 00016 – Naf : 8559A – RCS 881 279 392 Saint-Pierre de la Réunion</Text>
      <Text>SASU au capital de 500€</Text>
      <Text>Tél : 0693 55 64 92 – Email : contact@pamoi.re</Text>
      <Text>Site internet : https://www.pamoi.re</Text>
    </View>
  );
}

function TableauFormation({ libelle, tableau }: { libelle: string; tableau: any }) {
  const NB_LIGNES_GABARIT = 7;
  const lignesVides = Math.max(0, NB_LIGNES_GABARIT - tableau.lignes.length);
  return (
    <View>
      <Text style={styles.tableTitre}>TP {libelle}</Text>
      <View style={styles.table}>
        <View style={[styles.tr, styles.thRow]}>
          <Text style={[styles.cell, styles.th]}>Mois d'intervention</Text>
          <Text style={[styles.cell, styles.th]}>Jours d'intervention</Text>
          <Text style={[styles.cellLast, styles.th]}>Nombre d'heure total (Journée de 07h00)</Text>
        </View>
        {tableau.lignes.map((l: any, i: number) => (
          <View style={styles.tr} key={`l${i}`}>
            <Text style={styles.cell}>{l.mois}</Text>
            <Text style={styles.cell}>{l.jours}</Text>
            <Text style={styles.cellLast}>{l.heures} heures</Text>
          </View>
        ))}
        {Array.from({ length: lignesVides }).map((_, i) => (
          <View style={styles.tr} key={`v${i}`}>
            <Text style={[styles.cell, styles.emptyCell]}> </Text>
            <Text style={[styles.cell, styles.emptyCell]}> </Text>
            <Text style={[styles.cellLast, styles.emptyCell]}> </Text>
          </View>
        ))}
        <View style={styles.tr}>
          <Text style={[styles.cell, styles.th]}>TOTAL</Text>
          <Text style={[styles.cell, styles.th]}>{tableau.totalJours} JOURS</Text>
          <Text style={[styles.cellLast, styles.th]}>{tableau.totalHeures} HEURES</Text>
        </View>
      </View>
    </View>
  );
}

function ContratDoc({ formateur, formations, dateDebut, dateFin, tableauxParFormation, logoUrl }: any) {
  const nomComplet = `${formateur.nom ?? ''} ${formateur.prenom ?? ''}`.trim();
  const val = (v?: string) => (v && String(v).trim()) ? String(v) : '…………………………';

  return (
    <Document>
      {/* ===================== PAGE DE CONTENU ===================== */}
      <Page size="A4" style={styles.page}>
        <PageHeader logoUrl={logoUrl} />

        <Text style={styles.h1}>Contrat de sous-traitance formation</Text>

        <Text style={styles.p}><Text style={styles.bold}>Entre les soussignés :</Text></Text>

        <Text style={styles.p}>
          <Text style={styles.bold}>1 – PAM OI</Text> représentée par <Text style={styles.bold}>Madame Gaëlle MAILLOT</Text>, directrice dont le siège social est situé au <Text style={styles.bold}>38 B rue des Canneliers 97436 SAINT LEU</Text>, déclarée et immatriculée sous le numéro <Text style={styles.bold}>SIRET 881 279 392 00016</Text>, organisme de formation enregistré sous le <Text style={styles.bold}>numéro 881 279 392</Text> du Greffier du Tribunal Mixte de Commerce de Saint-Pierre de la Réunion,
        </Text>
        <Text style={styles.p}>ci-après « <Text style={styles.bold}>le donneur d'ordre</Text> »</Text>

        <Text style={styles.p}><Text style={styles.bold}>Et</Text></Text>

        <Text style={styles.p}>
          <Text style={styles.bold}>2 – </Text>Le prestataire <Text style={styles.bold}>{val(nomComplet)}</Text>, déclaré/e en tant que formateur/trice indépendant/e sous le numéro <Text style={styles.bold}>SIRET {val(formateur.siret)}</Text>, code APE <Text style={styles.bold}>8559A</Text>, n° NDA <Text style={styles.bold}>{val(formateur.nda)}</Text> dont le siège social est au <Text style={styles.bold}>“{val(formateur.adresse)}”</Text>, ci-après « <Text style={styles.bold}>le sous-traitant</Text> »
        </Text>

        <Text style={styles.p}>Il a été convenu ce qui suit :</Text>

        <Text style={styles.h2}>PREAMBULE</Text>
        <Text style={styles.p}>
          <Text style={styles.bold}>PAM OI</Text> est un organisme de formation ayant la certification qualité « <Text style={styles.bold}>QUALIOPI</Text> » au titre des catégories suivantes : « Actions de formation » et « Actions de formation par apprentissage », depuis le <Text style={styles.bold}>05 Janvier 2023</Text>.
        </Text>
        <Text style={styles.p}>
          <Text style={styles.bold}>PAM OI</Text> propose une offre de formation à haute valeur ajoutée, en permanence adaptée aux besoins et tournée vers l'innovation et les évolutions du secteur.
        </Text>
        <Text style={styles.p}>
          <Text style={styles.bold}>PAM OI</Text>, grâce à ses liens étroits avec les entreprises de son territoire et de son secteur, est également impliqué dans l'élaboration de référentiels de formation avec pour objectif l'amélioration des savoirs, savoir-faire et savoir-être en sortie de stage. Ces objectifs sont définis et actualisés en lien étroit avec les professionnels et partenaires de la filière.
        </Text>
        <Text style={styles.h3}>Attentes du Client</Text>
        <Text style={styles.p}>
          Le Client confie à PAM OI, l'élaboration, la dispense et l'animation d'une formation. Le Sous-traitant est un professionnel habilité, disposant de l'expérience métier et des compétences nécessaires en matière de formations qui, après avoir pris connaissance des besoins et contraintes, s'est déclaré en mesure d'y répondre.
        </Text>
        <Text style={styles.p}>
          Les Parties reconnaissent avoir bénéficié, pendant la phase précontractuelle de négociations, de toutes les informations nécessaires et utiles pour leur permettre de s'engager en toute connaissance de cause.
        </Text>
        <Text style={styles.p}>
          Chaque Partie déclare avoir informé l'autre Partie de toute information portée à sa connaissance dont l'importance est déterminante pour le consentement de l'autre Partie, que cette information soit ignorée légitimement de l'autre Partie ou que cette dernière fasse confiance à son cocontractant.
        </Text>
        <Text style={styles.p}>
          Dans ces conditions, les Parties se sont rapprochées et ont conclu le présent Accord Cadre de formation/animation, ci-après dénommé « l'Accord-cadre ».
        </Text>

        <Text style={styles.h2}>Article 1 : Nature du contrat</Text>
        <Text style={styles.p}>
          Le présent contrat est conclu dans le cadre d'une prestation de formation réalisée par le sous-traitant au bénéfice du donneur d'ordre.
        </Text>
        {formations.map((code: string) => (
          <Text style={styles.p} key={code}>
            <Text style={styles.bold}>TP {LIBELLES_FORMATION[code] || code} en alternance et en présentiel.</Text>
          </Text>
        ))}
        <Text style={styles.p}>
          Le déroulement des missions sera défini par un planning, une progression pédagogique et un suivi journalier auquel le/la consultant/e devra se conformer.
        </Text>
        <Text style={styles.p}>
          A l'issue de la prestation un bilan sera remis à PAM OI selon les modalités définies des actions de formation concernées (grilles d'évaluation, livret ECF, Dossier Professionnel…).
        </Text>
        <Text style={styles.p}>
          La formation sera déclinée en sessions de formation et précisée à travers un suivi journalier Excel et Digiforma détaillant le contenu des Prestations, notamment :
        </Text>
        <Text style={styles.li}>- Le thème de la formation,</Text>
        <Text style={styles.li}>- Les intervenants,</Text>
        <Text style={styles.li}>- Les heures, dates et lieux des différentes sessions,</Text>
        <Text style={styles.li}>- Les ressources communiquées</Text>
        <Text style={styles.li}>- Les outils utilisés</Text>

        <Text style={styles.h2}>Article 2 : Lieu de la prestation</Text>
        <Text style={styles.p}>Les prestations s'effectueront sur les sites de PAM OI :</Text>
        <Text style={styles.li}>- 1 chemin Dubuisson 97436 Saint-LEU</Text>

        <Text style={styles.h2}>Article 3 : Modalités d'exécution des prestations</Text>
        <Text style={styles.p}>
          Le Sous-traitant s'engage à réaliser les Prestations dans le respect des délais et modalités fixés par l'Accord Cadre. Les délais d'exécution, et notamment les dates des sessions de formation, sont impératifs pour le Client.
        </Text>
        <Text style={styles.p}>
          A ce titre, le Sous-traitant doit transmettre toutes pièces et documents lui permettant de démontrer que cette obligation est respectée.
        </Text>
        <Text style={styles.p}>
          En cas de désaccord entre les parties, PAM OI se réserve le droit d'annuler les sessions de formation à venir.
        </Text>
        <Text style={styles.p}>
          <Text style={styles.bold}>PAM OI</Text> demande à l'ensemble des Sous-traitants de respecter les exigences du référentiel RNCQ et de la certification QUALIOPI, en particulier les points traitants de :
        </Text>

        <Text style={styles.h3}>Analyse du besoin et convocation (Ind4)</Text>
        <Text style={styles.p}>
          Avant chaque démarrage de session, <Text style={styles.bold}>PAM OI</Text> recueille le besoin des bénéficiaires sur le programme et les objectifs de la formation. Le <Text style={styles.bold}>Sous-traitant</Text> s'engage à adapter la formation si le bénéficiaire en fait la demande. <Text style={styles.bold}>PAM OI</Text> reste responsable de la convocation des bénéficiaires.
        </Text>

        <Text style={styles.h3}>Définition et validation des objectifs (Ind5)</Text>
        <Text style={styles.p}>
          Avant chaque mise en place d'une formation, <Text style={styles.bold}>PAM OI</Text> recueille et valide auprès du Sous-traitant les objectifs de la formation et des outils pédagogiques permettant de les évaluer.
        </Text>

        <Text style={styles.h3}>Amélioration continue (Ind 32)</Text>
        <Text style={styles.p}>
          Chaque Prestation dispensée et animée par le <Text style={styles.bold}>Sous-traitant</Text> fera l'objet d'un questionnaire de satisfaction, élaboré par <Text style={styles.bold}>PAM OI</Text> et transmis à l'issue de la formation aux personnes ayant assisté à la formation, ci-après dénommées les « Stagiaires ». Sur cette base, et en particulier au cas où les résultats du questionnaire ne seraient pas satisfaisants ou s'ils font état de défaillances du Sous-traitant, celui-ci s'engage à améliorer les supports de formation et à faire évoluer les Prestations. La relance est assurée selon sa procédure de relance.
        </Text>

        <Text style={styles.h3}>Actualisation et développement des compétences (Ind 22_24)</Text>
        <Text style={styles.p}>
          De même, en cas d'évolution des connaissances relatives aux Prestations, <Text style={styles.bold}>le Sous-traitant</Text> s'engage à mettre à jour les supports de formation et à faire évoluer les Prestations. Il adapte ses compétences pédagogiques et fait régulièrement des formations de mises à jour de ses connaissances. En l'absence d'amélioration des supports de formation et/ou d'évolution des Prestations, <Text style={styles.bold}>PAM OI</Text> se réserve le droit d'annuler les sessions de formation à venir.
        </Text>

        <Text style={styles.h3}>Émargement, vérification des prérequis des Stagiaires, positionnement, accueil, engagement et progression des Stagiaires, évaluation de l'atteinte des objectifs pédagogiques. (Ind 8_12_11)</Text>
        <Text style={styles.p}>L'intervenant <Text style={styles.bold}>Sous-traitant</Text> s'assure en démarrage de Prestation à effectuer :</Text>
        <Text style={styles.li}>- La feuille d'émargement attestant de la présence des Stagiaires à la session de formation, est à signer au début de chaque demi-journée de formation (pas de signature anticipée, cette pratique est interdite).</Text>
        <Text style={styles.li}>- Toute difficulté grave ou urgente doit aussi être signalée au plus vite au responsable pédagogique de l'organisme de formation.</Text>
        <Text style={styles.li}>- En cas d'absence repérée en début de demi-journée, <Text style={styles.bold}>le Sous-traitant</Text> prévient le responsable pédagogique de l'organisme de formation.</Text>
        <Text style={styles.li}>- Un rappel du règlement intérieur de formation en vigueur, des consignes sécurité incendie,</Text>
        <Text style={styles.li}>- Un recueil des attentes des stagiaires et une évaluation du niveau de connaissances des stagiaires sur le sujet de la formation suivie.</Text>
        <Text style={styles.li}>- Une présentation/rappel des objectifs/méthodes pédagogiques et du document « Questionnaire de satisfaction » des Stagiaires,</Text>
        <Text style={styles.li}>- Une vérification régulière de la progression pédagogique (atteinte des objectifs pédagogiques) par tous moyens et à la fréquence qui sembleront pertinentes.</Text>
        <Text style={styles.li}>- En cas de difficulté ou de risque de non atteinte des objectifs pédagogiques, prévenir <Text style={styles.bold}>PAM OI</Text>, Le Sous-traitant sera responsable du remplissage de la feuille d'émargement et du suivi journalier. Une copie sera remise à <Text style={styles.bold}>PAM OI</Text> en fin de formation.</Text>

        <Text style={styles.h3}>Une adaptation en continu (Ind 10)</Text>
        <Text style={styles.p}>
          Ces modalités de formation selon les besoins des Stagiaires et dans la mesure du possible (échanges, travaux de groupes, mises en situation, etc.), tout en préservant l'atteinte des objectifs prévus et la progressivité requise des apprentissages,
        </Text>
        <Text style={styles.p}>Une possibilité de rattrapage individuel en cas d'absence exceptionnelle.</Text>
        <Text style={styles.p}>
          Sont encouragés, dans la mesure du possible également, les temps d'échanges informels (pauses, repas) qui renforcent et soutiennent la motivation des Stagiaires.
        </Text>

        <Text style={styles.h2}>Article 4 : Durée du contrat</Text>
        <Text style={styles.p}>
          Le présent contrat entrera en vigueur le <Text style={styles.bold}>{val(dateDebut)}</Text> et prendra fin le <Text style={styles.bold}>{val(dateFin)}</Text>
        </Text>
        <Text style={styles.p}>
          Chaque partie peut résilier ce contrat 15 jours après l'avoir notifiée par écrit à l'autre partie. La lettre de notification devra être envoyée par courrier recommandé ou remise en main propre.
        </Text>
        <Text style={styles.p}>Le <Text style={styles.bold}>Sous-traitant</Text> effectuera les prestations auxquelles il/elle sera engagé/e.</Text>

        {tableauxParFormation.map((t: any) => (
          <TableauFormation key={t.code} libelle={t.libelle} tableau={t.tableau} />
        ))}

        <Text style={styles.p}>
          En cas d'empêchement pour raison de santé, l'annulation sera communiquée à PAM OI 48h à l'avance avant le démarrage de la prestation.
        </Text>
        <Text style={styles.p}>
          Si une des parties ne respecte pas les obligations qu'elle s'est engagée à respecter, la partie victime de l'obligation inexécutée pourra demander la résiliation de la convention sans préavis.
        </Text>
        <Text style={styles.p}>
          Si une contestation ou un différend ne peuvent être réglés à l'amiable, le tribunal de St Denis sera seul compétent pour régler le litige.
        </Text>

        <Text style={styles.h2}>Article 5 : Obligations du sous-traitant</Text>
        <Text style={styles.p}>Le <Text style={styles.bold}>Sous-traitant</Text> dans le cadre de ses obligations à l'égard de <Text style={styles.bold}>PAM OI</Text>, s'engage à :</Text>
        <Text style={styles.li}>- Communiquer à <Text style={styles.bold}>PAM OI</Text> une copie de son extrait K-bis, sa pièce d'identité, son attestation d'assurance, sa déclaration d'activité NDA, son diplôme, son CV avant le début de la formation ;</Text>
        <Text style={styles.li}>- Demander tout renseignement ou information qu'il jugerait nécessaire à l'exécution des Prestations qui lui sont confiées,</Text>
        <Text style={styles.li}>- Définir, les outils, méthodes et moyens d'exécution nécessaires à la réalisation des Prestations qu'il communique à <Text style={styles.bold}>PAM OI</Text> pour information.</Text>
        <Text style={styles.li}>- Notifier à <Text style={styles.bold}>PAM OI</Text>, dès qu'il en aura connaissance, tout élément, événement, acte susceptible d'affecter la bonne exécution de ses obligations,</Text>
        <Text style={styles.li}>- Utiliser des moyens techniques adaptés et conformes en termes de santé/sécurité et en adéquation pédagogique avec les Prestations,</Text>
        <Text style={styles.li}>- À fournir les modalités d'évaluation finales et les règles d'obtention des certifications quand il en est détenteur, prévues à <Text style={styles.bold}>l'article L.6353-1 du Code du travail</Text></Text>
        <Text style={styles.li}>- Assurer la gestion administrative, comptable et sociale et la supervision de son personnel affecté aux Prestations, dont il garantit la compétence, la probité et l'expérience pour les Prestations. Il conserve les pouvoirs de direction, de commandement, de surveillance et de contrôle sur les préposés qu'il aura affectés aux Prestations,</Text>
        <Text style={styles.li}>- Participer, si besoin, aux réunions de préparation / aux jurys d'examen / aux remises de diplôme</Text>
        <Text style={styles.li}>- À respecter et à faire respecter les obligations en matière de santé/ sécurité, en vigueur dans le lieu de la Prestation, dans l'hypothèse où celles-ci seraient exécutées dans les locaux de <Text style={styles.bold}>PAM OI</Text>, doté d'un règlement intérieur.</Text>
        <Text style={styles.li}>- Sauf accord préalable et écrit de <Text style={styles.bold}>PAM OI</Text>, le <Text style={styles.bold}>Sous-traitant</Text> s'interdit de contacter les stagiaires de quelque manière que ce soit avant, pendant et après l'exécution des Prestations.</Text>
        <Text style={styles.p}>Avoir pris connaissance du Référentiel QUALIOPI disponible sur le site :</Text>
        <Text style={[styles.p, styles.link]}>https://travail-emploi.gouv.fr/demarches-ressources-documentaires/documentation-et-publications-officielles/guides/guide-referentiel-national-qualite</Text>

        <Text style={styles.h2}>Article 6 : Obligations de PAM OI</Text>
        <Text style={styles.p}>Le donneur d'ordre s'engage à :</Text>
        <Text style={styles.li}>● Confier au sous-traitant la formation prévue à l'article 1 ;</Text>
        <Text style={styles.li}>● Prendre en charge la gestion administrative et logistique de la formation</Text>
        <Text style={styles.li}>● Transmettre au sous-traitant les feuilles d'émargement à faire signer aux stagiaires via Digiforma ;</Text>
        <Text style={styles.li}>● Transmettre au sous-traitant le questionnaire de satisfaction rempli par les stagiaires à l'issue de la formation</Text>
        <Text style={styles.li}>● Prévenir le sous-traitant au moins 48 heures à l'avance en cas d'annulation ou de report de la formation ;</Text>

        <Text style={styles.h2}>Article 7 : Modalités financières</Text>
        <Text style={styles.p}>
          Le sous-traitant percevra une rémunération de 30 euros TTC de l'heure pour ses actions de formation en présentiel et 18 euros TTC pour ses actions de formation en distanciel.
        </Text>
        <Text style={styles.p}>Le paiement sera effectué à réception de la facture par virement.</Text>

        <Text style={styles.h2}>Article 8 : Dispositions diverses</Text>
        <Text style={styles.li}>● Le présent contrat ne crée entre les parties aucun lien de subordination,</Text>
        <Text style={styles.li}>● Le sous-traitant déclare avoir souscrit une police d'assurance responsabilité civile professionnelle (RCP) auprès de la compagnie <Text style={styles.bold}>{val(formateur.assuranceRcp)}</Text></Text>
        <Text style={styles.li}>● Le sous-traitant dispose d'une propriété intellectuelle et/ou artistique sur le contenu de sa formation. Le donneur d'ordre s'engage à ne pas reproduire ni diffuser ce contenu sans l'accord du sous-traitant.</Text>
        <Text style={styles.li}>● Afin de faciliter le travail, <Text style={styles.bold}>PAM OI</Text> mettra à disposition des moyens matériels tels que locaux et mobilier.</Text>
        <Text style={styles.li}>● Pour toute communication avec le donneur d'ordre et les bénéficiaires ; le <Text style={styles.bold}>Sous-Traitant</Text> utilisera les outils de communication <Text style={styles.bold}>PAM OI</Text>.</Text>
        <Text style={styles.li}>● <Text style={styles.bold}>PAM OI</Text> tiendra à la disposition du prestataire toutes les informations pouvant contribuer à la bonne réalisation de l'objet de la présente convention.</Text>

        <Text style={styles.h2}>Article 9 : Clause de non concurrence</Text>
        <Text style={styles.li}>● Le sous-traitant s'interdit de travailler en direct avec les clients et prospects de PAM OI.</Text>
        <Text style={styles.li}>● Le sous-traitant fait part de toute demande entrante directe qu'il recevrait du client et en informe directement PAM OI.</Text>
        <Text style={styles.li}>● Les programmes, supports pédagogiques et tout autre document de <Text style={styles.bold}>PAM OI</Text>, restent à la propriété exclusive de ce dernier et ne sont pas autorisés à être utilisés dans un autre cadre que celui de la sous-traitance dont ce contrat fait l'objet.</Text>

        <Text style={styles.h2}>Article 10 : Confidentialité</Text>
        <Text style={styles.p}>
          Le Sous-traitant garantit la confidentialité des informations, de quelque nature que ce soit, écrites ou orales, dont il a connaissance dans le présent Accord Cadre et s'interdit de les communiquer aux personnes autres que celles qui ont qualité pour en connaître au titre de l'Accord Cadre. Le Sous-traitant s'engage à n'utiliser les informations confidentielles qu'afin d'exécuter les Prestations. Cet engagement de confidentialité restera valable pendant une durée de 24 mois après la cessation, pour quelque raison que ce soit, de l'Accord Cadre. Le Sous-Traitant s'interdit d'utiliser le nom et la marque de PAM OI, y compris à titre de citation comme référence commerciale, sans son autorisation expresse et préalable sur présentation par le Sous-Traitant du support et du contenu du projet d'utilisation. Le Sous-traitant garantît le respect de cet engagement de confidentialité.
        </Text>

        <PageFooter />
      </Page>

      {/* ===================== PAGE DE SIGNATURE ===================== */}
      <Page size="A4" style={styles.page}>
        <PageHeader logoUrl={logoUrl} />

        <Text style={styles.p}>
          En foi de quoi, les présentes parties ont signé ce contrat qui prend effet à la date de ce document. Fait en deux exemplaires.
        </Text>

        <Text style={[styles.p, { marginTop: 16 }]}>Fait à <Text style={styles.bold}>SAINT-LEU</Text>, le ……………………</Text>

        <View style={styles.signZone}>
          <View style={styles.signBox}>
            <Text>Le donneur d'ordre,</Text>
            <Text style={styles.bold}>Gaëlle MAILLOT</Text>
            <Text>de <Text style={styles.bold}>PAM OI</Text></Text>
            <Text style={{ marginTop: 34 }}>Signature</Text>
          </View>
          <View style={styles.signBox}>
            <Text>Le sous-traitant</Text>
            <Text style={styles.bold}>{val(nomComplet)}</Text>
            <Text style={{ marginTop: 34 }}>Signature</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default function BoutonContratPrestation({
  formateur,
  sessions,
  formations,
  dateDebut,
  dateFin,
  disabled,
}: {
  formateur: any;
  sessions: any[];
  formations: string[];
  dateDebut?: string;
  dateFin?: string;
  disabled?: boolean;
}) {
  const [enCours, setEnCours] = React.useState(false);

  async function generer() {
    try {
      setEnCours(true);
      // Logo : on précharge l'image en dataURL pour que @react-pdf l'affiche de façon fiable
      let logoUrl: string | undefined = undefined;
      try {
        const resLogo = await fetch('/logo-pamoi.png');
        const blobLogo = await resLogo.blob();
        logoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blobLogo);
        });
      } catch (e) {
        console.warn('[ContratPrestation] Logo non chargé :', e);
      }
      const tableauxParFormation = (formations || []).map((code) => ({
        code,
        libelle: LIBELLES_FORMATION[code] || code,
        tableau: calculerTableauFormation(sessions, formateur.id, code, dateDebut, dateFin),
      }));
      const blob = await pdf(
        <ContratDoc
          formateur={formateur}
          formations={formations || []}
          dateDebut={dateDebut}
          dateFin={dateFin}
          tableauxParFormation={tableauxParFormation}
          logoUrl={logoUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrat_prestation_${formateur.nom}_${(formations || []).join('-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[ContratPrestation] Erreur génération PDF :', e);
      alert('⚠️ Erreur lors de la génération du contrat. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      onClick={generer}
      disabled={enCours || disabled}
      style={{ backgroundColor: disabled ? '#ccc' : '#006B68', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: (enCours || disabled) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
    >
      {enCours ? '⏳ Génération…' : '📄 Générer le contrat de prestation'}
    </button>
  );
}