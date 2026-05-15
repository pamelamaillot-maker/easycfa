# 🌊 Vague 1 — Guide d'intégration

## 📦 Fichiers livrés

| Fichier | Action | Où ? |
|---|---|---|
| `mockUtilisateurs.ts` | **Remplacer** entièrement | `data/mockUtilisateurs.ts` |
| `type-apprenant-enrichi.ts` | **Fusion partielle** dans le fichier existant | `data/mockApprenants_reels.ts` |

---

## 🪜 Étape 1 : Remplacer `data/mockUtilisateurs.ts`

1. Télécharge **`mockUtilisateurs`**
2. VS Code → `data/mockUtilisateurs.ts` → `Ctrl+A` → `Delete` → coller → `Ctrl+S`

**Ce qui change :**
- ✅ PAMA : prénom = "Gaëlle Marie Paméla", avatar "GM"
- ✅ Signature email : "Gaëlle Marie Paméla MAILLOT\nDirectrice — PAM OI Formation..."
- ✅ Nouveau type `ReferentHandicap` + valeur par défaut (Betty REBOUL)
- ✅ Accès `comptable` étendu à `/france-competences`
- ✅ Accès `admin` étendu à `/france-competences` et `/sifa`

---

## 🪜 Étape 2 : Modifier `data/mockApprenants_reels.ts`

⚠️ **Ne pas remplacer tout le fichier** — on ne veut pas perdre tes 62 fiches !

### Action A : remplacer le type Apprenant

1. Ouvre `data/mockApprenants_reels.ts`
2. Cherche `export type Apprenant = {` (vers le début du fichier)
3. **Sélectionne tout le bloc** jusqu'à la `}` de fermeture (juste le type, pas le tableau)
4. **Remplace-le** par le bloc `export type Apprenant` du fichier `type-apprenant-enrichi.ts`

### Action B : ajouter les helpers et constantes à la fin du fichier

À la **fin** de `data/mockApprenants_reels.ts` (après le tableau `APPRENANTS_REELS`), colle tout le reste du fichier `type-apprenant-enrichi.ts` :
- `SEXE_SIFA`
- `DERNIERE_SITUATION_SIFA`
- `TYPE_CFA_SIFA`
- Helpers : `deduireSexe`, `dateVersIso`, `calculerAnneeScolaire`, `estMineur`, `verifierConformiteSifa`

---

## 🪜 Étape 3 : Vider le user en localStorage

Pour que PAMA récupère son nouveau prénom (Gaëlle Marie Paméla), tu dois te déconnecter et te reconnecter :

```javascript
// F12 → Console
localStorage.removeItem('easycfa_user'); sessionStorage.removeItem('easycfa_user'); location.reload();
```

Tu seras renvoyée à la page de login. Reconnecte-toi avec **pamelamaillot@pamoi.re / admin2024** → tu verras maintenant **GM Gaëlle Marie Paméla MAILLOT** dans la sidebar.

---

## ✅ Tests à faire

1. **Sidebar** : tu vois "GM" comme avatar et "Gaëlle Marie Paméla MAILLOT"
2. **Paramètres → Mon profil** : prénom = "Gaëlle Marie Paméla"
3. **Signature email** : commence par "Gaëlle Marie Paméla MAILLOT"
4. **Fiches apprenants** : aucun bug, toutes les 62 fiches s'affichent normalement (les nouveaux champs SIFA sont vides mais c'est normal)
5. **Console** : aucune erreur TypeScript

---

## 🌊 Vague 2 (prochaine livraison)

Une fois la Vague 1 validée, je te livre :

1. 🆕 **Page France Compétences** (`app/france-competences/page.tsx`)
   - 6 onglets (Identité, Certifications, Résultats, Indicateurs, Analytique, UFA)
   - Pré-remplissage automatique depuis Paramètres CFA + Formations
   - Saisie manuelle des données comptables
   - **Export .xlsx au format officiel France Compétences**
   - Sauvegarde par exercice

2. 🆕 **Page SIFA** (`app/sifa/page.tsx`)
   - Tableau récap : tous les apprenants en formation sur l'année scolaire
   - Pré-remplissage automatique depuis fiches apprenants + entreprises + formations
   - Mise en évidence rouge des champs obligatoires manquants
   - **Export .xlsx au format officiel SIFA (62 colonnes)**

3. 🔄 **Sidebar** mise à jour
   - Ajout de "🇫🇷 France Compétences" et "📊 SIFA" dans la catégorie CONFORMITÉS

4. 🔄 **Fiche apprenant** (`app/apprenants/[id]/page.tsx`)
   - Nouvelle section "📊 Déclarations administratives"
   - Saisie des 9 nouveaux champs SIFA
   - Badge "⚠️ X champs SIFA manquants" sur la fiche apprenant

5. 🔄 **Paramètres CFA**
   - Saisie du référent handicap (nom, prénom, email)
   - Sélection du type CFA (code SIFA)

---

## 📌 Note importante

Les **nouveaux champs SIFA sont tous optionnels** dans le type Apprenant. Ça veut dire :
- ✅ Tes 62 fiches actuelles continuent de fonctionner sans modification
- ⚠️ Mais tu devras les **compléter progressivement** pour pouvoir générer un export SIFA conforme
- 📊 La page SIFA (Vague 2) affichera un compteur : "47/62 apprenants conformes" pour t'aider à suivre

Tu pourras commencer par les apprenants en formation active (CA/P2S) pour la prochaine déclaration SIFA de novembre.
