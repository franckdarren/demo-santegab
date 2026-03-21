// ============================================================
// QR TOKEN — Génération et vérification JWT sécurisés
// ============================================================

import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.QR_TOKEN_SECRET ?? "santegab-qr-secret-key-2025-gabon"
);

const DUREE_HEURES = 24;

export async function genererQrToken(
  patientId: string,
  hospitalId: string,
  creePar: string
): Promise<{ token: string; expireAt: Date }> {
  // crypto.randomUUID() est natif Node.js — pas de dépendance externe
  const tokenId = crypto.randomUUID();
  const expireAt = new Date(Date.now() + DUREE_HEURES * 60 * 60 * 1000);

  const token = await new SignJWT({
    patient_id: patientId,
    hospital_id: hospitalId,
    cree_par: creePar,
    jti: tokenId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_HEURES}h`)
    .sign(SECRET);

  return { token, expireAt };
}

export async function verifierQrToken(token: string): Promise<{
  patient_id: string;
  hospital_id: string;
  cree_par: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      patient_id: payload.patient_id as string,
      hospital_id: payload.hospital_id as string,
      cree_par: payload.cree_par as string,
    };
  } catch {
    return null;
  }
}