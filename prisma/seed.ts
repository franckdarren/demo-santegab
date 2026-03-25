// ============================================================
// SEED — Données de démo SANTÉGAB
//
// Génère des données réalistes pour la démo client :
//   - 1 hôpital (Clinique El Rapha, Libreville)
//   - 5 utilisateurs (admin, 2 médecins, infirmier, comptable)
//   - 10 patients gabonais avec assurances
//   - 8 consultations avec diagnostics
//   - Prescriptions associées
//   - Factures avec calcul assurance
// ============================================================

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Démarrage du seed SANTÉGAB...");

  // ----------------------------------------------------------
  // 1. NETTOYAGE — Supprime les données existantes dans l'ordre
  //    (respecter les contraintes de clés étrangères)
  // ----------------------------------------------------------
  await prisma.ligneFacture.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.patientHospital.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.hospital.deleteMany();

  console.log("🗑️  Données existantes supprimées");

  // ----------------------------------------------------------
  // 2. HÔPITAL — Clinique fictive à Libreville
  // ----------------------------------------------------------
  const hospital = await prisma.hospital.create({
    data: {
      id: "11111111-1111-1111-1111-111111111111",
      nom: "Clinique El Rapha",
      adresse: "Boulevard Triomphal Omar Bongo, BP 2234",
      ville: "Libreville",
      telephone: "+241 01 72 34 56",
      email: "contact@elrapha.ga",
      est_actif: true,
    },
  });

  console.log(`🏥 Hôpital créé : ${hospital.nom}`);

  // ----------------------------------------------------------
  // 3. UTILISATEURS — Personnel de la clinique
  // ----------------------------------------------------------
  const [admin, medecin1, medecin2, infirmier, comptable] =
    await Promise.all([
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "Ondo",
          prenom: "Marie-Claire",
          email: "admin@elrapha.ga",
          role: "ADMIN",
          telephone: "+241 07 11 22 33",
        },
      }),
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "Nguema",
          prenom: "Dr. Pierre",
          email: "p.nguema@elrapha.ga",
          role: "MEDECIN",
          telephone: "+241 07 44 55 66",
        },
      }),
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "Mbagou",
          prenom: "Dr. Sandrine",
          email: "s.mba@elrapha.ga",
          role: "MEDECIN",
          telephone: "+241 07 77 88 99",
        },
      }),
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "Obame",
          prenom: "Jean-Paul",
          email: "jp.obame@elrapha.ga",
          role: "INFIRMIER",
          telephone: "+241 06 12 34 56",
        },
      }),
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "Ella",
          prenom: "Christelle",
          email: "c.ella@elrapha.ga",
          role: "COMPTABLE",
          telephone: "+241 06 98 76 54",
        },
      }),
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "BOUROBOU",
          prenom: "Brice",
          email: "b.bourobou@elrapha.ga",
          role: "LABORANTIN",
          telephone: "+241 06 98 76 54",
        },
      }),
      prisma.utilisateur.create({
        data: {
          hospital_id: hospital.id,
          nom: "Franck",
          prenom: "MOUSSAVOU",
          email: "f.moussavou@elrapha.ga",
          role: "PHARMACIEN",
          telephone: "+241 06 98 76 54",
        },
      }),
    ]);

  console.log("👥 5 utilisateurs créés");

  // ----------------------------------------------------------
  // 4. PATIENTS — Noms gabonais réalistes
  // ----------------------------------------------------------
  const patientsData = [
    {
      numero: "PAT-2025-00001",
      nom: "Nzigou",
      prenom: "Alphonse",
      sexe: "MASCULIN" as const,
      naissance: new Date("1978-03-15"),
      telephone: "+241 07 23 45 67",
      groupe: "A+",
      assurance: "CNAMGS",
      taux: 80,
      allergies: "Pénicilline",
    },
    {
      numero: "PAT-2025-00002",
      nom: "Moussavou",
      prenom: "Estelle",
      sexe: "FEMININ" as const,
      naissance: new Date("1990-07-22"),
      telephone: "+241 06 34 56 78",
      groupe: "O+",
      assurance: "ASCOMA",
      taux: 70,
      allergies: null,
    },
    {
      numero: "PAT-2025-00003",
      nom: "Bourobou",
      prenom: "Gaston",
      sexe: "MASCULIN" as const,
      naissance: new Date("1965-11-08"),
      telephone: "+241 07 45 67 89",
      groupe: "B+",
      assurance: "CNAMGS",
      taux: 80,
      allergies: "Aspirine",
    },
    {
      numero: "PAT-2025-00004",
      nom: "Mboumba",
      prenom: "Sylvie",
      sexe: "FEMININ" as const,
      naissance: new Date("1985-04-30"),
      telephone: "+241 06 56 78 90",
      groupe: "AB+",
      assurance: "AXA",
      taux: 90,
      allergies: null,
    },
    {
      numero: "PAT-2025-00005",
      nom: "Nkoghe",
      prenom: "Rodrigue",
      sexe: "MASCULIN" as const,
      naissance: new Date("1995-01-12"),
      telephone: "+241 07 67 89 01",
      groupe: "A-",
      assurance: null,
      taux: 0,
      allergies: null,
    },
    {
      numero: "PAT-2025-00006",
      nom: "Ovono",
      prenom: "Nadège",
      sexe: "FEMININ" as const,
      naissance: new Date("1982-09-18"),
      telephone: "+241 06 78 90 12",
      groupe: "O-",
      assurance: "OGAR",
      taux: 75,
      allergies: "Latex",
    },
    {
      numero: "PAT-2025-00007",
      nom: "Mounguengui",
      prenom: "Patrick",
      sexe: "MASCULIN" as const,
      naissance: new Date("1970-06-25"),
      telephone: "+241 07 89 01 23",
      groupe: "B-",
      assurance: "CNAMGS",
      taux: 80,
      allergies: null,
    },
    {
      numero: "PAT-2025-00008",
      nom: "Koumba",
      prenom: "Félicité",
      sexe: "FEMININ" as const,
      naissance: new Date("1998-12-03"),
      telephone: "+241 06 90 12 34",
      groupe: "A+",
      assurance: "Sunu",
      taux: 60,
      allergies: null,
    },
    {
      numero: "PAT-2025-00009",
      nom: "Ndong",
      prenom: "Emmanuel",
      sexe: "MASCULIN" as const,
      naissance: new Date("1955-08-14"),
      telephone: "+241 07 01 23 45",
      groupe: "O+",
      assurance: "ASCOMA",
      taux: 70,
      allergies: "Morphine",
    },
    {
      numero: "PAT-2025-00010",
      nom: "Bekale",
      prenom: "Lucie",
      sexe: "FEMININ" as const,
      naissance: new Date("2001-02-28"),
      telephone: "+241 06 12 34 50",
      groupe: "AB-",
      assurance: "CNAMGS",
      taux: 80,
      allergies: null,
    },
  ];

  const patients = await Promise.all(
    patientsData.map((p) =>
      prisma.patient.create({
        data: {
          numero_dossier: p.numero,
          nom: p.nom,
          prenom: p.prenom,
          sexe: p.sexe,
          date_naissance: p.naissance,
          telephone: p.telephone,
          groupe_sanguin: p.groupe,
          allergies: p.allergies,
          hospitalisations: {
            create: {
              hospital_id: hospital.id,
              assurance_nom: p.assurance,
              taux_couverture: p.taux,
            },
          },
        },
      })
    )
  );

  console.log("🧑‍⚕️ 10 patients créés");

  // ----------------------------------------------------------
  // 5. CONSULTATIONS avec prescriptions
  // ----------------------------------------------------------
  const consultationsData = [
    {
      patient: patients[0],
      medecin: medecin1,
      statut: "TERMINEE" as const,
      motif: "Douleurs abdominales persistantes",
      diagnostic: "Gastrite chronique",
      tension: "13/8",
      poids: 78,
      taille: 175,
      temperature: 37.2,
      date: new Date("2025-03-10T09:00:00"),
      prescriptions: [
        { medicament: "Oméprazole 20mg", dosage: "1 gélule", frequence: "Matin à jeun", duree: "30 jours" },
        { medicament: "Gaviscon", dosage: "1 sachet", frequence: "Après chaque repas", duree: "15 jours" },
      ],
      montant: 35000,
    },
    {
      patient: patients[1],
      medecin: medecin2,
      statut: "TERMINEE" as const,
      motif: "Fièvre et maux de tête",
      diagnostic: "Paludisme simple",
      tension: "11/7",
      poids: 62,
      taille: 165,
      temperature: 38.9,
      date: new Date("2025-03-11T10:30:00"),
      prescriptions: [
        { medicament: "Artémether/Luméfantrine", dosage: "4 comprimés", frequence: "2 fois par jour", duree: "3 jours" },
        { medicament: "Paracétamol 1000mg", dosage: "1 comprimé", frequence: "Toutes les 6h si fièvre", duree: "3 jours" },
      ],
      montant: 45000,
    },
    {
      patient: patients[2],
      medecin: medecin1,
      statut: "TERMINEE" as const,
      motif: "Contrôle tension artérielle",
      diagnostic: "Hypertension artérielle stade 2",
      tension: "16/10",
      poids: 92,
      taille: 178,
      temperature: 36.8,
      date: new Date("2025-03-12T08:00:00"),
      prescriptions: [
        { medicament: "Amlodipine 5mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
        { medicament: "Périndopril 4mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
      ],
      montant: 30000,
    },
    {
      patient: patients[3],
      medecin: medecin2,
      statut: "TERMINEE" as const,
      motif: "Consultation prénatale",
      diagnostic: "Grossesse 24 semaines — évolution normale",
      tension: "12/7",
      poids: 71,
      taille: 162,
      temperature: 37.0,
      date: new Date("2025-03-13T11:00:00"),
      prescriptions: [
        { medicament: "Fer + Acide folique", dosage: "1 comprimé", frequence: "1 fois par jour", duree: "60 jours" },
        { medicament: "Calcium 500mg", dosage: "1 comprimé", frequence: "Le soir", duree: "60 jours" },
      ],
      montant: 40000,
    },
    {
      patient: patients[4],
      medecin: medecin1,
      statut: "EN_ATTENTE" as const,
      motif: "Douleur genou droit",
      diagnostic: null,
      tension: "12/8",
      poids: 75,
      taille: 180,
      temperature: 36.9,
      date: new Date("2025-03-14T14:00:00"),
      prescriptions: [],
      montant: 25000,
    },
    {
      patient: patients[5],
      medecin: medecin2,
      statut: "TERMINEE" as const,
      motif: "Éruption cutanée",
      diagnostic: "Dermatite allergique",
      tension: "11/7",
      poids: 58,
      taille: 160,
      temperature: 37.1,
      date: new Date("2025-03-14T09:30:00"),
      prescriptions: [
        { medicament: "Cétirizine 10mg", dosage: "1 comprimé", frequence: "Le soir", duree: "7 jours" },
        { medicament: "Bétaméthasone crème", dosage: "Application locale", frequence: "2 fois par jour", duree: "10 jours" },
      ],
      montant: 28000,
    },
    {
      patient: patients[8],
      medecin: medecin1,
      statut: "TERMINEE" as const,
      motif: "Diabète — suivi mensuel",
      diagnostic: "Diabète type 2 — glycémie mal contrôlée",
      tension: "14/9",
      poids: 88,
      taille: 172,
      temperature: 37.0,
      date: new Date("2025-03-15T08:30:00"),
      prescriptions: [
        { medicament: "Metformine 850mg", dosage: "1 comprimé", frequence: "Matin et soir au repas", duree: "30 jours" },
        { medicament: "Glibenclamide 5mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
      ],
      montant: 32000,
    },
    {
      patient: patients[9],
      medecin: medecin2,
      statut: "EN_COURS" as const,
      motif: "Toux persistante depuis 2 semaines",
      diagnostic: "Bronchite aiguë",
      tension: "11/7",
      poids: 55,
      taille: 163,
      temperature: 38.2,
      date: new Date("2025-03-15T10:00:00"),
      prescriptions: [
        { medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois par jour", duree: "7 jours" },
        { medicament: "Bromhexine sirop", dosage: "2 cuillères", frequence: "3 fois par jour", duree: "7 jours" },
      ],
      montant: 38000,
    },
  ];

  for (const c of consultationsData) {
    // Récupère l'assurance du patient dans cet hôpital
    const patientHospital = await prisma.patientHospital.findFirst({
      where: { patient_id: c.patient.id, hospital_id: hospital.id },
    });

    const tauxCouverture = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(c.montant * (tauxCouverture / 100));
    const montantPatient = c.montant - montantAssurance;

    // Crée la consultation
    const consultation = await prisma.consultation.create({
      data: {
        hospital_id: hospital.id,
        patient_id: c.patient.id,
        medecin_id: c.medecin.id,
        statut: c.statut,
        motif: c.motif,
        diagnostic: c.diagnostic,
        tension: c.tension,
        poids_kg: c.poids,
        taille_cm: c.taille,
        temperature: c.temperature,
        date_consultation: c.date,
        // Prescriptions créées en même temps
        prescriptions: {
          create: c.prescriptions.map((p) => ({
            medicament: p.medicament,
            dosage: p.dosage,
            frequence: p.frequence,
            duree: p.duree,
          })),
        },
      },
    });

    // Crée la facture uniquement pour les consultations terminées
    if (c.statut === "TERMINEE") {
      const numeroFacture = `FAC-2025-${String(consultationsData.indexOf(c) + 1).padStart(5, "0")}`;

      await prisma.facture.create({
        data: {
          hospital_id: hospital.id,
          patient_id: c.patient.id,
          consultation_id: consultation.id,
          numero_facture: numeroFacture,
          statut: "PAYEE",
          montant_total: c.montant,
          montant_assurance: montantAssurance,
          montant_patient: montantPatient,
          mode_paiement: tauxCouverture > 0 ? "ASSURANCE" : "ESPECES",
          date_paiement: c.date,
          lignes: {
            create: [
              {
                description: "Consultation médicale",
                quantite: 1,
                prix_unitaire: 20000,
                montant_total: 20000,
              },
              {
                description: "Actes et examens",
                quantite: 1,
                prix_unitaire: c.montant - 20000,
                montant_total: c.montant - 20000,
              },
            ],
          },
        },
      });
    }
  }

  console.log("📋 8 consultations + factures créées");

  // ----------------------------------------------------------
  // RÉSUMÉ FINAL
  // ----------------------------------------------------------
  console.log("\n✅ Seed terminé avec succès !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏥 Hôpital  : ${hospital.nom}`);
  console.log(`👥 Users    : 5 (admin, 2 médecins, infirmier, comptable)`);
  console.log(`🧑 Patients : 10`);
  console.log(`📋 Consult. : 8`);
  console.log(`💊 Prescr.  : 16`);
  console.log(`🧾 Factures : 6 (consultations terminées)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📧 Comptes de démo :");
  console.log("   admin@elrapha.ga  → ADMIN");
  console.log("   p.nguema@elrapha.ga → MÉDECIN");
  console.log("   s.mba@elrapha.ga  → MÉDECIN");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });