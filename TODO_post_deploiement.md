# 📋 EasyCFA — TODO post-déploiement

## 🎯 Priorité Haute

### 1. Prénom usuel vs prénom officiel (juridique/administratif)

**Contexte** : Paméla MAILLOT est le prénom usuel, mais **Gaëlle MAILLOT** est le prénom à utiliser sur tous les documents juridiques et administratifs.

**Modifications à prévoir** :

#### a) Type `Utilisateur` (`data/mockUtilisateurs.ts`)

```typescript
export type Utilisateur = {
  // ... champs existants
  prenom: string;              // 'Paméla' — usage quotidien (sidebar, mails internes)
  prenomOfficiel?: string;     // 'Gaëlle' — documents juridiques/administratifs
};
```

Mettre à jour la fiche PAMA :
```typescript
{
  id: 'PAMA',
  nom: 'MAILLOT',
  prenom: 'Paméla',
  prenomOfficiel: 'Gaëlle',  // ← à ajouter
  // ...
}
```

#### b) Helper centralisé (`lib/userHelpers.ts`)

```typescript
import { Utilisateur } from '../data/mockUtilisateurs';

export function nomComplet(
  u: Utilisateur | null | undefined,
  contexte: 'usuel' | 'officiel' = 'usuel'
): string {
  if (!u) return '—';
  if (contexte === 'officiel' && u.prenomOfficiel) {
    return `${u.prenomOfficiel} ${u.nom}`;
  }
  return `${u.prenom} ${u.nom}`;
}

// Pour signatures de documents officiels
export function signataireOfficiel(u: Utilisateur | null | undefined): string {
  return nomComplet(u, 'officiel');
}
```

#### c) Modules à mettre à jour pour utiliser le prénom OFFICIEL

| Module | Champ/document | Prénom |
|---|---|---|
| **Conventions de formation** | Signature directrice | Officiel |
| **Contrats d'apprentissage** | Signataire CFA | Officiel |
| **Attestations de formation** | Signature | Officiel |
| **Factures OPCO** | Émetteur | Officiel |
| **Devis** | Signataire | Officiel |
| **PV d'examens** | Représentant CFA | Officiel |
| **Émargements** | Responsable session | Officiel |
| **Qualiopi** | Documents officiels | Officiel |
| **BPF** | Déclaration | Officiel |
| **DEETS** | Demandes d'agrément | Officiel |

#### d) Modules qui gardent le prénom USUEL

| Module | Affichage | Prénom |
|---|---|---|
| **Sidebar** | "Connecté : Paméla M." | Usuel |
| **Historique actions** | "Archivé par Paméla MAILLOT" | Usuel |
| **Signature email** | Bas de mail | Usuel |
| **Badge utilisateur** | Avatar + nom | Usuel |
| **Notifications internes** | "Paméla a modifié..." | Usuel |

#### e) Système prêt pour d'autres utilisateurs

Le champ `prenomOfficiel` est **optionnel** — pour Betty, Raoul, Noella, ne rien mettre.
Le helper retourne automatiquement le prénom usuel si pas de prénom officiel défini.
Quand un autre utilisateur aura besoin du même mécanisme, il suffira d'ajouter `prenomOfficiel` à sa fiche.

---

## 🎯 Autres points en attente

### 2. Sidebar arborescente
Restructurer en : ADMINISTRATIF / PÉDAGOGIE / ASSIDUITÉS / CONFORMITÉS / COMPTABILITÉ

### 3. Émargement lié aux sessions
Faire le lien entre le module Émargement et les sessions de formation.

### 4. Affectation apprenant → session
Depuis la fiche apprenant, pouvoir affecter à une session.

### 5. Déploiement Vercel + Supabase (lundi)
- Création projet Supabase
- Schéma SQL pour : formations, apprenants, entreprises, formateurs, sessions, examens, APC, utilisateurs, journal_bord
- Migration `dataBase64` (localStorage) → Supabase Storage pour les PDF
- Variables d'environnement Vercel
- Auth Supabase (remplacement de UserContext localStorage)

### 6. Sécurisation admin-only (après auth Supabase)
- Suppression de formations
- Modification du code RNCP / dates de validité
- Création/suppression d'utilisateurs
- Modification des données financières sensibles
