import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ============================================================
// Types
// ============================================================
export interface RapportData {
  hospital: {
    nom: string;
    adresse?: string | null;
    ville?: string | null;
    telephone?: string | null;
  };
  dateDebut: string;
  dateFin: string;
  totaux: {
    recettes: number;
    depenses: number;
    benefice: number;
    nbRecettes: number;
    nbDepenses: number;
  };
  depensesParCategorie: { categorie: string; montant: number }[];
  ecritures: {
    id: string;
    date_ecriture: Date | string;
    type_ecriture: string;
    libelle: string;
    reference: string | null;
    categorie: string | null;
    montant: number;
  }[];
}

// ============================================================
// Utilitaires
// ============================================================
function xaf(montant: number) {
  return montant.toLocaleString("fr-FR") + " XAF";
}

function dateFr(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const CATEGORIE_LABELS: Record<string, string> = {
  SALAIRES:    "Salaires",
  MEDICAMENTS: "Médicaments",
  EQUIPEMENT:  "Équipement",
  LOYER:       "Loyer",
  ELECTRICITE: "Électricité",
  EAU:         "Eau",
  TELEPHONE:   "Téléphone",
  FOURNITURES: "Fournitures",
  MAINTENANCE: "Maintenance",
  AUTRE:       "Autre",
};

// ============================================================
// Styles
// ============================================================
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#374151",
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },

  // --- En-tête ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1d4ed8",
    paddingBottom: 14,
    marginBottom: 18,
  },
  hospitalNom: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  hospitalInfo: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  rapportTitre: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    textAlign: "right",
  },
  rapportSousTitre: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 3,
  },

  // --- Résumé ---
  resumeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  resumeBox: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  resumeBoxVert:   { backgroundColor: "#f0fdf4", borderColor: "#86efac" },
  resumeBoxRouge:  { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  resumeBoxBleu:   { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  resumeBoxOrange: { backgroundColor: "#fff7ed", borderColor: "#fdba74" },
  resumeLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  resumeValeur: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },
  resumeValeurVert:   { color: "#16a34a" },
  resumeValeurRouge:  { color: "#dc2626" },
  resumeValeurBleu:   { color: "#1d4ed8" },
  resumeValeurOrange: { color: "#ea580c" },
  resumeCount: {
    fontSize: 7,
    color: "#9ca3af",
    marginTop: 2,
  },

  // --- Titres de section ---
  sectionTitre: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 16,
  },

  // --- Tableaux ---
  tableauEntete: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableauLigne: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tableauLigneAlt: {
    backgroundColor: "#fafafa",
  },
  tableauTotal: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
    marginTop: 1,
  },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  td: {
    fontSize: 8,
    color: "#374151",
  },
  tdGras: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  // --- Pied de page ---
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
});

// ============================================================
// Composant — Ligne de tableau générique
// ============================================================
interface ColonneConfig {
  valeur: string;
  largeur: string;
  align?: "right" | "left";
  couleur?: string;
}

interface LigneTableauProps {
  colonnes: ColonneConfig[];
  isAlt?: boolean;
  isTotal?: boolean;
  isEntete?: boolean;
}

function LigneTableau({ colonnes, isAlt, isTotal, isEntete }: LigneTableauProps) {
  const rowStyle = isTotal
    ? s.tableauTotal
    : isEntete
    ? s.tableauEntete
    : isAlt
    ? [s.tableauLigne, s.tableauLigneAlt]
    : s.tableauLigne;

  return (
    <View style={rowStyle}>
      {colonnes.map((col, i) => (
        <Text
          key={i}
          style={{
            ...(isEntete ? s.th : isTotal ? s.tdGras : s.td),
            width: col.largeur,
            textAlign: col.align ?? "left",
            ...(col.couleur ? { color: col.couleur } : {}),
          }}
        >
          {col.valeur}
        </Text>
      ))}
    </View>
  );
}

// ============================================================
// Document PDF principal
// ============================================================
export function RapportPDF({ data }: { data: RapportData }) {
  const { hospital, dateDebut, dateFin, totaux, depensesParCategorie, ecritures } = data;
  const dateGeneration = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const periodeLabel = `Du ${dateFr(dateDebut)} au ${dateFr(dateFin)}`;
  const beneficePositif = totaux.benefice >= 0;

  return (
    <Document
      title={`Rapport comptable — ${hospital.nom}`}
      author="SANTÉGAB"
    >
      <Page size="A4" style={s.page}>

        {/* ---- En-tête ---- */}
        <View style={s.header}>
          <View>
            <Text style={s.hospitalNom}>{hospital.nom}</Text>
            {hospital.adresse && (
              <Text style={s.hospitalInfo}>{hospital.adresse}</Text>
            )}
            {hospital.ville && (
              <Text style={s.hospitalInfo}>{hospital.ville}</Text>
            )}
            {hospital.telephone && (
              <Text style={s.hospitalInfo}>Tél : {hospital.telephone}</Text>
            )}
          </View>
          <View>
            <Text style={s.rapportTitre}>RAPPORT COMPTABLE</Text>
            <Text style={s.rapportSousTitre}>{periodeLabel}</Text>
            <Text style={s.rapportSousTitre}>Généré le {dateGeneration}</Text>
          </View>
        </View>

        {/* ---- Résumé financier ---- */}
        <View style={s.resumeRow}>
          <View style={[s.resumeBox, s.resumeBoxVert]}>
            <Text style={s.resumeLabel}>Total recettes</Text>
            <Text style={[s.resumeValeur, s.resumeValeurVert]}>
              {xaf(totaux.recettes)}
            </Text>
            <Text style={s.resumeCount}>
              {totaux.nbRecettes} transaction{totaux.nbRecettes !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={[s.resumeBox, s.resumeBoxRouge]}>
            <Text style={s.resumeLabel}>Total dépenses</Text>
            <Text style={[s.resumeValeur, s.resumeValeurRouge]}>
              {xaf(totaux.depenses)}
            </Text>
            <Text style={s.resumeCount}>
              {totaux.nbDepenses} transaction{totaux.nbDepenses !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={[s.resumeBox, beneficePositif ? s.resumeBoxBleu : s.resumeBoxOrange]}>
            <Text style={s.resumeLabel}>Bénéfice net</Text>
            <Text style={[s.resumeValeur, beneficePositif ? s.resumeValeurBleu : s.resumeValeurOrange]}>
              {beneficePositif ? "+" : ""}{xaf(totaux.benefice)}
            </Text>
            <Text style={s.resumeCount}>
              {beneficePositif ? "Résultat positif" : "Résultat négatif"}
            </Text>
          </View>
        </View>

        {/* ---- Répartition des dépenses par catégorie ---- */}
        {depensesParCategorie.length > 0 && (
          <View>
            <Text style={s.sectionTitre}>Répartition des dépenses par catégorie</Text>
            <LigneTableau
              isEntete
              colonnes={[
                { valeur: "Catégorie",  largeur: "50%" },
                { valeur: "Montant",    largeur: "30%", align: "right" },
                { valeur: "Part (%)",   largeur: "20%", align: "right" },
              ]}
            />
            {depensesParCategorie.map((d, i) => {
              const pct = totaux.depenses > 0
                ? ((d.montant / totaux.depenses) * 100).toFixed(1)
                : "0.0";
              return (
                <LigneTableau
                  key={d.categorie}
                  isAlt={i % 2 !== 0}
                  colonnes={[
                    { valeur: CATEGORIE_LABELS[d.categorie] ?? d.categorie, largeur: "50%" },
                    { valeur: xaf(d.montant), largeur: "30%", align: "right" },
                    { valeur: `${pct} %`,     largeur: "20%", align: "right" },
                  ]}
                />
              );
            })}
            <LigneTableau
              isTotal
              colonnes={[
                { valeur: "Total dépenses", largeur: "50%" },
                { valeur: xaf(totaux.depenses), largeur: "30%", align: "right" },
                { valeur: "100 %",            largeur: "20%", align: "right" },
              ]}
            />
          </View>
        )}

        {/* ---- Journal des écritures ---- */}
        <Text style={s.sectionTitre}>Journal des écritures</Text>
        <LigneTableau
          isEntete
          colonnes={[
            { valeur: "Date",       largeur: "11%" },
            { valeur: "Libellé",    largeur: "33%" },
            { valeur: "Référence",  largeur: "14%" },
            { valeur: "Type",       largeur: "10%" },
            { valeur: "Catégorie",  largeur: "14%" },
            { valeur: "Montant",    largeur: "18%", align: "right" },
          ]}
        />
        {ecritures.map((e, i) => {
          const estRecette = e.type_ecriture === "RECETTE";
          const couleur = estRecette ? "#16a34a" : "#dc2626";
          return (
            <LigneTableau
              key={e.id}
              isAlt={i % 2 !== 0}
              colonnes={[
                { valeur: dateFr(e.date_ecriture),                                         largeur: "11%" },
                { valeur: e.libelle,                                                        largeur: "33%" },
                { valeur: e.reference ?? "—",                                               largeur: "14%" },
                { valeur: estRecette ? "Recette" : "Dépense", largeur: "10%", couleur },
                { valeur: e.categorie ? (CATEGORIE_LABELS[e.categorie] ?? e.categorie) : "—", largeur: "14%" },
                {
                  valeur: (estRecette ? "+" : "-") + xaf(e.montant),
                  largeur: "18%",
                  align: "right",
                  couleur,
                },
              ]}
            />
          );
        })}
        {/* Ligne de totaux */}
        <LigneTableau
          isTotal
          colonnes={[
            { valeur: `${ecritures.length} écriture${ecritures.length !== 1 ? "s" : ""}`, largeur: "68%" },
            { valeur: "",          largeur: "14%" },
            {
              valeur: `Solde : ${beneficePositif ? "+" : ""}${xaf(totaux.benefice)}`,
              largeur: "18%",
              align: "right",
              couleur: beneficePositif ? "#16a34a" : "#dc2626",
            },
          ]}
        />

        {/* ---- Pied de page ---- */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {hospital.nom} — Rapport comptable confidentiel
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}
