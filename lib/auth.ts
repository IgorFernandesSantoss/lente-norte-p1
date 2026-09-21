import crypto from "node:crypto";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { SessionPayload } from "@/lib/types";

const sessionCookieName = "ln_session";

const toBase64Url = (input: string) =>
  Buffer.from(input, "utf8").toString("base64url");

const fromBase64Url = (input: string) =>
  Buffer.from(input, "base64url").toString("utf8");

const sign = (payload: string) =>
  crypto.createHmac("sha256", env.sessionSecret).update(payload).digest("hex");

export const createSessionToken = (payload: SessionPayload) => {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const parseSessionToken = (token?: string): SessionPayload | null => {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }
};

export const setSessionCookie = async (payload: SessionPayload) => {
  const jar = await cookies();
  jar.set(sessionCookieName, createSessionToken(payload), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const clearSessionCookie = async () => {
  const jar = await cookies();
  jar.delete(sessionCookieName);
};

export const getSession = async () => {
  const jar = await cookies();
  return parseSessionToken(jar.get(sessionCookieName)?.value);
};
