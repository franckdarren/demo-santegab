"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Identifiants incorrects. Vérifiez et réessayez.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl rounded-2xl">
      <CardContent className="p-6 space-y-6">

        {/* HEADER */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-semibold text-white">
            Connexion
          </h2>
          <p className="text-sm text-blue-200/70">
            Accédez à votre espace sécurisé
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* EMAIL */}
          <div className="space-y-1.5">
            <Label className="text-sm text-blue-100">Email</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/60 group-focus-within:text-cyan-400 transition" />
              <Input
                type="email"
                placeholder="ex: medecin@hopital.ga"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-blue-300/40 focus:border-cyan-400 focus:ring-cyan-400 transition"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <Label className="text-sm text-blue-100">Mot de passe</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/60 group-focus-within:text-cyan-400 transition" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-blue-300/40 focus:border-cyan-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-transform active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>

          {/* SECURITY NOTE */}
          <p className="text-xs text-center text-blue-300/50">
            🔒 Vos données sont chiffrées et sécurisées
          </p>

          {/* DEMO ACCOUNTS */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <p className="text-xs text-center text-blue-300/60">
              Accès rapide (démo)
            </p>

            <div className="grid gap-2">
              {[
                { email: "admin@elrapha.ga", role: "Administrateur" },
                { email: "p.nguema@elrapha.ga", role: "Médecin" },
              ].map((compte) => (
                <button
                  key={compte.email}
                  type="button"
                  onClick={() => {
                    setEmail(compte.email);
                    setPassword("Demo@2026!");
                  }}
                  className="text-left p-3 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 transition"
                >
                  <p className="text-sm text-white font-medium">
                    {compte.role}
                  </p>
                  <p className="text-xs text-blue-300/60">
                    {compte.email}
                  </p>
                </button>
              ))}
            </div>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}