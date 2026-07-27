# SANTÉGAB — Guide utilisateur par profil

**Destinataire :** dossier de candidature KIMBA CONNECT (CDC §10)
**Version :** juillet 2026

Ce guide décrit ce que chaque profil peut faire. Les écrans visibles varient
selon les droits : un utilisateur ne voit dans le menu que les modules qui le
concernent.

---

## Se connecter

1. Ouvrir l'adresse de l'application.
2. Saisir son adresse professionnelle et son mot de passe.
3. Le tableau de bord s'affiche, adapté au profil.

En cas d'oubli du mot de passe, l'administrateur de l'établissement le
réinitialise depuis le module Utilisateurs.

---

## Ce que voit tout le monde

**Le tableau de bord** affiche l'activité du jour : nombre de patients
enregistrés, consultations du jour et du mois, patients en salle d'attente, et
la liste des **rendez-vous de la journée**.

---

## 👨‍⚕️ Médecin

**Accès :** patients, consultations, rendez-vous, laboratoire, imagerie, statistiques.

### Consulter un dossier patient

Menu **Patients**, rechercher par nom, prénom ou numéro de dossier, puis cliquer
sur la ligne. Le dossier s'ouvre en quatre onglets : consultations, prescriptions,
antécédents, et (hors périmètre KIMBA) factures.

> Chaque ouverture de dossier est enregistrée dans le journal de traçabilité :
> nom du praticien, patient concerné, date et heure.

### Enregistrer une consultation

Depuis la fiche patient, bouton **Nouvelle consultation** — le patient est
alors déjà sélectionné. Ou depuis le menu **Consultations**, bouton
**Nouvelle consultation**.

Renseigner :
- la **nature de l'acte** : consultation médicale ou soin ;
- le motif (obligatoire), le service, le statut ;
- les constantes : tension, poids, taille, température ;
- le diagnostic et les observations ;
- les **prescriptions**, ajoutées une par une (médicament, dosage, fréquence, durée).

### Renseigner les antécédents

Onglet **Antécédents** du dossier, bouton **Ajouter**. Choisir le type :
pathologie, hospitalisation, chirurgie, allergie ou traitement chronique.

> **Les traitements chroniques marqués « actif » remontent automatiquement en
> tête du dossier**, dans un encart « Traitements en cours ». C'est l'information
> qu'un confrère doit voir en premier.

Les antécédents suivent le patient d'un établissement à l'autre. Ceux saisis
ailleurs sont visibles mais non modifiables — ils portent la mention
« Saisi par un autre établissement ».

### Planifier un rendez-vous

Menu **Rendez-vous**. Le calendrier affiche la semaine ; le nombre de
rendez-vous figure sous chaque jour. Cliquer sur un jour pour voir le détail.

Bouton **Nouveau** : patient, médecin, service, date, heure, durée, motif.

> **Le logiciel refuse un créneau déjà occupé** par le même médecin et indique
> le patient concerné. Les doubles réservations sont impossibles.

Sur chaque rendez-vous : **Modifier** (report, changement de praticien) et les
statuts **Confirmer**, **Honoré**, **Absent**, **Annuler**.

### Prescrire un examen

Menus **Laboratoire** et **Imagerie**, bouton de création. Le résultat est
rattaché au dossier du patient dès sa validation par le service concerné.

---

## 👩‍⚕️ Infirmier

**Accès :** patients (lecture), consultations (lecture), rendez-vous (création et
modification), laboratoire et imagerie (lecture).

L'infirmier consulte les dossiers et les prescriptions, mais ne crée pas de
consultation médicale. Il **gère les rendez-vous** : planification, confirmation,
enregistrement des présences et des absences.

Les soins réalisés sont enregistrés par le médecin ou l'administratif avec la
nature d'acte « Soin ».

---

## 🔬 Laborantin

**Accès :** laboratoire (création, modification), patients et consultations (lecture).

1. Menu **Laboratoire** : la liste des examens prescrits s'affiche.
2. Ouvrir l'examen à traiter.
3. Saisir les résultats, ou **joindre le compte rendu** en PDF.
4. Valider : le résultat devient visible dans le dossier du patient.

Le **catalogue des examens** (familles, libellés, tarifs) est administré depuis
le sous-menu dédié, réservé aux administrateurs.

---

## 🩻 Radiologue

**Accès :** imagerie (création, modification), patients et consultations (lecture).

Fonctionnement identique au laborantin, sur le module **Imagerie** :
enregistrement du compte rendu et dépôt des fichiers d'images.

---

## 🗂 Personnel administratif / accueil

**Accès :** patients (création, modification), rendez-vous (tous droits),
consultations (lecture).

C'est le profil **gestionnaire des rendez-vous** : il dispose seul du droit de
suppression sur ce module.

### Enregistrer un nouveau patient

Menu **Patients**, bouton **Nouveau patient**. Renseigner l'identité, les
coordonnées, le groupe sanguin, les allergies connues et, le cas échéant,
l'organisme d'assurance et le taux de couverture.

Un **numéro de dossier** est attribué automatiquement.

### Générer le carnet de santé QR Code

Depuis la fiche patient, bouton **QR Code**. Un code est produit, **valable
24 heures**. Le patient le présente depuis son téléphone : la page s'ouvre sans
compte et affiche son groupe sanguin, ses allergies, ses antécédents, ses
dernières consultations et ses résultats d'examens.

> Chaque accès au carnet est journalisé. Le code peut être désactivé à tout
> moment, et expire seul au bout de 24 heures.

---

## 🛡 Administrateur

**Accès :** tout, sans restriction.

### Gérer les comptes

Menu **Utilisateurs** : création, modification, désactivation. Chaque compte
reçoit un rôle qui détermine ses accès.

### Ajuster les droits

Menu **Permissions**. Un tableau croise les modules et les quatre droits
(voir, créer, modifier, supprimer). Les modifications sont enregistrées
immédiatement.

Des **rôles personnalisés** peuvent être créés pour les métiers qui ne
correspondent à aucun profil standard — sage-femme, aide-soignant, directeur
médical — puis assignés aux utilisateurs.

### Consulter le journal de traçabilité

Menu **Journal d'audit**. Chaque ligne indique l'auteur, la date et l'heure,
l'action, le module et l'élément concerné.

Filtres disponibles : utilisateur, type d'action, module, période.
**Export CSV** pour archivage ou transmission lors d'un contrôle.

> Le filtre **« Consultation »** isole les lectures de dossier : qui a ouvert
> quel dossier patient, et quand.

### Administrer les services

Menu **Services** : création des services médicaux (cardiologie, pédiatrie…)
avec un code couleur repris dans les plannings et les consultations.

---

## Questions fréquentes

**Un module a disparu de mon menu.**
Les modules s'affichent selon les droits. Contacter l'administrateur.

**Le calendrier refuse mon rendez-vous.**
Le médecin a déjà un rendez-vous qui chevauche ce créneau. Le message indique
le patient concerné : choisir un autre horaire ou un autre praticien.

**Je ne peux pas modifier un antécédent.**
Il a été saisi par un autre établissement. Il reste consultable, mais seule la
structure qui l'a enregistré peut le corriger.

**Le QR Code du patient ne fonctionne plus.**
Sa validité est de 24 heures. En générer un nouveau depuis la fiche patient.
