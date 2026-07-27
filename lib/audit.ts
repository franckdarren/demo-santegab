// ============================================================
// AUDIT TRAIL — Utilitaire d'enregistrement des actions
//
// À appeler dans chaque Server Action après une action critique.
// Exemple : await enregistrerAudit({ ... })
// ============================================================

import { prisma } from "@/lib/prisma";
import { TypeAction, ModuleAction, Prisma } from "@/app/generated/prisma/client";
import { headers } from "next/headers";

interface AuditParams {
  hospitalId: string;
  utilisateurId?: string;
  utilisateurNom?: string;
  typeAction: TypeAction;
  module: ModuleAction;
  description: string;
  entiteId?: string;
  entiteNom?: string;
  metadonnees?: Record<string, unknown>;
}

export async function enregistrerAudit(params: AuditParams): Promise<void> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? "inconnue";
    const userAgent = headersList.get("user-agent") ?? "inconnu";

    await prisma.auditTrail.create({
      data: {
        hospital_id:     params.hospitalId,
        utilisateur_id:  params.utilisateurId ?? null,
        utilisateur_nom: params.utilisateurNom ?? null,
        type_action:     params.typeAction,
        module:          params.module,
        description:     params.description,
        entite_id:       params.entiteId ?? null,
        entite_nom:      params.entiteNom ?? null,
        ip_address:      ip,
        user_agent:      userAgent,
        // ============================================================
        // Prisma JSON nullable : on ne peut pas passer null directement
        // pour un champ Json? — il faut utiliser Prisma.JsonNull
        // ou omettre le champ entièrement s'il est undefined
        // ============================================================
        metadonnees: params.metadonnees
          ? (params.metadonnees as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Ne jamais bloquer l'action principale si l'audit échoue
    console.error("[AUDIT] Erreur enregistrement audit :", error);
  }
}

// ============================================================
// TRAÇABILITÉ DES LECTURES DE DOSSIER (CDC KIMBA §8)
//
// « Qui a consulté quel dossier patient, et quand ».
// Utilise les enums existants TypeAction.CONSULTATION +
// ModuleAction.PATIENT — aucune migration nécessaire.
//
// ⚠️ Pourquoi une fenêtre anti-doublon :
// la page fiche patient est un Server Component ré-exécuté à
// chaque router.refresh() — donc après CHAQUE ajout d'antécédent,
// de consultation, etc. Sans ce garde-fou, une simple séance de
// travail sur un dossier générerait dix lignes d'audit identiques
// et rendrait le journal illisible.
//
// Une même personne rouvrant le même dossier dans l'intervalle
// ne produit qu'une seule trace.
// ============================================================
const FENETRE_ANTI_DOUBLON_MINUTES = 30;

interface ConsultationDossierParams {
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  patientId: string;
  patientNom: string;
  numeroDossier?: string;
}

export async function enregistrerConsultationDossier(
  params: ConsultationDossierParams
): Promise<void> {
  try {
    const depuis = new Date(
      Date.now() - FENETRE_ANTI_DOUBLON_MINUTES * 60 * 1000
    );

    const dejaTracee = await prisma.auditTrail.findFirst({
      where: {
        hospital_id:    params.hospitalId,
        utilisateur_id: params.utilisateurId,
        entite_id:      params.patientId,
        type_action:    "CONSULTATION",
        module:         "PATIENT",
        created_at:     { gte: depuis },
      },
      select: { id: true },
    });

    if (dejaTracee) return;

    await enregistrerAudit({
      hospitalId:     params.hospitalId,
      utilisateurId:  params.utilisateurId,
      utilisateurNom: params.utilisateurNom,
      typeAction:     "CONSULTATION",
      module:         "PATIENT",
      description:    `Consultation du dossier — ${params.patientNom}`,
      entiteId:       params.patientId,
      entiteNom:      params.patientNom,
      metadonnees: {
        numero_dossier: params.numeroDossier ?? null,
      },
    });
  } catch (error) {
    // Comme enregistrerAudit : ne jamais bloquer l'affichage du dossier
    console.error("[AUDIT] Erreur traçabilité lecture dossier :", error);
  }
}