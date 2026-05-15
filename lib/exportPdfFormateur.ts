// lib/exportPdfFormateur.ts
// Export PDF synthèse Indicateur 22 - Fiche individuelle formateur
// CFA PAM OI Formation - La Réunion
//
// Dépendance : jspdf + jspdf-autotable (déjà utilisés dans EasyCFA pour
// le module Appréciation formateur). Si besoin :
//   npm install jspdf jspdf-autotable

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FormationContinue,
  LABELS_TYPE_FORMATION,
  getStatutValidite,
  LABELS_STATUT,
} from '../types/formationContinue';

interface ExportParams {
  formateurNom: string;
  formateurPrenom: string;
  formations: FormationContinue[];
}

const COULEUR_PRIMAIRE: [number, number, number] = [37, 99, 235];   // blue-600
const COULEUR_TEXTE: [number, number, number] = [31, 41, 55];       // gray-800
const COULEUR_GRISE: [number, number, number] = [107, 114, 128];    // gray-500

export function exporterPdfFormateur({
  formateurNom,
  formateurPrenom,
  formations,
}: ExportParams): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== EN-TÊTE =====
  doc.setFillColor(...COULEUR_PRIMAIRE);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PAM OI Formation', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('CFA - La Réunion', margin, 17);
  doc.text('Indicateur 22 Qualiopi - Maintien et développement des compétences', margin, 22);

  doc.setFontSize(8);
  doc.text(
    `Édité le ${new Date().toLocaleDateString('fr-FR')}`,
    pageW - margin,
    22,
    { align: 'right' }
  );

  // ===== TITRE FORMATEUR =====
  let y = 40;
  doc.setTextColor(...COULEUR_TEXTE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(
    `Formations continues — ${formateurPrenom} ${formateurNom}`,
    margin,
    y
  );

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COULEUR_GRISE);
  doc.text(
    `Synthèse individuelle des formations continues suivies dans le cadre du`,
    margin,
    y
  );
  y += 5;
  doc.text(
    `développement professionnel continu du formateur (Indicateur 22 Qualiopi).`,
    margin,
    y
  );

  // ===== STATS =====
  y += 10;
  const totalHeures = formations.reduce((s, f) => s + f.dureeHeures, 0);
  const annee = new Date().getFullYear();
  const heuresAnnee = formations
    .filter((f) => new Date(f.dateFin).getFullYear() === annee)
    .reduce((s, f) => s + f.dureeHeures, 0);
  const nbCertifs = formations.filter((f) => f.type === 'certification').length;

  const stats = [
    { label: 'Total formations', value: String(formations.length) },
    { label: 'Heures cumulées', value: `${totalHeures} h` },
    { label: `Heures ${annee}`, value: `${heuresAnnee} h` },
    { label: 'Certifications', value: String(nbCertifs) },
  ];

  const boxW = (pageW - 2 * margin - 9) / 4;
  stats.forEach((s, i) => {
    const x = margin + i * (boxW + 3);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
    doc.setTextColor(...COULEUR_GRISE);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(s.label, x + 3, y + 6);
    doc.setTextColor(...COULEUR_TEXTE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(s.value, x + 3, y + 14);
  });

  y += 25;

  // ===== TABLEAU =====
  if (formations.length === 0) {
    doc.setTextColor(...COULEUR_GRISE);
    doc.setFontSize(11);
    doc.text('Aucune formation continue enregistrée à ce jour.', margin, y);
  } else {
    const formationsTriees = [...formations].sort(
      (a, b) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime()
    );

    const rows = formationsTriees.map((f) => {
      const statut = getStatutValidite(f);
      return [
        LABELS_TYPE_FORMATION[f.type].replace(/^\S+\s/, ''), // retire emoji
        f.intitule,
        f.organisme,
        `${formaterDate(f.dateDebut)}\nau ${formaterDate(f.dateFin)}`,
        `${f.dureeHeures} h`,
        f.dateExpiration
          ? `${LABELS_STATUT[statut].replace(/^\S+\s/, '')}\n(${formaterDate(f.dateExpiration)})`
          : '—',
        f.justificatif ? '✓' : '—',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Type', 'Intitulé', 'Organisme', 'Période', 'Durée', 'Validité', 'Justif.']],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: COULEUR_PRIMAIRE,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 14, halign: 'right' },
        5: { cellWidth: 25 },
        6: { cellWidth: 12, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    // Compétences visées en complément
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    if (finalY < pageH - 30) {
      const competencesGlobales = new Set<string>();
      formations.forEach((f) =>
        f.competencesVisees.forEach((c) => competencesGlobales.add(c))
      );
      if (competencesGlobales.size > 0) {
        doc.setTextColor(...COULEUR_TEXTE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Compétences du référentiel travaillées', margin, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COULEUR_GRISE);
        const txt = Array.from(competencesGlobales).join(' · ');
        const lines = doc.splitTextToSize(txt, pageW - 2 * margin);
        doc.text(lines, margin, finalY + 5);
      }
    }
  }

  // ===== PIED DE PAGE =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COULEUR_GRISE);
    doc.text(
      `PAM OI Formation - Fiche Indicateur 22 - ${formateurPrenom} ${formateurNom}`,
      margin,
      pageH - 8
    );
    doc.text(`Page ${i} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const nomFichier = `Indicateur22_${formateurNom}_${formateurPrenom}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(nomFichier);
}

function formaterDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
