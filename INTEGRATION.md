# 📈 Intégration Module Formations Continues - Guide pas-à-pas

**Indicateur 22 Qualiopi - CFA PAM OI Formation**

---

## 📂 ÉTAPE 1 — Copier les 2 fichiers

### Fichier 1 : `mockFormationsContinues.ts`
→ Coller dans :
```
C:\Users\Utilisateur\Documents\easycfa\data\mockFormationsContinues.ts
```

### Fichier 2 : `CardFormationsContinues.tsx`
→ Coller dans :
```
C:\Users\Utilisateur\Documents\easycfa\components\CardFormationsContinues.tsx
```

✅ **Aucun nouveau dossier à créer** — ils existent déjà dans votre projet.

---

## 🔧 ÉTAPE 2 — Modifier `page.tsx`

Fichier à éditer :
```
C:\Users\Utilisateur\Documents\easycfa\app\formateurs\[id]\page.tsx
```

### 2.1 — Ajouter UN IMPORT (en haut du fichier)

**Cherchez cette ligne (vers la ligne 24) :**
```tsx
} from '../../../data/mockEvaluations';
```

**Juste APRÈS cette ligne, ajoutez :**
```tsx
import CardFormationsContinues from '../../../components/CardFormationsContinues';
```

### 2.2 — Ajouter le bloc Card Formations Continues

**Cherchez ce bloc dans votre code (vers la fin) :**

```tsx
      {/* Sessions assignées */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Sessions assignées ({sessions.length})
        </h2>
```

**Juste AVANT ce bloc `{/* Sessions assignées */}`, collez ce nouveau bloc :**

```tsx
      {/* ====================================================================== */}
      {/* 📈 FORMATIONS CONTINUES — Indicateur 22 Qualiopi                       */}
      {/* ====================================================================== */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>
            📈 Formations continues du formateur
          </h2>
          <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
            🛡️ Indicateur 22 (Critère 5) — Traçabilité des formations, certifications et veille professionnelle
          </p>
        </div>

        {!peutEvaluer && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#7a5c00', borderLeft: '4px solid #C8A23A' }}>
            🔒 <strong>Accès restreint</strong> — Seule la direction (PAMA) peut ajouter ou modifier les formations.
          </div>
        )}

        <CardFormationsContinues
          formateurId={id}
          formateurNom={`${formateur.prenom} ${formateur.nom}`}
          peutEditer={peutEvaluer}
          utilisateur={utilisateur}
        />
      </Card>
```

---

## ✅ ÉTAPE 3 — Tester

1. **Sauvegarder** tous les fichiers (Ctrl+S)
2. **Relancer** votre projet si nécessaire (`npm run dev`)
3. **Aller sur la fiche d'un formateur** (ex: http://localhost:3000/formateurs/1)
4. **Vérifier** que vous voyez bien :
   - La Card "📊 Évaluation annuelle Qualiopi" (existante)
   - La nouvelle Card "📈 Formations continues du formateur"
   - Le bouton "+ Ajouter une formation continue"
5. **Tester** : cliquer sur le bouton → remplir → enregistrer

---

## 🎯 Ce que vous obtenez

### Pour chaque formateur :
- ✅ Ajout/modification/suppression de formations continues
- ✅ 4 types : 🎓 Pédagogique · 🔧 Technique · 📜 Certification · 👁️ Veille
- ✅ Upload justificatif (PDF/JPG/PNG, max 3 Mo)
- ✅ Date d'expiration pour les certifications
- ✅ Alerte automatique 3 mois avant expiration
- ✅ Compétences du référentiel travaillées
- ✅ Filtrage par type
- ✅ Stats : total, heures cumulées, heures de l'année, alertes
- ✅ Métadonnées d'audit (qui a ajouté, quand)

### Réponse à votre auditeur Qualiopi :
> "Voici la liste des formations suivies par chaque formateur, **avec les justificatifs**, **les dates**, et **les compétences travaillées** — tout est consultable et exportable depuis la fiche du formateur."

---

## 🔜 Si tout fonctionne

On enchaîne avec le module suivant :
- 🌡️ **Évaluations à chaud apprenants** (Indicateurs 30/31)
