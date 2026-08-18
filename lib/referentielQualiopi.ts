// lib/referentielQualiopi.ts
// Niveaux attendus et points de conformité des 33 indicateurs du RNQ.
//
// SOURCE : grille d'audit de renouvellement Certifopac du 25-26 août 2025
// (indicateurs 1 à 32), et fiche Certifopac de l'indicateur 33 publiée
// le 6 août 2026.
//
// ⚠️ L'indicateur 33 est issu du décret n° 2026-728 du 1er août 2026, en
// vigueur au 1er novembre 2026. Le guide de lecture v10 n'étant pas publié,
// son niveau attendu reste à confirmer auprès du certificateur.

export interface ReferenceIndicateur {
  libelle: string;
  niveauAttendu: string;
  pointsConformite: string[];
}

export const REFERENCE_INDICATEURS: Record<number, ReferenceIndicateur> = {
  1: {
    libelle: 'Information du public',
    niveauAttendu: 'Donner une information accessible, exhaustive sur la prestation, c’est-à-dire sur son contenu et sur l’intégralité des items mentionnés. Cette information doit être à jour.',
    pointsConformite: [
      'L\'information est accessible au public.   ',
      'L\'information est exhaustive : Les prérequis sont présents.   ',
      'L\'information est exhaustive : Les objectifs sont présents.   ',
      'L\'information est exhaustive : Le contenu de la prestation est présent.   ',
      'L\'information est exhaustive : La durée est présente.   ',
      'L\'information est exhaustive : les modalités d\'accès sont présentes.   ',
      'L\'information est exhaustive : Les délais d\'accès sont présents.   ',
      'L\'information est exhaustive : Les tarifs sont présents.   ',
      'L\'information est exhaustive : Les contacts sont présents.   ',
      'L\'information est exhaustive : Les méthodes mobilisées sont présentes.   '
    ],
  },
  2: {
    libelle: 'Indicateurs de résultats',
    niveauAttendu: 'Donner une information chiffrée permettant de suivre les résultats de la prestation au regard des objectifs.',
    pointsConformite: [
      'Un ou plusieurs indicateurs sont pré identifiés (obligation spécifique nouvel entrant).   ',
      'Un ou plusieurs indicateurs de résultats existent pour chaque prestation échantillonnée.   ',
      'Le ou les indicateurs de résultats sont adaptés aux prestations mises en œuvre […]   ',
      'Le ou les indicateurs de résultats sont diffusés.   ',
      'Précision : Les indicateurs de résultats obligatoires et cités à l\'article L. 6111-8 du Code   ',
      'du travail sont disponibles sur Inserjeunes ou sont calculés et diffusés par le CFA.'
    ],
  },
  3: {
    libelle: 'Taux d\'obtention des certifications',
    niveauAttendu: 'Donner au public une information accessible, exhaustive (c\'est à dire sur l\'intégralité des items mentionnés) et actualisés (informations à jour).',
    pointsConformite: [
      'L\'information est exhaustive et accessible : le taux d\'obtention des certifications   ',
      'Le taux d\'obtention des certifications est mis en relation avec le taux de présentation à   ',
      'L\'information est exhaustive et accessible : les possibilités de valider un ou des blocs de   ',
      'compétences sont présents.',
      'L\'information est exhaustive et accessible : les équivalences et passerelles sont présents.   ',
      'L\'information est exhaustive et accessible : les suites de parcours et débouchés sont   ',
      'L\'information sur les débouchés comprend le taux d\'insertion global dans l\'emploi.   ',
      'L\'information sur les débouchés comprend le taux d\'insertion dans le métier visé des   ',
      'titulaires de la certification figurant sur la fiche RNCP.',
      'Les informations sont actualisées.   '
    ],
  },
  4: {
    libelle: 'Analyse du besoin',
    niveauAttendu: 'Démontrer comment le besoin du bénéficiaire est analysé en fonction de la finalité de la prestation.',
    pointsConformite: [
      'Le besoin du bénéficiaire est pris en compte dans la conception et l\'exécution de la   ',
      'Le besoin du bénéficiaire est analysé en fonction de la finalité de la prestation.   ',
      'Le besoin du bénéficiaire est analysé en lien avec l\'entreprise ou le financeur concerné.   ',
      'L\'analyse du besoin est prévue en amont du processus de contractualisation   ',
      'L\'analyse du besoin intègre la vérification des missions proposées par l\'entreprise avec le   ',
      'diplôme ou la certification professionnelle visé.',
      'Les situations de handicap et les besoins en compensation sont pris en compte.   '
    ],
  },
  5: {
    libelle: 'Objectifs de la prestation',
    niveauAttendu: 'Démontrer que les objectifs spécifiques à la prestation ont été définis et peuvent faire l\'objet d\'une évaluation.',
    pointsConformite: [
      'Le prestataire sous-traitant démontre qu’il tient compte des objectifs définis par le   ',
      'Précision : Les objectifs spécifiques de la prestation sont définis de façon opérationnelle   ',
      'Précision : Les objectifs spécifiques de la prestation peuvent faire l\'objet d\'une   ',
      'Les objectifs sont exprimés en compétences et/ou capacités professionnelles à acquérir   ',
      'et/ou en certifications visées.',
      'Les objectifs sont conformes aux objectifs fixés par la certification inscrite au RNCP/RS   '
    ],
  },
  6: {
    libelle: 'Contenus et modalités',
    niveauAttendu: 'Démontrer que les contenus et modalités de mise en œuvre des prestations sont adaptées aux objectifs définis en fonction des bénéficiaires.',
    pointsConformite: [
      'Les contenus sont établis et adaptés aux objectifs définis et aux publics bénéficiaires.   ',
      'Les modalités de mise en œuvre des prestations sont établies et adaptées aux objectifs   ',
      'définis et aux publics bénéficiaires.',
      'Le contenu de la prestation est en cohérence avec les objectifs inscrits dans le   ',
      'référentiel de la certification inscrite au RNCP/RS.',
      'Nouveauté V8 2024 : La situation de handicap est prise en compte dans la conception   ',
      'et la mise en œuvre des prestations.'
    ],
  },
  7: {
    libelle: 'Contenus et exigences',
    niveauAttendu: 'Démontrer l’adéquation du contenu aux compétences ciblées et aux épreuves d’évaluation de la certification.',
    pointsConformite: [
      'Les contenus des prestations sont en adéquation avec les compétences ciblées de la   ',
      'Les contenus des prestations sont en adéquation avec les épreuves d’évaluation de la   ',
      'La prestation est conforme au Référentiel d\'Activité, de Compétences et d\'Evaluation   ',
      'de la certification visée.'
    ],
  },
  8: {
    libelle: 'Positionnement à l\'entrée',
    niveauAttendu: 'Démontrer l\'existence de procédures de positionnement et d\'évaluation des acquis à l\'entrée de la prestation adaptée au public et modalités de formation.',
    pointsConformite: [
      'Le prestataire démontre qu\'il applique les procédures de positionnement du   ',
      'Des procédures de positionnement et d’évaluation des acquis à l’entrée de la   ',
      'prestation sont mises en œuvre.',
      'Les procédures de positionnement et d’évaluation des acquis à l’entrée de la   ',
      'prestation sont adaptées aux publics et aux modalités de formations.',
      'Les prérequis sont cohérents avec ceux de la certification inscrite au RNCP/RS.   ',
      'L’information sur l’absence des prérequis est communiquée.   '
    ],
  },
  9: {
    libelle: 'Conditions de déroulement',
    niveauAttendu: 'Les modalités d\'accueil et les conditions de déroulement de la prestation sont formalisées et diffusées.',
    pointsConformite: [
      'Les modalités d’accueil sont formalisées.   ',
      'Les conditions de déroulement de la prestation sont formalisées.   ',
      'Les modalités d’accueil sont diffusées.   ',
      'Les conditions de déroulement de la prestation sont diffusées.   '
    ],
  },
  10: {
    libelle: 'Adaptation de la prestation',
    niveauAttendu: 'La prestation est adaptée aux situations et profils des bénéficiaires, lorsque l’analyse du besoin en établit la nécessité : contenus (outils et méthodes), accompagnement, suivi (durée, emploi du temps, adaptation des rythmes).',
    pointsConformite: [
      'Les contenus, l\'accompagnement et le suivi de la prestation (durées, emplois du temps,   ',
      'adaptation des rythmes) sont adaptés aux situations et profils des bénéficiaires.',
      'La prestation est adaptée aux situations et profils des bénéficiaires lorsque l\'analyse des   ',
      'besoins en établit la nécessité',
      'Précisions : Le CFA accompagne les personnes souhaitant s\'orienter ou se réorienter par   ',
      'la voie de l\'apprentissage, en développant leurs connaissances et leurs compétences',
      'et en facilitant leur intégration en emploi, en cohérence avec leur projet professionnel.',
      '(1° de l\'article L. 6231-2 du code du travail).',
      'Précisions : Pour les personnes en situation de handicap, le CFA appuie la recherche   ',
      'd\'un employeur et facilite leur intégration tant en CFA qu\'en entreprise en proposant les'
    ],
  },
  11: {
    libelle: 'Atteinte des objectifs',
    niveauAttendu: 'Démontrer qu\'un processus d\'évaluation existe, est formalisé et mis en œuvre. Il permet d\'apprécier l\'atteinte des objectifs.',
    pointsConformite: [
      'Précisions : Un processus d’évaluation existe et est formalisé (défini et matérialisé par   ',
      'Le processus d\'évaluation permet d\'apprécier l’atteinte par les publics bénéficiaires des   ',
      'objectifs de la prestation.',
      'Le processus d\'évaluation est mis en œuvre.   '
    ],
  },
  12: {
    libelle: 'Engagement des bénéficiaires',
    niveauAttendu: 'Démontrer que des mesures formalisées existent et sont mises en œuvre.',
    pointsConformite: [
      'Des mesures pour favoriser l’engagement des bénéficiaires sont formalisées.   ',
      'Précisions : Des mesures pour favoriser l’engagement des bénéficiaires sont mises en   ',
      'œuvre (démontrées et matérialisées par des outils).',
      'Des mesures pour prévenir les ruptures de parcours existent et sont formalisées.   ',
      'Précisions : Des mesures pour prévenir les ruptures de parcours existent et sont mises en   ',
      'œuvre (démontrées et matérialisées par des outils).',
      'Précisions : Le CFA apporte, en lien avec le service public de l\'emploi, en particulier   ',
      'avec les missions locales, un accompagnement aux apprentis pour prévenir ou',
      'résoudre les difficultés d\'ordre social et matériel susceptibles de mettre en péril le',
      'déroulement du contrat d\'apprentissage. (Mission 6 de l\'article L. 6231-2 du code du'
    ],
  },
  13: {
    libelle: 'Coordination des apprentis',
    niveauAttendu: 'Démontrer que les principes de la pédagogie de l\'alternance sont mis en œuvre, grâce à un processus formalisé d\'articulation itératif des apprentissages entre le centre de formation et l\'entreprise.',
    pointsConformite: [
      'Précision : Un processus formalisé d’articulation itératif des apprentissages est formalisé   ',
      'pour les deux lieux de formation : en centre de formation et en entreprise.',
      'Le processus formalisé d’articulation itératif des apprentissages est mis en œuvre.   '
    ],
  },
  14: {
    libelle: 'Exercice de la citoyenneté',
    niveauAttendu: 'Démontrer que l\'accompagnement de l\'apprenant est formalisé et mis en œuvre par la mise en place de projets spécifiques.',
    pointsConformite: [
      'Un accompagnement socio-professionnel, éducatif et relatif à l’exercice de la   ',
      'citoyenneté de l’apprenant est formalisé.',
      'L\'accompagnement est mis en œuvre par la mise en place de projets spécifiques.   ',
      'Précision : Le CFA favorise la mixité au sein de sa structure en sensibilisant les   ',
      'formateurs, les maîtres d\'apprentissage et les apprentis à la question de l\'égalité entre',
      'les femmes et les hommes ainsi qu\'à la prévention du harcèlement sexuel au travail et',
      'en menant une politique d\'orientation et de promotion des formations qui met en avant',
      'les avantages de la mixité. Ils participent à la lutte contre la répartition sexuée des',
      'métiers (Mission 7 de l\'article L. 6231-2 du code du travail) ;',
      'Précision : Le CFA encourage la mixité des métiers et l\'égalité professionnelle entre les   '
    ],
  },
  15: {
    libelle: 'Droits et devoirs de l\'apprenti',
    niveauAttendu: 'Démontrer que les apprentis sont informés des droits et devoirs des salariés / apprentis et sur les règles applicables en matière de santé et de sécurité en milieu professionnel.',
    pointsConformite: [
      'Précision : Les apprentis sont informés de leurs droits et devoirs en tant qu’apprentis et   ',
      'salariés (Mission 4 de l\'article L. 6231-2 du code du travail).',
      'Précision : Les apprentis sont informés des règles applicables en matière de santé et de   ',
      'sécurité en milieu professionnel (Mission 4 de l\'article L. 6231-2 du code du travail).'
    ],
  },
  16: {
    libelle: 'Présentation à la certification',
    niveauAttendu: 'Le prestataire respecte les exigences formelles de l’autorité de certification lorsqu’il présente des candidats à la certification qu’il propose',
    pointsConformite: [
      'les conditions de présentation des bénéficiaires à la certification respectent les   ',
      'exigences formelles de l’autorité de certification.',
      'Lorsque le prestataire n\'est pas chargé de l\'évaluation, il oriente le bénéficiaire vers   '
    ],
  },
  17: {
    libelle: 'Moyens humains et techniques',
    niveauAttendu: 'Démontrer que les locaux, les équipements, les moyens humains sont en adéquation avec la ou les prestation(s).',
    pointsConformite: [
      'L\'environnement mis à disposition (Conditions, locaux, plateaux techniques) pour   ',
      'réaliser la prestation est approprié.',
      'Les moyens humains mis à disposition pour réaliser la prestation sont adaptés.   ',
      'Les moyens techniques (équipements) mis à disposition pour réaliser la prestation sont   '
    ],
  },
  18: {
    libelle: 'Coordination des acteurs',
    niveauAttendu: 'Le prestataire identifie selon les fonctions nécessaires aux prestations, les intervenants dont il assure la coordination.',
    pointsConformite: [
      'Précision : Les intervenants et leurs fonctions nécessaires à la prestation sont identifiés   ',
      '(intervenants internes et/ou externes : pédagogiques, administratifs, logistiques,',
      'Précision : La coordination des intervenants est assurée.   ',
      'Le prestataire indépendant démontre qu\'il assume seul toutes les fonctions.   '
    ],
  },
  19: {
    libelle: 'Ressources pédagogiques',
    niveauAttendu: 'Démontrer que les ressources pédagogiques sont cohérentes avec les objectifs des prestations, sont disponibles et que des dispositions sont mises en place afin de permettre aux bénéficiaires de se les approprier.',
    pointsConformite: [
      'Les ressources pédagogiques existent.   ',
      'Les ressources pédagogiques sont cohérentes avec les objectifs des prestations.   ',
      'Les ressources pédagogiques sont disponibles.   ',
      'Des dispositions sont prévues pour permettre aux bénéficiaires de s\'approprier les   ',
      'Les dispositions sont mises en œuvre pour permettre aux bénéficiaires de s\'approprier les   ',
      'La mise en œuvre d’une action de formation en tout ou partie à distance comprend   ',
      'une assistance technique et pédagogique appropriée pour accompagner le',
      'bénéficiaire dans le déroulement de son parcours (article D. 6313-3-1 du code du'
    ],
  },
  20: {
    libelle: 'Personnels dédiés',
    niveauAttendu: 'Le prestataire présente : - La liste des membres du Conseil de perfectionnement, le dernier compte rendu et/ou procès-verbal ; - La liste des personnes dédiées à la mobilité (nationale et internationale) et les actions mises en œuvre en faveur de la mobilité ; - Le nom et le contact du référent handicap et les actions qu\'il met en œuvre pour accomp',
    pointsConformite: [
      'Le prestataire présente la liste des membres du conseil de perfectionnement, le dernier   ',
      'compte-rendu et/ou procès-verbal.',
      'Le prestataire présente la liste des personnes dédiées à la mobilité (nationale et   ',
      'internationale) (Mission 10 de l\'article L. 6231-2 du code du travail).',
      'Le prestataire présente le nom et le contact du référent handicap (Mission 1 de l\'article   ',
      'L. 6231-2 du code du travail).',
      'Le prestataire présente les actions mises en œuvre en faveur de la mobilité.   ',
      'Le prestataire présente les actions qu\'il met en œuvre pour accompagner les publics en   '
    ],
  },
  21: {
    libelle: 'Compétences des acteurs',
    niveauAttendu: 'Démontrer que les compétences requises pour réaliser les prestations ont été définies en amont et sont adaptées aux prestations. La maîtrise de ces compétences par les intervenants est vérifiée par le prestataire.',
    pointsConformite: [
      'Les compétences requises pour réaliser la prestation sont définies en amont.   ',
      'Les compétences requises pour réaliser la prestation sont adaptées.   ',
      'Précision : La maîtrise des compétences des différents intervenants internes et/ou   ',
      'externes (sous-traitants inclut) est vérifiée.'
    ],
  },
  22: {
    libelle: 'Gestion de la compétence',
    niveauAttendu: 'Démontrer la mobilisation des différents leviers de formation et de professionnalisation pour l\'ensemble de son personnel.',
    pointsConformite: [
      'Le processus de développement des compétences existe (formalisé pour les nouveaux   ',
      'Le prestataire indépendant démontre sa démarche de formation continue, adaptée   ',
      'aux prestations délivrées.',
      'Précision : La mobilisation des différents leviers de formation et de professionnalisation   ',
      'existe pour l\'ensemble du personnel salarié.',
      'Précision : La mobilisation des différents leviers de formation et de professionnalisation   ',
      'est adaptée aux prestations délivrées.'
    ],
  },
  23: {
    libelle: 'Veille légale et réglementaire',
    niveauAttendu: 'Démontrez la mise en place d\'une veille légale et réglementaire, sa prise en compte par le prestataire et sa communication en interne.',
    pointsConformite: [
      'La veille légale/réglementaire sur le champ de la formation professionnelle est mise en   ',
      'Les enseignements tirés de la veille sont exploités.   ',
      'Les enseignements tirés de la veille sont communiqués en interne.   '
    ],
  },
  24: {
    libelle: 'Veille des emplois et métiers',
    niveauAttendu: 'Démontrer la mise en place d’une veille sur les thèmes de l’indicateur et son impact éventuel sur les prestations.',
    pointsConformite: [
      'La veille sur les évolutions des compétences, des métiers et des emplois dans les   ',
      'secteurs d\'interventions du prestataire est mise en place.',
      'Les enseignements tirés de la veille sont exploités.   '
    ],
  },
  25: {
    libelle: 'Veille pédagogique et technologique',
    niveauAttendu: 'Démontrer la mise en place d’une veille sur les thèmes de l’indicateur et son impact éventuel sur les prestations.',
    pointsConformite: [
      'La veille sur les innovations pédagogiques et technologiques permettant une évolution   ',
      'des prestations de l\'organisme est mise en place.',
      'Les enseignements tirés de la veille sont exploités.   '
    ],
  },
  26: {
    libelle: 'Situation de handicap',
    niveauAttendu: 'Démontrer l\'identification d\'un réseau de partenaires/experts/acteurs du champ du handicap, mobilisable par les personnels. Dans le cas d\'accueil de personnes en situation de handicap précisez les modalités de recours à ce réseau et les mesures spécifiques d\'accompagnement ou d\'orientation mises en œuvre.',
    pointsConformite: [
      'Un réseau de partenaires/experts/acteurs du champ du handicap est mis en place.   ',
      'Le réseau de partenaires/experts/acteurs du champ du handicap est mobilisable par le   ',
      'Précision : Des mesures spécifiques d\'accompagnement ou d\'orientation existent et   ',
      'Les modalités de recours au réseau sont précisés.   ',
      'Le prestataire sous-traitant démontre qu’il dispose d’un réseau de   ',
      'partenaires/experts/acteurs du champ du handicap ou que son donneur d’ordre lui a',
      'communiqué la liste de ses partenaires mobilisables pour orienter les PSH et mettre en',
      'place des mesures spécifiques'
    ],
  },
  27: {
    libelle: 'Dispositions sous-traitance',
    niveauAttendu: 'Démontrer les dispositions mises en place pour vérifier le respect de la conformité au présent référentiel par le sous-traitant ou le salarié porté.',
    pointsConformite: [
      'Des dispositions sont mises en place pour vérifier le respect de la conformité au présent   ',
      'référentiel par le sous-traitant ou le salarié porté.'
    ],
  },
  28: {
    libelle: 'Formation en situation de travail',
    niveauAttendu: 'Démontrer l’existence d’un réseau de partenaires socio-économiques mobilisé tout au long de la prestation.',
    pointsConformite: [
      'Un réseau de partenaires socio-économiques existe et permet de co-construire   ',
      'l\'ingénierie de formation et favoriser l\'accueil en entreprise.',
      'Le réseau de partenaires socio-économiques est mobilisable tout au long de la   '
    ],
  },
  29: {
    libelle: 'Insertion professionnelle',
    niveauAttendu: 'Démontrer l’existence d’actions qui concourent à l’insertion professionnelle ou la poursuite d’études.',
    pointsConformite: [
      'Des actions concourant à l\'insertion professionnelle ou la poursuite d\'études existent.   '
    ],
  },
  30: {
    libelle: 'Recueil des appréciations',
    niveauAttendu: 'Démontrer la sollicitation des appréciations à une fréquence pertinente incluant des dispositifs de relance et permettant une libre expression.',
    pointsConformite: [
      'Le prestataire sous-traitant recueille l’appréciation des bénéficiaires et de son donneur   ',
      'd’ordres sur la prestation réalisée',
      'Pour les bénéficiaires : la sollicitation des appréciations est démontrée.   ',
      'Pour les bénéficiaires : la sollicitation est mise en place à une fréquence pertinente.   ',
      'Pour les bénéficiaires : la sollicitation permet une libre expression.   ',
      'Pour les bénéficiaires : la sollicitation inclut des dispositifs de relance.   ',
      'Pour les financeurs : Précision : la sollicitation des appréciations est démontrée, permet   ',
      'une libre expression et inclut des dispositifs de relance. Le cas échéant, il existe des',
      'preuves de contacts, d\'échanges, de participation à des webinaires/réunions avec les',
      'Précision : Pour les financeurs, la sollicitation est mise en place à une fréquence   '
    ],
  },
  31: {
    libelle: 'Traitement des réclamations',
    niveauAttendu: 'Démontrer la mise en place de modalités de traitement des aléas, difficultés et réclamations.',
    pointsConformite: [
      'Des modalités de traitement des difficultés, des réclamations et des aléas rencontrées   ',
      'par les parties prenantes existent.',
      'Des modalités de traitement des difficultés, des réclamations et des aléas rencontrées   ',
      'par les parties prenantes sont mises en œuvre.'
    ],
  },
  32: {
    libelle: 'Amélioration continue',
    niveauAttendu: 'Démontrer la mise en place d’une démarche d’amélioration continue',
    pointsConformite: [
      'Le processus d\'amélioration continue est formalisé.   ',
      'Des mesures d\'améliorations sont mises en œuvre à partir de l\'analyse des   ',
      'Des mesures d\'améliorations sont mises en œuvre à partir de l\'analyse des réclamations.   '
    ],
  },
  33: {
    libelle: "Dispositif d'évaluation des contenus et des enseignements par les apprenants",
    niveauAttendu: "Le guide de lecture ne précise pas encore le niveau attendu (source Certifopac, août 2026).",
    pointsConformite: [
      "Un dispositif d'évaluation des contenus et des enseignements par les apprenants existe.",
      "Ce dispositif est DISTINCT du recueil général de satisfaction.",
      "Les résultats sont partagés avec les équipes pédagogiques.",
      "Les résultats donnent lieu à la formalisation d'une démarche d'amélioration continue.",
      "L'efficacité de cette démarche est mesurée périodiquement.",
    ],
  },
};