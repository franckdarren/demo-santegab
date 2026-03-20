// ============================================================
// PAGE FICHE PATIENT — Carnet de santé numérique
//
// Récupère le patient depuis la base de données en vérifiant
// que l'utilisateur connecté appartient au même hôpital.
// L'isolation multi-tenant est garantie par hospital_id.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getPatientById } from "../actions";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { PatientTabs } from "@/components/patients/PatientTabs";

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
  // --------------------------------------------------------
  // Vérification de la session
  // --------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // --------------------------------------------------------
  // Récupère le profil complet de l'utilisateur connecté
  // pour obtenir son hospital_id (isolation multi-tenant)
  // --------------------------------------------------------
  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });

  if (!utilisateur) redirect("/login");

  // --------------------------------------------------------
  // Récupère le patient en vérifiant qu'il appartient
  // bien à l'hôpital de l'utilisateur connecté
  // --------------------------------------------------------
  const { id } = await params;
  const patient = await getPatientById(id, utilisateur.hospital_id);

  // Si patient introuvable ou n'appartient pas à cet hôpital
  if (!patient) notFound();

  return (
    <div className="space-y-6">

      {/* En-tête : identité + actions (modifier, supprimer) */}
      <PatientHeader
        patient={patient}
        hospitalId={utilisateur.hospital_id}
      />

      {/* Onglets : consultations, prescriptions, factures, antécédents */}
      <PatientTabs patient={patient} />

    </div>
  );
}