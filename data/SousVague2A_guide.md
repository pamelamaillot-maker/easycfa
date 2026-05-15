# 🚀 Sous-vague 2A — France Compétences

## 📦 3 actions à faire dans l'ordre

---

### 1️⃣ Installer la librairie xlsx (1 fois pour tout)

Dans le terminal VS Code :

```powershell
npm install xlsx
```

Attends que ça finisse (15-30 secondes). Tu verras "added X packages" à la fin.

⚠️ **Si tu vois des warnings**, c'est normal. Tant qu'il n'y a pas d'erreur (rouge), on est bon.

---

### 2️⃣ Créer le dossier + le fichier France Compétences

Dans VS Code :

1. Panneau gauche → clic droit sur le dossier **`app`** → **New Folder**
2. Tape `france-competences` (avec le tiret)
3. Clic droit sur le nouveau dossier `france-competences` → **New File**
4. Tape `page.tsx`
5. Le fichier vide s'ouvre dans l'éditeur
6. Télécharge **`page`** ci-dessus
7. Copie tout son contenu → colle dans le fichier vide → `Ctrl + S`

---

### 3️⃣ Remplacer la Sidebar

1. Dans VS Code, ouvre **`components/Sidebar.tsx`**
2. Télécharge **`Sidebar`** ci-dessus
3. `Ctrl + A` → `Delete` → coller le nouveau contenu → `Ctrl + S`

---

## 🧪 Tester

1. Rafraîchis http://localhost:3000 (`Ctrl + F5`)
2. Dans la sidebar, tu vois maintenant dans la section CONFORMITÉS :
   - 🏅 Qualiopi
   - 🇫🇷 **France Compétences** ← nouveau !
   - 📊 **SIFA** (avec 🔒 pour l'instant, sera créé en 2B)
   - 📑 BPF
   - 📄 Documents
3. Clique sur **🇫🇷 France Compétences**
4. Tu arrives sur la page avec 6 onglets

---

## ✅ Tests à faire sur la page

### Onglet 🏢 Identité (AUTO)
- ✅ Toutes les infos pré-remplies (SIRET, NDA, UAI, adresse, etc.)
- ✅ Représentant : **MAILLOT Gaëlle Marie Paméla** ← OK conforme au fichier officiel

### Onglet 📚 Certifications (AUTO)
- ✅ Liste de tes 8 formations actives (les archivées ARH_05112025 et AD_29072024 n'apparaissent pas)
- ✅ Taux de certification affichés depuis la fiche formation

### Onglet 💰 Résultat apprentissage
- Saisis quelques valeurs dans Charges (Achats 17831, Locations 35121, Charges personnel 63220...)
- Saisis quelques valeurs dans Produits (Ventes 165084...)
- **Le total se met à jour en direct** ✨
- Le résultat net s'affiche en vert si positif, rouge si négatif

### Onglet 📊 Indicateurs
- 13 champs à saisir (immobilisations, investissements, subventions, réserves...)

### Onglet 🔍 Analytique & 🏫 UFA
- Pour l'instant, message "à compléter manuellement dans le fichier exporté"

### Test EXPORT 📥
1. Clique sur **💾 Enregistrer** d'abord (pour conserver tes données)
2. Puis **📥 Exporter au format officiel (.xlsx)**
3. Le fichier `France_Competences_PAM_OI_2024.xlsx` se télécharge
4. Ouvre-le → tu retrouves les **5 onglets** correctement remplis avec tes données

---

## 📊 Ce qui est fait / Ce qui reste

### ✅ Fait dans 2A
- Page France Compétences complète
- Export .xlsx au format officiel (5 premiers onglets)
- Pré-remplissage automatique : Identité + Certifications
- Saisie manuelle avec totaux automatiques : Résultat + Indicateurs
- Sauvegarde par exercice (localStorage clé `easycfa_france_competences_YYYY`)
- Sidebar mise à jour avec 🇫🇷 et 📊 SIFA

### 🔜 À venir (Sous-vague 2B)
- 🆕 Page SIFA avec export .xlsx (62 colonnes)
- 🔄 Fiche apprenant avec section "Déclarations administratives"

### 🔜 Sous-vague 2C
- 🔄 Paramètres CFA modifiables (pour mettre à jour SIRET/NDA/UAI depuis l'interface)
- 🔄 Saisie référent handicap

---

## ⚠️ Notes importantes

### Le prénom officiel "Gaëlle Marie Paméla MAILLOT"
- Affiché dans l'onglet Identité ✅
- Inclus dans l'export Excel ✅
- Format identique au fichier officiel France Compétences que tu m'as fourni 👌

### Données comptables
- Pour l'instant **saisie manuelle** (les données comptables viennent de ton expert-comptable, pas d'EasyCFA)
- Une éventuelle import depuis un FEC (Fichier des Écritures Comptables) pourrait être ajouté plus tard

### Onglets Analytique & UFA
- Non implémentés en saisie graphique (complexes et spécifiques)
- L'export Excel les inclut quand même comme onglets vides → tu compléteras directement dans Excel

### Comptable (Raoul) a accès
- Dans la nouvelle config d'accès, **comptable** peut accéder à `/france-competences`
- Tu peux le modifier dans **Paramètres → 🔐 Accès** si besoin
