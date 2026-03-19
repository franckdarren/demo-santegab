// ============================================================
// PAGE LOGIN — Authentification Supabase (UI/UX améliorée)
// ============================================================

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-blue-700/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg mb-4 transition-transform hover:scale-105">
            <span className="text-3xl">🏥</span>
          </div> */}

          <h1 className="text-3xl font-bold text-white tracking-tight">
            SANTÉGAB
          </h1>

          <p className="text-blue-200 mt-2 text-sm">
            Plateforme hospitalière sécurisée
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-blue-300/70">
            <span>🔒</span>
            <span>Connexion sécurisée</span>
          </div>
        </div>

        {/* Card */}
        <div className="">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/50 text-xs mt-6">
          © 2026 SANTÉGAB — Gabon
        </p>
      </div>
    </div>
  );
}