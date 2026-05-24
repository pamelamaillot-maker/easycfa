import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { oauth2Client } from '../../../../lib/googleAuth';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Non authentifié', authRequired: true }, { status: 401 });
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { docId, donnees } = await request.json();

    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Copier le document pour ne pas modifier l'original
    const copie = await drive.files.copy({
      fileId: docId,
      requestBody: {
        name: `EasyCFA_${donnees.APPRENANT_NOM_COMPLET}_${new Date().toLocaleDateString('fr-FR')}`,
      },
    });

    const newDocId = copie.data.id!;

    // Récupérer le document copié
    const doc = await docs.documents.get({ documentId: newDocId });
    const content = doc.data.body?.content ?? [];

    // Construire les remplacements
    const requests = Object.entries(donnees)
      .filter(([, valeur]) => valeur && valeur.trim() !== '')
      .map(([cle, valeur]) => ({
        replaceAllText: {
          containsText: {
            text: `{{${cle}}}`,
            matchCase: true,
          },
          replaceText: valeur,
        },
      }));

    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: { requests },
      });
    }

    // 2ème passe : supprimer tous les {{PLACEHOLDER}} restants (non remplis)
    // Liste exhaustive des placeholders possibles (comme le fait l'AppScript original)
    const placeholdersConnus = [
      // Apprenant
      'APPRENANT_CIVILITE', 'APPRENANT_NOM', 'APPRENANT_PRENOM', 'APPRENANT_NOM_COMPLET',
      'APPRENANT_DATE_NAISSANCE', 'APPRENANT_LIEU_NAISSANCE', 'APPRENANT_ADRESSE',
      'APPRENANT_CP', 'APPRENANT_VILLE', 'APPRENANT_TELEPHONE', 'APPRENANT_EMAIL', 'APPRENANT_NSS',
      'NOM_APPRENTI(E)',
      // Représentant légal
      'REPRESENTANT_LEGAL_NOM', 'REPRESENTANT_LEGAL_PRENOM', 'REPRESENTANT_LEGAL_LIEN',
      'REPRESENTANT_LEGAL_ADRESSE', 'REPRESENTANT_LEGAL_TELEPHONE', 'REPRESENTANT_LEGAL_EMAIL',
      // Entreprise
      'ENTREPRISE_RAISON_SOCIALE', 'ENTREPRISE_ACTIVITE', 'ENTREPRISE_ADRESSE', 'ENTREPRISE_CP',
      'ENTREPRISE_VILLE', 'ENTREPRISE_SIRET', 'ENTREPRISE_IDCC', 'ENTREPRISE_OPCO',
      'ADRESSE_ENTREPRISE', 'Code_Postal_ENTREPRISE', 'Ville_ENTREPRISE', 'SIRET_ENTREPRISE',
      'ACTIVITE_ENTREPRISE', 'IDCC_ENTREPRISE', 'OPCO', 'QUALITE_SIGNATAIRE_ENTREPRISE',
      'DIRIGEANT_NOM_COMPLET', 'IDCC_CODE',
      // Maître d'apprentissage / Tuteur
      'MAITRE_APPRENTISSAGE_NOM_COMPLET', 'MAITRE_APPRENTISSAGE_TELEPHONE', 'MAITRE_APPRENTISSAGE_EMAIL',
      'MAITRE_APPRENTISSAGE_POSTE', 'TUTEUR_NOM_COMPLET', 'POSTE_TUTEUR', 'Mail_TUTEUR', 'N° Tel_TUTEUR',
      // Référent CFA
      'REFERENT_APPRENTI_NOM_COMPLET', 'REFERENT_APPRENTI_TELEPHONE', 'REFERENT_APPRENTI_EMAIL',
      // Contrat
      'DATE_DEBUT_CONTRAT', 'DATE_FIN_CONTRAT', 'DUREE_CONTRAT',
      'DATE_DEBUT_FORMATION', 'DATE_FIN_FORMATION', 'DATE_RUPTURE_CONTRAT',
      'DATE_FIN_MAINTIEN', 'N_DECA',
      // Formation
      'FORMATION_LIBELLE', 'FORMATION_BASIQUE', 'FORMATION_SIGLE', 'RNCP_CODE',
      'CODE_DIPLOME', 'NB_HEURES_FORMATION', 'VOLUME_HORAIRE_TOTAL', 'DUREE_FORMATION',
      'TYPE_ACCOMPAGNEMENT', 'TIERS_FINANCEUR', 'ID_DOSSIER', 'DECA',
      // CFA
      'CFA_RAISON_SOCIALE', 'CFA_ADRESSE', 'CFA_DIRECTRICE', 'CFA_DIRECTRICE_TELEPHONE',
      'CFA_DIRECTRICE_EMAIL', 'CFA_TELEPHONE', 'CFA_EMAIL', 'CFA_SIRET',
      'RESPONSABLE_PEDAGOGIQUE', 'RESPONSABLE_PEDAGOGIQUE_TELEPHONE', 'RESPONSABLE_PEDAGOGIQUE_EMAIL',
      'COORDONNATEUR_UFA_NOM', 'COORDONNATEUR_UFA_ADRESSE', 'COORDONNATEUR_UFA_TELEPHONE', 'COORDONNATEUR_UFA_EMAIL',
      'LIEU_FORMATION', 'LIEU_SIGNATURE_DOC', 'DATE_SIGNATURE_DOC',
      // Financements & coûts
      'MONTANT_NPEC', 'COUT_MENSUEL_NPEC', 'COUT_HORAIRE',
      'COUT_PEDAGOGIQUE_ANNEE_1', 'COUT_PEDAGOGIQUE_ANNEE_2', 'COUT_TOTAL_FRAIS_PEDAGOGIQUES',
      'MONTANT_OPCO_ANNEE_1', 'MONTANT_OPCO_ANNEE_2', 'MONTANT_TOTAL_OPCO',
      'FRAIS_ANNEXES_REPAS_ANNEE_1', 'FRAIS_ANNEXES_REPAS_ANNEE_2', 'FRAIS_PREMIER_EQUIPEMENT',
      'TOTAL_FRAIS_ANNEXES', 'TOTAL_FRAIS_PEDAGOGIQUES',
      'TOTAL_JOURS', 'TOTAL_JOURS_PREMIERE_ANNEE', 'TOTAL_JOURS_DEUXIEME_ANNEE',
      'DATE_DEBUT_DEUXIEME_ANNEE', 'DATE_FIN_PREMIERE_ANNEE', 'DATE_DEBUT_FORMATION+365 JOURS',
      'Nombre_repas_ 1', 'Nombre_repas_ 2', 'Montant_repas_ 1', 'Montant_repas_ 2',
      // CR / DMF
      'CR_DATE_DEBUT', 'CR_DATE_FIN', 'CR_DUREE_HEURES', 'CR_DUREE_MOIS',
      'CR_LIEU_SIGNATURE', 'CR_SIGNATAIRE_QUALITE',
      // Compétences ARH (et extra placeholders)
      'ARH_ACTIVITE_1', 'ARH_COMPETENCE_1_1', 'ARH_COMPETENCE_1_2', 'ARH_COMPETENCE_1_3',
      'ARH_ACTIVITE_2', 'ARH_COMPETENCE_2_1', 'ARH_COMPETENCE_2_2', 'ARH_COMPETENCE_2_3',
    ];

    const requestsNettoyage = placeholdersConnus.map(cle => ({
      replaceAllText: {
        containsText: { text: `{{${cle}}}`, matchCase: true },
        replaceText: '',
      },
    }));

    if (requestsNettoyage.length > 0) {
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: { requests: requestsNettoyage },
      });
    }

    // Retourner le lien du document rempli
    const lienDoc = `https://docs.google.com/document/d/${newDocId}/edit`;

    return NextResponse.json({
      success: true,
      lienDoc,
      docId: newDocId,
      message: `Document rempli avec ${requests.length} champs`,
    });

  } catch (error: any) {
    console.error('Erreur remplissage Google Docs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}