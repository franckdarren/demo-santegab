"use server";

import { prisma } from "@/lib/prisma";
import { genererQrToken } from "@/lib/qr-token";
import { headers } from "next/headers";

// ============================================================
// Génère un QR Code pour un patient
// Invalide les anciens tokens actifs du même patient
// ============================================================
export async function genererQrCodePatient(
  patientId: string,
  hospitalId: string,
  creePar: string
) {
  // 1. Invalide les anciens tokens actifs
  await prisma.qrToken.updateMany({
    where: {
      patient_id: patientId,
      hospital_id: hospitalId,
      est_actif: true,
    },
    data: { est_actif: false },
  });

  // 2. Génère un nouveau token JWT signé
  const { token, expireAt } = await genererQrToken(
    patientId,
    hospitalId,
    creePar
  );

  // 3. Sauvegarde en base
  await prisma.qrToken.create({
    data: {
      patient_id: patientId,
      hospital_id: hospitalId,
      token,
      expire_le: expireAt,
      cree_par: creePar,
      est_actif: true,
    },
  });

  return token;
}

// ============================================================
// Récupère les données du carnet de santé via token QR
// + enregistre l'accès dans l'audit log (traçabilité légale)
// ============================================================
export async function getCarnetParToken(token: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "inconnue";
  const userAgent = headersList.get("user-agent") ?? "inconnu";

  // 1. Vérifie que le token existe en base et est actif
  const qrToken = await prisma.qrToken.findUnique({
    where: { token },
    include: { patient: true },
  });

  if (!qrToken || !qrToken.est_actif) {
    return { erreur: "Token invalide ou désactivé" };
  }

  if (new Date() > qrToken.expire_le) {
    return { erreur: "Token expiré — demandez un nouveau QR Code" };
  }

  // 2. Enregistre l'accès dans l'audit log
  await prisma.auditLogCarnet.create({
    data: {
      patient_id: qrToken.patient_id,
      hospital_id: qrToken.hospital_id,
      accessed_by: "QR_CODE_PUBLIC",
      ip_address: ip,
      user_agent: userAgent,
      type_acces: "QR_CODE",
    },
  });

  // 3. Récupère les données médicales du patient
  const patient = await prisma.patient.findUnique({
    where: { id: qrToken.patient_id },
    include: {
      consultations: {
        where: { hospital_id: qrToken.hospital_id },
        orderBy: { date_consultation: "desc" },
        take: 5,
        include: {
          medecin: { select: { nom: true, prenom: true } },
          prescriptions: true,
        },
      },
      examens_labo: {
        where: {
          hospital_id: qrToken.hospital_id,
          statut: "VALIDE",
        },
        orderBy: { created_at: "desc" },
        take: 5,
        include: {
          medecin: { select: { nom: true, prenom: true } },
        },
      },
      hospitalisations: {
        where: { hospital_id: qrToken.hospital_id },
        include: {
          hospital: {
            select: { nom: true, ville: true, telephone: true },
          },
        },
      },
    },
  });

  if (!patient) return { erreur: "Patient introuvable" };

  return {
    patient,
    expireAt: qrToken.expire_le,
    hospital: patient.hospitalisations[0]?.hospital ?? null,
  };
}