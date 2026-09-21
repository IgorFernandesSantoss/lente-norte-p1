import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { createClient, getClientEntityByEmail } from "@/lib/storage";

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  document: z.string().min(5),
  address: z.string().min(8),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await request.json());
  if (!payload.success) {
    return jsonError("Dados de cadastro inválidos.", 400);
  }

  const existing = await getClientEntityByEmail(payload.data.email);
  if (existing) {
    return jsonError("E-mail já cadastrado.", 409);
  }

  const client = await createClient({
    ...payload.data,
    passwordHash: hashPassword(payload.data.password),
  });

  if (!client) {
    return jsonError("Não foi possível criar o cliente.", 500);
  }

  await setSessionCookie({
    id: client.id,
    role: "client",
    name: client.name,
    issuedAt: new Date().toISOString(),
  });
  return jsonOk({ client }, { status: 201 });
}
