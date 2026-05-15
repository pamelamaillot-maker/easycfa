'use client';

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  EvaluationFormateur,
  CRITERES_FORMATEUR,
  LIBELLE_NOTE,
  dateIsoToFr,
} from '../data/mockEvaluations';

interface BoutonPdfEvaluationProps {
  evaluation: EvaluationFormateur;
  /** Spécialités du formateur (pour affichage en en-tête) */
  specialites?: string[];
  /**
   * Si true : génère un PDF vierge (à donner au formateur pour qu'il le remplisse).
   * Si false : génère un PDF rempli avec les notes saisies dans EasyCFA.
   */
  vierge?: boolean;
  /** Style du bouton */
  style?: React.CSSProperties;
  /** Label personnalisé du bouton */
  label?: string;
}

/**
 * Charge le logo PAM OI en base64 depuis /public/logo.png
 */
async function chargerLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Erreur chargement logo:', err);
    return null;
  }
}

/**
 * Bouton qui génère un PDF d'appréciation formateur sur PAM OI Formation.
 *
 * 2 modes :
 *   - vierge=true : PDF à donner au formateur pour qu'il le remplisse
 *   - vierge=false : PDF rempli avec les notes saisies dans EasyCFA (rapport)
 *
 * Indicateur Qualiopi 31 — Recueil des appréciations des parties prenantes.
 *
 * Couleurs de la charte PAM OI :
 *   - Vert primaire : #006B68
 *   - Or secondaire : #C8A23A
 *   - Fond doux : #EAF4F3
 */
export default function BoutonPdfEvaluation({
  evaluation,
  specialites = [],
  vierge = false,
  style,
  label,
}: BoutonPdfEvaluationProps) {

  async function genererPdf() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marge = 15;

    // === COULEURS CHARTE PAM OI ===
    const couleurPrimaire: [number, number, number] = [0, 107, 104];
    const couleurSecondaire: [number, number, number] = [200, 162, 58];
    const couleurFondDoux: [number, number, number] = [234, 244, 243];
    const couleurTexte: [number, number, number] = [40, 40, 40];
    const couleurGris: [number, number, number] = [120, 120, 120];

    // ========================================================================
    // PAGE 1 — EN-TÊTE + IDENTITÉ + CRITÈRES
    // ========================================================================

    // Logo + nom CFA
    const logo = await chargerLogoBase64();
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', marge, marge, 22, 22);
      } catch (err) {
        console.error('Erreur insertion logo:', err);
      }
    }

    const xCfa = logo ? marge + 26 : marge;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...couleurPrimaire);
    doc.text('PAM OI Formation', xCfa, marge + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...couleurGris);
    doc.text('Centre de Formation d\'Apprentis', xCfa, marge + 11);
    doc.text('SIRET : 88127939200016  •  UAI : 9741871R  •  NDA : 04973425197', xCfa, marge + 16);
    doc.text('La Réunion (974)', xCfa, marge + 21);

    // Ligne séparation
    doc.setDrawColor(...couleurSecondaire);
    doc.setLineWidth(0.8);
    doc.line(marge, marge + 28, pageWidth - marge, marge + 28);

    // Titre du document
    let y = marge + 38;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...couleurPrimaire);
    doc.text('APPRÉCIATION DU FORMATEUR', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text('SUR PAM OI FORMATION', pageWidth / 2, y, { align: 'center' });

    y += 7;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...couleurSecondaire);
    doc.text('Référence Qualiopi — Critère 7, Indicateur 31', pageWidth / 2, y, { align: 'center' });

    // Note explicative
    y += 9;
    doc.setFillColor(...couleurFondDoux);
    doc.roundedRect(marge, y, pageWidth - 2 * marge, 16, 3, 3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...couleurTexte);
    const txtExplication = vierge
      ? 'Ce questionnaire vise à recueillir votre avis sur PAM OI Formation. Vos réponses nous permettent d\'identifier des axes d\'amélioration et de renforcer la qualité de nos prestations. Merci de répondre avec sincérité.'
      : 'Synthèse des appréciations recueillies auprès du formateur sur PAM OI Formation.';
    const lignesExpl = doc.splitTextToSize(txtExplication, pageWidth - 2 * marge - 6);
    doc.text(lignesExpl, marge + 3, y + 5);

    // Bloc identité formateur
    y += 21;
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(marge, y, pageWidth - 2 * marge, 30, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...couleurPrimaire);
    doc.text('IDENTITÉ DU FORMATEUR', marge + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...couleurTexte);

    // Colonne gauche
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(evaluation.formateurNom, marge + 4, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...couleurGris);
    if (specialites.length > 0) {
      doc.text(`Spécialités : ${specialites.join(' • ')}`, marge + 4, y + 18);
    }

    // Colonne droite
    const xDroite = pageWidth - marge - 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...couleurTexte);
    doc.text('Année concernée :', xDroite, y + 12);
    doc.text('Date :', xDroite, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.text(`${evaluation.annee}`, xDroite + 28, y + 12);
    doc.text(
      vierge
        ? '_____ / _____ / _________'
        : evaluation.dateEvaluation ? dateIsoToFr(evaluation.dateEvaluation) : '—',
      xDroite + 28,
      y + 18,
    );

    // Échelle de notation (instructions)
    y += 36;
    doc.setFillColor(255, 251, 240);
    doc.setDrawColor(200, 162, 58);
    doc.roundedRect(marge, y, pageWidth - 2 * marge, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(122, 92, 0);
    doc.text('ÉCHELLE DE NOTATION :', marge + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1 = Très insuffisant   |   2 = Insuffisant   |   3 = Satisfaisant   |   4 = Bien   |   5 = Excellent', marge + 3, y + 9);

    // === TABLEAU DES 10 CRITÈRES ===
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...couleurPrimaire);
    doc.text(vierge ? 'CRITÈRES D\'APPRÉCIATION — Entourer votre note' : 'NOTES PAR CRITÈRE', marge, y);

    y += 4;

    if (vierge) {
      // PDF vierge : tableau avec cases vides à cocher
      autoTable(doc, {
        startY: y,
        head: [['Catégorie', 'Critère', 'Note', 'Commentaire']],
        body: CRITERES_FORMATEUR.map(crit => [
          crit.categorie.replace(/[\uD800-\uDFFF].\s?/g, '').trim(),
          crit.label,
          '1   2   3   4   5',
          '',
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: couleurPrimaire,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: couleurTexte,
          minCellHeight: 14,
        },
        alternateRowStyles: {
          fillColor: couleurFondDoux,
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 70 },
          2: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 'auto' },
        },
        margin: { left: marge, right: marge },
      });
    } else {
      // PDF rempli : tableau avec notes saisies
      autoTable(doc, {
        startY: y,
        head: [['Catégorie', 'Critère', 'Note', 'Appréciation', 'Commentaire']],
        body: CRITERES_FORMATEUR.map(crit => {
          const c = evaluation.criteres[crit.cle];
          return [
            crit.categorie.replace(/[\uD800-\uDFFF].\s?/g, '').trim(),
            crit.label,
            c.note > 0 ? `${c.note}/5` : '—',
            c.note > 0 ? LIBELLE_NOTE[c.note].replace(/⭐/g, '*').trim() : '—',
            c.commentaire || '',
          ];
        }),
        theme: 'striped',
        headStyles: {
          fillColor: couleurPrimaire,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: couleurTexte,
        },
        alternateRowStyles: {
          fillColor: couleurFondDoux,
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 55 },
          2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 'auto' },
        },
        margin: { left: marge, right: marge },
      });

      // Note moyenne en bas de tableau (seulement si rempli)
      const finalY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFillColor(...couleurPrimaire);
      doc.roundedRect(marge, finalY, pageWidth - 2 * marge, 12, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('🌟 NOTE MOYENNE GLOBALE', marge + 4, finalY + 7.5);

      doc.setFontSize(14);
      doc.setTextColor(...couleurSecondaire);
      doc.text(
        evaluation.noteMoyenne > 0 ? `${evaluation.noteMoyenne} / 5` : '—',
        pageWidth - marge - 4,
        finalY + 8,
        { align: 'right' }
      );
    }

    // ========================================================================
    // PAGE 2 — SYNTHÈSE LIBRE + SIGNATURE
    // ========================================================================
    doc.addPage();

    // En-tête simplifié page 2
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', marge, marge, 14, 14);
      } catch {}
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...couleurPrimaire);
    doc.text('PAM OI Formation — Appréciation formateur', logo ? marge + 18 : marge, marge + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...couleurGris);
    doc.text(`${evaluation.formateurNom} — Année ${evaluation.annee}`, logo ? marge + 18 : marge, marge + 13);

    doc.setDrawColor(...couleurSecondaire);
    doc.line(marge, marge + 18, pageWidth - marge, marge + 18);

    y = marge + 25;

    // Titre Synthèse
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...couleurPrimaire);
    doc.text('VOTRE RETOUR DÉTAILLÉ', marge, y);
    y += 8;

    // 3 sections libres
    const blocs = [
      {
        label: '💪 Ce qui fonctionne bien',
        contenu: vierge ? '' : evaluation.pointsForts,
        couleur: [21, 128, 61] as [number, number, number],
      },
      {
        label: '🎯 Ce qui pourrait être amélioré',
        contenu: vierge ? '' : evaluation.axesAmelioration,
        couleur: couleurSecondaire,
      },
      {
        label: '💡 Suggestions concrètes',
        contenu: vierge ? '' : evaluation.suggestions,
        couleur: [124, 58, 237] as [number, number, number],
      },
    ];

    for (const bloc of blocs) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...bloc.couleur);
      doc.text(bloc.label, marge, y);
      y += 5;

      const contenu = bloc.contenu?.trim() || (vierge ? '' : '— Non renseigné');
      const lignes = doc.splitTextToSize(contenu, pageWidth - 2 * marge - 6);
      // Hauteur : minimum 32 mm pour PDF vierge (zone d'écriture), sinon adaptatif
      const hauteurBloc = vierge ? 32 : Math.max(14, lignes.length * 4 + 6);

      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(marge, y, pageWidth - 2 * marge, hauteurBloc, 2, 2, 'FD');

      if (!vierge && contenu) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...couleurTexte);
        doc.text(lignes, marge + 3, y + 5);
      }

      y += hauteurBloc + 6;
    }

    // ===  CADRE DE SIGNATURE (formateur uniquement)  ===
    const ySignature = pageHeight - 55;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...couleurPrimaire);
    doc.text('SIGNATURE', marge, ySignature - 5);

    // Cadre formateur centré
    const largeurCadre = 95;
    const xCadre = (pageWidth - largeurCadre) / 2;

    doc.setDrawColor(...couleurSecondaire);
    doc.setLineWidth(0.5);
    doc.roundedRect(xCadre, ySignature, largeurCadre, 38, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...couleurSecondaire);
    doc.text('Le formateur', xCadre + 3, ySignature + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...couleurGris);
    doc.text(evaluation.formateurNom, xCadre + 3, ySignature + 11);

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Date : ___________________________', xCadre + 3, ySignature + 18);
    doc.text('Signature précédée de "Lu et approuvé" :', xCadre + 3, ySignature + 25);

    // Pied de page
    const yPied = pageHeight - 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      vierge
        ? '📥 À retourner au CFA PAM OI Formation pour amélioration continue — Indicateur Qualiopi 31'
        : '🔒 Document confidentiel — Indicateur Qualiopi 31 — RGPD',
      pageWidth / 2,
      yPied,
      { align: 'center' }
    );

    // ===  ENREGISTREMENT  ===
    const nomFichier = vierge
      ? `Questionnaire_Appreciation_VIERGE_${evaluation.formateurNom.replace(/\s+/g, '_')}_${evaluation.annee}.pdf`
      : `Appreciation_${evaluation.formateurNom.replace(/\s+/g, '_')}_${evaluation.annee}.pdf`;
    doc.save(nomFichier);
  }

  // Style et label par défaut selon le mode
  const styleDefaut: React.CSSProperties = vierge
    ? {
        backgroundColor: '#C8A23A',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }
    : {
        backgroundColor: 'white',
        color: '#006B68',
        border: '1.5px solid #006B68',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      };

  return (
    <button
      onClick={genererPdf}
      style={styleDefaut}
      title={vierge ? 'Générer le questionnaire vierge à donner au formateur' : 'Générer le PDF rempli (synthèse des appréciations)'}
    >
      {label ?? (vierge ? '📄 Questionnaire vierge' : '📊 PDF rempli')}
    </button>
  );
}
