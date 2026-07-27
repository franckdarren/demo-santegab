# SANTÉGAB — Note technique sécurité & protection des données

**Destinataire :** dossier de candidature KIMBA CONNECT (CDC §7 et §8)
**Version :** Phase 4 — juillet 2026
**Périmètre :** modules du cahier des charges KIMBA (dossier patient,
consultations, examens, rendez-vous, antécédents, statistiques, audit)

---

## 1. Résumé pour le jury

| Exigence CDC | État | Nature |
|--------------|------|--------|
| Chiffrement des flux (TLS) | ✅ | Infrastructure (Vercel + Supabase) |
| Chiffrement au repos | ✅ | Infrastructure (Supabase / AWS) |
| Authentification | ✅ | Implémenté (Supabase Auth) |
| Gestion des accès par profil | ✅ | Implémenté (9 rôles + permissions granulaires) |
| Cloisonnement multi-établissements | ⚠️ | Implémenté **au niveau applicatif** — voir §4 |
| Traçabilité des écritures | ✅ | Implémenté (audit trail complet) |
| Traçabilité des lectures de dossier | ✅ | Implémenté en Phase 3 |
| Politique de rétention | ⚠️ | Définie ci-dessous, **non automatisée** |

Les points marqués ⚠️ sont documentés sans détour : ils correspondent à des
choix d'architecture assumés, pas à des oublis.

---

## 2. Chiffrement des données

### 2.1 En transit

Toutes les communications sont chiffrées par TLS, sans exception :

- **Navigateur → application** : HTTPS imposé par Vercel, avec redirection
  automatique de HTTP vers HTTPS et en-tête HSTS.
- **Application → base de données** : connexion PostgreSQL en SSL.
  *Vérifié le 27/07/2026 : le serveur répond `ssl = on`.*
- **Application → stockage de fichiers** : API Supabase Storage en HTTPS.

### 2.2 Au repos

Le chiffrement au repos est assuré par l'infrastructure Supabase, hébergée sur
AWS : volumes de base de données et sauvegardes chiffrés en AES-256.

> **Précision honnête :** il s'agit d'une garantie contractuelle du prestataire
> d'hébergement, non d'un mécanisme développé dans SANTÉGAB. Elle doit être
> confirmée auprès de Supabase pour le plan souscrit au moment du déploiement.
> Aucun chiffrement applicatif supplémentaire (au niveau colonne) n'est mis en
> œuvre : les données médicales sont lisibles par quiconque dispose d'un accès
> administrateur légitime à la base.

### 2.3 Mots de passe

Les mots de passe ne transitent ni ne sont stockés par SANTÉGAB. L'authentification
est entièrement déléguée à Supabase Auth, qui applique un hachage bcrypt.
La base applicative ne contient aucun champ de mot de passe.

**Environnement technique vérifié :** PostgreSQL 17.6.

---

## 3. Authentification et contrôle d'accès

### 3.1 Sessions

Authentification par Supabase Auth, session portée par un cookie sécurisé.
Un middleware vérifie la session sur l'ensemble des routes `/dashboard`.
Toute requête sans session valide est redirigée vers la page de connexion.

### 3.2 Permissions

Le contrôle d'accès est appliqué à **deux niveaux**, ce qui évite qu'une faille
d'interface n'ouvre l'accès aux données :

1. **À l'affichage** — la page serveur appelle `withPermission(module, action)`,
   qui redirige si le droit est absent. La barre de navigation masque en outre
   les modules non autorisés.
2. **À l'écriture** — chaque Server Action appelle `verifierPermissionAction()`
   avant toute opération. Un appel forgé directement vers l'action est donc
   rejeté même si l'interface a été contournée.

Neuf profils sont disponibles (le CDC en demandait cinq), avec quatre droits
par module : voir, créer, modifier, supprimer. Des rôles personnalisés peuvent
être créés par établissement.

> **Limite assumée :** les rôles ADMIN et SUPER_ADMIN contournent
> intégralement le système de permissions. C'est un choix explicite, mais il
> implique que le compte administrateur d'un établissement accède à toutes
> les données de cet établissement, sans restriction possible.

### 3.3 Carnet de santé par QR Code

La page `/carnet/[token]` est **publique par conception** : elle doit rester
consultable en urgence, sans compte. Sa sécurité repose sur trois barrières :

1. Le jeton est une chaîne imprévisible, générée aléatoirement.
2. Il doit exister dans la table `qr_tokens` — un jeton fabriqué de toutes
   pièces est rejeté, la présence en base étant la véritable garantie.
3. Il expire automatiquement au bout de **24 heures**, et peut être désactivé
   manuellement à tout moment (`est_actif`).

Chaque accès au carnet est journalisé (identifiant du jeton, adresse IP,
navigateur, horodatage).

> **Correctif apporté en Phase 4 :** le secret de signature des jetons
> disposait d'une valeur de repli inscrite dans le code source, donc publique.
> Elle n'était pas exploitable — la signature n'est jamais vérifiée, seule la
> présence en base fait foi — mais constituait un piège pour l'avenir.
> L'application **refuse désormais de démarrer en production** si la variable
> `QR_TOKEN_SECRET` n'est pas définie.

**Action requise avant mise en production :** définir `QR_TOKEN_SECRET`
avec une valeur aléatoire d'au moins 32 caractères.

---

## 4. Cloisonnement entre établissements

SANTÉGAB est multi-établissements : chaque structure ne doit accéder qu'à ses
propres données. Ce cloisonnement s'appuie sur la colonne `hospital_id`,
présente sur toutes les tables métier.

**Le cloisonnement est appliqué au niveau applicatif.** Chaque requête filtre
sur l'identifiant de l'établissement de l'utilisateur connecté, lequel provient
toujours de la session authentifiée — jamais d'un paramètre d'URL, qui serait
manipulable.

> **Point de vigilance documenté :** au 27/07/2026, la sécurité au niveau des
> lignes (Row Level Security) de PostgreSQL n'est activée que sur **6 des 27
> tables** du schéma public. La base ne constitue donc pas un second rempart
> pour la majorité des tables : une requête applicative qui omettrait le filtre
> `hospital_id` exposerait les données d'autres établissements.
>
> Cette contrainte est compensée par une règle de développement stricte et
> documentée (fichier `CLAUDE.md`), appliquée systématiquement dans le code.
> **Recommandation :** activer la RLS sur l'ensemble des tables métier avant
> tout déploiement accueillant plusieurs établissements réels.

### Exception documentée : les antécédents médicaux

Les antécédents structurés (allergies, pathologies, traitements chroniques)
sont **volontairement lisibles depuis tout établissement**. Une allergie est
une caractéristique du patient, pas la propriété d'une clinique : la masquer
priverait le carnet de santé de son intérêt en situation d'urgence.

L'établissement d'origine reste enregistré, et **seul lui peut modifier ou
supprimer** l'antécédent qu'il a saisi.

---

## 5. Traçabilité

Le journal d'audit enregistre, pour chaque événement : l'auteur, la date et
l'heure, le type d'action, le module, l'entité concernée, l'adresse IP et le
navigateur.

**Sont tracées :** les créations, modifications et suppressions de toutes les
entités métier ; les connexions ; les générations et accès de QR Code ; les
exports ; et, depuis la Phase 3, **les consultations de dossier patient**.

**Ne sont pas tracées :** l'ouverture des listes (patients, consultations,
examens). Seul l'accès à un dossier nominatif est journalisé.

Une fenêtre de 30 minutes évite qu'une même personne consultant le même
dossier génère des dizaines de lignes identiques — la page étant rechargée à
chaque saisie. Le journal reste ainsi exploitable lors d'un contrôle.

Le journal est **consultable et exportable en CSV** par les administrateurs,
avec filtres par utilisateur, type d'action, module et période.

> **Limite assumée :** le journal est stocké dans la même base que les données
> métier. Un accès administrateur à la base permettrait d'en altérer le contenu.
> Une conservation sur un support distinct et en écriture seule serait
> nécessaire pour une valeur probante opposable.

---

## 6. Protection des données personnelles et rétention

### 6.1 Nature des données traitées

SANTÉGAB traite des **données de santé**, catégorie sensible par nature :
identité, coordonnées, groupe sanguin, allergies, antécédents, diagnostics,
prescriptions, résultats d'examens et documents médicaux.

### 6.2 Minimisation

Aucune donnée n'est collectée au-delà de ce qu'exige le suivi du parcours de
soins. Aucun traceur publicitaire, aucun outil de mesure d'audience tiers,
aucune transmission de données à un tiers ne sont mis en œuvre.

### 6.3 Durée de conservation proposée

| Donnée | Durée proposée | Justification |
|--------|----------------|---------------|
| Dossier patient et actes médicaux | 20 ans après le dernier contact | Pratique hospitalière courante |
| Documents d'examens (fichiers) | Identique au dossier | Indissociables du dossier |
| Journal d'audit | 3 ans | Besoin de contrôle et de preuve |
| Jetons QR Code | 24 heures | Expiration technique automatique |
| Comptes utilisateurs désactivés | 1 an après le départ | Traçabilité des actes passés |

> **À ce jour, ces durées ne sont pas appliquées automatiquement.** Aucune purge
> programmée n'existe : toutes les données sont conservées sans limite. La mise
> en œuvre suppose une tâche planifiée d'anonymisation ou de suppression, à
> développer, et une validation juridique des durées auprès de l'autorité
> gabonaise compétente.

### 6.4 Droits des personnes

La suppression d'un patient est possible depuis l'interface et retire en
cascade ses consultations, examens et documents associés. L'opération est
tracée dans le journal d'audit.

Le droit d'accès est matérialisé par le carnet de santé QR Code, que le patient
peut consulter sur son propre téléphone.

> **Non couvert à ce jour :** l'export des données d'un patient dans un format
> structuré réutilisable (droit à la portabilité), et le recueil formalisé du
> consentement.

### 6.5 Sauvegardes

Les sauvegardes sont assurées par Supabase (sauvegardes quotidiennes
automatiques, restauration à un instant donné selon le plan souscrit).
**Aucune procédure de restauration n'a été testée à ce jour** — un exercice de
restauration est recommandé avant toute mise en service réelle.

---

## 7. Points à traiter avant une mise en production réelle

Par ordre de priorité :

1. **Définir `QR_TOKEN_SECRET`** — sans quoi l'application refusera de démarrer.
2. **Activer la RLS** sur les 21 tables métier qui en sont dépourvues,
   afin de disposer d'un second rempart au cloisonnement.
3. **Tester une restauration** de sauvegarde de bout en bout.
4. **Automatiser la politique de rétention** décrite au §6.3.
5. **Externaliser le journal d'audit** vers un stockage en écriture seule.
6. **Faire valider les durées de conservation** par l'autorité compétente.

---

## 8. Ce que cette note ne couvre pas

Par souci d'exactitude, les éléments suivants n'ont **pas** été réalisés et ne
doivent pas être présentés comme acquis :

- Aucun test d'intrusion ni audit de sécurité externe.
- Aucune analyse d'impact relative à la protection des données (AIPD).
- Aucune certification d'hébergeur de données de santé.
- Aucun test de charge ni de continuité d'activité.
