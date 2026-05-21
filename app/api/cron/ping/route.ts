// ============================================================
// CRON PING — Interroge la BDD Supabase une fois par jour
// pour éviter la mise en pause automatique (Free tier)
// Appelé par Vercel Cron via vercel.json
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Vérification du token secret Vercel Cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  try {
    // Requête légère : compte le nombre d'hôpitaux (table toujours présente)
    const compte = await prisma.hospital.count();

    const maintenant = new Date().toISOString();
    console.log(`[CRON PING] ${maintenant} — BDD active, ${compte} hôpital(aux)`);

    return NextResponse.json({
      statut: "ok",
      horodatage: maintenant,
      hopitaux: compte,
    });
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : "Erreur inconnue";
    console.error(`[CRON PING] Échec de la connexion BDD :`, message);

    return NextResponse.json(
      { statut: "erreur", message },
      { status: 500 }
    );
  }
}
