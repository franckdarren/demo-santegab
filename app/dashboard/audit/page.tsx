import { withPermission } from "@/lib/withPermission";
import {
  getAuditLogs,
  getStatsAudit,
  getUtilisateursPourFiltre,
} from "./actions";
import { AuditStats } from "@/components/audit/AuditStats";
import { AuditList } from "@/components/audit/AuditList";

export default async function AuditPage() {
  const utilisateur = await withPermission("AUDIT", "peut_voir");

  const [logs, stats, utilisateurs] = await Promise.all([
    getAuditLogs(utilisateur.hospital_id),
    getStatsAudit(utilisateur.hospital_id),
    getUtilisateursPourFiltre(utilisateur.hospital_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Journal d&apos;audit
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Traçabilité complète de toutes les actions utilisateurs
        </p>
      </div>

      <AuditStats stats={stats} />

      <AuditList
        logs={logs}
        utilisateurs={utilisateurs}
        hospitalId={utilisateur.hospital_id}
      />
    </div>
  );
}