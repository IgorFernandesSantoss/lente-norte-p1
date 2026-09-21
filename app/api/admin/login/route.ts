import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = schema.safeParse(await request.json());
  if (!payload.success) {
    return jsonError("Credenciais inválidas.", 400);
  }

  if (
    payload.data.email !== env.adminEmail ||
    payload.data.password !== env.adminPassword
  ) {
    return jsonError("Credenciais inválidas.", 401);
  }

  await setSessionCookie({
    id: "admin",
    role: "admin",
    name: "Administrador",
    issuedAt: new Date().toISOString(),
  });
  return jsonOk({ ok: true });
}
