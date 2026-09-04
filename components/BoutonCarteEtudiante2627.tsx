'use client';

// components/BoutonCarteEtudiante2627.tsx
// Génère la CARTE D'ÉTUDIANT DES MÉTIERS 2026-2027 en superposant les données
// de l'apprenti sur le modèle officiel du ministère.
//
// POURQUOI UNE SUPERPOSITION ET NON UNE RECRÉATION
// La carte d'étudiant des métiers est un document officiel (art. L. 6222-36-1
// du code du travail). Sa maquette est fournie par le ministère du Travail.
// On remplit donc le PDF officiel plutôt que d'en reproduire une imitation.
//
// MODÈLE UTILISÉ
// public/modeles/carte-etudiant-26-27.pdf — variante « classique », 86 × 54 mm,
// deux pages : page 0 = recto, page 1 = verso.
// La variante « imprimeur » (109,3 × 77,3 mm, avec fonds perdus) n'est pas
// utilisée ici : elle est destinée à un imprimeur professionnel.
//
// SIGNATURE
// Le cadre « Signature » du verso est celui de L'APPRENTI, qui signe via
// sign.plus après génération. Il est donc laissé VIERGE.
// Le champ « Chef(fe) d'établissement : » attend le nom en toutes lettres
// de la directrice, pas une signature.
//
// ADRESSE
// La carte porte l'adresse du LIEU DE FORMATION (1 Chemin Dubuisson),
// et non celle du siège social (38 B rue des Canneliers) qui figure au BPF
// et sur la déclaration France Compétences. Les deux sont exactes dans leur
// contexte respectif : ne pas « corriger » l'une par l'autre.

import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const CHEMIN_MODELE = '/modeles/carte-etudiant-26-27.pdf';
const CHEMIN_LOGO = '/modeles/logo-pam-oi.png';

// Couleur du texte officiel, relevée sur la maquette du ministère.
const BLEU_OFFICIEL = rgb(39 / 255, 51 / 255, 117 / 255);

// ---------------------------------------------------------------------------
// COORDONNÉES DES ZONES
// ---------------------------------------------------------------------------
// Mesurées sur le modèle officiel, en POINTS PDF, origine en HAUT à gauche.
// Chaque page mesure 243,779 × 153,071 pt.
// La conversion vers le repère pdf-lib (origine en bas) est faite au dessin.

const HAUTEUR_PAGE = 153.071;

interface Zone { x: number; largeur: number; yHaut: number; hauteur: number }

// --- VERSO -----------------------------------------------------------------
const ZONES: Record<string, Zone> = {
  nom:        { x: 67.4, largeur: 94.1, yHaut: 15.8,  hauteur: 10.6 },
  prenom:     { x: 67.4, largeur: 94.1, yHaut: 33.1,  hauteur: 10.8 },
  naissance:  { x: 67.4, largeur: 94.1, yHaut: 50.6,  hauteur: 10.6 },
  organisme:  { x: 67.4, largeur: 94.1, yHaut: 67.9,  hauteur: 10.8 },
  adresse:    { x: 67.4, largeur: 94.1, yHaut: 85.4,  hauteur: 10.6 },
  telephone:  { x: 67.4, largeur: 94.1, yHaut: 102.7, hauteur: 10.6 },
  chef:       { x: 67.4, largeur: 94.1, yHaut: 120.2, hauteur: 10.6 },
  photo:      { x: 166.3, largeur: 65.7, yHaut: 11.5, hauteur: 83.3 },
  // signature : { x: 166.0, largeur: 66.3, yHaut: 102.5, hauteur: 28.3 }
  //   volontairement NON remplie — l'apprenti signe via sign.plus.
};

// --- RECTO -----------------------------------------------------------------
// Le recto comporte une bande blanche en haut (jusqu'à y = 42,2 pt) où figure
// le bloc « Ministère du Travail » à gauche (x 11,3 → 48,0 ; y 11,3 → 34,6)
// et le titre à droite (à partir de x = 96,1).
// L'espace intermédiaire est libre : le logo du CFA s'y insère à la MÊME
// hauteur que celui du ministère, avec un espacement équilibré de part
// et d'autre.
const ZONE_LOGO: Zone = { x: 56.0, largeur: 38.0, yHaut: 11.3, hauteur: 23.3 };

const MARGE_TEXTE = 3;      // retrait à gauche dans la case
const TAILLE_MAX = 8;       // police de départ
const TAILLE_MIN = 4.5;     // en dessous, le texte devient illisible

// ---------------------------------------------------------------------------
// DONNÉES DU CFA
// ---------------------------------------------------------------------------

const CFA_ORGANISME = 'PAM OI Formation';
const CFA_ADRESSE = '1 Chemin Dubuisson 97436 St Leu';
const CFA_TELEPHONE = '0693556492';
const CFA_CHEF = 'MAILLOT Gaëlle';

// ---------------------------------------------------------------------------
// OUTILS
// ---------------------------------------------------------------------------

/** Formate une date ISO ou FR en JJ/MM/AAAA. Chaîne vide si illisible. */
function dateFR(valeur?: string): string {
  if (!valeur) return '';
  const v = String(valeur).trim();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const fr = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (fr) {
    const annee = fr[3].length === 2 ? '20' + fr[3] : fr[3];
    return `${fr[1].padStart(2, '0')}/${fr[2].padStart(2, '0')}/${annee}`;
  }
  return v;
}

/**
 * Remplace les caractères qu'une police WinAnsi ne sait pas rendre.
 * Sans cela, pdf-lib lève une exception sur certains prénoms.
 */
function assainir(texte: string): string {
  return texte
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ');
}

/**
 * Place une image dans un cadre sans déformation ni débordement.
 * Une marge d'un demi-point de chaque côté préserve le liseré du modèle.
 */
function ajusterDansCadre(
  zone: Zone,
  largeurImage: number,
  hauteurImage: number,
): { x: number; y: number; width: number; height: number } {
  const facteur = Math.min(
    (zone.largeur - 1) / largeurImage,
    (zone.hauteur - 1) / hauteurImage,
  );
  const l = largeurImage * facteur;
  const h = hauteurImage * facteur;
  return {
    x: zone.x + (zone.largeur - l) / 2,
    y: HAUTEUR_PAGE - (zone.yHaut + zone.hauteur) + (zone.hauteur - h) / 2,
    width: l,
    height: h,
  };
}

// ---------------------------------------------------------------------------
// COMPOSANT
// ---------------------------------------------------------------------------

interface Props {
  apprenant: any;
  nomFichier?: string;
  style?: React.CSSProperties;
  libelle?: string;
}

export default function BoutonCarteEtudiante2627({
  apprenant,
  nomFichier,
  style,
  libelle = '🎓 Carte étudiant 2026-2027',
}: Props) {
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generer() {
    setEnCours(true);
    setMessage(null);
    const avertissements: string[] = [];

    try {
      // --- 1. Charger le modèle officiel ---------------------------------
      const reponse = await fetch(CHEMIN_MODELE);
      if (!reponse.ok) {
        throw new Error(
          `Modèle introuvable (${reponse.status}). Vérifiez que le fichier est bien dans public/modeles/.`
        );
      }
      const modele = await reponse.arrayBuffer();
      const pdf = await PDFDocument.load(modele);

      const pages = pdf.getPages();
      if (pages.length < 2) throw new Error('Le modèle doit comporter 2 pages (recto et verso).');
      const recto = pages[0];
      const verso = pages[1];

      const police = await pdf.embedFont(StandardFonts.Helvetica);

      // --- 2. Logo du CFA sur le recto -----------------------------------
      // Optionnel : son absence n'empêche pas la génération de la carte.
      try {
        const repLogo = await fetch(CHEMIN_LOGO);
        if (!repLogo.ok) throw new Error(`statut ${repLogo.status}`);
        const octetsLogo = await repLogo.arrayBuffer();
        const logo = await pdf.embedPng(octetsLogo);
        recto.drawImage(logo, ajusterDansCadre(ZONE_LOGO, logo.width, logo.height));
      } catch (e: any) {
        avertissements.push(`logo CFA absent (${e?.message ?? 'chargement impossible'})`);
      }

      // --- 3. Écrire une valeur dans une case du verso --------------------
      // La police est réduite progressivement jusqu'à ce que le texte tienne
      // dans la largeur de la case. Les cases font 33 mm : une adresse
      // complète ne tient pas à taille normale.
      const ecrire = (zone: Zone, valeur: string) => {
        const texte = assainir((valeur ?? '').trim());
        if (!texte) return;

        const largeurUtile = zone.largeur - MARGE_TEXTE * 2;
        let taille = TAILLE_MAX;
        while (taille > TAILLE_MIN && police.widthOfTextAtSize(texte, taille) > largeurUtile) {
          taille -= 0.25;
        }

        const basDeCase = HAUTEUR_PAGE - (zone.yHaut + zone.hauteur);
        const ligneDeBase = basDeCase + (zone.hauteur - taille * 0.72) / 2;

        verso.drawText(texte, {
          x: zone.x + MARGE_TEXTE,
          y: ligneDeBase,
          size: taille,
          font: police,
          color: BLEU_OFFICIEL,
        });
      };

      ecrire(ZONES.nom, apprenant?.nom ?? '');
      ecrire(ZONES.prenom, apprenant?.prenom ?? '');
      ecrire(ZONES.naissance, dateFR(apprenant?.dateNaissance));
      ecrire(ZONES.organisme, CFA_ORGANISME);
      ecrire(ZONES.adresse, CFA_ADRESSE);
      ecrire(ZONES.telephone, CFA_TELEPHONE);
      ecrire(ZONES.chef, CFA_CHEF);

      // --- 4. Photo d'identité -------------------------------------------
      // Optionnelle : une carte sans photo reste générable, l'apprenti
      // pourra en coller une.
      const photo = apprenant?.piece_photo_identite ?? apprenant?.pieces?.photo_identite;
      if (photo?.url) {
        try {
          const rep = await fetch(photo.url);
          if (!rep.ok) throw new Error(`statut ${rep.status}`);
          const octets = await rep.arrayBuffer();
          const nom = String(photo.nom ?? '').toLowerCase();
          const estPng = nom.endsWith('.png') || (rep.headers.get('content-type') ?? '').includes('png');
          const image = estPng ? await pdf.embedPng(octets) : await pdf.embedJpg(octets);
          verso.drawImage(image, ajusterDansCadre(ZONES.photo, image.width, image.height));
        } catch (e: any) {
          avertissements.push(`photo non intégrée (${e?.message ?? 'chargement impossible'})`);
        }
      } else {
        avertissements.push('aucune photo d\u2019identité sur la fiche');
      }

      // --- 5. Téléchargement ---------------------------------------------
      const octetsPdf = await pdf.save();
      const blob = new Blob([octetsPdf as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download =
        nomFichier ??
        `Carte_Etudiant_2627_${apprenant?.nom ?? ''}_${apprenant?.prenom ?? ''}.pdf`.replace(/\s+/g, '_');
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      URL.revokeObjectURL(url);

      if (avertissements.length > 0) {
        setMessage(`Carte générée — ${avertissements.join(' ; ')}.`);
      }
    } catch (e: any) {
      console.error('[CarteEtudiante2627]', e);
      setMessage(`Erreur : ${e?.message ?? 'génération impossible'}`);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        onClick={generer}
        disabled={enCours}
        style={
          style ?? {
            backgroundColor: '#006B68',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: enCours ? 'default' : 'pointer',
            opacity: enCours ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }
        }
      >
        {enCours ? 'Génération…' : libelle}
      </button>
      {message && (
        <span style={{ fontSize: 11, color: '#7a5c00', fontStyle: 'italic' }}>{message}</span>
      )}
    </span>
  );
}
