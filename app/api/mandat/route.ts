import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const entreprise = await req.json();
  const tmpInput = join(tmpdir(), `mandat_${Date.now()}.json`);
  const tmpOutput = join(tmpdir(), `mandat_${Date.now()}.pdf`);
  const logoPath = join(process.cwd(), 'public', 'logo-pamoi.png');

  writeFileSync(tmpInput, JSON.stringify(entreprise));

  const script = `
import json, sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from PIL import Image
import os

with open(r'${tmpInput.replace(/\\/g, '\\\\')}', encoding='utf-8') as f:
    e = json.load(f)

logo_src = r'${logoPath.replace(/\\/g, '\\\\')}'
logo_transparent = r'${tmpOutput.replace(/\\/g, '\\\\')}'.replace('.pdf', '_logo.png')

img = Image.open(logo_src).convert('RGBA')
data = img.getdata()
new_data = []
for item in data:
    r, g, b, a = item
    if r < 30 and g < 30 and b < 30:
        new_data.append((r, g, b, 0))
    else:
        new_data.append(item)
img.putdata(new_data)
img.save(logo_transparent)

W, H = A4
VERT = HexColor('#006B68')
OR = HexColor('#C8A23A')
FOND = HexColor('#EAF4F3')
BLANC = colors.white
NOIR = HexColor('#1a1a1a')
GRIS = HexColor('#555555')

c = canvas.Canvas(r'${tmpOutput.replace(/\\/g, '\\\\')}', pagesize=A4)

def entete():
    c.drawImage(logo_transparent, 15*mm, H - 28*mm, width=35*mm, height=22*mm, mask='auto')
    c.setFillColor(OR)
    c.rect(15*mm, H - 30*mm, W - 30*mm, 1.5, fill=1, stroke=0)

def tableau_ligne(label, valeur1, label2='', valeur2='', ypos=0, h=7*mm):
    c.setStrokeColor(HexColor('#bbbbbb'))
    c.setLineWidth(0.5)
    c.rect(15*mm, ypos - h + 2*mm, W - 30*mm, h, fill=0, stroke=1)
    c.line(48*mm, ypos - h + 2*mm, 48*mm, ypos + 2*mm)
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 8)
    c.drawString(17*mm, ypos - h/2 + 2.5*mm, label)
    c.setFillColor(NOIR)
    c.setFont("Helvetica", 8.5)
    c.drawString(50*mm, ypos - h/2 + 2.5*mm, str(valeur1))
    if label2:
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 8)
        c.drawString(120*mm, ypos - h/2 + 2.5*mm, label2)
        c.setFillColor(NOIR)
        c.setFont("Helvetica", 8.5)
        c.drawString(145*mm, ypos - h/2 + 2.5*mm, str(valeur2))
        c.line(118*mm, ypos - h + 2*mm, 118*mm, ypos + 2*mm)
    return ypos - h - 0.3*mm

def ligne(label, valeur='', ypos=0, h=7*mm):
    c.setStrokeColor(HexColor('#bbbbbb'))
    c.setLineWidth(0.5)
    c.rect(15*mm, ypos - h + 2*mm, W - 30*mm, h, fill=0, stroke=1)
    c.line(48*mm, ypos - h + 2*mm, 48*mm, ypos + 2*mm)
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 8)
    c.drawString(17*mm, ypos - h/2 + 2.5*mm, label)
    c.setFillColor(NOIR)
    c.setFont("Helvetica", 8.5)
    c.drawString(50*mm, ypos - h/2 + 2.5*mm, str(valeur or ''))
    return ypos - h - 0.3*mm

# PAGE 1
entete()
y = H - 38*mm

c.setFillColor(NOIR)
c.setFont("Helvetica-Bold", 13)
c.drawCentredString(W/2, y, "Mandat de recrutement et depot d une offre d emploi en alternance")
y -= 3*mm
c.setStrokeColor(NOIR)
c.setLineWidth(0.8)
c.line(15*mm, y, W - 15*mm, y)
y -= 10*mm

c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 10)
c.drawCentredString(W/2, y, "ORGANISME DE FORMATION / CFA :  PAM OI  certifie QUALIOPI n 154312-3")
y -= 6*mm

y = tableau_ligne("Adresse :", "1 Chemin Dubuisson 97436 St Leu", "Siret :", "881 279 392 00016", y)
y = tableau_ligne("Mail :", "pedagogie@pamoi.re", "Tel :", "0693 55 64 97", y)
y = tableau_ligne("N UAI", "9741871R", "N NDA", "04973425197", y)
y = tableau_ligne("Represente par :", "MAILLOT Pamela", "", "", y)
y -= 8*mm

c.setFillColor(VERT)
c.rect(15*mm, y - 5*mm, W - 30*mm, 7*mm, fill=1, stroke=0)
c.setFillColor(BLANC)
c.setFont("Helvetica-Bold", 10)
c.drawCentredString(W/2, y - 1.5*mm, "OFFRE D EMPLOI")
y -= 12*mm

y = ligne("Poste :", e.get('poste', ''), y)
y = ligne("Secteur d activite :", e.get('secteur', ''), y)

c.setStrokeColor(HexColor('#bbbbbb'))
c.setLineWidth(0.5)
c.rect(15*mm, y - 7*mm + 2*mm, W - 30*mm, 7*mm, fill=0, stroke=1)
c.line(48*mm, y - 7*mm + 2*mm, 48*mm, y + 2*mm)
c.setFillColor(GRIS)
c.setFont("Helvetica", 8)
c.drawString(17*mm, y - 1.5*mm, "Experience :")
c.setStrokeColor(VERT)
c.rect(50*mm, y - 3.5*mm, 3*mm, 3*mm, fill=0, stroke=1)
c.setFillColor(NOIR)
c.setFont("Helvetica", 8)
c.drawString(54*mm, y - 1.5*mm, "Debutant accepte")
c.setStrokeColor(VERT)
c.rect(100*mm, y - 3.5*mm, 3*mm, 3*mm, fill=0, stroke=1)
c.rect(106*mm, y - 3.5*mm, 3*mm, 3*mm, fill=0, stroke=1)
c.setFillColor(NOIR)
c.drawString(110*mm, y - 1.5*mm, "_____ an(s)")
y -= 7.3*mm

c.setStrokeColor(HexColor('#bbbbbb'))
c.setLineWidth(0.5)
c.rect(15*mm, y - 35*mm + 2*mm, W - 30*mm, 35*mm, fill=0, stroke=1)
c.line(48*mm, y - 35*mm + 2*mm, 48*mm, y + 2*mm)
c.setFillColor(GRIS)
c.setFont("Helvetica", 8)
c.drawString(17*mm, y - 1.5*mm, "Description :")
c.setFillColor(NOIR)
c.setFont("Helvetica", 8)
c.drawString(50*mm, y - 1.5*mm, "PAM OI recrute pour l un de ses partenaires....")
y -= 35.3*mm

y = ligne("Lieu de travail :", e.get('ville', ''), y)

c.setStrokeColor(HexColor('#bbbbbb'))
c.setLineWidth(0.5)
c.rect(15*mm, y - 7*mm + 2*mm, W - 30*mm, 7*mm, fill=0, stroke=1)
c.line(48*mm, y - 7*mm + 2*mm, 48*mm, y + 2*mm)
c.setFillColor(GRIS)
c.setFont("Helvetica", 8)
c.drawString(17*mm, y - 1.5*mm, "Type de contrat :")
c.setStrokeColor(VERT)
c.rect(50*mm, y - 3.5*mm, 3*mm, 3*mm, fill=0, stroke=1)
c.setFillColor(NOIR)
c.setFont("Helvetica", 8)
c.drawString(54*mm, y - 1.5*mm, "CDI")
c.setStrokeColor(VERT)
c.rect(75*mm, y - 3.5*mm, 3*mm, 3*mm, fill=0, stroke=1)
c.setFillColor(NOIR)
c.drawString(79*mm, y - 1.5*mm, "CDD")
c.drawString(110*mm, y - 1.5*mm, "Duree :")
y -= 7.3*mm

c.setFillColor(OR)
c.rect(15*mm, 12*mm, W - 30*mm, 1, fill=1, stroke=0)
c.setFillColor(GRIS)
c.setFont("Helvetica", 7)
c.drawCentredString(W/2, 8*mm, "Page 1 | 2")
c.showPage()

# PAGE 2
entete()
y = H - 38*mm

c.setStrokeColor(HexColor('#bbbbbb'))
c.setLineWidth(0.5)
c.rect(15*mm, y - 12*mm + 2*mm, W - 30*mm, 12*mm, fill=0, stroke=1)
c.line(48*mm, y - 12*mm + 2*mm, 48*mm, y + 2*mm)
c.setFillColor(GRIS)
c.setFont("Helvetica", 8)
c.drawString(17*mm, y - 5*mm, "Nature du contrat :")
c.setFillColor(VERT)
c.rect(50*mm, y - 4*mm, 3.5*mm, 3.5*mm, fill=1, stroke=0)
c.setFillColor(BLANC)
c.setFont("Helvetica-Bold", 9)
c.drawString(50.5*mm, y - 3.3*mm, "v")
c.setFillColor(NOIR)
c.setFont("Helvetica", 8)
c.drawString(55*mm, y - 3*mm, "Apprentissage")
c.setStrokeColor(VERT)
c.rect(100*mm, y - 4*mm, 3.5*mm, 3.5*mm, fill=0, stroke=1)
c.setFillColor(NOIR)
c.drawString(105*mm, y - 3*mm, "Contrat de professionnalisation")
c.setStrokeColor(VERT)
c.rect(50*mm, y - 10*mm, 3.5*mm, 3.5*mm, fill=0, stroke=1)
c.setFillColor(NOIR)
c.drawString(55*mm, y - 9*mm, "Droit commun")
y -= 12.3*mm

y = ligne("Date d embauche prevue :", "", y)
y = ligne("Nb de poste(s) :", "", y)
y = ligne("Diplome prepare :", e.get('diplome', ''), y)
y = ligne("Niveau du diplome :", e.get('niveauDiplome', ''), y)
y -= 8*mm

c.setFillColor(VERT)
c.rect(15*mm, y - 5*mm, W - 30*mm, 7*mm, fill=1, stroke=0)
c.setFillColor(BLANC)
c.setFont("Helvetica-Bold", 10)
c.drawCentredString(W/2, y - 1.5*mm, "RECRUTEUR FINAL")
y -= 12*mm

y = ligne("Raison sociale", e.get('raisonSociale', ''), y)
y = ligne("Adresse du siege", str(e.get('adresse', '')) + ' ' + str(e.get('codePostal', '')) + ' ' + str(e.get('ville', '')), y)
y = ligne("SIRET", e.get('siret', ''), y)
y = ligne("URSSAF", "", y)
y -= 6*mm

c.setFillColor(NOIR)
c.setFont("Helvetica", 8.5)
c.drawString(15*mm, y, "Je soussigne(e) ................................................................mandate l organisme de formation  PAM OI  a gerer l offre d emploi")
y -= 5*mm
c.drawCentredString(W/2, y, "citee ci-dessus, au nom et pour le compte de l entreprise.")
y -= 8*mm
c.drawString(15*mm, y, "Mandat valable jusqu au :")
y -= 10*mm

c.setFillColor(FOND)
c.rect(15*mm, y - 20*mm, W - 30*mm, 20*mm, fill=1, stroke=0)
c.setStrokeColor(VERT)
c.setLineWidth(1)
c.rect(15*mm, y - 20*mm, W - 30*mm, 20*mm, fill=0, stroke=1)
c.setFillColor(VERT)
c.setFont("Helvetica-Bold", 8)
c.drawCentredString(W/2, y - 6*mm, "Dans la description de l offre d emploi, France Travail ne citera pas le nom de")
c.drawCentredString(W/2, y - 11*mm, "l entreprise et precisera que la formation sera dispensee par l organisme de")
c.drawCentredString(W/2, y - 16*mm, "formation cite ci-dessus.")
y -= 26*mm

c.setFillColor(NOIR)
c.setFont("Helvetica-Bold", 9)
c.drawString(15*mm, y, "Recruteur final")
c.drawString(120*mm, y, "Organisme de formation")
y -= 8*mm
c.setFont("Helvetica", 8)
c.drawString(15*mm, y, "Date :")
c.drawString(55*mm, y, "Fait a :")
c.drawString(120*mm, y, "Date :")
c.drawString(155*mm, y, "Fait a :")
y -= 20*mm
c.drawString(15*mm, y, "Signature :")
c.drawString(120*mm, y, "Signature :")
c.setStrokeColor(VERT)
c.setLineWidth(0.8)
c.rect(15*mm, y - 18*mm, 75*mm, 15*mm, fill=0, stroke=1)
c.rect(120*mm, y - 18*mm, 75*mm, 15*mm, fill=0, stroke=1)

c.setFillColor(OR)
c.rect(15*mm, 12*mm, W - 30*mm, 1, fill=1, stroke=0)
c.setFillColor(GRIS)
c.setFont("Helvetica", 7)
c.drawCentredString(W/2, 8*mm, "Page 2 | 2")

c.save()
if os.path.exists(logo_transparent):
    os.remove(logo_transparent)
`;

  try {
    await execAsync(`python3 -c "${script.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);
    const pdfBuffer = readFileSync(tmpOutput);
    try { unlinkSync(tmpInput); } catch {}
    try { unlinkSync(tmpOutput); } catch {}
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Mandat_${(entreprise.raisonSociale ?? 'entreprise').replace(/\s/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur génération mandat' }, { status: 500 });
  }
}