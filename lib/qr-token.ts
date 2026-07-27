// ============================================================
// QR TOKEN — Génération et vérification JWT sécurisés
// ============================================================

import { SignJWT, jwtVerify } from "jose";

// ============================================================
// SECRET DE SIGNATURE
//
// ⚠️ Le secret de repli ci-dessous est versionné dans le dépôt,
// donc public. Il dépanne en développement, mais signer avec lui
// des jetons d'accès à des données médicales serait une faute.
//
// La vérification a lieu à la GÉNÉRATION d'un jeton, et non au
// chargement du module : un build ne doit pas échouer pour une
// variable d'environnement absente de la machine de build, alors
// qu'aucun jeton n'y est créé.
// ============================================================
const SECRET_REPLI = "santegab-qr-secret-key-2025-gabon";

const SECRET = new TextEncoder().encode(
  process.env.QR_TOKEN_SECRET ?? SECRET_REPLI
);

// Refuse d'émettre un jeton signé avec le secret public en production
function verifierSecretConfigure(): void {
  if (process.env.QR_TOKEN_SECRET) return;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "QR_TOKEN_SECRET est absent. Impossible de générer un QR Code : " +
      "définissez cette variable d'environnement en production."
    );
  }

  console.warn(
    "[QR] QR_TOKEN_SECRET absent — secret de repli utilisé. " +
    "À NE JAMAIS laisser ainsi en production."
  );
}

const DUREE_HEURES = 24;

export async function genererQrToken(
  patientId: string,
  hospitalId: string,
  creePar: string
): Promise<{ token: string; expireAt: Date }> {
  verifierSecretConfigure();

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