# SANTÉGAB — Dossier de candidature KIMBA CONNECT

**Objet :** logiciel de gestion du parcours médical des patients
**Version :** juillet 2026

---

## 1. Présentation

SANTÉGAB est une application web de gestion du parcours médical, développée
pour le contexte sanitaire gabonais. Elle couvre la prise en charge du patient
de son enregistrement à la restitution de ses résultats d'examens : dossier
médical, consultations, actes, prescriptions, rendez-vous, examens et
traçabilité des accès.

**L'application est fonctionnelle et démontrable en conditions réelles**, avec
un jeu de données représentatif : un établissement, neuf profils
d'utilisateurs, des patients gabonais, des consultations et des examens.

### Ce qui distingue la proposition

**Un carnet de santé accessible sans compte.** Un QR Code généré depuis le
dossier ouvre, sur le téléphone du patient, une page présentant son groupe
sanguin, ses allergies, ses antécédents et ses derniers résultats. Le code
expire au bout de 24 heures et chaque accès est journalisé. En situation
d'urgence, un soignant accède à l'essentiel sans identifiants.

**Des antécédents qui suivent le patient.** Allergies et traitements chroniques
sont rattachés à la personne, pas à l'établissement. Un patient pris en charge
dans une autre structure du réseau conserve ces informations. Les traitements
en cours apparaissent en tête du dossier.

**Une traçabilité qui couvre aussi les lectures.** Le journal enregistre les
créations et modifications, mais également **qui a ouvert quel dossier
patient**. C'est l'exigence la plus souvent négligée en matière de données de
santé.

**Un contrôle des accès à deux niveaux.** Les droits sont vérifiés à
l'affichage et de nouveau côté serveur à chaque écriture : contourner
l'interface ne donne accès à rien.

---

## 2. Couverture du cahier des charges

| § | Exigence | État |
|---|----------|------|
| 5.1 | Dossier patient : identité, contact, groupe sanguin, allergies | ✅ |
| 5.1 | Traitements en cours | ✅ |
| 5.2 | Consultations et prescriptions | ✅ |
| 5.3 | Examens biologiques, radiologiques et spécialisés | ✅ |
| 5.4 | Résultats : saisie, dépôt de fichiers, archivage | ✅ |
| 5.5 | Actes médicaux : professionnel, date, service | ✅ |
| 5.6 | Antécédents structurés | ✅ |
| 5.7 | Prise de rendez-vous et calendrier | ✅ |
| 5.8 | Gestion documentaire | ✅ |
| 5.9 | Tableaux de bord et statistiques | ✅ |
| 6 | Profils utilisateurs | ✅ 9 profils (5 demandés) |
| 7 | Architecture modulaire | ✅ |
| 7 | Authentification et gestion des accès | ✅ |
| 7 | Chiffrement | ✅ TLS + chiffrement au repos |
| 7 | API ouverte | ❌ **non couvert** |
| 8 | Traçabilité des consultations de dossier | ✅ |
| 9 | Interopérabilité | ❌ **non couvert** |
| 10 | Livrables documentaires | ✅ |

### Les deux exigences non couvertes

Nous les signalons plutôt que de les contourner.

SANTÉGAB n'expose **aucune API publique** : les échanges entre l'interface et
le serveur passent par des appels internes, sans route HTTP exposée. Ce choix
réduit la surface d'attaque, mais interdit en l'état toute interconnexion avec
un système tiers.

L'architecture y est préparée : chaque domaine métier est isolé dans son propre
fichier de fonctions serveur, avec des signatures explicites. **Ouvrir une API
REST ou FHIR consisterait à ajouter une couche d'exposition au-dessus de
l'existant, sans réécrire la logique métier.** Nous estimons cette évolution à
six à huit semaines, à engager dès qu'une norme d'échange nationale sera
arrêtée.

---

## 3. Périmètre de la démonstration

SANTÉGAB comporte des modules de gestion administrative et financière
(facturation, comptabilité, pharmacie, hospitalisations) **qui ne relèvent pas
du cahier des charges**. Ils sont masqués pour la candidature.

Ce masquage est piloté par une constante unique dans le code. Le rétablir est
une opération d'une ligne. Cette mécanique illustre concrètement la modularité
demandée au CDC §7 : **un domaine fonctionnel s'active ou se retire par
configuration**, sans intervention sur le reste de l'application.

Ces modules restent disponibles si un établissement souhaite en disposer
ultérieurement.

---

## 4. Déroulé de démonstration (20 minutes)

### 1 — Accueil : enregistrer un patient (3 min)
*Profil administratif.* Créer un patient : identité, groupe sanguin, allergies.
Le numéro de dossier est attribué automatiquement.

### 2 — Prendre un rendez-vous (3 min)
Menu Rendez-vous, calendrier de la semaine. Créer un rendez-vous, puis
**tenter d'en créer un second sur le même créneau avec le même médecin** :
le logiciel refuse et nomme le patient déjà positionné.

### 3 — La consultation (5 min)
*Profil médecin.* Ouvrir le dossier, enregistrer une consultation : nature de
l'acte, motif, constantes, diagnostic, prescriptions.

Onglet Antécédents : ajouter un traitement chronique actif. **Il remonte
immédiatement dans l'encart « Traitements en cours »** en tête du dossier.

### 4 — Les examens (3 min)
Prescrire un examen de laboratoire. *Profil laborantin :* saisir le résultat et
joindre le compte rendu. Le résultat apparaît dans le dossier du patient.

### 5 — Le carnet de santé (3 min)
Générer le QR Code depuis la fiche patient. **Le scanner avec un téléphone du
jury** : la page s'ouvre sans identifiants et présente groupe sanguin,
allergies, antécédents et derniers résultats. Rappeler l'expiration à 24 heures
et la journalisation de chaque accès.

### 6 — Traçabilité et droits (3 min)
*Profil administrateur.* Journal d'audit : filtrer sur « Consultation » pour
montrer **qui a ouvert quel dossier**. Exporter en CSV.

Puis le module Permissions : retirer un droit à un profil, se reconnecter avec
ce profil, constater que le module a disparu du menu.

---

## 5. Calendrier de mise en œuvre

| Phase | Durée | Contenu |
|-------|-------|---------|
| 1 — Installation | 2 semaines | Environnement, base, comptes, personnalisation |
| 2 — Reprise des données | 3 semaines | Import du fichier patients existant |
| 3 — Formation | 2 semaines | Une session par profil, supports remis |
| 4 — Pilote | 4 semaines | Un service, accompagnement rapproché |
| 5 — Généralisation | 3 semaines | Extension à l'établissement |
| **Total** | **14 semaines** | |

Les phases 1 et 2 peuvent être menées en parallèle.

### Points de vigilance annoncés

**La reprise des données existantes est le poste le plus incertain.** Sa durée
dépend entièrement de l'état des fichiers actuels : un tableur structuré se
reprend en quelques jours, des dossiers papier demandent une saisie que seul
l'établissement peut planifier.

**La formation conditionne l'adoption.** Un logiciel de dossier médical ne
produit ses effets que si les soignants le renseignent. Nous prévoyons une
session par profil et un accompagnement pendant la phase pilote.

---

## 6. Travaux préalables à une mise en production

Par honnêteté technique, ces points sont identifiés et documentés dans
[SECURITE.md](SECURITE.md) :

1. Définir le secret de signature des QR Codes (`QR_TOKEN_SECRET`)
2. Activer la sécurité au niveau des lignes sur les tables métier restantes
3. Réaliser un exercice de restauration de sauvegarde
4. Automatiser la politique de conservation des données
5. Faire valider les durées de conservation par l'autorité compétente

Aucun ne remet en cause l'architecture. Ils relèvent de la préparation à
l'exploitation réelle.

---

## 7. Documentation remise

| Document | Contenu |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Choix techniques, modèle de données, modularité |
| [GUIDE-UTILISATEUR.md](GUIDE-UTILISATEUR.md) | Mode d'emploi par profil |
| [EXPLOITATION.md](EXPLOITATION.md) | Déploiement, maintenance, réversibilité |
| [SECURITE.md](SECURITE.md) | Chiffrement, accès, traçabilité, données personnelles |

---

## 8. Réversibilité

Le socle technique est intégralement libre : PostgreSQL, Next.js, Prisma.
Les données s'exportent aux formats standard, le code source est remis.

**Aucun verrou technique ne s'oppose à une reprise par un autre prestataire**,
ni à une réinstallation sur une infrastructure nationale.
