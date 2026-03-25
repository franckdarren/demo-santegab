// ============================================================
// TARIFS PAR DÉFAUT — Laboratoire et Imagerie
//
// Ces tarifs sont des valeurs de référence en XAF.
// Chaque établissement peut les ajuster manuellement
// lors de la saisie des résultats.
// ============================================================

export const TARIFS_LABO: Record<string, number> = {
    BILAN_SANGUIN: 15000,
    BILAN_URINAIRE: 10000,
    BACTERIOLOGIE: 25000,
    PARASITOLOGIE: 20000,
    SEROLOGIE: 30000,
    BIOCHIMIE: 35000,
    HEMATOLOGIE: 20000,
    AUTRE: 15000,
};

export const TARIFS_IMAGERIE: Record<string, number> = {
    RADIOGRAPHIE: 30000,
    ECHOGRAPHIE: 45000,
    SCANNER: 150000,
    IRM: 250000,
    MAMMOGRAPHIE: 60000,
    AUTRE: 35000,
};

// Tarif par défaut d'une consultation — ajustable par établissement
export const TARIF_CONSULTATION = 10000; // 10 000 XAF