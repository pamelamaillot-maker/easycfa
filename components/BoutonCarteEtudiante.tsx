'use client';

import React from 'react';
import { Document, Page, Image as PdfImage, View, Text, pdf } from '@react-pdf/renderer';

// ───────────────────────────────────────────────────────────────
// Position des éléments variables sur le RECTO, en % de la carte.
// Ajuste ces valeurs si besoin après le 1er essai (DIRECT, un nombre à la fois).
// ───────────────────────────────────────────────────────────────
const POS = {
  photo:    { left: 68.5, top: 1.5, width: 31, height: 58 }, // recouvre le paysage
  nom:      { left: 11, top: 31 },
  prenom:   { left: 16, top: 41 },
  nele:     { left: 45, top: 41 },
  validite: { left: 20, top: 55.5 },
  fontSize: 9,
};

// Carte au format standard 85,6 × 54 mm (en points PDF, paysage)
const W = 242.6;
const H = 153.1;
const px = (p: number) => (p / 100) * W;
const py = (p: number) => (p / 100) * H;

function CarteDoc({ apprenant, photoUrl }: { apprenant: any; photoUrl?: string }) {
  const champ = (v?: string) => (v && String(v).trim()) ? String(v) : '';
  const txt = { position: 'absolute' as const, fontSize: POS.fontSize, color: '#1a1a1a' };

  return (
    <Document>
      {/* ===== RECTO ===== */}
      <Page size={[W, H]} wrap={false}>
        <View style={{ position: 'relative', width: W, height: H }}>
          <PdfImage src="/cartes/recto.png" style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }} />
          {photoUrl && (
            <PdfImage
              src={photoUrl}
              style={{ position: 'absolute', left: px(POS.photo.left), top: py(POS.photo.top), width: px(POS.photo.width), height: py(POS.photo.height), objectFit: 'cover' }}
            />
          )}
          <Text style={{ ...txt, left: px(POS.nom.left),      top: py(POS.nom.top) }}>{champ(apprenant.nom)}</Text>
          <Text style={{ ...txt, left: px(POS.prenom.left),   top: py(POS.prenom.top) }}>{champ(apprenant.prenom)}</Text>
          <Text style={{ ...txt, left: px(POS.nele.left),     top: py(POS.nele.top) }}>{champ(apprenant.dateNaissance)}</Text>
          <Text style={{ ...txt, left: px(POS.validite.left), top: py(POS.validite.top) }}>{champ(apprenant.dateFinContrat)}</Text>
        </View>
      </Page>

      {/* ===== VERSO (entièrement figé) ===== */}
      <Page size={[W, H]} wrap={false}>
        <View style={{ position: 'relative', width: W, height: H }}>
          <PdfImage src="/cartes/verso.png" style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }} />
        </View>
      </Page>
    </Document>
  );
}
export default function BoutonCarteEtudiante({ apprenant, nomFichier }: { apprenant: any; nomFichier: string }) {
  const [enCours, setEnCours] = React.useState(false);

  const photoUrl: string | undefined =
    apprenant?.piece_photo_identite?.url || apprenant?.pieces?.photo_identite?.url;

  async function generer() {
    try {
      setEnCours(true);
      const blob = await pdf(<CarteDoc apprenant={apprenant} photoUrl={photoUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomFichier;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[CarteEtudiante] Erreur génération PDF :', e);
      alert('⚠️ Erreur lors de la génération de la carte. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      onClick={generer}
      disabled={enCours}
      style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: enCours ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
    >
      {enCours ? '⏳ Génération…' : '🎓 Générer / Télécharger la carte'}
    </button>
  );
}