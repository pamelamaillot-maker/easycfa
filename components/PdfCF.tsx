'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';

const S = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 45, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 8.5, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 1 },
  pageLabel: { fontSize: 6.5, color: '#aaa', textAlign: 'right', marginTop: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 10 },
  title: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 8.5, color: '#C8A23A', marginTop: 3 },
  legalNote: { fontSize: 7, color: '#444', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5, backgroundColor: '#f5f5f5', padding: 5, borderRadius: 2 },
  sectionBg: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 8, marginBottom: 4, backgroundColor: '#EAF4F3', padding: '3 6', borderRadius: 2 },
  articleTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 7, marginBottom: 3 },
  p: { fontSize: 8, lineHeight: 1.55, marginBottom: 4, color: '#1a1a1a' },
  bullet: { fontSize: 8, lineHeight: 1.55, marginBottom: 2, marginLeft: 10 },
  row: { flexDirection: 'row', marginBottom: 2, flexWrap: 'wrap' },
  lbl: { fontSize: 8, color: '#555', width: 120 },
  val: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  box: { backgroundColor: '#EAF4F3', padding: 6, borderRadius: 2, marginBottom: 6 },
  boxRed: { backgroundColor: '#fff5f5', padding: 6, borderRadius: 2, marginBottom: 5, borderWidth: 1, borderColor: '#fcc' },
  boxGreen: { backgroundColor: '#f0fff4', padding: 6, borderRadius: 2, marginBottom: 5, borderWidth: 1, borderColor: '#9ae6b4' },
  boxGray: { backgroundColor: '#f9f9f9', padding: 6, borderRadius: 2, marginBottom: 5 },
  checkLine: { fontSize: 8, marginBottom: 3 },
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  sigBlock: { width: '45%' },
  sigLbl: { fontSize: 7.5, color: '#555', marginBottom: 2 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  sigLine: { marginTop: 32, borderBottomWidth: 1, borderBottomColor: '#999' },
  sigNote: { fontSize: 6.5, color: '#aaa', marginTop: 2 },
  footer: { position: 'absolute', bottom: 14, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 4, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 6, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ddd', marginVertical: 6 },
  fn: { fontSize: 6.5, color: '#888', fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#006B68', padding: '3 4', marginBottom: 0 },
  tableHeaderCell: { fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', padding: '3 4' },
  tableCell: { fontSize: 7.5, flex: 1, textAlign: 'center' },
  tableCellLeft: { fontSize: 7.5, flex: 1.5 },
});

const FOOTER = 'PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A – RCS Saint-Pierre de La Réunion – SASU au capital de 500€';

type Props = { donnees: Record<string, string> };

export default function PdfCF({ donnees: d }: Props) {
  const deuxiemeAnnee = !!d.DATE_DEBUT_DEUXIEME_ANNEE && d.DATE_DEBUT_DEUXIEME_ANNEE.trim() !== '';

  return (
    <Document>

      {/* ===== PAGE 1 — Parties ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – UAI : 9741871R</Text>
            <Text style={S.headerRight}>NDA : 04973425197 – Qualiopi n° 51971543-3</Text>
            <Text style={S.headerRight}>Tél : 0693 55 64 92 – pamelamaillot@pamoi.re</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 1/8</Text>
          </View>
        </View>

        <View style={S.titleBlock}>
          <Text style={S.title}>Convention de formation</Text>
          <Text style={S.subtitle}>Par apprentissage</Text>
        </View>

        <Text style={S.legalNote}>
          Au plus tard dans les cinq jours ouvrables qui suivent le début de l'exécution du contrat d'apprentissage, l'employeur transmet le contrat, accompagné de la convention mentionnée à l'article L. 6353-1 et, le cas échéant, de la convention tripartite prévue au troisième alinéa de l'article L. 6222-7-1, à l'opérateur de compétences. Art. D. 6224-1 du Code du travail.
        </Text>

        <Text style={S.p}>Entre les soussignés,</Text>

        <Text style={S.sectionBg}>Le CFA</Text>
        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Désignation :</Text><Text style={S.val}>SASU PAM OI</Text></View>
          <View style={S.row}><Text style={S.lbl}>Adresse :</Text><Text style={S.val}>38 B RUE DES CANNELIERS 97436 SAINT-LEU</Text></View>
          <View style={S.row}><Text style={S.lbl}>Numéro Siret :</Text><Text style={S.val}>881 279 392 00016</Text></View>
          <View style={S.row}><Text style={S.lbl}>UAI :</Text><Text style={S.val}>9741871R</Text></View>
          <View style={S.row}><Text style={S.lbl}>NDA :</Text><Text style={S.val}>04973425197 – Préfecture de région de REUNION</Text></View>
          <View style={S.row}><Text style={S.lbl}>Certification :</Text><Text style={S.val}>QUALIOPI n° 51971543-3</Text></View>
          <View style={S.row}><Text style={S.lbl}>Représentée par :</Text><Text style={S.val}>Mme MAILLOT Gaëlle – Directrice et référente handicap</Text></View>
        </View>

        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Contact opérationnel :</Text>
        <View style={S.row}><Text style={S.lbl}>Nom-Prénom :</Text><Text style={S.val}>MAILLOT Gaëlle</Text></View>
        <View style={S.row}><Text style={S.lbl}>Fonction :</Text><Text style={S.val}>Directrice et référente handicap</Text></View>
        <View style={S.row}><Text style={S.lbl}>Email :</Text><Text style={S.val}>pamelamaillot@pamoi.re</Text></View>
        <View style={S.row}><Text style={S.lbl}>N° de téléphone :</Text><Text style={S.val}>06 93 55 64 92</Text></View>

        <Text style={S.sectionBg}>L'entreprise</Text>
        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Désignation :</Text><Text style={S.val}>{d.ENTREPRISE_RAISON_SOCIALE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Adresse :</Text><Text style={S.val}>{d.ADRESSE_ENTREPRISE} {d.Code_Postal_ENTREPRISE} {d.Ville_ENTREPRISE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Numéro Siret :</Text><Text style={S.val}>{d.SIRET_ENTREPRISE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>IDCC :</Text><Text style={S.val}>{d.IDCC_ENTREPRISE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Activité :</Text><Text style={S.val}>{d.ACTIVITE_ENTREPRISE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Représentée par :</Text><Text style={S.val}>{d.DIRIGEANT_NOM_COMPLET} en qualité de {d.QUALITE_SIGNATAIRE_ENTREPRISE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>OPCO :</Text><Text style={S.val}>{d.OPCO}</Text></View>
        </View>

        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Contact opérationnel :</Text>
        <View style={S.row}><Text style={S.lbl}>Nom-Prénom :</Text><Text style={S.val}>{d.TUTEUR_NOM_COMPLET}</Text></View>
        <View style={S.row}><Text style={S.lbl}>Fonction :</Text><Text style={S.val}>{d.POSTE_TUTEUR}</Text></View>
        <View style={S.row}><Text style={S.lbl}>Email :</Text><Text style={S.val}>{d.Mail_TUTEUR}</Text></View>
        <View style={S.row}><Text style={S.lbl}>N° de téléphone :</Text><Text style={S.val}>{d['N° Tel_TUTEUR']}</Text></View>

        <Text style={[S.p, { marginTop: 6 }]}>est conclue la présente convention*, en application des dispositions des Livres II et III de la sixième partie du Code du travail.</Text>
        <Text style={S.fn}>*Convention renseignée pour la durée totale de la formation en apprentissage couverte par le contrat d'apprentissage, et pouvant faire l'objet d'avenant(s) modificatif(s).</Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      {/* ===== PAGE 2 — Mandat ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 2/8</Text>
          </View>
        </View>

        <Text style={S.sectionBg}>Mandat de gestion du contrat d'apprentissage</Text>

        <Text style={[S.p, { marginBottom: 6 }]}>
          Le CFA PAM OI se propose d'élaborer pour votre compte et à titre gracieux, le contrat d'apprentissage et d'adresser une demande de dépôt auprès de votre OPCO (secteur privé), si celui-ci le permet ou sur la plateforme dédiée à l'apprentissage contrat.apprentissage.beta.gouv.fr (secteur Public).
        </Text>

        <View style={{ marginBottom: 6 }}>
  <Text style={{ fontSize: 7.5, color: '#555', marginBottom: 3 }}>Secteur :</Text>
  <PdfCheckBox label="Secteur privé (dépôt OPCO)" />
  <PdfCheckBox label="Secteur public (plateforme contrat.apprentissage.beta.gouv.fr)" />
</View>

        <View style={S.boxRed}>
          <PdfCheckBox label="JE REFUSE DE MANDATER LE CFA PAM OI" bold={true} />
          <Text style={S.p}>Vous refusez de donner mandat au CFA PAM OI, merci de cocher la case ci-dessus, il en est alors de votre responsabilité de réaliser le contrat d'apprentissage, la demande de dépôt et de nous adresser le contrat signé par les parties et le numéro DECA¹. La convention de formation vous sera envoyée par le CFA.</Text>
        </View>

        <View style={S.boxGreen}>
          <PdfCheckBox label="JE DONNE MANDAT AU CFA PAM OI (sans contrepartie financière)" bold={true} />
          <Text style={S.p}>Vous donnez mandat au CFA PAM OI, ses missions seront :</Text>
          <Text style={S.bullet}>• Préparation et envoi pour signature électronique du cerfa "contrat d'apprentissage" sur la base des informations transmises dans le dossier d'inscription.</Text>
          <Text style={S.bullet}>• Préparation et envoi pour signature électronique de la convention de formation par apprentissage.</Text>
          <Text style={S.bullet}>• Préparation et envoi de la convention tripartite de réduction ou allongement de durée du contrat d'apprentissage, le cas échéant.</Text>
          <Text style={S.bullet}>• Préparation et envoi des avenants et ruptures éventuels sur la base des informations transmises.</Text>
          <Text style={[S.p, { marginTop: 3 }]}>Pour la partie "contrat", les niveaux de rémunération et le salaire brut mensuel à l'embauche indiqués par le CFA reprennent les bases légales. Ces éléments sont donnés à titre indicatif. Il est de la responsabilité de l'employeur d'effectuer les vérifications nécessaires afin de s'assurer qu'il respecte les minimums conventionnels en vigueur lors de la signature du contrat d'apprentissage.</Text>
          <Text style={S.p}>La responsabilité du CFA PAM OI ne pourra être engagée.</Text>
        </View>

        <Text style={[S.p, { marginTop: 4 }]}>Par le présent mandat, et conformément aux articles 1984 et suivants du Code Civil,</Text>

        <View style={S.box}>
          <Text style={S.p}>Je soussigné(e) : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DIRIGEANT_NOM_COMPLET}</Text></Text>
          <Text style={S.p}>Représentant l'entreprise : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.ENTREPRISE_RAISON_SOCIALE}</Text></Text>
          <Text style={S.p}>Située au : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.ADRESSE_ENTREPRISE}</Text></Text>
          <Text style={S.p}>CP : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.Code_Postal_ENTREPRISE}</Text>{'        '}VILLE : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.Ville_ENTREPRISE}</Text>{'        '}SIRET : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.SIRET_ENTREPRISE}</Text></Text>
        </View>

        <Text style={S.p}>Donne pouvoir au CFA représenté par son directeur en exercice pour effectuer les missions nécessaires au traitement du contrat d'apprentissage de l'apprenti(e) : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.APPRENANT_NOM_COMPLET}</Text></Text>

        <Text style={[S.p, { marginTop: 6 }]}>À : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.LIEU_SIGNATURE_DOC}</Text>{'        '}le : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_SIGNATURE_DOC}</Text></Text>

        <View style={S.sigZone}>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Signature de l'employeur</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <Text style={[S.fn, { marginTop: 10 }]}>Ce mandat ne vous dispense en aucun cas de conserver les justificatifs obligatoires à l'enregistrement de votre contrat, en cas de contrôle.</Text>
        <Text style={S.fn}>¹DECA : numéro d'enregistrement du contrat</Text>

        <Text style={[S.p, { marginTop: 8 }]}>Le contrat d'apprentissage et la convention de formation vous seront envoyés par mail pour signature.</Text>
        <Text style={S.p}>Expéditeur : pedagogie@pamoi.re ou contact@pamoi.re</Text>
        <Text style={S.p}>Les documents définitifs vous seront retournés par mail une fois visés par toutes les parties (Apprenti, Responsable légal le cas échéant, employeur, CFA).</Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 3/8</Text>
          </View>
        </View>

        <Text style={S.articleTitle}>Article 1er : Objet de la convention</Text>
        <Text style={S.p}>Le CFA PAM OI organise l'action de formation par apprentissage au sens de l'article L. 6313-6 du Code du travail.</Text>

        <View style={S.box}>
          <Text style={S.p}>• Préparer à l'obtention du titre :</Text>
          <Text style={S.p}>Intitulé : <Text style={{ fontFamily: 'Helvetica-Bold' }}>TITRE PROFESSIONNEL</Text></Text>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 3 }}>{d.FORMATION_LIBELLE}</Text>
          <Text style={S.p}>• Contenu de l'action : cf Programme de formation annexé à la convention</Text>
          <Text style={S.p}>• Durée de l'action de formation : cf Planning prévisionnel annexé à la convention</Text>
          <Text style={S.p}>Du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_FORMATION}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_FORMATION}</Text> pour un volume horaire total de <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.VOLUME_HORAIRE_TOTAL}</Text> heures</Text>
          <Text style={S.p}>• Lieu principal de la formation : Centre PAM OI, au 1 Chemin Dubuisson 97436 ST LEU</Text>
          <Text style={S.p}>• Périodes de réalisation en entreprise et en CFA : la formation se déroulera selon un rythme alterné CFA/Entreprise du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_CONTRAT}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_CONTRAT}</Text> selon le planning de formation joint en annexe.</Text>
        </View>

        <Text style={S.articleTitle}>Article 2 : Modalités de déroulement, de suivi et d'obtention du diplôme ou du titre</Text>
        <Text style={S.p}>Modalités de déroulement : La formation se déroulera en présentiel mais pourra être également dispensée à distance en cas d'impossibilité de déroulement en présentiel.</Text>

        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Moyens prévus : PAM OI dispose de moyens humains et matériels suivants, nécessaires au bon déroulement de la formation :</Text>
        {[
          'Équipe de formateurs spécialisés ;',
          'Alternance d\'apports théoriques, méthodologiques et pratiques ;',
          'Jeux de rôle, situation de problèmes, études de cas tirées de l\'actualité nationale et régionale et faisant référence aux compétences de l\'emploi. Ceux-ci permettant à chaque stagiaire d\'intégrer les connaissances générales, savoir-faire, gestes professionnels et attitudes comportementales adaptées ;',
          'Mise en situation professionnelle en combinant approches théoriques et pratique pour un entraînement tout au long du programme ;',
          'Ateliers et exercices pratiques pour l\'acquisition et l\'ajustement des gestes professionnels ;',
          'Tout au long de l\'apprentissage, des évaluations formatives sont fréquemment réalisées dans le cadre du suivi de progression vers l\'atteinte de l\'objectif et des modalités de contrôle des acquis ;',
          'Intervention par image (télévision-hdmi) ;',
          'Utilisation de l\'outil informatique nécessaire à tout acte administratif, de gestion ou communication moderne (internet) ;',
          'Pédagothèque : outils et contenus pédagogiques récents relatifs à nos domaines d\'intervention en formation notamment secrétariat comptable / ressources humaines / formateur pour adultes.',
        ].map((t, i) => <Text key={i} style={S.bullet}>• {t}</Text>)}

        <Text style={[S.p, { marginTop: 4 }]}>Modalités de suivi : Le CFA contrôle la présence du Bénéficiaire. Un suivi en entreprise et au sein du CFA sera opéré par notre chargé de suivi qualité ; 2 suivis minimums par année de contrat d'apprentissage.</Text>
        <Text style={S.p}>Modalités d'obtention du diplôme ou du titre : Présentation à la session de validation conduisant au titre professionnel.</Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      {/* ===== PAGE 3 — Article 3 ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 3/8</Text>
          </View>
        </View>

        <Text style={S.articleTitle}>Article 3 : Bénéficiaire(s) de l'action de formation en apprentissage</Text>

        <View style={S.box}>
          <Text style={S.p}>Nom et prénom(s) : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.APPRENANT_NOM_COMPLET}</Text>{'          '}Date de début du contrat : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_CONTRAT}</Text>{'          '}Date de fin du contrat : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_CONTRAT}</Text></Text>
          <Text style={[S.p, { fontStyle: 'italic', marginTop: 4 }]}>Quotité de temps de travail si l'apprenti bénéficie d'un temps de travail adapté en raison de la reconnaissance de la qualité de travailleur handicapé et/ou de son inscription sur la liste des sportifs de haut niveau¹ : …………………%</Text>
          <Text style={S.p}>Formation débutée précédemment : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.FORMATION_DEJA_DEBUTEe}</Text></Text>
        </View>

        <Text style={[S.p, { fontStyle: 'italic', fontSize: 7.5 }]}>Lorsque le jeune a commencé sa formation sous un autre statut (ex. stagiaire de la formation professionnelle au titre de l'article L 6222-12-1 – avant la signature du contrat ou au titre de l'article L6231-2 – en cas de rupture de contrat) ou bien lorsque le contrat fait suite à un précédent contrat d'apprentissage.</Text>

        <View style={S.boxGray}>
          <Text style={S.p}>Du : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_PRECEDENTE_FORMATION || '…………………'}</Text>{'     '}au : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_PRECEDENTE_FORMATION || '…………………'}</Text></Text>
          <Text style={S.p}>Statut : Apprenti(e){'          '}Nombre d'heures de formation suivies : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.NB_HEURES_DEJA_SUIVIES || '…………'}</Text></Text>
          <Text style={S.p}>N° DECA : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.N_DECA || '……………………………………'}</Text></Text>
          <Text style={[S.p, { marginTop: 4 }]}>Du : …………………{'     '}au : …………………</Text>
          <Text style={S.p}>Statut : …………………{'          '}Nombre d'heures de formation suivies : …………………</Text>
        </View>

        <Text style={S.fn}>¹ Liste prévue au premier alinéa de l'article L.221-2 du code du sport.</Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      {/* ===== PAGE 5 — Article 4 Dispositions financières ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 5/8</Text>
          </View>
        </View>

        <Text style={S.articleTitle}>Article 4 : Dispositions financières</Text>
        <Text style={S.p}>Conformément à l'article L. 6211-1 du code du travail, la gratuité de la formation est garantie à l'apprenti et, le cas échéant, son représentant légal. Dès lors, aucune somme ne peut leur être demandée.</Text>
        <Text style={S.p}>Le financement du contrat de professionnalisation sera fonction de la durée d'exécution du contrat, soit <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DUREE_FORMATION}</Text> du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_FORMATION}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_FORMATION}</Text>.</Text>

        <View style={S.box}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Niveau de Prise En Charge :</Text>
          <Text style={S.p}>RNCP : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.RNCP_CODE}</Text></Text>
          <Text style={S.p}>Pour IDCC <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.IDCC_ENTREPRISE}</Text> : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.COUT_PEDAGOGIQUE_ANNEE_1}</Text>/an</Text>
          <Text style={S.p}>Durée du contrat : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DUREE_FORMATION}</Text> mois, du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_FORMATION}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_FORMATION}</Text></Text>
          <Text style={S.p}>Durée en jours la première année, du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_FORMATION}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_PREMIERE_ANNEE}</Text> : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.TOTAL_JOURS_PREMIERE_ANNEE}</Text> jours</Text>
          {deuxiemeAnnee && (
            <Text style={S.p}>Durée en jours la deuxième année, du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_DEBUT_DEUXIEME_ANNEE}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_FIN_FORMATION}</Text> : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.TOTAL_JOURS_DEUXIEME_ANNEE}</Text> jours</Text>
          )}
        </View>

        {/* Tableau financier */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 1.5 }]}>Année</Text>
          <Text style={S.tableHeaderCell}>Prix de la prestation ¹</Text>
          <Text style={S.tableHeaderCell}>Prise en charge OPCO ²</Text>
          <Text style={S.tableHeaderCell}>Participation employeur ³</Text>
          <Text style={S.tableHeaderCell}>Montant à payer OPCO</Text>
          <Text style={S.tableHeaderCell}>Total employeur</Text>
        </View>
        <View style={S.tableRow}>
          <Text style={[S.tableCellLeft, { fontFamily: 'Helvetica-Bold' }]}>1ère année</Text>
          <Text style={S.tableCell}>{d.COUT_PEDAGOGIQUE_ANNEE_1} €</Text>
          <Text style={S.tableCell}>{d.COUT_PEDAGOGIQUE_ANNEE_1} €</Text>
          <Text style={S.tableCell}></Text>
          <Text style={S.tableCell}>{d.COUT_PEDAGOGIQUE_ANNEE_1} €</Text>
          <Text style={S.tableCell}></Text>
        </View>
        {deuxiemeAnnee && (
          <View style={S.tableRow}>
            <Text style={[S.tableCellLeft, { fontFamily: 'Helvetica-Bold' }]}>2ème année</Text>
            <Text style={S.tableCell}>{d.COUT_PEDAGOGIQUE_ANNEE_2} €</Text>
            <Text style={S.tableCell}>{d.COUT_PEDAGOGIQUE_ANNEE_2} €</Text>
            <Text style={S.tableCell}></Text>
            <Text style={S.tableCell}>{d.COUT_PEDAGOGIQUE_ANNEE_2} €</Text>
            <Text style={S.tableCell}></Text>
          </View>
        )}
        <View style={[S.tableRow, { backgroundColor: '#EAF4F3' }]}>
          <Text style={[S.tableCellLeft, { fontFamily: 'Helvetica-Bold' }]}>Total frais pédagogiques</Text>
          <Text style={[S.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{d.COUT_TOTAL_FRAIS_PEDAGOGIQUES} €</Text>
          <Text style={S.tableCell}></Text>
          <Text style={S.tableCell}></Text>
          <Text style={S.tableCell}></Text>
          <Text style={S.tableCell}></Text>
        </View>

        <Text style={[S.p, { marginTop: 5, fontStyle: 'italic', fontSize: 7.5 }]}>Tableau adapté en fonction de la durée du contrat.</Text>
        <Text style={[S.p, { fontStyle: 'italic', fontSize: 7 }]}>N.B. : La 1ère année de financement correspond à la première année d'exécution du contrat d'apprentissage. Dans le cas d'une formation débutée sous statut de stagiaire de la formation professionnelle financée par l'OPCO, la 1ère année de financement correspond au début de la période sous statut de stagiaire de la formation professionnelle.</Text>

        <View style={[S.boxGray, { marginTop: 6 }]}>
          <Text style={S.p}>Montant de la majoration forfaitaire annuelle pour les apprentis bénéficiant de la reconnaissance en qualité de travailleur handicapé² : ………………… €</Text>
          <Text style={S.p}>Montant de la modulation annuelle pour l'accompagnement social des apprentis les plus en difficulté résidant dans les territoires ultramarins : ………………… €</Text>
          <Text style={S.p}>Montant de la modulation en cas de formation à distance : ………………… €</Text>
        </View>

        <Text style={S.fn}>¹ Article 261 4, 4° du code général des impôts</Text>
        <Text style={S.fn}>² En application de l'article D. 6332-82 du code du travail et/ou du 1° de l'article L.6523-2-3 du code du travail.</Text>
        <Text style={S.fn}>³ Article 192 de la loi n° 2025-127 du 14 février 2025 de finances pour 2025.</Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      {/* ===== PAGE 6 — Article 5 Frais annexes ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 6/8</Text>
          </View>
        </View>

        <Text style={S.articleTitle}>Article 5 : Frais annexes – pendant le temps en CFA uniquement</Text>
        <Text style={S.p}>Les frais annexes concernent le temps en CFA uniquement. Lorsqu'ils sont financés par les CFA, l'OPCO prend en charge une partie de ces frais³.</Text>

        {/* Tableau frais annexes */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 2 }]}></Text>
          <Text style={S.tableHeaderCell}>Hébergement 6€/nuit</Text>
          <Text style={S.tableHeaderCell}>Restauration 3€/repas</Text>
        </View>
        <View style={S.tableRow}>
          <Text style={[S.tableCellLeft, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>1ère année de financement</Text>
          <Text style={S.tableCell}>Nuitées : ………{'  '}Montant : ……… €</Text>
          <Text style={S.tableCell}>Repas : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d['Nombre_repas_ 1']}</Text>{'  '}Montant : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.FRAIS_ANNEXES_REPAS_ANNEE_1}</Text> €</Text>
        </View>
        {deuxiemeAnnee && (
          <View style={S.tableRow}>
            <Text style={[S.tableCellLeft, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>2ème année de financement</Text>
            <Text style={S.tableCell}>Nuitées : ………{'  '}Montant : ……… €</Text>
            <Text style={S.tableCell}>Repas : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d['Nombre_repas_ 2']}</Text>{'  '}Montant : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.FRAIS_ANNEXES_REPAS_ANNEE_2}</Text> €</Text>
          </View>
        )}

        <View style={[S.boxGray, { marginTop: 8 }]}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Premier équipement pédagogique :</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 4 }}>
  <PdfCheckBox label="Oui" />
  <PdfCheckBox label="Non" />
</View>
<Text style={S.p}>Si oui, préciser le montant du forfait pris en charge par l'OPCO : ………………… €</Text>
        </View>

        <Text style={S.p}>Le règlement de la formation sera dû à réception de la facture. Les factures des frais de formation ainsi que les certificats de réalisation seront adressés directement à l'OPCO.</Text>

        <View style={[S.boxGray, { marginTop: 6 }]}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Frais liés à la mobilité internationale⁴ ou à la mobilité vers la métropole des apprentis résidant dans les territoires ultramarins :</Text>
          <Text style={S.checkLine}>☐ Oui{'          '}☐ Non</Text>
          <Text style={S.p}>Si oui, préciser le montant du forfait pris en charge par l'OPCO : ………………… €</Text>
        </View>

        <View style={[S.box, { marginTop: 6 }]}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Totaux pour les frais annexes : <Text style={{ color: '#006B68' }}>{d.TOTAL_FRAIS_ANNEXES} €</Text></Text>
        </View>

        <Text style={S.fn}>³ En cas de formation délivrée à 100% à distance, il ne peut être facturé de frais d'hébergement et de restauration.</Text>
        <Text style={S.fn}>⁴ En application des articles R.6222-68 ou R.6222-60, la convention organisant la mobilité internationale de l'apprenti est transmise à l'opérateur de compétences qui se prononce sur la prise en charge financière. En cas de formation délivrée à 100% à distance, il ne peut être facturé de frais d'hébergement et de restauration.</Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      {/* ===== PAGE 7 — Articles 6 à 9 ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 7/8</Text>
          </View>
        </View>

        <Text style={S.articleTitle}>Article 6 : Clause suspensive</Text>
        <Text style={S.p}>L'exécution de la présente convention est soumise au dépôt du contrat par l'opérateur de compétence (l'OPCO) (Art. L 6224-1 du Code du travail) auprès des services du ministre en chargé de la formation professionnelle.</Text>

        <Text style={S.articleTitle}>Article 7 : Fin de la convention</Text>
        <Text style={S.p}>La présente convention se termine :</Text>
        <Text style={S.bullet}>• dès la fin d'exécution du contrat d'apprentissage, à l'échéance mentionnée dans le contrat d'apprentissage ;</Text>
        <Text style={S.bullet}>• en cas de refus de prise en charge par un OPCO, par effet de la clause résolutoire prévue à l'article 8 ;</Text>
        <Text style={S.bullet}>• en cas de rupture anticipée du contrat, à la date d'effet de celle-ci.</Text>

        <Text style={S.articleTitle}>Article 8 : Différends éventuels</Text>
        <Text style={S.p}>Si une contestation ou un différend ne peuvent être réglés à l'amiable, le Tribunal de Saint Denis sera seul compétent pour régler le litige.</Text>

        <Text style={S.articleTitle}>Article 9 : Date d'effet et durée de la convention</Text>
        <Text style={S.p}>La présente convention est applicable pour toute la durée de réalisation de l'action de formation, visée à l'article 1.</Text>

        <View style={S.divider} />
        <Text style={[S.p, { marginBottom: 10 }]}>Fait en double exemplaire*, à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.LIEU_SIGNATURE_DOC}</Text>, le <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_SIGNATURE_DOC}</Text></Text>

        <View style={S.sigZone}>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Pour l'entreprise : {d.ENTREPRISE_RAISON_SOCIALE}</Text>
            <Text style={S.sigLbl}>Nom et qualité du signataire :</Text>
            <Text style={S.sigName}>{d.DIRIGEANT_NOM_COMPLET}</Text>
            <View style={S.sigLine} />
            <Text style={S.sigNote}>Signature de l'entreprise cliente</Text>
          </View>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Pour l'organisme : PAM OI</Text>
            <Text style={S.sigLbl}>Nom et qualité du signataire :</Text>
            <Text style={S.sigName}>MAILLOT Gaëlle, Directrice & référente handicap</Text>
            <View style={S.sigLine} />
            <Text style={S.sigNote}>Cachet du CFA</Text>
          </View>
        </View>

        <Text style={[S.fn, { marginTop: 12 }]}>
          * Un exemplaire de ce document doit être adressé à vos interlocuteurs (OPCO) avec le Cerfa{'\n'}
          • Envoi par mail à : contact@pamoi.re – pedagogie@pamoi.re{'\n'}
          • Dépôt sur l'espace OPCO en utilisant vos coordonnées sur l'extranet « mon espace Opco en ligne »
        </Text>

        <View style={[S.boxGray, { marginTop: 8 }]}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Annexes :</Text>
          <Text style={S.fn}>1 – Programme pédagogique</Text>
          <Text style={S.fn}>2 – Planning de formation</Text>
          <Text style={S.fn}>3 – Information relatives au traitement des données personnelles que l'entreprise doit remettre au bénéficiaire</Text>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

      {/* ===== PAGE 8 — Mentions légales RGPD ===== */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.pageLabel}>Convention de Formation par apprentissage – Page 8/8</Text>
          </View>
        </View>

        <Text style={S.sectionBg}>Mentions légales et protection des données</Text>

        <Text style={[S.p, { marginTop: 8 }]}>
          Conformément à la loi n° 78-17 du 6 janvier 1978 modifiée, relative à l'Informatique, aux Fichiers et aux Libertés, vous disposez d'un droit d'accès et de rectification des données à caractère personnel vous concernant et faisant l'objet de traitements sous la responsabilité de PAM OI.
        </Text>
        <Text style={S.p}>
          Vous pouvez exercer votre droit d'accès et de rectification des données à caractère personnel en écrivant par mail à contact@pamoi.re – coordonnées sur www.pamoi.re – N° SIRET : 881 279 392 00016 – Code APE : 8559A – N° TVA Intracom. : FR77881279392
        </Text>

        <View style={[S.boxGray, { marginTop: 12 }]}>
          <Text style={S.fn}>PAM OI Formation – 38B Rue des Canneliers 97436 St Leu</Text>
          <Text style={S.fn}>Siret : 881 279 392 00016 – Naf : 8559A – RCS 881 279 392 Saint-Pierre de la Réunion</Text>
          <Text style={S.fn}>SASU au capital de 500€</Text>
          <Text style={S.fn}>Tel : 0693 55 64 92 – Email : contact@pamoi.re</Text>
          <Text style={S.fn}>Site internet : https://www.pamoi.re</Text>
        </View>

        <View style={[S.boxGray, { marginTop: 12 }]}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Notes de bas de page :</Text>
          <Text style={S.fn}>[1] Liste prévue au premier alinéa de l'article L.221-2 du code du sport.</Text>
          <Text style={S.fn}>[2] En application de l'article D. 6332-82 du code du travail et/ou du 1° de l'article L.6523-2-3 du code du travail.</Text>
          <Text style={S.fn}>[3] En cas de formation délivrée à 100% à distance, il ne peut être facturé de frais d'hébergement et de restauration.</Text>
          <Text style={S.fn}>[4] En application des articles R.6222-68 ou R.6222-60, la convention organisant la mobilité internationale de l'apprenti est transmise à l'opérateur de compétences qui se prononce sur la prise en charge financière. En cas de formation délivrée à 100% à distance, il ne peut être facturé de frais d'hébergement et de restauration.</Text>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>{FOOTER}</Text>
      </Page>

    </Document>
  );
}