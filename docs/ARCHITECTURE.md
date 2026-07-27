# SANTÉGAB — Documentation technique

**Destinataire :** dossier de candidature KIMBA CONNECT (CDC §10)
**Version :** juillet 2026

---

## 1. Vue d'ensemble

SANTÉGAB est une application web de gestion du parcours médical des patients,
conçue pour un usage multi-établissements. Une seule instance dessert plusieurs
structures de santé, chacune ne voyant que ses propres données.

L'application est **monolithique et modulaire** : un seul déploiement, mais des
domaines fonctionnels indépendants les uns des autres, activables ou masquables
sans toucher au reste du code.

---

## 2. Choix techniques

| Couche | Technologie | Raison du choix |
|--------|-------------|-----------------|
| Interface | Next.js 16 (App Router) | Rendu serveur : les données médicales ne transitent pas inutilement vers le navigateur |
| Composants | Shadcn UI + Tailwind CSS 4 | Composants accessibles, pas de dépendance à une bibliothèque propriétaire |
| Accès aux données | Prisma 7 | Schéma typé, requêtes vérifiées à la compilation |
| Base de données | PostgreSQL 17 (Supabase) | Base relationnelle éprouvée, adaptée aux données structurées de santé |
| Authentification | Supabase Auth | Gestion des mots de passe déléguée, jamais stockés par l'application |
| Fichiers | Supabase Storage | Résultats d'examens, comptes rendus |
| Hébergement | Vercel | Déploiement continu, HTTPS automatique |

**Langage unique** : TypeScript du navigateur jusqu'à la base. Un même modèle de
données est partagé entre l'interface et le serveur, ce qui supprime toute une
catégorie d'erreurs d'intégration.

---

## 3. Organisation du code

```
app/
├── (auth)/login/            Connexion
├── carnet/[token]/          Carnet de santé public (QR Code, sans compte)
└── dashboard/
    ├── patients/            Dossier patient, antécédents, QR Code
    ├── consultations/       Consultations, actes, prescriptions
    ├── rendez-vous/         Calendrier médical
    ├── laboratory/          Examens biologiques + catalogue
    ├── imaging/             Imagerie médicale
    ├── services/            Services médicaux
    ├── stats/               Tableaux de bord
    ├── audit/               Journal de traçabilité
    ├── users/               Comptes utilisateurs
    └── permissions/         Rôles et droits

components/                  Composants d'interface, groupés par domaine
lib/                         Règles transverses (voir §5)
prisma/schema.prisma         Modèle de données
scripts/                     Scripts SQL à exécuter manuellement
docs/                        Documentation
```

Chaque domaine suit la même structure : une page, un fichier d'actions serveur,
des composants dédiés. Un développeur qui connaît un module les connaît tous.

---

## 4. Modèle de données

**27 tables**, organisées en six domaines.

### Identité et structure
`Hospital` · `Utilisateur` · `Service` · `Permission` · `RolePersonnalise`

### Dossier patient
`Patient` · `PatientHospital` · `AntecedentMedical`

`PatientHospital` est la table pivot : **un patient peut être suivi par
plusieurs établissements**. Ses données d'identité sont uniques et partagées ;
son rattachement, son assurance et son médecin traitant sont propres à chaque
structure.

### Parcours de soins
`Consultation` · `Prescription` · `RendezVous`

### Examens
`ExamenLabo` · `ExamenCatalogue` · `ExamenLaboExamen` · `ExamenImagerie`

### Traçabilité
`AuditTrail` · `QrToken` · `AuditLogCarnet`

### Hors périmètre KIMBA (présents mais masqués — voir §7)
`Facture` · `LigneFacture` · `EcritureComptable` · `ArticleStock` ·
`MouvementStock` · `Chambre` · `Lit` · `Hospitalisation` · `LigneHospitalisation`

### Règle structurante

Toute table métier porte une colonne `hospital_id`. C'est le pivot du
cloisonnement entre établissements.

**Une exception documentée** : `AntecedentMedical` est lisible depuis tout
établissement. Une allergie ou un traitement chronique appartient au patient,
pas à la clinique qui l'a consigné — le masquer priverait le carnet de santé de
son utilité en urgence. L'établissement d'origine reste enregistré et demeure
seul habilité à modifier sa saisie.

---

## 5. Règles transverses

| Fichier | Rôle |
|---------|------|
| `lib/prisma.ts` | Connexion unique à la base (évite d'épuiser le pool) |
| `lib/audit.ts` | Journalisation — appelée après chaque action |
| `lib/permissions.ts` | Modules et libellés (utilisable côté navigateur) |
| `lib/permissions.server.ts` | Vérification des droits (serveur uniquement) |
| `lib/withPermission.ts` | Garde d'accès aux pages |
| `lib/kimba-scope.ts` | Périmètre fonctionnel activé (voir §7) |

La séparation entre `permissions.ts` et `permissions.server.ts` est
volontaire : elle empêche qu'un composant navigateur importe par erreur du code
d'accès à la base.

---

## 6. Communication client-serveur

L'application n'expose **aucune API REST publique**. Les échanges passent par
les *Server Actions* de Next.js : des fonctions serveur appelées directement
depuis l'interface, sans route HTTP exposée.

**Conséquence positive :** la surface d'attaque est réduite. Il n'existe aucun
point d'entrée interrogeable depuis l'extérieur, donc rien à protéger par clé
d'API ou limitation de débit.

**Limite assumée :** aucune interconnexion avec un système tiers n'est possible
en l'état (exigences CDC §7 « API ouverte » et §9 « Interopérabilité »).
L'architecture y est cependant préparée : chaque domaine métier est isolé dans
son propre fichier d'actions, avec des signatures explicites. Exposer ces
fonctions via des routes REST ou FHIR consisterait à ajouter une couche
d'exposition, sans réécrire la logique métier.

### Modèle imposé à chaque action serveur

```typescript
export async function monAction(hospitalId, utilisateurId, utilisateurNom, data) {
  await verifierPermissionAction(hospitalId, "MODULE", "peut_creer"); // 1. droits
  const resultat = await prisma.model.create({ ... });                // 2. métier
  await enregistrerAudit({ ... });                                    // 3. trace
  return resultat;
}
```

Les trois étapes sont systématiques. La vérification des droits a lieu côté
serveur : contourner l'interface ne donne aucun accès supplémentaire.

---

## 7. Modularité et périmètre

SANTÉGAB dépasse le cahier des charges KIMBA sur plusieurs domaines
(facturation, comptabilité, pharmacie, hospitalisations). Ces modules sont
**masqués, non supprimés**.

Le fichier `lib/kimba-scope.ts` contient une constante unique :

```typescript
export const MASQUAGE_KIMBA_ACTIF: boolean = true;
```

Elle pilote le masquage des entrées de menu, l'accès direct par URL et les
éléments financiers imbriqués dans les écrans conservés. La passer à `false`
réactive l'ensemble, sans autre modification.

C'est la démonstration concrète de la modularité exigée au CDC §7 : un domaine
fonctionnel s'active ou se retire par configuration.

---

## 8. Sécurité

Traitée en détail dans **[SECURITE.md](SECURITE.md)** : chiffrement,
authentification, contrôle d'accès à deux niveaux, cloisonnement, traçabilité,
conservation des données, et points à traiter avant mise en production.

---

## 9. Évolutions techniques identifiées

Par ordre de priorité :

1. Activer la sécurité au niveau des lignes (RLS) sur les tables métier
   restantes, pour doubler le cloisonnement applicatif d'une garantie en base.
2. Automatiser la politique de conservation des données.
3. Exposer une API REST ou FHIR si l'interopérabilité devient nécessaire.
4. Mettre en place des tests automatisés — l'application n'en comporte pas
   à ce jour, la vérification repose sur le contrôle de types et la compilation.
