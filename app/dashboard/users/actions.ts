// ============================================================
// ACTIONS GESTION UTILISATEURS
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Role } from "@/app/generated/prisma/client";

// ============================================================
// Créer un utilisateur + compte Supabase Auth
//
// On utilise le client ADMIN (service role key) car
// la création d'utilisateurs Auth nécessite des droits élevés.
// Le client anon standard ne peut pas créer de comptes.
// ============================================================
export async function creerUtilisateur(
  hospitalId: string,
  data: {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    role: Role;
    mot_de_passe: string;
  }
) {
  // Client admin — utilise SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = createAdminClient();

  // 1. Crée le compte dans Supabase Auth
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.mot_de_passe,
      // Confirme directement — pas d'email de vérification
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Erreur Auth : ${authError.message}`);
  }

  // 2. Crée le profil en base de données
  return prisma.utilisateur.create({
    data: {
      hospital_id: hospitalId,
      supabase_uid: authData.user?.id ?? null,
      nom: data.nom.trim().toUpperCase(),
      prenom: data.prenom.trim(),
      email: data.email.toLowerCase(),
      telephone: data.telephone ?? null,
      role: data.role,
      est_actif: true,
    },
  });
}

// ============================================================
// Modifier un utilisateur (infos + rôle)
// ============================================================
export async function modifierUtilisateur(
  utilisateurId: string,
  hospitalId: string,
  data: {
    nom: string;
    prenom: string;
    telephone?: string;
    role: Role;
  }
) {
  return prisma.utilisateur.update({
    where: { id: utilisateurId, hospital_id: hospitalId },
    data: {
      nom: data.nom.trim().toUpperCase(),
      prenom: data.prenom.trim(),
      telephone: data.telephone ?? null,
      role: data.role,
    },
  });
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
  estActif: boolean
) {
  const supabaseAdmin = createAdminClient();

  // Récupère le supabase_uid pour agir sur Auth
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

  // Met à jour le statut en base
  return prisma.utilisateur.update({
    where: { id: utilisateurId, hospital_id: hospitalId },
    data: { est_actif: estActif },
  });
}

// ============================================================
// Réinitialiser le mot de passe
//
// Envoie un email de réinitialisation via Supabase Auth.
// L'utilisateur clique sur le lien et choisit un nouveau mdp.
// ============================================================
export async function reinitialiserMotDePasse(email: string) {
  // Client standard (pas admin) — reset password ne nécessite
  // pas de droits élevés
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
  });

  if (error) throw new Error(error.message);
}