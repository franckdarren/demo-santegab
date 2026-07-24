// ============================================================
// PAGE LOGIN — Version professionnelle, branding deux colonnes
// ============================================================

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Activity, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white">

      {/* -------------------------------------------------- */}
      {/* COLONNE GAUCHE — Branding (cachée sur mobile)      */}
      {/* Fond uni sobre, sans dégradé                        */}
      {/* -------------------------------------------------- */}
      <div className="relative hidden lg:flex lg:flex-1 flex-col justify-center p-12 bg-slate-900 text-white">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
            <span className="text-xl">🏥</span>
          </div>
          <div>
            <p className="font-bold text-lg tracking-wide">SANTÉGAB</p>
            <p className="text-slate-400 text-xs">Système d'Information Hospitalier</p>
          </div>
        </div>

        {/* Pitch central */}
        <div className="space-y-8 pt-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              La santé numérique
              <span className="text-blue-400"> au Gabon</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              Plateforme unifiée de gestion hospitalière pour les
              structures de santé publiques et privées.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              {
                icon: Activity,
                titre: "Suivi en temps réel",
                desc: "Consultations, laboratoire, pharmacie",
              },
              {
                icon: Shield,
                titre: "Données sécurisées",
                desc: "Isolation stricte par établissement",
              },
              {
                icon: Users,
                titre: "Multi-établissements",
                desc: "Compatible CNAMGS, ASCOMA, AXA et plus",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.titre} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.titre}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* COLONNE DROITE — Formulaire                        */}
      {/* -------------------------------------------------- */}
      <div className="relative flex-1 flex items-center justify-center p-6 lg:p-12 lg:max-w-xl">
        <div className="w-full max-w-md space-y-6">

          {/* Header mobile uniquement */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <span className="text-xl">🏥</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 text-lg">SANTÉGAB</p>
                <p className="text-slate-500 text-xs">Gestion Hospitalière</p>
              </div>
            </div>
          </div>

          {/* Formulaire — Suspense requis par useSearchParams */}
          <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-xl" />}>
            <LoginForm />
          </Suspense>

          {/* Footer */}
          <p className="text-center text-slate-400 text-xs">
            © 2026 SANTÉGAB — Gabon
          </p>
        </div>
      </div>

    </div>
  );
}
