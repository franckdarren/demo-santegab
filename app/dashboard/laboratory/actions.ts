"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { TypeExamenLabo, StatutExamen } from "@/app/generated/prisma/client";
import { enregistrerAudit } from "@/lib/audit";
import { TARIFS_LABO } from "@/lib/tarifs";

export async function getExamensLabo(hospitalId: string, search?: string) {
  return prisma.examenLabo.findMany({
    where: {
      hospital_id: hospitalId,
      ...(search && {
        OR: [
          {
            patient: {
              OR: [
                { nom:    { contains: search, mode: "insensitive" } },
                { prenom: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          { notes: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { patient: true, medecin: true },
    orderBy: [{ urgence: "desc" }, { created_at: "desc" }],
  });
}

// ============================================================
// Créer une demande d'examen labo + facture immédiate
// ============================================================
export async function creerExamenLabo(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id:  string;
    medecin_id:  string;
    type_examen: TypeExamenLabo;
    notes?:      string;
    urgence?:    boolean;
  }
) {
  const patientHospital = await prisma.patientHospital.findFirst({
    where:   { hospital_id: hospitalId, patient_id: data.patient_id },
    include: { patient: true },
  });
  const nomPatient = patientHospital
    ? `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`
    : "Patient inconnu";

  const tarifParDefaut = TARIFS_LABO[data.type_examen] ?? null;

  const examen = await prisma.examenLabo.create({
    data: {
      hospital_id:   hospitalId,
      patient_id:    data.patient_id,
      medecin_id:    data.medecin_id,
      type_examen:   data.type_examen,
      notes:         data.notes ?? null,
      urgence:       data.urgence ?? false,
      statut:        "EN_ATTENTE",
      prix_unitaire: tarifParDefaut,
    },
    include: { patient: true, medecin: true },
  });

  if (tarifParDefaut && tarifParDefaut > 0) {
    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(tarifParDefaut * (tauxCouverture / 100));
    const montantPatient   = tarifParDefaut - montantAssurance;

    const count = await prisma.facture.count({ where: { hospital_id: hospitalId } });
    const numeroFacture = `FAC-LABO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospitalId,
        patient_id:        data.patient_id,
        numero_facture:    numeroFacture,
        statut:            "EN_ATTENTE",
        montant_total:     tarifParDefaut,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        notes:             `Examen laboratoire — ${data.type_examen}${data.urgence ? " 🔴 URGENT" : ""}`,
        lignes: {
          create: [{
            description:   `Examen labo — ${data.type_examen}`,
            quantite:      1,
            prix_unitaire: tarifParDefaut,
            montant_total: tarifParDefaut,
          }],
        },
      },
    });

    await prisma.examenLabo.update({
      where: { id: examen.id },
      data:  { facture_id: facture.id },
    });
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "LABORATOIRE",
    description: `Demande examen labo — ${data.type_examen} — ${nomPatient}${data.urgence ? " 🔴 URGENT" : ""}`,
    entiteId:    examen.id,
    entiteNom:   nomPatient,
    metadonnees: {
      type_examen:    data.type_examen,
      urgence:        data.urgence ?? false,
      tarif_applique: tarifParDefaut,
    },
  });

  return examen;
}

// ============================================================
// Saisir les résultats
// ============================================================
export async function saisirResultatsLabo(
  examenId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    resultats:      string;
    statut?:        StatutExamen;
    prix_unitaire?: number;
  }
) {
  const examen = await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      resultats:     data.resultats,
      statut:        data.statut ?? "RESULTAT_SAISI",
      prix_unitaire: data.prix_unitaire ?? undefined,
    },
    include: { patient: true },
  });

  if (data.prix_unitaire && data.prix_unitaire > 0 && !examen.facture_id) {
    const patientHospital = await prisma.patientHospital.findFirst({
      where: { patient_id: examen.patient_id, hospital_id: hospitalId },
    });
    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(data.prix_unitaire * (tauxCouverture / 100));
    const montantPatient   = data.prix_unitaire - montantAssurance;

    const count = await prisma.facture.count({ where: { hospital_id: hospitalId } });
    const numeroFacture = `FAC-LABO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospitalId,
        patient_id:        examen.patient_id,
        numero_facture:    numeroFacture,
        statut:            "EN_ATTENTE",
        montant_total:     data.prix_unitaire,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        notes:             `Examen laboratoire — ${examen.type_examen}`,
        lignes: {
          create: [{
            description:   `Examen labo — ${examen.type_examen}`,
            quantite:      1,
            prix_unitaire: data.prix_unitaire,
            montant_total: data.prix_unitaire,
          }],
        },
      },
    });

    await prisma.examenLabo.update({
      where: { id: examenId },
      data:  { facture_id: facture.id },
    });
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "LABORATOIRE",
    description: `Saisie résultats labo — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:    examenId,
    entiteNom:   `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees: {
      statut:        data.statut ?? "RESULTAT_SAISI",
      prix_unitaire: data.prix_unitaire ?? null,
    },
  });

  return examen;
}

// ============================================================
// Upload PDF résultats
//
// On utilise createAdminClient (service role key) pour
// bypasser les Row Level Security du bucket Supabase.
// Le client utilisateur normal est bloqué par les RLS
// car l'upload se fait côté serveur sans session active.
// ============================================================
export async function uploadResultatPDF(
  examenId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  formData: FormData
) {
  const file = formData.get("fichier") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  const supabaseAdmin = createAdminClient();
  const cheminFichier = `${hospitalId}/${examenId}/${Date.now()}_${file.name}`;

  const { error } = await supabaseAdmin.storage
    .from("resultats-examens")
    .upload(cheminFichier, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data: signedUrl } = await supabaseAdmin.storage
    .from("resultats-examens")
    .createSignedUrl(cheminFichier, 365 * 24 * 60 * 60);

  const examen = await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      fichier_url: signedUrl?.signedUrl ?? null,
      fichier_nom: file.name,
      statut:      "RESULTAT_SAISI",
    },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "LABORATOIRE",
    description: `Upload PDF résultats labo — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:    examenId,
    entiteNom:   `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees: { fichier_nom: file.name, fichier_size: file.size },
  });

  return signedUrl?.signedUrl;
}

// ============================================================
// Valider un examen
// ============================================================
export async function validerExamenLabo(
  examenId: string,
  hospitalId: string,
  validateurId: string,
  validateurNom: string
) {
  const examen = await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      statut:     "VALIDE",
      valide_par: validateurId,
      valide_le:  new Date(),
    },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  validateurId,
    utilisateurNom: validateurNom,
    typeAction:     "MODIFICATION",
    module:         "LABORATOIRE",
    description:    `Validation examen labo — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:       examenId,
    entiteNom:      `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees:    { statut: "VALIDE" },
  });

  return examen;
}

export async function getStatsLabo(hospitalId: string) {
  const [enAttente, enCours, valides, urgents] = await Promise.all([
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, statut: "EN_ATTENTE" } }),
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, statut: "EN_COURS" } }),
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, statut: "VALIDE" } }),
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, urgence: true, statut: { not: "VALIDE" } } }),
  ]);
  return { enAttente, enCours, valides, urgents };
}