// ============================================================
// ACTIONS GESTION UTILISATEURS
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Role } from "@/app/generated/prisma/client";
import { enregistrerAudit } from "@/lib/audit";

// ============================================================
// Créer un utilisateur + compte Supabase Auth
//
// On utilise le client ADMIN (service role key) car
// la création d'utilisateurs Auth nécessite des droits élevés.
// Le client anon standard ne peut pas créer de comptes.
// ============================================================
export async function creerUtilisateur(
  hospitalId: string,
  adminId: string,
  adminNom: string,
  data: {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    role: Role;
    mot_de_passe: string;
  }
) {
  const supabaseAdmin = createAdminClient();

  // 1. Crée le compte dans Supabase Auth
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email:         data.email,
      password:      data.mot_de_passe,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Erreur Auth : ${authError.message}`);
  }

  // 2. Crée le profil en base de données
  const utilisateur = await prisma.utilisateur.create({
    data: {
      hospital_id:  hospitalId,
      supabase_uid: authData.user?.id ?? null,
      nom:          data.nom.trim().toUpperCase(),
      prenom:       data.prenom.trim(),
      email:        data.email.toLowerCase(),
      telephone:    data.telephone ?? null,
      role:         data.role,
      est_actif:    true,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "CREATION",
    module:         "UTILISATEUR",
    description:    `Création compte utilisateur — ${data.prenom} ${data.nom} (${data.role})`,
    entiteId:       utilisateur.id,
    entiteNom:      `${data.prenom} ${data.nom}`,
    metadonnees: {
      role:  data.role,
      email: data.email,
    },
  });

  return utilisateur;
}

// ============================================================
// Modifier un utilisateur (infos + rôle)
// ============================================================
export async function modifierUtilisateur(
  utilisateurId: string,
  hospitalId: string,
  adminId: string,
  adminNom: string,
  data: {
    nom: string;
    prenom: string;
    telephone?: string;
    role: Role;
  }
) {
  const utilisateur = await prisma.utilisateur.update({
    where: { id: utilisateurId, hospital_id: hospitalId },
    data: {
      nom:       data.nom.trim().toUpperCase(),
      prenom:    data.prenom.trim(),
      telephone: data.telephone ?? null,
      role:      data.role,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    `Modification utilisateur — ${data.prenom} ${data.nom} (rôle : ${data.role})`,
    entiteId:       utilisateurId,
    entiteNom:      `${data.prenom} ${data.nom}`,
    metadonnees: {
      role:      data.role,
      telephone: data.telephone ?? null,
    },
  });

  return utilisateur;
}

// ============================================================
// Activer / désactiver un compte
//
// On désactive à la fois dans Supabase Auth (ban) et en base.
// Le ban Supabase empêche physiquement la connexion.
// La désactivation en base masque l'utilisateur dans l'UI.
// ============================================================
export async function toggleActivationUtilisateur(
  utilisateurId: string,
  hospitalId: string,
  estActif: boolean,
  adminId: string,
  adminNom: string
) {
  const supabaseAdmin = createAdminClient();

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
  });

  // Désactive ou réactive dans Supabase Auth si uid disponible
  if (utilisateur?.supabase_uid) {
    await supabaseAdmin.auth.admin.updateUserById(
      utilisateur.supabase_uid,
      {
        // "none" = actif, "876600h" ≈ 100 ans = désactivé définitivement
        ban_duration: estActif ? "none" : "876600h",
      }
    );
  }

  const utilisateurMaj = await prisma.utilisateur.update({
    where: { id: utilisateurId, hospital_id: hospitalId },
    data:  { est_actif: estActif },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    `Compte ${estActif ? "réactivé" : "désactivé"} — ${utilisateur?.prenom} ${utilisateur?.nom}`,
    entiteId:       utilisateurId,
    entiteNom:      `${utilisateur?.prenom} ${utilisateur?.nom}`,
    metadonnees:    { est_actif: estActif },
  });

  return utilisateurMaj;
}

// ============================================================
// Réinitialiser le mot de passe
//
// Envoie un email de réinitialisation via Supabase Auth.
// L'utilisateur clique sur le lien et choisit un nouveau mdp.
// ============================================================
export async function reinitialiserMotDePasse(
  email: string,
  adminId: string,
  adminNom: string,
  hospitalId: string
) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
  });

  if (error) throw new Error(error.message);

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    `Email de réinitialisation mot de passe envoyé — ${email}`,
    entiteNom:      email,
    metadonnees:    { email },
  });
}