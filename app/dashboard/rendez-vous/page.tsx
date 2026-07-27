// ============================================================
// PAGE RENDEZ-VOUS — Calendrier médical
//
// Répond à l'exigence §5.7 du cahier des charges KIMBA.
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { startOfWeek, endOfWeek, startOfDay, parseISO, isValid } from "date-fns";
import { getRendezVous } from "./actions";
import {
  getMedecins,
  getPatientsHospital,
  getServicesConsultation,
} from "@/app/dashboard/consultations/actions";
import { CalendrierMedical } from "@/components/rendez-vous/CalendrierMedical";

interface RendezVousPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function RendezVousPage({
  searchParams,
}: RendezVousPageProps) {
  const utilisateur = await withPermission("RENDEZ_VOUS", "peut_voir");

  const { date } = await searchParams;

  // ----------------------------------------------------------
  // Jour affiché : celui de l'URL, sinon aujourd'hui.
  // parseISO gère le format YYYY-MM-DD en heure locale ;
  // isValid protège contre un paramètre d'URL farfelu.
  // ----------------------------------------------------------
  const dateUrl = date ? parseISO(date) : null;
  const jourSelectionne =
    dateUrl && isValid(dateUrl) ? startOfDay(dateUrl) : startOfDay(new Date());

  // ----------------------------------------------------------
  // On charge toute la semaine en une seule requête : le bandeau
  // du calendrier affiche le nombre de rendez-vous par jour.
  // Semaine du lundi au dimanche (weekStartsOn: 1).
  // ----------------------------------------------------------
  const debutSemaine = startOfWeek(jourSelectionne, { weekStartsOn: 1 });
  const finSemaine   = endOfWeek(jourSelectionne, { weekStartsOn: 1 });

  const [rendezVous, medecins, patients, services, perms] = await Promise.all([
    getRendezVous(utilisateur.hospital_id, debutSemaine, finSemaine),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    getServicesConsultation(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "RENDEZ_VOUS",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <CalendrierMedical
      rendezVousSemaine={rendezVous}
      debutSemaine={debutSemaine}
      jourSelectionne={jourSelectionne}
      hospitalId={utilisateur.hospital_id}
      utilisateurId={utilisateur.id}
      utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
      medecins={medecins}
      patients={patients}
      services={services}
      peutCreer={perms.peut_creer}
      peutModifier={perms.peut_modifier}
    />
  );
}
