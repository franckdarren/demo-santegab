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
│   ├── rendez-vous/            ← Calendrier médical (CDC §5.7)
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
├── rendez-vous/                ← CalendrierMedical, NouveauRendezVousDialog,
│                                 RendezVousDuJour (encart dashboard)
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
| `Cannot read properties of undefined (reading 'findMany')` sur `prisma.monModele` | `npx prisma generate` lancé pendant que `npm run dev` tournait. Le singleton `globalForPrisma.prisma` (lib/prisma.ts) survit au hot-reload Turbopack : l'ancienne instance, sans le nouveau modèle, reste en mémoire | **Redémarrer le serveur de dev** (Ctrl+C + `npm run dev`). Un simple rafraîchissement de page ou une sauvegarde de fichier NE suffit PAS |
| `Property 'X' is missing in type ... Record<ModuleAction, ...>` | Nouvelle valeur ajoutée à l'enum `ModuleAction` | Ajouter l'entrée dans `MODULE_CONFIG` de `components/audit/AuditList.tsx` (+ son icône lucide) |
| Nouveau module invisible pour tous sauf admin | Lignes `permissions` absentes en BDD | Lancer le script SQL d'INSERT des permissions du module |

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
| Rendez-vous | ✅ | Calendrier semaine + contrôle de conflit d'agenda (CDC §5.7) |
| Hospitalisations | ✅ | Kanban 3 colonnes + fiche + stock intégré |
| Chambres | ✅ | CRUD + tarifs journaliers |
| Permissions | ✅ | Rôles système + rôles personnalisés + assignation |

---

## 🎯 PÉRIMÈTRE KIMBA CONNECT — CAHIER DES CHARGES

Le projet répond à l'appel à candidatures **KIMBA CONNECT** (`kimba.pdf`) :
« Logiciel de gestion du parcours médical des patients ».

SANTÉGAB couvre déjà la majorité du CDC et va **au-delà** sur plusieurs modules
(facturation, comptabilité, pharmacie, hospitalisations) qui ne sont **pas demandés**.

### Décision produit

> **Les modules hors périmètre CDC sont MASQUÉS, jamais supprimés.**
> Le code et les données restent intacts — le masquage doit être réversible
> en supprimant une seule constante.

**Pas de routes API REST** — on reste en Server Actions internes.
Les exigences CDC §7 « API ouverte » et §9 « Interopérabilité » sont assumées
comme non couvertes techniquement, à présenter comme
« architecture modulaire prête pour une API future ».

### Couverture du CDC

| Exigence CDC | Statut | Note |
|--------------|--------|------|
| 5.1 Dossier patient (identité, contact, groupe sanguin, allergies) | ✅ | Modèle `Patient` complet |
| 5.1 Traitements en cours | ⚠️ | Pas de champ dédié → Phase 2 |
| 5.2 Consultations + prescriptions | ✅ | |
| 5.3 Examens (bio, radio, spécialisés) | ✅ | `laboratory/` + `imaging/` |
| 5.4 Résultats (upload, archivage) | ✅ | Supabase Storage |
| 5.5 Actes médicaux (pro + date + service) | ⚠️ | `Consultation` a déjà medecin_id + date + service_id → Phase 2 |
| 5.6 Antécédents structurés | ⚠️ | Champ texte libre uniquement → Phase 2 |
| 5.7 Rendez-vous / calendrier | ✅ | Module livré en Phase 1 (calendrier + contrôle de conflit) |
| 5.8 Gestion documentaire | ✅ | |
| 5.9 Tableaux de bord et statistiques | ✅ | |
| 6. Profils utilisateurs | ✅ | 9 rôles — dépasse les 5 demandés |
| 7. Architecture modulaire | ✅ | |
| 7. API ouverte | ❌ | **Hors scope assumé** (Server Actions) |
| 7. Authentification / gestion accès | ✅ | Supabase Auth + permissions |
| 7. Chiffrement | ⚠️ | Infra Supabase (TLS + at-rest) → à documenter Phase 4 |
| 8. Traçabilité des consultations de dossier | ❌ | Audit sur écritures seulement → Phase 3 |
| 9. Interopérabilité | ❌ | **Hors scope assumé** |
| 10. Livrables documentaires | ✅ | `docs/` : architecture, guide utilisateur, exploitation, sécurité, candidature |

### ⚠️ Points techniques VÉRIFIÉS dans le code

```
1. Le masquage NE PEUT PAS passer par les permissions.
   withPermission() (lib/withPermission.ts:20-25) et Sidebar estVisible()
   (Sidebar.tsx:201) font un BYPASS TOTAL pour ADMIN/SUPER_ADMIN.
   → Désactiver peut_voir n'aurait AUCUN effet sur admin@elrapha.ga.
   → Masquage au niveau CODE, indépendant des permissions.

2. TypeAction.CONSULTATION EXISTE DÉJÀ dans schema.prisma:115-125.
   → Phase 3 (audit des lectures) ne nécessite AUCUNE migration d'enum.

3. ModuleAction (schema.prisma:127-140) n'a PAS de valeur RENDEZ_VOUS.
   → Phase 1 nécessite une migration d'enum pour l'audit.

4. SERVICES est CONSERVÉ (pas masqué) : Consultation.service_id l'utilise
   et le CDC §5.5 exige « un acte associé à un service médical ».
   Seul CHAMBRES est masqué (lié à Hospitalisations/facturation).

5. La facturation auto des consultations (consultations/actions.ts:171)
   CONTINUE de tourner en silence. On ne la retire PAS :
   données créées mais invisibles = masquage réversible et non destructif.
```

### Modules masqués (hors CDC)

```
FACTURATION · COMPTABILITE · PHARMACIE · HOSPITALISATION · CHAMBRES
```

**Éléments financiers/stock imbriqués à masquer aussi — vérifiés un par un :**

| Fichier | Élément à masquer |
|---------|-------------------|
| `components/layout/Sidebar.tsx` | 5 entrées de nav (filtrer AVANT le bypass admin) |
| `components/dashboard/StatsCards.tsx:65` | KPI « Revenus du mois » |
| `app/dashboard/page.tsx:12,42,95` | `getRevenusParAssurance` + `<AssuranceChart>` |
| `app/dashboard/stats/page.tsx:15,16` | `<StatsFinancieres>` + `<StatsStock>` |
| `components/patients/PatientTabs.tsx:90-93` | Onglet « Factures » |
| Pages `billing/ accounting/ pharmacy/ hospitalisations/ chambres/` | Garde `redirect("/dashboard")` en tête de page (bloque l'accès URL direct) |

---

## 🗺 PLAN D'IMPLÉMENTATION KIMBA

### Phase 0 — Masquage du périmètre hors-CDC ✅ FAIT

- [x] `lib/kimba-scope.ts` → `MASQUAGE_KIMBA_ACTIF` + `MODULES_HORS_PERIMETRE`
      + `ROUTES_HORS_PERIMETRE` + helpers `estHorsPerimetre()` / `routeHorsPerimetre()`
- [x] `Sidebar.tsx` → filtre `routeHorsPerimetre()` en **tout premier test** de `estVisible()`
- [x] Garde `redirect("/dashboard")` dans les **6** pages concernées
      (les 5 prévues + `hospitalisations/[id]` oubliée au plan initial)
- [x] Masquer les 4 éléments financiers/stock imbriqués (tableau ci-dessus)
- [x] ❌ Aucune modif de `schema.prisma` ni des Server Actions existantes
- [x] Vérifié : `npx tsc --noEmit` = 0 erreur, `npx next build` = OK (22 routes)

**🔄 Pour tout réafficher : `MASQUAGE_KIMBA_ACTIF = false` dans `lib/kimba-scope.ts`.**
Aucune autre modification nécessaire.

> ⚠️ `MASQUAGE_KIMBA_ACTIF` est typé `: boolean` explicitement.
> Sans cette annotation, TypeScript déduit le type littéral `true` et
> considère tout le code de réaffichage comme du code mort (warnings lint).

### Phase 1 — Module Rendez-vous (CDC 5.7) ✅ FAIT

- [x] `schema.prisma` → modèle `RendezVous` + enum `StatutRendezVous`
      (`PLANIFIE | CONFIRME | HONORE | ANNULE | ABSENT`)
- [x] `schema.prisma` → `RENDEZ_VOUS` ajouté à l'enum `ModuleAction` (audit)
- [x] `npx prisma generate` exécuté
- [x] `lib/permissions.ts` → `"RENDEZ_VOUS"` dans `MODULES` + `MODULE_LABELS`
      (**11 → 12 modules**)
- [x] `prisma/seed.ts` → permissions RENDEZ_VOUS pour les 7 rôles
- [x] `app/dashboard/rendez-vous/actions.ts`
- [x] `app/dashboard/rendez-vous/page.tsx` + `components/rendez-vous/CalendrierMedical.tsx`
      + `NouveauRendezVousDialog.tsx`
- [x] Entrée Sidebar (module `RENDEZ_VOUS`, icône `CalendarDays`)
- [x] Badge « RDV du jour » sur le dashboard (`RendezVousDuJour.tsx`) — pas d'email/SMS
- [x] **Script SQL** : `scripts/phase1_rendez_vous.sql`
- [x] Vérifié : `tsc --noEmit` = 0 erreur, `next build` = OK (23 routes)

**⚠️ Écart assumé par rapport au plan initial**

Le plan prévoyait 4 actions (`creerRendezVous`, `modifierRendezVous`,
`annulerRendezVous`, `confirmerRendezVous`). Les trois dernières auraient été
quasi identiques. Implémenté à la place :

```
creerRendezVous          → création + contrôle de conflit d'agenda
modifierRendezVous       → report / changement de médecin + contrôle de conflit
changerStatutRendezVous  → CONFIRME | HONORE | ANNULE | ABSENT (une seule action)
supprimerRendezVous      → erreur de saisie uniquement
```

`changerStatutRendezVous` suit le même pattern que `updateStatutConsultation`
du module Consultations — cohérence avec l'existant plutôt que 4 copies.

**Contrôle de conflit d'agenda** : un médecin ne peut pas avoir deux rendez-vous
qui se chevauchent. Le calcul se fait en JavaScript (`trouverConflit`) car
PostgreSQL ne compare pas facilement `date_heure + duree_min` dans un WHERE ;
seuls les rendez-vous du médecin sur la journée sont chargés.

**Point d'intégration découvert au typecheck** : `components/audit/AuditList.tsx`
définit un `Record<ModuleAction, ...>` — toute nouvelle valeur de l'enum
`ModuleAction` DOIT y être ajoutée, sinon le build casse.

### Phase 2 — Actes & antécédents (CDC 5.5 / 5.6 / 5.1) ✅ CODE FAIT

- [x] `schema.prisma` → modèle `AntecedentMedical` + enum `TypeAntecedent`
      (`PATHOLOGIE | HOSPITALISATION | CHIRURGIE | ALLERGIE | TRAITEMENT_CHRONIQUE`)
- [x] `TRAITEMENT_CHRONIQUE` + `est_actif` = « traitements en cours » (CDC 5.1),
      mis en avant dans un encart dédié de l'onglet Antécédents
- [x] Champ texte libre `Patient.antecedents` CONSERVÉ en repli,
      affiché dans un bloc « Saisie libre (à reprendre) »
- [x] Onglet « Antécédents » de `PatientTabs.tsx` branché sur la nouvelle table
      (ajout / modification / suppression via `AntecedentDialog.tsx`)
- [x] `type_acte` (`CONSULTATION | SOIN`) sur `Consultation` + enum `TypeActe`
      — **pas de nouvelle table** (Consultation a déjà medecin_id + date + service_id)
- [x] Sélecteur « Nature de l'acte » dans les **deux** dialogs de création
      (`NouvelleConsultationDialog` ET `NouvelleConsultationDepuisPatient`)
- [x] `npx prisma generate` exécuté
- [x] **Script SQL** : `scripts/phase2_antecedents_actes.sql`
- [x] Vérifié : `tsc --noEmit` = 0 erreur, `next build` = OK
- [ ] ⚠️ **SQL PAS ENCORE EXÉCUTÉ EN BASE** — voir avertissement ci-dessous

> ⚠️ **Tant que `scripts/phase2_antecedents_actes.sql` n'est pas passé,
> la fiche patient plante** : `getPatientById` interroge `antecedents_medicaux`
> et la liste des consultations lit `type_acte`. Ces deux objets n'existent pas
> encore en base. Le script est exécutable d'un seul bloc (aucun `ALTER TYPE`).

### ⚠️ EXCEPTION À LA RÈGLE MULTI-TENANT — Antécédents médicaux

`AntecedentMedical` est la **seule table métier dont la LECTURE n'est pas
filtrée par `hospital_id`**. C'est délibéré, ne pas « corriger ».

```typescript
// ✅ Lecture — filtre patient_id SEUL (patients/actions.ts)
await prisma.antecedentMedical.findMany({
  where: { patient_id: patientId },        // ← PAS de hospital_id
});

// ✅ Écriture / modification / suppression — hospital_id EXIGÉ
await prisma.antecedentMedical.findFirst({
  where: { id, hospital_id: hospitalId },  // ← garde le double filtre
});
```

**Pourquoi :** une allergie ou un traitement chronique est une caractéristique
du PATIENT, pas un événement appartenant à l'établissement. Une consultation
se rattache à qui l'a réalisée ; une allergie doit suivre le patient partout,
sinon le carnet de santé (`/carnet/[token]`) perd tout intérêt en urgence.
Le champ texte libre `Patient.antecedents` qu'elle remplace était déjà porté
par le patient : filtrer par hôpital aurait été une régression.

**Conséquences dans l'UI :**
- Tous les antécédents du patient sont visibles, quel que soit l'établissement
- Seul l'établissement qui a saisi un antécédent peut le modifier/supprimer
  (`estProprietaire` dans `PatientTabs.tsx`) — les autres voient
  « Saisi par un autre établissement »
- Le carnet QR affiche les antécédents structurés **sans filtre hôpital**,
  contrairement aux consultations/examens qui y restent filtrés

### Phase 3 — Traçabilité des lectures de dossier (CDC 8) ✅ FAIT

- [x] `lib/audit.ts` → `enregistrerConsultationDossier()` avec fenêtre anti-doublon
- [x] `app/dashboard/patients/[id]/page.tsx` → appel après le `notFound()`
      (`typeAction: "CONSULTATION"` + `module: "PATIENT"` — enums existants)
- [x] Filtre déjà fonctionnel dans `app/dashboard/audit/` : la liste déroulante est
      générée depuis `TYPE_ACTION_CONFIG`, qui contient déjà `CONSULTATION`
      (label « Consultation », icône œil) → **aucune modification nécessaire**
- [x] **Aucun script SQL** — aucun changement de schéma, aucun `prisma generate`
- [x] Vérifié : `tsc --noEmit` = 0 erreur, lint propre, `next build` = OK

**⚠️ Fenêtre anti-doublon — ne pas supprimer**

```typescript
// lib/audit.ts
const FENETRE_ANTI_DOUBLON_MINUTES = 30;
```

La fiche patient est un Server Component **ré-exécuté à chaque
`router.refresh()`** — donc après chaque ajout d'antécédent, de consultation,
de rendez-vous... Sans ce garde-fou, une seule séance de travail sur un dossier
produirait dix lignes d'audit identiques et rendrait le journal inexploitable.

Une même personne rouvrant le même dossier dans les 30 minutes ne génère
donc qu'une seule trace. Les accès de deux utilisateurs différents, ou à deux
dossiers différents, restent bien distingués.

**Ce qui n'est PAS tracé** (à assumer devant le jury) : l'ouverture de la liste
des patients, des listes de consultations/examens, et l'affichage d'un dossier
via le carnet QR — ce dernier ayant déjà sa propre traçabilité dédiée
(`AuditLogCarnet` + `TypeAction.QR_CODE_ACCES`).

### Phase 4 — Sécurité & conformité (CDC 7-8) ✅ FAIT

- [x] **Livrable** : `docs/SECURITE.md` — chiffrement, contrôle d'accès,
      cloisonnement, traçabilité, rétention, points à traiter avant production
- [x] Responsive corrigé sur le périmètre CDC (dialogs + grilles de formulaire)
- [x] Politique de rétention proposée (§6.3 du livrable) — **non automatisée**
- [x] **Aucun script SQL** — aucun changement de schéma
- [x] Vérifié : `tsc --noEmit` = 0 erreur, lint propre, `next build` = OK

**Correctifs responsive appliqués**

```
DialogContent  max-w-Xl!        → sm:max-w-Xl!        (débordement mobile)
zone scrollable p-6 / 70vh      → p-4 sm:p-6 / 60vh sm:70vh
en-tête + pied px-6             → px-4 sm:px-6
grilles de formulaire grid-cols-2 → grid-cols-1 sm:grid-cols-2
ligne 3 inputs prescription     → grid-cols-2 sm:grid-cols-3
bandeau semaine calendrier      → gap-1 sm:gap-2
```

Fichiers : `NouveauPatientDialog`, `NouvelleConsultationDialog`,
`ConsultationDetailDialog`, `NouveauRendezVousDialog`,
`ModifierRendezVousDialog`, `CalendrierMedical`.

> ⚠️ Vérification faite **par lecture du code**, pas sur appareil réel.
> Un passage sur téléphone reste nécessaire avant la démonstration.

### 🔐 Constats de sécurité — À TRAITER AVANT PRODUCTION

**1. `QR_TOKEN_SECRET` absent de `.env`** (corrigé côté code)

Le secret de repli est écrit en dur dans `lib/qr-token.ts`, donc public.
`genererQrToken()` **lève désormais une erreur en production** si la variable
n'est pas définie (vérification à la génération, pas au chargement du module :
sinon `next build` échoue). En développement, repli toléré + avertissement.

➡️ **Définir `QR_TOKEN_SECRET` (32+ caractères aléatoires) avant tout déploiement.**

**2. RLS activée sur 6 tables sur 27** (constat, non corrigé)

```
Tables avec RLS : antecedents_medicaux, examen_labo_examens,
                  examens_catalogue, lits, rendez_vous, services
```

Le cloisonnement multi-établissements repose donc **uniquement sur le filtrage
applicatif** `hospital_id`. Une requête qui oublierait ce filtre exposerait les
données d'un autre établissement, sans second rempart en base.

➡️ Activer la RLS sur les tables métier restantes avant tout déploiement
   accueillant plusieurs établissements réels.

**3. `verifierQrToken()` n'est appelé nulle part** (code mort)

La signature JWT du carnet n'est jamais vérifiée : la sécurité repose sur la
présence du jeton en base (`qr_tokens` + `est_actif` + `expire_le`), ce qui est
valide. Mais la fonction inutilisée invite à un usage futur erroné — la
supprimer ou la brancher explicitement.

### Phase 5 — Livrables de l'appel à candidatures (CDC 10-13) ✅ FAIT

- [x] `docs/ARCHITECTURE.md` — choix techniques, 27 tables par domaine,
      Server Actions, modularité KIMBA
- [x] `docs/GUIDE-UTILISATEUR.md` — mode d'emploi par profil
      (médecin, infirmier, laborantin, radiologue, administratif, admin)
- [x] `docs/EXPLOITATION.md` — déploiement, ordre des scripts SQL, maintenance,
      pièges connus, réversibilité
- [x] `docs/CANDIDATURE.md` — présentation, couverture CDC, déroulé de démo
      20 min, calendrier 14 semaines
- [x] `README.md` réécrit (4 lignes → point d'entrée vers toute la doc)
- [x] **Aucun script SQL**, aucune modification de code

**Ton adopté dans les livrables**

Les deux exigences non couvertes (API ouverte §7, interopérabilité §9) sont
**annoncées explicitement**, avec l'argument de l'architecture prête et une
estimation chiffrée (6-8 semaines). Les travaux préalables à la production
identifiés en Phase 4 sont listés dans le dossier de candidature plutôt que
tus — un jury repère un dossier qui promet trop.

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
- Permissions par défaut pour 7 rôles × 12 modules (RENDEZ_VOUS inclus depuis la Phase 1)

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
- **TOUJOURS fournir les scripts SQL à lancer manuellement** (voir ci-dessous)

---

## 🗄 SCRIPTS SQL — RÈGLE ABSOLUE

**Toute modification touchant la base de données DOIT s'accompagner du script SQL
correspondant, prêt à copier-coller dans l'éditeur SQL Supabase.**

Le développeur exécute les scripts **manuellement** — ne jamais supposer
qu'une commande Prisma a été lancée, ni lancer soi-même une migration.

### Ce qui déclenche un script SQL

| Changement | Script à fournir |
|------------|------------------|
| Nouveau modèle Prisma | `CREATE TABLE` + index + clés étrangères |
| Nouvelle valeur d'enum | `ALTER TYPE ... ADD VALUE` |
| Nouveau champ | `ALTER TABLE ... ADD COLUMN` |
| Nouveau module de permission | `INSERT` des permissions pour chaque rôle |
| Données de démo | `INSERT` cohérents avec le seed existant |

### Format imposé

```sql
-- ============================================================
-- OBJECTIF : ce que fait le script, en une phrase
-- À exécuter dans : Supabase → SQL Editor
-- ============================================================

-- Idempotent autant que possible
CREATE TABLE IF NOT EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
```

**Règles :**
- Script **complet**, jamais un fragment à compléter
- **Idempotent** quand c'est possible (`IF NOT EXISTS`) — le script peut être
  relancé sans casser la base
- Colonnes ID en `TEXT` (uuid) — cohérent avec le schéma existant
- Toujours inclure `hospital_id` sur les tables métier (multi-tenant)
- Fournir le **rollback** quand l'opération est risquée

### ⚠️ Cas particulier : ALTER TYPE ... ADD VALUE

```sql
-- PostgreSQL interdit ADD VALUE dans un bloc transactionnel.
-- À exécuter SEUL, jamais dans un DO $$ ... $$ ni un BEGIN/COMMIT.
ALTER TYPE "ModuleAction" ADD VALUE IF NOT EXISTS 'RENDEZ_VOUS';
```

### Quand il n'y a PAS de SQL

Le dire **explicitement** — « aucun script SQL nécessaire pour cette étape » —
plutôt que de laisser le doute.
Exemple : la Phase 0 (masquage KIMBA) ne touche ni au schéma ni aux données.
