import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { getClientEntityByEmail } from "@/lib/storage";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json());
  if (!payload.success) {
    return jsonError("Credenciais inválidas.", 400);
  }

  const entity = await getClientEntityByEmail(payload.data.email);
  if (!entity) {
    return jsonError("Usuário ou senha inválidos.", 401);
  }

  const isValid = verifyPassword(
    payload.data.password,
    String(entity.passwordHash ?? "")
  );
  if (!isValid) {
    return jsonError("Usuário ou senha inválidos.", 401);
  }

  await setSessionCookie({
    id: String(entity.rowKey),
    role: "client",
    name: String(entity.name ?? "Cliente"),
    issuedAt: new Date().toISOString(),
  });

  return jsonOk({
    client: {
      id: String(entity.rowKey),
      name: String(entity.name ?? ""),
      email: String(entity.email ?? ""),
      phone: String(entity.phone ?? ""),
      document: String(entity.document ?? ""),
      address: String(entity.address ?? ""),
      createdAt: String(entity.createdAt ?? ""),
    },
  });
}
