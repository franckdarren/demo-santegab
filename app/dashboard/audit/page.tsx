import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  getAuditLogs,
  getStatsAudit,
  getUtilisateursPourFiltre,
} from "./actions";
import { AuditStats } from "@/components/audit/AuditStats";
import { AuditList } from "@/components/audit/AuditList";

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  // Seuls les admins ont accès
  if (utilisateur.role !== "ADMIN" && utilisateur.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

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