# SANTÉGAB

**Logiciel de gestion du parcours médical des patients — Gabon**

Application web de dossier médical multi-établissements : dossier patient,
consultations, actes, prescriptions, rendez-vous, examens de laboratoire et
d'imagerie, carnet de santé par QR Code et traçabilité complète des accès.

Candidature à l'appel **KIMBA CONNECT**.

---

## Documentation

| Document | Pour qui |
|----------|----------|
| [Dossier de candidature](docs/CANDIDATURE.md) | Jury — présentation, couverture du CDC, démonstration |
| [Architecture technique](docs/ARCHITECTURE.md) | Développeurs — choix techniques, modèle de données |
| [Guide utilisateur](docs/GUIDE-UTILISATEUR.md) | Utilisateurs — mode d'emploi par profil |
| [Exploitation](docs/EXPLOITATION.md) | Exploitants — déploiement et maintenance |
| [Sécurité](docs/SECURITE.md) | Sécurité — chiffrement, accès, données personnelles |
| [CLAUDE.md](CLAUDE.md) | Conventions de développement du projet |

---

## Démarrage rapide

```bash
npm install
npx prisma generate
npm run dev               # http://localhost:3000
```

### Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                  # pooler port 6543, pgbouncer=true
MIGRATE_DATABASE_URL=          # pooler port 5432, mode session
QR_TOKEN_SECRET=               # 32+ caractères — obligatoire en production
```

> ⚠️ Sans `QR_TOKEN_SECRET`, la génération de QR Code échoue en production.
> Générer une valeur : `openssl rand -base64 32`

### Base de données

```bash
npx prisma db push        # schéma
npx prisma db seed        # données de démonstration
```

Puis, dans Supabase → SQL Editor, dans cet ordre :

1. `scripts/catalogue_labo.sql`
2. `scripts/phase1_rendez_vous.sql` — ⚠️ l'instruction `ALTER TYPE` en tête
   du fichier doit être exécutée **seule**
3. `scripts/phase2_antecedents_actes.sql`

Détails dans [EXPLOITATION.md](docs/EXPLOITATION.md).

---

## Comptes de démonstration

| Adresse | Profil |
|---------|--------|
| `admin@elrapha.ga` | Administrateur |
| `p.nguema@elrapha.ga` | Médecin |
| `s.mba@elrapha.ga` | Médecin |
| `jp.obame@elrapha.ga` | Infirmier |
| `b.bourobou@elrapha.ga` | Laborantin |
| `f.moussavou@elrapha.ga` | Pharmacien |
| `c.ella@elrapha.ga` | Comptable |

---

## Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Shadcn UI · Prisma 7 ·
PostgreSQL 17 (Supabase) · Vercel

---

## Périmètre KIMBA

Les modules hors cahier des charges (facturation, comptabilité, pharmacie,
hospitalisations, chambres) sont **masqués, non supprimés**.

Pour les réafficher, dans `lib/kimba-scope.ts` :

```typescript
export const MASQUAGE_KIMBA_ACTIF: boolean = false;
```

Aucune autre modification n'est nécessaire.

---

## Commandes

```bash
npm run dev          # développement
npm run build        # build de production
npx prisma studio    # explorer la base
npx prisma generate  # après modification du schéma — puis REDÉMARRER le serveur
```

> ⚠️ Après `npx prisma generate`, redémarrer le serveur de développement.
> Le client Prisma est mis en cache dans `globalThis` et survit au
> rechargement à chaud.
