import crypto from "node:crypto";

export const hashPassword = (plain: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (plain: string, combined: string) => {
  const [salt, expectedHash] = combined.split(":");
  if (!salt || !expectedHash) {
    return false;
  }
  const currentHash = crypto
    .pbkdf2Sync(plain, salt, 100000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(expectedHash));
};
