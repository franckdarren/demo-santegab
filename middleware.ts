// ============================================================
// MIDDLEWARE — Protection des routes
//
// Vérifie à chaque requête si l'utilisateur est connecté.
// Si non connecté → redirige vers /login
// Si connecté sur /login → redirige vers /dashboard
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { destinationApresConnexion } from "@/lib/redirection";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupère la session utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes publiques — accessibles sans authentification
  const routesPubliques = ["/login", "/carnet"];
  const estPublique = routesPubliques.some((r) => pathname.startsWith(r));

  // Si non connecté et route protégée → redirige vers /login avec l'URL d'origine
  if (!user && !estPublique) {
    const loginUrl = new URL("/login", request.url);
    // On ne mémorise pas la racine : elle ne contient aucune page utile,
    // sinon la connexion renverrait sur "/" au lieu du dashboard
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Si connecté et sur /login → redirige vers /dashboard (ou next si valide)
  if (user && pathname === "/login") {
    const destination = destinationApresConnexion(
      request.nextUrl.searchParams.get("next")
    );
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return supabaseResponse;
}

// Applique le middleware sur toutes les routes sauf assets statiques
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};