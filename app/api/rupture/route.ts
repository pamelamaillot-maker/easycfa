import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const apprenant = await req.json();
  const tmpInput = join(tmpdir(), `rupture_${Date.now()}.json`);
  const tmpOutput = join(tmpdir(), `rupture_${Date.now()}.pdf`);

  writeFileSync(tmpInput, JSON.stringify(apprenant));

  const script = `
import json, sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from datetime import date

with open('${tmpInput.replace(/\\/g, '\\\\')}', encoding='utf-8') as f:
    ap = json.load(f)

W, H = A4
VERT = HexColor('#006B68')
OR = HexColor('#C8A23A')
FOND = HexColor('#EAF4F3')
BLANC = colors.white
NOIR = HexColor('#1a1a1a')
GRIS = HexColor('#555555')

c = canvas.Canvas('${tmpOutput.replace(/\\/g, '\\\\')}', pagesize=A4)
y = H - 18*mm

c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 12)
c.drawCentredString(W/2, y, "FORMULAIRE DE RÉSILIATION DU CONTRAT D'APPRENTISSAGE")
y -= 5*mm
c.setFillColor(OR)
c.rect(15*mm, y, W - 30*mm, 2, fill=1, stroke=0)
y -= 8*mm

def section_header(titre, ypos, h=6.5*mm):
    c.setFillColor(VERT)
    c.rect(15*mm, ypos - h + 2*mm, W - 30*mm, h, fill=1, stroke=0)
    c.setFillColor(BLANC)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(W/2, ypos - h/2 + 2.5*mm, titre)
    return ypos - h - 1*mm

def ligne(label, valeur, ypos, h=6.5*mm, alt=False):
    if alt:
        c.setFillColor(FOND)
        c.rect(15*mm, ypos - h + 2*mm, W - 30*mm, h, fill=1, stroke=0)
    c.setStrokeColor(HexColor('#bbbbbb'))
    c.setLineWidth(0.5)
    c.rect(15*mm, ypos - h + 2*mm, W - 30*mm, h, fill=0, stroke=1)
    c.line(83*mm, ypos - h + 2*mm, 83*mm, ypos + 2*mm)
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 7.5)
    c.drawString(17*mm, ypos - h/2 + 2.5*mm, label)
    c.setFillColor(NOIR)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(85*mm, ypos - h/2 + 2.5*mm, str(valeur or '—'))
    return ypos - h - 0.5*mm

y = section_header("Le contrat d'apprentissage", y)
y = ligne("Date de début de contrat", ap.get('dateDebutContrat',''), y)
y = ligne("Date de fin de contrat prévue", ap.get('dateFinContrat',''), y, alt=True)
y = ligne("Enregistré par l'OPCO sous le numéro", ap.get('numeroDossierOPCO') or ap.get('numeroDECA',''), y)
y -= 2.5*mm

y = section_header("L'employeur", y)
y = ligne("Entreprise", ap.get('entreprise',''), y)
y = ligne("N° SIRET", ap.get('siret',''), y, alt=True)
y -= 2.5*mm

y = section_header("L'apprenti", y)
y = ligne("Prénom et Nom", ap.get('prenom','') + ' ' + ap.get('nom',''), y)
y = ligne("Date de naissance", ap.get('dateNaissance',''), y, alt=True)
y -= 2.5*mm

y = section_header("Le représentant légal de l'apprenti mineur", y)
rep = ''
if ap.get('representantPrenom') and ap.get('representantNom'):
    rep = ap['representantPrenom'] + ' ' + ap['representantNom']
y = ligne("Prénom et Nom", rep or '—', y)
y -= 4*mm

c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 7.5)
c.drawCentredString(W/2, y, "Cocher obligatoirement la case correspondant au motif de la rupture")
y -= 4.5*mm

motifs = [
    ('unilateral', "Rupture unilatérale pendant les 45 premiers jours en emploi, consécutifs ou non (art. L.6222-18, al.1)"),
    ('commun', "Rupture d'un commun accord entre l'apprenti et l'employeur (art. L.6222-18, al.2)"),
    ('force_majeure', "Rupture en cas de force majeure — licenciement (art. L.6222-18, al.3)"),
    ('faute_grave', "Rupture en cas de faute grave de l'apprenti — licenciement (art. L.6222-18, al.3)"),
    ('inaptitude', "Rupture en cas d'inaptitude de l'apprenti constatée par le médecin du travail (art. L.6222-18, al.3)"),
    ('deces', "Rupture en cas de décès de l'employeur maître d'apprentissage en entreprise unipersonnelle (art. L.6222-18, al.3)"),
    ('initiative', "Rupture à l'initiative de l'apprenti après préavis et sollicitation du médiateur consulaire (art. L.6222-18, al.4)"),
    ('liquidation', "Rupture en cas de liquidation judiciaire de l'employeur sans maintien de l'activité (art. L.6222-18, al.5)"),
    ('exclusion', "Rupture en cas d'exclusion définitive de l'apprenti par le CFA (art. L.6222-18-1)"),
    ('diplome', "Rupture en cas d'obtention du diplôme — fin du contrat à l'initiative de l'apprenti (art. L.6222-19)"),
    ('administratif', "Rupture par décision administrative — risque d'atteinte à la santé ou l'intégrité de l'apprenti (art. L.6222-24 et 25)"),
]

motif_sel = ap.get('motif','')
for mid, mlabel in motifs:
    c.setStrokeColor(VERT)
    c.setLineWidth(1)
    c.rect(17*mm, y - 0.8*mm, 3*mm, 3*mm, fill=0, stroke=1)
    if motif_sel == mid:
        c.setFillColor(VERT)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(17.3*mm, y - 0.2*mm, chr(10003))
    c.setFillColor(NOIR)
    c.setFont("Helvetica", 7)
    c.drawString(21.5*mm, y + 0.3*mm, mlabel)
    y -= 4.8*mm

y -= 2.5*mm

c.setFillColor(FOND)
c.rect(15*mm, y - 5.5*mm, W - 30*mm, 10*mm, fill=1, stroke=0)
c.setStrokeColor(VERT)
c.setLineWidth(1.5)
c.rect(15*mm, y - 5.5*mm, W - 30*mm, 10*mm, fill=0, stroke=1)
c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 8.5)
c.drawString(18*mm, y + 1*mm, "Date d'effet de la rupture :")
c.setFillColor(NOIR)
c.setFont("Helvetica-Bold", 8.5)
c.drawString(88*mm, y + 1*mm, ap.get('dateRupture',''))
y -= 12*mm

c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 7.5)
c.drawString(15*mm, y, "L'apprenti poursuit-il sa formation en CFA après la rupture de son contrat d'apprentissage ?")
y -= 5.5*mm

maintien = ap.get('maintienFormation','')
for choix, label in [('OUI','OUI'), ('NON', "NON  ->  Date de sortie de la formation : " + (ap.get('dateFinMaintien') or ''))]:
    c.setStrokeColor(VERT)
    c.setLineWidth(1)
    c.rect(22*mm, y - 0.8*mm, 3*mm, 3*mm, fill=0, stroke=1)
    c.setFillColor(NOIR)
    c.setFont("Helvetica", 8)
    c.drawString(27*mm, y + 0.3*mm, label)
    y -= 5.5*mm

y -= 2*mm

nc = ap.get('nouveauContrat') or {}
c.setFillColor(FOND)
c.rect(15*mm, y - 17*mm, W - 30*mm, 20*mm, fill=1, stroke=0)
c.setStrokeColor(OR)
c.setLineWidth(3)
c.line(15*mm, y - 17*mm, 15*mm, y + 3*mm)
c.setStrokeColor(HexColor('#cccccc'))
c.setLineWidth(0.5)
c.rect(15*mm, y - 17*mm, W - 30*mm, 20*mm, fill=0, stroke=1)
c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 7.5)
c.drawString(19*mm, y, "Si l'apprenti signe un nouveau contrat dans une autre entreprise, merci de nous fournir les informations suivantes :")
c.setFillColor(NOIR)
c.setFont("Helvetica", 7.5)
c.drawString(19*mm, y - 5*mm, "Signature d'un nouveau contrat en date du : " + (nc.get('date') or ''))
c.drawString(19*mm, y - 9.5*mm, "Avec l'entreprise (Raison sociale) : " + (nc.get('entreprise') or ''))
c.drawString(19*mm, y - 14*mm, "Siret et IDCC : " + (nc.get('siret') or '') + ('  -  IDCC : ' + nc.get('idcc','') if nc.get('idcc') else '') + "     Nouvel OPCO : " + (nc.get('opco') or ''))
y -= 21*mm

c.setFillColor(NOIR)
c.setFont("Helvetica", 8)
c.drawString(15*mm, y, "Fait a : Saint-Leu")
c.drawString(100*mm, y, "Le : " + date.today().strftime('%d/%m/%Y'))
y -= 6*mm

c.setFillColor(OR)
c.rect(15*mm, y, W - 30*mm, 2, fill=1, stroke=0)
y -= 8*mm

larg = 52*mm
sigs = [("L'employeur :", 15*mm), ("L'apprenti :", W/2 - larg/2), ("Le representant legal :", W - 15*mm - larg)]
for label, xpos in sigs:
    c.setFillColor(VERT)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(xpos + larg/2, y, label)
    c.setFillColor(FOND)
    c.rect(xpos, y - 20*mm, larg, 17*mm, fill=1, stroke=0)
    c.setStrokeColor(VERT)
    c.setLineWidth(1)
    c.rect(xpos, y - 20*mm, larg, 17*mm, fill=0, stroke=1)

c.save()
`;

  try {
    await execAsync(`python3 -c "${script.replace(/"/g, '\\"')}"`);
    const pdfBuffer = readFileSync(tmpOutput);
    unlinkSync(tmpInput);
    unlinkSync(tmpOutput);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rupture_${apprenant.nom}_${apprenant.prenom}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 });
  }
}