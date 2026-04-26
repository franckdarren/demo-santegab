// ============================================================
// PAGE CATALOGUE EXAMENS LABO — CRUD par famille
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { getCatalogue } from "./actions";
import { CatalogueExamens } from "@/components/laboratory/CatalogueExamens";

export default async function CataloguePage() {
  const utilisateur = await withPermission("LABORATOIRE", "peut_voir");

  const estAdmin =
    utilisateur.role === "ADMIN" || utilisateur.role === "SUPER_ADMIN";

  const catalogue = await getCatalogue(utilisateur.hospital_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Catalogue d'examens
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gérez les examens biologiques et leurs tarifs
        </p>
      </div>

      <CatalogueExamens
        catalogue={catalogue}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        peutModifier={estAdmin || utilisateur.role === "LABORANTIN"}
      />
    </div>
  );
}
