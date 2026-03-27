import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { peutFaire } from "@/lib/permissions.server";
import { type PermissionModule, type Module } from "@/lib/permissions";

export async function withPermission(
  module: Module,
  action: keyof PermissionModule
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  if (
    utilisateur.role === "ADMIN" ||
    utilisateur.role === "SUPER_ADMIN"
  ) {
    return utilisateur;
  }

  const autorise = await peutFaire(
    utilisateur.hospital_id,
    utilisateur.role,
    module,
    action,
    utilisateur.role_personnalise_id // ← rôle personnalisé pris en compte
  );

  if (!autorise) {
    redirect("/dashboard?erreur=acces_refuse");
  }

  return utilisateur;
}

export async function getUtilisateurConnecte() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  return utilisateur;
}