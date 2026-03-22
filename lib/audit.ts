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