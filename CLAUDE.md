# CLAUDE.md — SANTÉGAB
# Système d'Information Hospitalier Multi-Structures — Gabon

---

## 👤 PROFIL DÉVELOPPEUR

- Développeur full-stack solo
- Niveau junior Laravel/PHP et Next.js/TypeScript
- Priorité absolue : Lisibilité > Sécurité > Maintenabilité > Simplicité
- Commentaires toujours en français
- Pas de sur-engineering, pas d'optimisation prématurée

---

## 🏥 CONTEXTE PRODUIT

SANTÉGAB est un SaaS médical multi-tenant permettant :
- Carnet de santé numérique sécurisé (QR Code JWT)
- Gestion des consultations + prescriptions
- Laboratoire + Imagerie médicale
- Pharmacie + Gestion des stocks
- Hospitalisations (kanban + fiche détail)
- Facturation avec calcul assurance automatique
- Comptabilité (journal automatique)
- Statistiques et reporting
- Audit trail complet (traçabilité légale)
- Permissions granulaires par rôle

**Isolation stricte par hospital_id — critique et non négociable.**

---

## 🏗 STACK TECHNIQUE (NON MODIFIABLE)

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16.2 (App Router, Turbopack) — PAS de dossier src/ |
| UI | Shadcn UI + Tailwind CSS 4 |
| ORM | Prisma 7 (@prisma/adapter-pg) |
| Base de données | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Déploiement | Vercel |

---

## 📁 ARCHITECTURE FICHIERS

```
app/
├── (auth)/login/
├── dashboard/
│   ├── layout.tsx              ← SidebarProvider + div (JAMAIS SidebarInset)
│   ├── page.tsx                ← Dashboard KPIs + graphiques
│   ├── actions.ts              ← getDashboardStats, getConsultationsParJour...
│   ├── patients/               ← CRUD patients + QR Code
│   ├── consultations/          ← Consultations + prescriptions
│   ├── billing/                ← Facturation
│   ├── laboratory/             ← Examens labo + upload PDF
│   ├── imaging/                ← Examens imagerie + upload fichiers
│   ├── pharmacy/               ← Pharmacie + stock
│   ├── accounting/             ← Comptabilité + journal
│   ├── hospitalisations/       ← Kanban séjours + [id]/ fiche détail
│   ├── chambres/               ← Gestion chambres + tarifs
│   ├── users/                  ← Gestion utilisateurs Supabase Auth
│   ├── stats/                  ← Statistiques Recharts
│   ├── audit/                  ← Journal audit (ADMIN only)
│   └── permissions/            ← Permissions granulaires (ADMIN only)
├── carnet/[token]/             ← Page publique QR Code (sans auth)
lib/
├── prisma.ts                   ← PrismaClient singleton + PrismaPg adapter
├── audit.ts                    ← enregistrerAudit() — appelé partout
├── tarifs.ts                   ← TARIFS_LABO, TARIFS_IMAGERIE, TARIF_CONSULTATION
├── permissions.ts              ← Constantes + types UNIQUEMENT (safe client)
├── permissions.server.ts       ← Fonctions Prisma (JAMAIS dans "use client")
├── withPermission.ts           ← Guard pages serveur
└── supabase/
    ├── client.ts               ← createBrowserClient
    ├── server.ts               ← createServerClient (cookies)
    └── admin.ts                ← createAdminClient() SERVICE_ROLE_KEY
components/
├── layout/
│   ├── Sidebar.tsx             ← Navigation dynamique selon permissions
│   └── Header.tsx
├── dashboard/                  ← StatsCards, ConsultationsChart, AssuranceChart
├── patients/
├── consultations/
├── billing/
├── laboratory/
├── imaging/
├── pharmacy/
├── accounting/
├── hospitalisations/
│   ├── HospitalisationsStats.tsx
│   ├── KanbanHospitalisations.tsx
│   ├── AdmissionDialog.tsx
│   ├── AjouterMedicamentDialog.tsx
│   ├── SortiePatientDialog.tsx
│   └── FicheHospitalisation.tsx
├── chambres/
│   └── ChambresGrid.tsx
└── permissions/
    ├── PermissionsTable.tsx            ← Rôles système (toggles auto-save)
    └── RolesPersonnalisesManager.tsx   ← Rôles perso + assignation
prisma/
├── schema.prisma
└── seed.ts                     ← Seed v3 complet
```

---

## ⚙️ PRISMA 7 — RÈGLES CRITIQUES

```typescript
// Import TOUJOURS depuis generated
import { PrismaClient } from "../app/generated/prisma/client"

// Driver adapter OBLIGATOIRE
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// schema.prisma
generator client {
  provider   = "prisma-client-js"
  output     = "../app/generated/prisma"
  engineType = "client"          // ← OBLIGATOIRE
}
```

**Après chaque modification de schema.prisma :**
```bash
npx prisma generate
```

**Colonnes ID = type TEXT (uuid)**
**NE JAMAIS modifier les migrations existantes**

---

## 🔑 VARIABLES D'ENVIRONNEMENT

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       ← pour createAdminClient()
DATABASE_URL=                    ← pooler port 6543, pgbouncer=true
MIGRATE_DATABASE_URL=            ← pooler port 5432, session mode
QR_TOKEN_SECRET=                 ← pour JWT carnet de santé
```

---

## 🔒 MULTI-TENANT — RÈGLES ABSOLUES

```typescript
// ✅ TOUJOURS — hospital_id depuis l'utilisateur authentifié
const utilisateur = await prisma.utilisateur.findFirst({
  where: { email: user.email! }
});
// Utiliser utilisateur.hospital_id

// ✅ TOUJOURS — double filtre sur les requêtes
await prisma.model.findFirst({
  where: { id: X, hospital_id: hospitalId }
});

// ❌ JAMAIS — hospital_id depuis les params URL
// ❌ JAMAIS — requête sans hospital_id
```

**Hospital ID fixe seed : `11111111-1111-1111-1111-111111111111`**

---

## 📋 PATTERN SERVER ACTIONS (obligatoire)

```typescript
"use server";

export async function monAction(
  hospitalId: string,        // toujours en premier
  utilisateurId: string,     // pour l'audit
  utilisateurNom: string,    // pour l'audit
  data: { ... }
) {
  // 1. Logique métier
  const result = await prisma.model.create({
    data: { hospital_id: hospitalId, ...data }
  });

  // 2. Audit OBLIGATOIRE après chaque action
  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "MODULE",
    description: `Description claire de l'action`,
    entiteId:    result.id,
    entiteNom:   result.nom,
    metadonnees: { ... },
  });

  return result;
}
```

---

## 💰 FLUX FACTURATION → COMPTABILITÉ

```
Consultation créée
  → Facture EN_ATTENTE auto (TARIF_CONSULTATION = 20 000 XAF)

Examen labo créé
  → Facture EN_ATTENTE auto (TARIFS_LABO[type])

Examen imagerie créé
  → Facture EN_ATTENTE auto (TARIFS_IMAGERIE[type])

Facture payée (payerFacture)
  → Écriture RECETTE auto dans ecritures_comptables

Hospitalisation payée (payerHospitalisation)
  → Écriture RECETTE auto dans ecritures_comptables
```

**Tarifs de référence (lib/tarifs.ts) :**
```typescript
TARIF_CONSULTATION = 20 000 XAF
TARIFS_LABO = {
  BILAN_SANGUIN: 15000, BILAN_URINAIRE: 10000,
  BACTERIOLOGIE: 25000, PARASITOLOGIE: 20000,
  SEROLOGIE: 30000, BIOCHIMIE: 35000,
  HEMATOLOGIE: 20000, AUTRE: 15000
}
TARIFS_IMAGERIE = {
  RADIOGRAPHIE: 30000, ECHOGRAPHIE: 45000,
  SCANNER: 150000, IRM: 250000,
  MAMMOGRAPHIE: 60000, AUTRE: 35000
}
```

---

## 🏥 FLUX HOSPITALISATION

```
Admission patient
  → Chambre marquée occupée (est_disponible = false)
  → Facture EN_ATTENTE créée immédiatement
  → Ligne CHAMBRE J1 ajoutée

Bon de commande médicament
  → Stock disponible   → SORTIE stock + ligne SERVI + facture recalculée
  → Stock indisponible → ligne EN_ATTENTE (pas de débit stock)

Ajout journée chambre (manuel)
  → Ligne CHAMBRE Jn + facture recalculée

Sortie patient (cloturerHospitalisation)
  → Facture finalisée (total réel lignes SERVI uniquement)
  → Chambre libérée (est_disponible = true)

Paiement (payerHospitalisation)
  → Facture PAYEE
  → Écriture RECETTE auto dans ecritures_comptables
```

---

## 🔐 SYSTÈME DE PERMISSIONS

### Deux fichiers séparés — CRITIQUE

```typescript
// lib/permissions.ts — SAFE côté client
// Contient : MODULES, MODULE_LABELS, PermissionModule, ROLES_ADMIN
// ✅ Importable dans "use client"

// lib/permissions.server.ts — SERVEUR UNIQUEMENT
// Contient : getPermissionsUtilisateur, getPermissionsEffectives,
//            peutFaire, initialiserPermissionsDefaut
// ❌ Ne JAMAIS importer dans un composant "use client" → erreur dns/pg
```

### Priorité des permissions
```
1. ADMIN / SUPER_ADMIN → bypass total (tout à true)
2. Rôle personnalisé (role_personnalise_id) → permissions de ce rôle perso
3. Rôle système (enum Role) → permissions configurées en BDD
```

### Guard page serveur
```typescript
import { withPermission } from "@/lib/withPermission";

export default async function MaPage() {
  // Vérifie auth + permission, redirige si refusé
  const utilisateur = await withPermission("MODULE", "peut_voir");
  // ...
}
```

### Tables BDD permissions
```
permissions.role                 NOT NULL → permission rôle système
permissions.role_personnalise_id NOT NULL → permission rôle personnalisé
Les deux sont mutuellement exclusifs.
Contraintes uniques séparées pour chaque cas.
```

---

## 📤 UPLOADS SUPABASE STORAGE

```typescript
// ✅ TOUJOURS utiliser createAdminClient pour les uploads
import { createAdminClient } from "@/lib/supabase/admin";

const supabaseAdmin = createAdminClient();
await supabaseAdmin.storage
  .from("resultats-examens")
  .upload(cheminFichier, file, { upsert: true });

// ❌ JAMAIS createClient() pour le storage côté serveur → erreur RLS
// Row Level Security bloque les uploads sans service role key
```

---

## 🎨 CONVENTIONS UI/COMPOSANTS

### Loading skeletons
```tsx
// ✅ TOUJOURS ce pattern
<div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md" />
<SkeletonKPI />  // import depuis @/components/ui/skeleton-card

// ❌ JAMAIS Shadcn <Skeleton> dans ce projet
```

### Déclaration composants
```tsx
// ✅ TOUJOURS — déclarer en dehors du composant parent
// et passer les données en props
interface TableauPermissionsProps {
  permsForm: PermissionRole[];
  onToggle:  (module: string, action: ActionKey) => void;
}
function TableauPermissions({ permsForm, onToggle }: TableauPermissionsProps) {
  return ( ... );
}

export function MonComposant() {
  return <TableauPermissions permsForm={...} onToggle={...} />
}

// ❌ JAMAIS — déclarer à l'intérieur d'un composant
// → React recrée le composant à chaque render → perte du state → bugs
export function MonComposant() {
  function SousComposant() { ... }  // ← BUG CRITIQUE
}
```

### Layout dashboard
```tsx
// ✅ TOUJOURS
<SidebarProvider>
  <AppSidebar role={...} hospitalNom={...} permissions={...} />
  <div className="relative flex flex-col flex-1 min-h-svh bg-gray-50 ...">
    <Header utilisateur={...} hospitalNom={...} />
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      {children}
    </main>
  </div>
</SidebarProvider>

// ❌ JAMAIS SidebarInset → bug z-index bloque les dropdowns
```

---

## 🐛 BUGS CONNUS — NE PAS REPRODUIRE

| Bug | Cause | Solution |
|-----|-------|----------|
| `Module not found: Can't resolve 'dns'` | Import permissions.server.ts dans "use client" | N'importer que permissions.ts côté client |
| `Cannot create components during render` | Composant déclaré à l'intérieur d'un render | Déclarer en dehors + passer en props |
| `Upload RLS violation` | createClient() pour storage serveur | createAdminClient() obligatoire |
| Sidebar bloque dropdowns | SidebarInset crée overflow:hidden | Utiliser div à la place |
| `next/font/google` erreur Turbopack | Incompatible avec Turbopack | Utiliser `<link>` HTML dans le layout |
| Comptabilité affiche 0 partout | Filtre mois courant, données seed en 2025 | Utiliser derniereEcriture.date_ecriture comme référence |
| `Null constraint violation` permissions | Création permission imbriquée avec role = null | Créer permissions séparément avec role: null explicite |
| `Unexpected any` TypeScript | Cast as any sur Role | Importer Role depuis Prisma, typer explicitement |
| `Export X doesn't exist in target module` | Mauvais fichier d'import permissions | getPermissionsEffectives dans permissions.server.ts |

---

## 📊 MODULES IMPLÉMENTÉS ✅

| Module | Statut | Notes importantes |
|--------|--------|-------------------|
| Auth + Middleware | ✅ | Vérification session Supabase |
| Layout + Sidebar | ✅ | Dynamique selon permissions, sans SidebarInset |
| Dashboard | ✅ | KPIs + Recharts (consultations, assurances) |
| Patients | ✅ | CRUD + QR Code JWT (jose) |
| Consultations | ✅ | Prescriptions + facture auto à la création |
| Facturation | ✅ | Paiement → écriture RECETTE auto |
| Laboratoire | ✅ | Upload PDF via createAdminClient |
| Imagerie | ✅ | Upload fichiers via createAdminClient |
| Pharmacie | ✅ | Stock + historique mouvements |
| Comptabilité | ✅ | Journal calé sur dernière écriture (pas new Date()) |
| Utilisateurs | ✅ | CRUD Supabase Auth Admin |
| Statistiques | ✅ | Recharts multi-graphiques |
| QR Code Carnet | ✅ | JWT temporaire, page publique /carnet/[token] |
| Audit Trail | ✅ | Journal complet avec filtres + export CSV |
| Hospitalisations | ✅ | Kanban 3 colonnes + fiche + stock intégré |
| Chambres | ✅ | CRUD + tarifs journaliers |
| Permissions | ✅ | Rôles système + rôles personnalisés + assignation |

---

## ⏳ EN ATTENTE

- [ ] Interface Super Admin (gestion multi-structures)
- [ ] Déploiement Vercel final (variables d'env à configurer)
- [ ] Connecter supabase_uid aux utilisateurs de démo (pour auth réelle)
- [ ] Intégration peutFaire() dans toutes les pages serveur restantes

---

## 🌱 SEED

```bash
# Lancer le seed complet
npx prisma db seed

# Vider BDD + reseed
npx prisma migrate reset --skip-seed && npx prisma db seed
```

**Données seed v3 :**
- 1 hôpital : Clinique El Rapha, Libreville
- 7 utilisateurs : admin, 2 médecins, infirmier, comptable, laborantin, pharmacien
- 10 patients gabonais avec assurances (CNAMGS, ASCOMA, AXA, OGAR, Sunu...)
- 8 consultations + prescriptions + factures
- 4 examens labo + 4 examens imagerie + factures
- 3 hospitalisations (1 payée, 1 sortie non payée, 1 en cours)
- 10 chambres (3 communes 8k, 3 privées 25k, 2 VIP 75k, 2 réa 120k XAF/jour)
- 10 articles stock + mouvements réalistes
- Écritures comptables cohérentes (recettes + dépenses)
- Permissions par défaut pour 7 rôles × 11 modules

**Scripts SQL complémentaires :**
```sql
-- Shift dates 2025 → 2026 (exécuter après seed)
UPDATE consultations
SET date_consultation = date_consultation + INTERVAL '1 year' ...

-- Peupler audit trail (simulation actions réelles)
DO $$ ... END $$;
```

**Comptes de démo :**
```
admin@elrapha.ga       → ADMIN
p.nguema@elrapha.ga    → MÉDECIN
s.mba@elrapha.ga       → MÉDECIN
jp.obame@elrapha.ga    → INFIRMIER
c.ella@elrapha.ga      → COMPTABLE
b.bourobou@elrapha.ga  → LABORANTIN
f.moussavou@elrapha.ga → PHARMACIEN
```

---

## 🚀 COMMANDES COURANTES

```bash
# Développement
npm run dev

# Générer client Prisma après modif schema
npx prisma generate

# Ouvrir Prisma Studio (visualiser BDD)
npx prisma studio

# Seed
npx prisma db seed

# Build production
npm run build

# Claude Code — lancer
claude

# Claude Code — commandes utiles
/compact    # compresser contexte (sessions longues)
/cost       # voir coût de la session
/clear      # réinitialiser le contexte
Escape      # interrompre une action en cours

# Git — toujours commiter avant session Claude Code
git add . && git commit -m "checkpoint avant session claude code"
```

---

## 📝 FORMAT RÉPONSE ATTENDU DE CLAUDE

Quand tu génères du code pour ce projet :
- Toujours fournir le fichier complet (jamais de diff partiel)
- Commentaires en français dans le code
- Vérifier hospital_id dans chaque action serveur
- Appeler enregistrerAudit() après chaque action
- Loading avec `bg-gray-200 animate-pulse rounded-md` (pas Shadcn Skeleton)
- Proposer les fichiers un par un dans l'ordre logique
- Signaler explicitement quand `npx prisma generate` est nécessaire
- Signaler les imports à ajouter dans la Sidebar si nouveau module
- Toujours typer explicitement (pas de `as any`)
