// lib/exportPdfGlobal.ts
// Export PDF Rapport global tous formateurs - Indicateur 22
// CFA PAM OI Formation

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TypeFormationContinue } from '../types/formationContinue';

interface LigneRecap {
  formateur: { id: string; nom: string; prenom: string };
  total: number;
  heuresTotal: number;
  heuresAnnee: number;
  parType: Record<TypeFormationContinue, number>;
  certifsExpirees: number;
  certifsBientotExpirees: number;
}

interface ExportGlobalParams {
  recap: LigneRecap[];
  annee: number;
}

const COULEUR_PRIMAIRE: [number, number, number] = [37, 99, 235];
const COULEUR_TEXTE: [number, number, number] = [31, 41, 55];
const COULEUR_GRISE: [number, number, number] = [107, 114, 128];

export function exporterPdfGlobal({ recap, annee }: ExportGlobalParams): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // EN-TÊTE
  doc.setFillColor(...COULEUR_PRIMAIRE);
  doc.rect(0, 0, pageW, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PAM OI Formation — Rapport global Indicateur 22', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Formations continues des formateurs · Qualiopi · CFA La Réunion',
    margin,
    18
  );
  doc.text(
    `Édité le ${new Date().toLocaleDateString('fr-FR')}`,
    pageW - margin,
    18,
    { align: 'right' }
  );

  let y = 35;

  // Stats globales
  const totalH = recap.reduce((s, l) => s + l.heuresTotal, 0);
  const totalHAnnee = recap.reduce((s, l) => s + l.heuresAnnee, 0);
  const alertes = recap.reduce(
    (s, l) => s + l.certifsExpirees + l.certifsBientotExpirees,
    0
  );
  const sansFormation = recap.filter((l) => l.total === 0).length;

  const stats = [
    { label: 'Formateurs suivis', value: String(recap.length) },
    { label: 'Heures cumulées', value: `${totalH} h` },
    { label: `Heures ${annee}`, value: `${totalHAnnee} h` },
    { label: 'Alertes validité', value: String(alertes) },
    { label: 'Sans formation', value: String(sansFormation) },
  ];

  const boxW = (pageW - 2 * margin - 4 * 3) / 5;
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

  // Tableau
  const rows = recap.map((l) => [
    `${l.formateur.prenom} ${l.formateur.nom}`,
    String(l.total),
    `${l.heuresTotal} h`,
    `${l.heuresAnnee} h`,
    String(l.parType.pedagogique || '-'),
    String(l.parType.technique || '-'),
    String(l.parType.certification || '-'),
    String(l.parType.veille || '-'),
    l.certifsExpirees + l.certifsBientotExpirees > 0
      ? `${l.certifsExpirees + l.certifsBientotExpirees} ⚠`
      : '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [[
      'Formateur',
      'Total',
      'Heures cumulées',
      `Heures ${annee}`,
      'Pédagogique',
      'Technique',
      'Certification',
      'Veille',
      'Alertes',
    ]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: COULEUR_PRIMAIRE,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  // Pied de page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COULEUR_GRISE);
    doc.text(
      'PAM OI Formation - Rapport global Indicateur 22 Qualiopi',
      margin,
      pageH - 8
    );
    doc.text(`Page ${i} / ${totalPages}`, pageW - margin, pageH - 8, {
      align: 'right',
    });
  }

  doc.save(`Indicateur22_Rapport_Global_${new Date().toISOString().slice(0, 10)}.pdf`);
}
