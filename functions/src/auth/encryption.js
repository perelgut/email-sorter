// ── src/auth/encryption.js ────────────────────────────────────────────────────
// AES-256-GCM encryption/decryption for OAuth tokens and IMAP credentials.
// Key is read from ENCRYPTION_SECRET environment variable (32 chars).
// Format: iv_hex:ciphertext_hex:authtag_hex
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ENCRYPTION_SECRET must be at least 32 characters");
  }
  // Use exactly 32 bytes for AES-256
  return Buffer.from(secret.slice(0, 32), "utf8");
}

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {string} iv:ciphertext:authtag (all hex)
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

/**
 * Decrypt a string produced by encrypt().
 * @param {string} encryptedString
 * @returns {string} plaintext
 */
function decrypt(encryptedString) {
  const key = getKey();
  const parts = encryptedString.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted string format");
  const [ivHex, ciphertextHex, authTagHex] = parts;
  const iv         = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const authTag    = Buffer.from(authTagHex, "hex");
  const decipher   = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
