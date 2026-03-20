// ============================================================
// FACTURE PDF — Template d'impression avec @react-pdf/renderer
//
// Génère un PDF professionnel avec :
//   - En-tête hôpital + logo
//   - Informations patient et facture
//   - Tableau des actes
//   - Calcul assurance / reste à payer
//   - Pied de page légal
// ============================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ============================================================
// Styles du PDF
// @react-pdf/renderer utilise un sous-ensemble de CSS Flexbox
// Les unités sont en points (pt) par défaut
// ============================================================
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },

  // ── En-tête ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1d4ed8",
  },
  headerLeft: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    marginBottom: 4,
  },
  hospitalInfo: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  factureTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    marginBottom: 4,
  },
  factureNumero: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  factureDate: {
    fontSize: 10,
    color: "#6b7280",
  },

  // ── Infos patient ─────────────────────────────────────────
  infoSection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 25,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoBoxTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoBoxText: {
    fontSize: 10,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  infoBoxSubtext: {
    fontSize: 9,
    color: "#6b7280",
  },

  // ── Statut badge ──────────────────────────────────────────
  statutBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  statutText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },

  // ── Tableau des actes ─────────────────────────────────────
  tableTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  table: {
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
  },
  tableCellBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  // Largeurs des colonnes
  colDescription: { flex: 4 },
  colQte:         { flex: 1, textAlign: "center" },
  colPrix:        { flex: 2, textAlign: "right" },
  colTotal:       { flex: 2, textAlign: "right" },

  // ── Totaux ────────────────────────────────────────────────
  totauxContainer: {
    alignItems: "flex-end",
    marginBottom: 25,
  },
  totauxBox: {
    width: 220,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  totauxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  totauxLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totauxValue: {
    fontSize: 10,
    color: "#374151",
    fontFamily: "Helvetica-Bold",
  },
  totauxAssuranceLabel: {
    fontSize: 10,
    color: "#16a34a",
  },
  totauxAssuranceValue: {
    fontSize: 10,
    color: "#16a34a",
    fontFamily: "Helvetica-Bold",
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#1d4ed8",
  },
  totalFinalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalFinalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  // ── Paiement ──────────────────────────────────────────────
  paiementBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 25,
  },
  paiementTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
    marginBottom: 4,
  },
  paiementText: {
    fontSize: 10,
    color: "#166534",
  },

  // ── Notes ─────────────────────────────────────────────────
  notesBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 10,
    color: "#374151",
  },

  // ── Pied de page ──────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  footerBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
});

// ============================================================
// Utilitaires
// ============================================================
function formatCurrencyPDF(amount: number): string {
  return new Intl.NumberFormat("fr-GA", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDatePDF(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const MODES_PAIEMENT: Record<string, string> = {
  ESPECES:        "Espèces",
  CARTE_BANCAIRE: "Carte bancaire",
  MOBILE_MONEY:   "Mobile Money",
  ASSURANCE:      "Assurance",
  CHEQUE:         "Chèque",
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE:          "En attente de paiement",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE:               "Payée",
  ANNULEE:             "Annulée",
};

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  EN_ATTENTE:          { bg: "#fff7ed", text: "#c2410c" },
  PARTIELLEMENT_PAYEE: { bg: "#fefce8", text: "#a16207" },
  PAYEE:               { bg: "#f0fdf4", text: "#15803d" },
  ANNULEE:             { bg: "#fef2f2", text: "#b91c1c" },
};

// ============================================================
// Props du composant PDF
// ============================================================
interface FacturePDFProps {
  facture: {
    id: string;
    numero_facture: string;
    statut: string;
    montant_total: number;
    montant_assurance: number;
    montant_patient: number;
    mode_paiement: string | null;
    date_paiement: Date | null;
    notes: string | null;
    created_at: Date;
    patient: { nom: string; prenom: string };
    lignes: Array<{
      id: string;
      description: string;
      quantite: number;
      prix_unitaire: number;
      montant_total: number;
    }>;
    consultation: {
      medecin: { nom: string; prenom: string };
    } | null;
  };
  hospital: {
    nom: string;
    adresse?: string | null;
    ville?: string | null;
    telephone?: string | null;
    email?: string | null;
  };
}

// ============================================================
// Composant principal — Document PDF
// ============================================================
export function FacturePDF({ facture, hospital }: FacturePDFProps) {
  const statutColor = STATUT_COLORS[facture.statut] ?? STATUT_COLORS.EN_ATTENTE;

  return (
    <Document
      title={`Facture ${facture.numero_facture}`}
      author={hospital.nom}
      subject="Facture médicale"
    >
      <Page size="A4" style={styles.page}>

        {/* ------------------------------------------------ */}
        {/* EN-TÊTE                                          */}
        {/* ------------------------------------------------ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.hospitalName}>{hospital.nom}</Text>
            {hospital.adresse && (
              <Text style={styles.hospitalInfo}>{hospital.adresse}</Text>
            )}
            {hospital.ville && (
              <Text style={styles.hospitalInfo}>{hospital.ville}, Gabon</Text>
            )}
            {hospital.telephone && (
              <Text style={styles.hospitalInfo}>Tél : {hospital.telephone}</Text>
            )}
            {hospital.email && (
              <Text style={styles.hospitalInfo}>{hospital.email}</Text>
            )}
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.factureTitle}>FACTURE</Text>
            <Text style={styles.factureNumero}>{facture.numero_facture}</Text>
            <Text style={styles.factureDate}>
              Émise le {formatDatePDF(facture.created_at)}
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------ */}
        {/* STATUT BADGE                                      */}
        {/* ------------------------------------------------ */}
        <View style={[styles.statutBadge, { backgroundColor: statutColor.bg }]}>
          <Text style={[styles.statutText, { color: statutColor.text }]}>
            {STATUT_LABELS[facture.statut] ?? facture.statut}
          </Text>
        </View>

        {/* ------------------------------------------------ */}
        {/* INFOS PATIENT + FACTURE                          */}
        {/* ------------------------------------------------ */}
        <View style={styles.infoSection}>

          {/* Patient */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Facturé à</Text>
            <Text style={styles.infoBoxText}>
              {facture.patient.prenom} {facture.patient.nom}
            </Text>
            {facture.consultation && (
              <Text style={styles.infoBoxSubtext}>
                Suivi par Dr. {facture.consultation.medecin.nom}
              </Text>
            )}
          </View>

          {/* Détails facture */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Détails</Text>
            <Text style={styles.infoBoxText}>N° {facture.numero_facture}</Text>
            <Text style={styles.infoBoxSubtext}>
              Date : {formatDatePDF(facture.created_at)}
            </Text>
            {facture.date_paiement && (
              <Text style={styles.infoBoxSubtext}>
                Payée le : {formatDatePDF(facture.date_paiement)}
              </Text>
            )}
          </View>

          {/* Établissement */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Établissement</Text>
            <Text style={styles.infoBoxText}>{hospital.nom}</Text>
            {hospital.ville && (
              <Text style={styles.infoBoxSubtext}>{hospital.ville}, Gabon</Text>
            )}
          </View>
        </View>

        {/* ------------------------------------------------ */}
        {/* TABLEAU DES ACTES                                */}
        {/* ------------------------------------------------ */}
        <Text style={styles.tableTitle}>Détail des prestations</Text>
        <View style={styles.table}>

          {/* En-tête tableau */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQte]}>
              Qté
            </Text>
            <Text style={[styles.tableHeaderText, styles.colPrix]}>
              Prix unit.
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total
            </Text>
          </View>

          {/* Lignes */}
          {facture.lignes.map((ligne, index) => (
            <View
              key={ligne.id}
              style={[
                styles.tableRow,
                index % 2 !== 0 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.colDescription]}>
                {ligne.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQte]}>
                {ligne.quantite}
              </Text>
              <Text style={[styles.tableCell, styles.colPrix]}>
                {formatCurrencyPDF(ligne.prix_unitaire)}
              </Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>
                {formatCurrencyPDF(ligne.montant_total)}
              </Text>
            </View>
          ))}
        </View>

        {/* ------------------------------------------------ */}
        {/* TOTAUX                                           */}
        {/* ------------------------------------------------ */}
        <View style={styles.totauxContainer}>
          <View style={styles.totauxBox}>

            <View style={styles.totauxRow}>
              <Text style={styles.totauxLabel}>Sous-total</Text>
              <Text style={styles.totauxValue}>
                {formatCurrencyPDF(facture.montant_total)}
              </Text>
            </View>

            {facture.montant_assurance > 0 && (
              <View style={styles.totauxRow}>
                <Text style={styles.totauxAssuranceLabel}>
                  Part assurance
                </Text>
                <Text style={styles.totauxAssuranceValue}>
                  -{formatCurrencyPDF(facture.montant_assurance)}
                </Text>
              </View>
            )}

            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>TOTAL À PAYER</Text>
              <Text style={styles.totalFinalValue}>
                {formatCurrencyPDF(facture.montant_patient)}
              </Text>
            </View>
          </View>
        </View>

        {/* ------------------------------------------------ */}
        {/* INFO PAIEMENT (si payée)                         */}
        {/* ------------------------------------------------ */}
        {facture.statut === "PAYEE" && facture.date_paiement && (
          <View style={styles.paiementBox}>
            <Text style={styles.paiementTitle}>✓ Paiement reçu</Text>
            <Text style={styles.paiementText}>
              Le {formatDatePDF(facture.date_paiement)} par{" "}
              {MODES_PAIEMENT[facture.mode_paiement ?? ""] ?? facture.mode_paiement}
            </Text>
          </View>
        )}

        {/* ------------------------------------------------ */}
        {/* NOTES                                            */}
        {/* ------------------------------------------------ */}
        {facture.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{facture.notes}</Text>
          </View>
        )}

        {/* ------------------------------------------------ */}
        {/* PIED DE PAGE                                     */}
        {/* ------------------------------------------------ */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Ce document est une facture officielle de {hospital.nom}
          </Text>
          {/* <Text style={styles.footerBrand}>SANTÉGAB</Text> */}
          <Text style={styles.footerText}>
            {facture.numero_facture} · {formatDatePDF(facture.created_at)}
          </Text>
        </View>

      </Page>
    </Document>
  );
}