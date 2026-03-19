// ============================================================
// UTILITAIRES GLOBAUX
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Fonction standard Shadcn pour fusionner les classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formate une date en français
// Exemple : formatDate(new Date()) → "15 janvier 2025"
export function formatDate(date: Date | string): string {
  return format(new Date(date), "d MMMM yyyy", { locale: fr });
}

// Formate un montant en Francs CFA
// Exemple : formatCurrency(15000) → "15 000 XAF"
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-GA", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Formate une heure
// Exemple : formatTime(new Date()) → "14:30"
export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm", { locale: fr });
}

// Génère les initiales d'un nom complet pour les avatars
// Exemple : getInitials("Jean Dupont") → "JD"
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}