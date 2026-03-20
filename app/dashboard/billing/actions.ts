// ============================================================
// ACTIONS FACTURATION
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";

// ============================================================
// Liste des factures de l'hôpital
// ============================================================
export async function getFactures(hospitalId: string, search?: string) {
    return prisma.facture.findMany({
        where: {
            hospital_id: hospitalId,
            ...(search && {
                OR: [
                    { numero_facture: { contains: search, mode: "insensitive" } },
                    {
                        patient: {
                            OR: [
                                { nom: { contains: search, mode: "insensitive" } },
                                { prenom: { contains: search, mode: "insensitive" } },
                            ],
                        },
                    },
                ],
            }),
        },
        include: {
            patient: true,
            lignes: true,
            consultation: {
                include: { medecin: true },
            },
        },
        orderBy: { created_at: "desc" },
    });
}

// ============================================================
// Créer une facture manuelle (sans consultation associée)
// ============================================================
export async function creerFacture(
    hospitalId: string,
    data: {
        patient_id: string;
        lignes: Array<{
            description: string;
            quantite: number;
            prix_unitaire: number;
        }>;
        mode_paiement?: string;
        notes?: string;
        taux_assurance?: number;
    }
) {
    // Calcule les montants
    const montantTotal = data.lignes.reduce(
        (sum, l) => sum + l.quantite * l.prix_unitaire,
        0
    );
    const montantAssurance = Math.round(
        montantTotal * ((data.taux_assurance ?? 0) / 100)
    );
    const montantPatient = montantTotal - montantAssurance;

    // Génère un numéro de facture unique
    const count = await prisma.facture.count({
        where: { hospital_id: hospitalId },
    });
    const numeroFacture = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    return prisma.facture.create({
        data: {
            hospital_id: hospitalId,
            patient_id: data.patient_id,
            numero_facture: numeroFacture,
            statut: "EN_ATTENTE",
            montant_total: montantTotal,
            montant_assurance: montantAssurance,
            montant_patient: montantPatient,
            notes: data.notes ?? null,
            lignes: {
                create: data.lignes.map((l) => ({
                    description: l.description,
                    quantite: l.quantite,
                    prix_unitaire: l.prix_unitaire,
                    montant_total: l.quantite * l.prix_unitaire,
                })),
            },
        },
        include: { patient: true, lignes: true },
    });
}

// ============================================================
// Mettre à jour le statut d'une facture (paiement)
// ============================================================
export async function payerFacture(
    factureId: string,
    hospitalId: string,
    modePaiement: string
) {
    return prisma.facture.update({
        where: { id: factureId, hospital_id: hospitalId },
        data: {
            statut: "PAYEE",
            mode_paiement: modePaiement as any,
            date_paiement: new Date(),
        },
    });
}

// ============================================================
// Annuler une facture
// ============================================================
export async function annulerFacture(
    factureId: string,
    hospitalId: string
) {
    return prisma.facture.update({
        where: { id: factureId, hospital_id: hospitalId },
        data: { statut: "ANNULEE" },
    });
}

// ============================================================
// Stats facturation pour le résumé en haut de page
// ============================================================
export async function getStatsFacturation(hospitalId: string) {
    const { startOfMonth } = await import("date-fns");
    const debutMois = startOfMonth(new Date());

    const [totalEnAttente, totalPayeeMois, totalFacturesMois] = await Promise.all([
        // Montant total des factures en attente
        prisma.facture.aggregate({
            where: { hospital_id: hospitalId, statut: "EN_ATTENTE" },
            _sum: { montant_patient: true },
            _count: true,
        }),
        // Montant encaissé ce mois
        prisma.facture.aggregate({
            where: {
                hospital_id: hospitalId,
                statut: "PAYEE",
                date_paiement: { gte: debutMois },
            },
            _sum: { montant_patient: true },
        }),
        // Nombre total de factures ce mois
        prisma.facture.count({
            where: {
                hospital_id: hospitalId,
                created_at: { gte: debutMois },
            },
        }),
    ]);

    return {
        montantEnAttente: totalEnAttente._sum.montant_patient ?? 0,
        nombreEnAttente: totalEnAttente._count,
        encaisseMois: totalPayeeMois._sum.montant_patient ?? 0,
        totalFacturesMois,
    };
}

// ============================================================
// Récupère les patients pour le formulaire de création
// ============================================================
export async function getPatientsHospital(hospitalId: string) {
    return prisma.patientHospital.findMany({
        where: { hospital_id: hospitalId },
        include: { patient: true },
        orderBy: { created_at: "desc" },
    });
}