"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { TypeExamenLabo, StatutExamen } from "@/app/generated/prisma/client";
import { enregistrerAudit } from "@/lib/audit";
import { TARIFS_LABO } from "@/lib/tarifs";
import { verifierPermissionAction } from "@/lib/permissions.server";

// Mapping famille catalogue → TypeExamenLabo (pour la compatibilité BDD)
function familleVersTypeExamen(famille: string): TypeExamenLabo {
  const f = famille.toUpperCase();
  if (f === "HEMATOLOGIE" || f === "HÉMATOLOGIE") return "HEMATOLOGIE";
  if (f === "BACTERIOLOGIE" || f === "BACTÉRIOLOGIE") return "BACTERIOLOGIE";
  if (f === "BIOCHIMIE") return "BIOCHIMIE";
  if (f === "PARASITOLOGIE") return "PARASITOLOGIE";
  if (f === "SEROLOGIE" || f === "SÉROLOGIE") return "SEROLOGIE";
  if (f === "HORMONES") return "SEROLOGIE";
  if (f.includes("IMMUNOLOGIE")) return "SEROLOGIE";
  if (f.includes("BILAN") && f.includes("SANGUIN")) return "BILAN_SANGUIN";
  if (f.includes("BILAN") && f.includes("URINAIRE")) return "BILAN_URINAIRE";
  return "AUTRE";
}

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
    include: {
      patient: true,
      medecin: true,
      // Inclut les examens spécifiques du catalogue
      examens_details: {
        include: { catalogue: true },
        orderBy: { created_at: "asc" },
      },
    },
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
    examens_ids: string[];   // IDs du catalogue ExamenCatalogue
    notes?:      string;
    urgence?:    boolean;
  }
) {
  await verifierPermissionAction(hospitalId, "LABORATOIRE", "peut_creer");

  const patientHospital = await prisma.patientHospital.findFirst({
    where:   { hospital_id: hospitalId, patient_id: data.patient_id },
    include: { patient: true },
  });
  const nomPatient = patientHospital
    ? `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`
    : "Patient inconnu";

  // Récupère les examens sélectionnés depuis le catalogue
  const examensChoisis = await prisma.examenCatalogue.findMany({
    where: {
      id:          { in: data.examens_ids },
      hospital_id: hospitalId,
      actif:       true,
    },
  });

  if (examensChoisis.length === 0) {
    throw new Error("Aucun examen valide sélectionné");
  }

  // Total = somme des prix individuels
  const totalTarif = examensChoisis.reduce((sum, e) => sum + e.prix, 0);

  // Dérive le type_examen depuis la famille du premier examen (compatibilité BDD)
  const typeExamen: TypeExamenLabo = familleVersTypeExamen(examensChoisis[0].famille);

  // Noms des examens pour les libellés
  const nomsExamens = examensChoisis.map((e) => e.nom).join(", ");

  const examen = await prisma.examenLabo.create({
    data: {
      hospital_id:   hospitalId,
      patient_id:    data.patient_id,
      medecin_id:    data.medecin_id,
      type_examen:   typeExamen,
      notes:         data.notes ?? null,
      urgence:       data.urgence ?? false,
      statut:        "EN_ATTENTE",
      prix_unitaire: totalTarif > 0 ? totalTarif : null,
    },
    include: { patient: true, medecin: true },
  });

  // Crée les lignes de détail (ExamenLaboExamen)
  await prisma.examenLaboExamen.createMany({
    data: examensChoisis.map((e) => ({
      examen_labo_id: examen.id,
      catalogue_id:   e.id,
      prix_snapshot:  e.prix,
    })),
  });

  // Crée la facture si le total est > 0
  if (totalTarif > 0) {
    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(totalTarif * (tauxCouverture / 100));
    const montantPatient   = totalTarif - montantAssurance;

    const count = await prisma.facture.count({ where: { hospital_id: hospitalId } });
    const numeroFacture = `FAC-LABO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospitalId,
        patient_id:        data.patient_id,
        numero_facture:    numeroFacture,
        statut:            "EN_ATTENTE",
        montant_total:     totalTarif,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        notes:             `Examens laboratoire${data.urgence ? " 🔴 URGENT" : ""} — ${nomsExamens}`,
        lignes: {
          // Une ligne de facture par examen sélectionné
          create: examensChoisis.map((e) => ({
            description:   e.nom,
            quantite:      1,
            prix_unitaire: e.prix,
            montant_total: e.prix,
          })),
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
    description: `Demande labo — ${nomPatient} — ${nomsExamens}${data.urgence ? " 🔴 URGENT" : ""}`,
    entiteId:    examen.id,
    entiteNom:   nomPatient,
    metadonnees: {
      examens:        examensChoisis.map((e) => ({ nom: e.nom, famille: e.famille, prix: e.prix })),
      urgence:        data.urgence ?? false,
      tarif_total:    totalTarif,
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
  await verifierPermissionAction(hospitalId, "LABORATOIRE", "peut_modifier");

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
  await verifierPermissionAction(hospitalId, "LABORATOIRE", "peut_modifier");

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
  await verifierPermissionAction(hospitalId, "LABORATOIRE", "peut_modifier");

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
  const maintenant = new Date();
  const debutMois  = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const finMois    = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 1);

  const [enAttente, saisies, valides, urgents, examensPayesMois] = await Promise.all([
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, statut: "EN_ATTENTE" } }),
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, statut: "RESULTAT_SAISI" } }),
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, statut: "VALIDE" } }),
    prisma.examenLabo.count({ where: { hospital_id: hospitalId, urgence: true, statut: { not: "VALIDE" } } }),
    // Somme des factures PAYEES liées aux examens labo créés ce mois-ci
    prisma.examenLabo.findMany({
      where: {
        hospital_id: hospitalId,
        created_at:  { gte: debutMois, lt: finMois },
        facture:     { statut: "PAYEE" },
      },
      include: { facture: { select: { montant_total: true } } },
    }),
  ]);

  const recetteMois = examensPayesMois.reduce(
    (sum, e) => sum + (e.facture?.montant_total ?? 0),
    0
  );

  return { enAttente, saisies, valides, urgents, recetteMois };
}