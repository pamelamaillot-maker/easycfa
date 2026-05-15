# 📈 Module Indicateur 22 — Formations continues formateurs

**EasyCFA · CFA PAM OI Formation · La Réunion**

---

## 📦 Contenu livré

```
easycfa/
├── types/
│   └── formationContinue.ts              # Types + helpers (statut validité)
├── hooks/
│   └── useFormationsContinues.ts         # Persistance localStorage
├── components/
│   ├── OngletFormationsContinues.tsx     # Onglet fiche formateur
│   └── TableauBordFormateursI22.tsx      # Vue globale Direction
└── lib/
    ├── exportPdfFormateur.ts             # PDF individuel
    └── exportPdfGlobal.ts                # PDF global tous formateurs
```

---

## 🚀 Intégration en 3 étapes

### 1️⃣ Vérifier les dépendances

Les exports PDF utilisent `jspdf` et `jspdf-autotable` (déjà présents pour
le module Appréciation formateur). Si jamais ce n'est pas le cas :

```bash
npm install jspdf jspdf-autotable
```

### 2️⃣ Copier les fichiers

Placez chaque dossier dans la racine d'EasyCFA en respectant la structure
ci-dessus. Adaptez les imports relatifs si votre arborescence diffère
(ex: `@/types/...` avec `tsconfig paths`).

### 3️⃣ Brancher l'onglet dans la fiche formateur

Dans la page/fiche formateur existante (probablement
`pages/formateurs/[id].tsx` ou similaire), ajoutez l'onglet à votre
navigation onglets :

```tsx
import OngletFormationsContinues from '@/components/OngletFormationsContinues';

// Dans le composant fiche formateur :
{ongletActif === 'formationsContinues' && (
  <OngletFormationsContinues
    formateurId={formateur.id}
    formateurNom={formateur.nom}
    formateurPrenom={formateur.prenom}
  />
)}
```

Et ajoutez l'onglet dans votre liste, à côté de "Appréciation formateur" :

```tsx
<button onClick={() => setOngletActif('formationsContinues')}>
  📈 Formations continues
</button>
```

### 4️⃣ (Optionnel) Ajouter la vue globale Direction

Créez une page `pages/qualiopi/indicateur-22.tsx` :

```tsx
import TableauBordFormateursI22 from '@/components/TableauBordFormateursI22';
import { useFormateurs } from '@/hooks/useFormateurs'; // votre hook existant

export default function PageIndicateur22() {
  const { formateurs } = useFormateurs();
  return <TableauBordFormateursI22 formateurs={formateurs} />;
}
```

---

## 🔑 Choix d'architecture

**Stockage séparé.** Les formations continues sont stockées dans une clé
localStorage dédiée (`easycfa_formations_continues_v1`) plutôt que dans
l'objet formateur. Avantages :
- N'alourdit pas le chargement de la liste formateurs
- Les justificatifs PDF (base64) sont isolés
- Migration future vers une BDD facilitée (table dédiée)

**Limite justificatif 3 Mo.** localStorage plafonne ~5-10 Mo selon le
navigateur. Au-delà, message d'erreur explicite + suggestion d'export.

**Alerte expiration 90 jours.** Les certifications/habilitations qui
expirent dans les 3 mois passent en "⚠️ Expire bientôt" automatiquement.

---

## ✅ Conformité Qualiopi - Indicateur 22

Ce qui est tracé pour l'audit :
- ✅ Type de formation (4 catégories Qualiopi)
- ✅ Intitulé + organisme + dates + durée
- ✅ Justificatif PDF (attestation) téléchargeable
- ✅ Compétences du référentiel formateur travaillées
- ✅ Statut de validité (certifications)
- ✅ PDF synthèse individuelle (à présenter en audit)
- ✅ PDF global Direction (pilotage)

---

## 🔜 Prochaines étapes Qualiopi

Modules restants pour la conformité complète :
- 🌡️ Évaluations à chaud apprenants (Indicateurs 30/31)
- ❄️ Évaluations à froid 6 mois (Indicateurs 30/31)
- 🏢 Évaluations entreprises/MA (Indicateur 13)

---

*Module développé avec Claude · 2026*
