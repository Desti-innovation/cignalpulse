require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

// --- COPY THIS LOGIC FROM lib/phone-crypto.ts ---
const ENCRYPTION_KEY = Buffer.from(process.env.PHONE_ENCRYPTION_KEY || "", "base64");
const HASH_SECRET = process.env.PHONE_HASH_SECRET || "";

function normalizePhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 10 && !phone.startsWith("+")) {
    return `233${digits.slice(-9)}`;
  }
  return digits;
}

function encryptPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(normalized, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptPhone(encryptedData) {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function hashPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  return crypto.createHmac("sha256", HASH_SECRET).update(normalized).digest("hex");
}

// --- RUN THE TEST ---
const testNumber = "+233 59 342 5854";
console.log("Original:", testNumber);
console.log("Normalized:", normalizePhoneNumber(testNumber));

const encrypted = encryptPhone(testNumber);
console.log("Encrypted:", encrypted);

const decrypted = decryptPhone(encrypted);
console.log("Decrypted:", decrypted);

const hash = hashPhone(testNumber);
console.log("Hash:", hash);

console.log("\n--- RESULT ---");
console.log(decrypted === normalizePhoneNumber(testNumber) ? "✅ SUCCESS: Decryption matches!" : "❌ FAILED: Mismatch!");