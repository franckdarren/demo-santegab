"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { destinationApresConnexion } from "@/lib/redirection";
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
  const searchParams = useSearchParams();
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

    // Redirige vers l'URL d'origine (QR Code, etc.) ou le dashboard par défaut
    // destinationApresConnexion() rejette les URLs externes et la racine "/"
    const destination = destinationApresConnexion(searchParams.get("next"));
    router.push(destination);
    router.refresh();
  }

  return (
    <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
      <CardContent className="p-6 space-y-6">

        {/* HEADER */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Connexion
          </h2>
          <p className="text-sm text-slate-500">
            Accédez à votre espace sécurisé
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* EMAIL */}
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-700">Email</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition" />
              <Input
                type="email"
                placeholder="ex: medecin@hopital.ga"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="pl-10 h-11 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600 transition"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-700">Mot de passe</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="pl-10 pr-10 h-11 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-transform active:scale-[0.98]"
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
          <p className="text-xs text-center text-slate-400">
            🔒 Vos données sont chiffrées et sécurisées
          </p>

          {/* DEMO ACCOUNTS */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <p className="text-xs text-center text-slate-500">
              Accès rapide (démo)
            </p>

            <div className="grid gap-2">
              {[
                { email: "admin@elrapha.ga", role: "Administrateur" },
                { email: "p.nguema@elrapha.ga", role: "Médecin" },
                { email: "jp.obame@elrapha.ga", role: "Infirmier" },
                { email: "c.ella@elrapha.ga", role: "Comptable" },
                { email: "b.bourobou@elrapha.ga", role: "Laborantin" },
                { email: "f.moussavou@elrapha.ga", role: "Pharmacien" },



              ].map((compte) => (
                <button
                  key={compte.email}
                  type="button"
                  onClick={() => {
                    setEmail(compte.email);
                    setPassword("password");
                  }}
                  className="text-left p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition"
                >
                  <p className="text-sm text-slate-900 font-medium">
                    {compte.role}
                  </p>
                  <p className="text-xs text-slate-500">
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