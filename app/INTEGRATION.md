# 🌡️ Module Évaluations à chaud apprenants — Guide d'intégration

**Indicateurs 30/31 Qualiopi · CFA PAM OI Formation**

---

## 📦 ÉTAPE 1 — Copier les 4 fichiers

### Fichier 1 : `supabaseClient.ts`
→ Coller dans :
```
C:\Users\Utilisateur\Documents\easycfa\lib\supabaseClient.ts
```

### Fichier 2 : `evaluationsChaud.ts`
→ Coller dans :
```
C:\Users\Utilisateur\Documents\easycfa\data\evaluationsChaud.ts
```

### Fichier 3 : Page apprenti
→ Créer le dossier `app\evaluation\[code]\` (oui, avec les crochets)
→ Coller `page.tsx` dedans :
```
C:\Users\Utilisateur\Documents\easycfa\app\evaluation\[code]\page.tsx
```

### Fichier 4 : Page merci
→ Créer le sous-dossier `merci` dans `[code]`
→ Coller `page.tsx` dedans :
```
C:\Users\Utilisateur\Documents\easycfa\app\evaluation\[code]\merci\page.tsx
```

### Fichier 5 : Dashboard admin
→ Coller dans :
```
C:\Users\Utilisateur\Documents\easycfa\components\CardEvaluationsChaud.tsx
```

⚠️ **Important** : les dossiers `evaluation/[code]/` et `evaluation/[code]/merci/` doivent être créés à la racine de `app/`.

---

## 🔧 ÉTAPE 2 — Modifier `app/sessions/page.tsx`

### 2.1 — Ajouter l'import (en haut du fichier)

Cherchez la ligne :
```tsx
import Card from '../../components/Card';
```

Juste **après** cette ligne, ajoutez :
```tsx
import CardEvaluationsChaud from '../../components/CardEvaluationsChaud';
```

### 2.2 — Élargir le type d'onglet

Cherchez cette ligne :
```tsx
const [onglet, setOnglet] = useState<'planning' | 'apprenants' | 'modules'>('planning');
```

**Remplacez-la par** :
```tsx
const [onglet, setOnglet] = useState<'planning' | 'apprenants' | 'modules' | 'eval_chaud'>('planning');
```

### 2.3 — Ajouter le 4ème onglet

Cherchez le bloc des onglets :
```tsx
                {[
                  { id: 'planning', label: '📅 Planning' },
                  { id: 'apprenants', label: `👥 Apprenants (${selectionne.apprenantIds.length})` },
                  { id: 'modules', label: '📚 Modules/Formateurs' },
                ].map(o => (
```

**Remplacez-le par** :
```tsx
                {[
                  { id: 'planning', label: '📅 Planning' },
                  { id: 'apprenants', label: `👥 Apprenants (${selectionne.apprenantIds.length})` },
                  { id: 'modules', label: '📚 Modules/Formateurs' },
                  { id: 'eval_chaud', label: '🌡️ Évaluations à chaud' },
                ].map(o => (
```

### 2.4 — Ajouter le contenu du nouvel onglet

Cherchez **la FIN** de l'onglet "modules" — c'est cette zone :

```tsx
                        <div style={{ backgroundColor: '#006B68', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Total modules</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#C8A23A' }}>
                            {(selectionne.modules || []).reduce((s, m) => s + m.heures, 0)}h / {config.totalHeures}h
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
```

Le bloc se termine par `</div>` puis `)}` à la fin (sortie de `{onglet === 'modules' && ...}`).

**Juste après le `)}` de fermeture de l'onglet modules, AVANT le `</div>` final, ajoutez** :

```tsx

                {/* ============ NOUVEL ONGLET : ÉVALUATIONS À CHAUD ============ */}
                {onglet === 'eval_chaud' && (
                  <div>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>
                        🌡️ Évaluations à chaud des apprentis
                      </h3>
                      <p style={{ fontSize: '10px', color: '#888' }}>
                        🛡️ Indicateurs 30/31 Qualiopi — Recueil des appréciations des apprenants
                      </p>
                    </div>

                    <CardEvaluationsChaud
                      sessionId={selectionne.id}
                      sessionNom={`${selectionne.numero} — ${config.label}`}
                      apprenantIds={selectionne.apprenantIds}
                    />
                  </div>
                )}

```

---

## 💾 ÉTAPE 3 — Sauvegarder & Tester

1. **Ctrl + S** pour sauvegarder tous les fichiers
2. Si Next.js ne recompile pas automatiquement, relancez `npm run dev`
3. Allez sur **http://localhost:3000/sessions**
4. Cliquez sur une session
5. Vous devriez voir le **4ème onglet "🌡️ Évaluations à chaud"**
6. Cliquez dessus → vous verrez :
   - 🔗 Le lien public (à partager aux apprentis)
   - 📊 Les stats (0 réponses au départ)
7. Cliquez sur **"👁 Aperçu"** pour voir la page apprenti
8. Remplissez le formulaire en test → vous devriez revenir avec 1 réponse !

---

## 🚀 ÉTAPE 4 — Déploiement Vercel

Une fois que ça marche en local :

```bash
git add .
git commit -m "feat: module évaluations à chaud apprenants (indicateurs 30/31)"
git push
```

Vercel redéploie automatiquement (1-2 min). Les liens des apprentis fonctionneront depuis n'importe où :

```
https://easycfa.vercel.app/evaluation/[code-unique]
```

---

## ✅ Workflow d'utilisation

### Pour vous (PAMA)
1. Allez sur la session
2. Onglet **🌡️ Évaluations à chaud**
3. **Copiez le lien** affiché en haut
4. **Envoyez-le** aux apprentis (email, WhatsApp, QR code en classe...)
5. **Revenez quand vous voulez** voir les réponses

### Pour les apprentis
1. Reçoivent le lien
2. Cliquent → page mobile-friendly
3. Notent 5 critères + commentaires
4. Cliquent "Envoyer"
5. Page de remerciement ✅

### Pour l'audit Qualiopi
- Toutes les réponses sont stockées dans Supabase (sécurisé)
- Date et heure de chaque réponse
- Statistiques par session
- Conformité Indicateurs 30 (recueil avis) et 31 (traitement difficultés via les commentaires)

---

## 🎁 Prochaines évolutions possibles

Plus tard, on pourra ajouter :
- 📧 **Envoi automatique par email** (Resend) à tous les apprentis de la session
- 📄 **Export PDF** de la synthèse pour l'audit
- 📱 **QR code** affichable à l'écran en fin de session
- 📊 **Vue agrégée** toutes formations confondues

Mais déjà avec ça, vous avez de quoi répondre à l'audit Qualiopi ! 🎯
