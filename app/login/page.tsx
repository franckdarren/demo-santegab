// ============================================================
// PAGE LOGIN — Version démo avec branding deux colonnes
// ============================================================

import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Activity, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-blue-700/20 blur-3xl" />
      </div>

      {/* -------------------------------------------------- */}
      {/* COLONNE GAUCHE — Branding (cachée sur mobile)      */}
      {/* -------------------------------------------------- */}
      <div className="relative hidden lg:flex lg:flex-1 flex-col justify-center p-12 text-white">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <span className="text-xl">🏥</span>
          </div>
          <div className="">
            <p className="font-bold text-lg tracking-wide">SANTÉGAB</p>
            <p className="text-blue-300 text-xs">Système d'Information Hospitalier</p>
          </div>
        </div>

        {/* Pitch central */}
        <div className="space-y-8 pt-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              La santé numérique
              <span className="text-cyan-400"> au Gabon</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-md">
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
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.titre}</p>
                    <p className="text-blue-300 text-xs mt-0.5">{f.desc}</p>
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
      <div className="relative flex-1 flex items-center justify-center p-6 lg:p-12 lg:max-w-lg">
        <div className="w-full max-w-md space-y-6">

          {/* Header mobile uniquement */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                <span className="text-xl">🏥</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-lg">SANTÉGAB</p>
                <p className="text-blue-300 text-xs">Gestion Hospitalière</p>
              </div>
            </div>
          </div>


          {/* Formulaire */}
          <LoginForm />

          {/* Footer */}
          <p className="text-center text-blue-300/50 text-xs">
            © 2026 SANTÉGAB — Gabon
          </p>
        </div>
      </div>

    </div>
  );
}