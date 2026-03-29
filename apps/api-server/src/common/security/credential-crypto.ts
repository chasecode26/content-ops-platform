import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_PREFIX = "enc:v1";

type CredentialRecord = Record<string, string>;

function buildKey(): Buffer {
  const raw = process.env.ACCOUNT_CREDENTIAL_ENCRYPTION_KEY;
  if (!raw || raw.trim().length < 16) {
    throw new Error("ACCOUNT_CREDENTIAL_ENCRYPTION_KEY_MISSING_OR_TOO_SHORT");
  }
  return createHash("sha256").update(raw, "utf-8").digest();
}

export function encryptCredentials(credentials: CredentialRecord): string {
  const key = buildKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.from(JSON.stringify(credentials), "utf-8");
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptCredentials(ciphertext: string | null): CredentialRecord | undefined {
  if (!ciphertext) {
    return undefined;
  }

  try {
    if (ciphertext.startsWith(`${ENCRYPTION_PREFIX}:`)) {
      const [, , ivB64, tagB64, bodyB64] = ciphertext.split(":");
      if (!ivB64 || !tagB64 || !bodyB64) {
        return undefined;
      }
      const key = buildKey();
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
      decipher.setAuthTag(Buffer.from(tagB64, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(bodyB64, "base64")),
        decipher.final(),
      ]).toString("utf-8");

      const json = JSON.parse(plaintext) as CredentialRecord;
      return json;
    }

    // Backward compatibility: old records are base64(JSON).
    const legacyPlain = Buffer.from(ciphertext, "base64").toString("utf-8");
    return JSON.parse(legacyPlain) as CredentialRecord;
  } catch {
    return undefined;
  }
}

export function maskSecret(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.length <= 8) {
    return `${value.slice(0, 1)}***${value.slice(-1)}`;
  }
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}
