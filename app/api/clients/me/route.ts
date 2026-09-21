import { z } from "zod";

import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getClientById, updateClient } from "@/lib/storage";

const schema = z.object({
  name: z.string().min(3),
  phone: z.string().min(8),
  document: z.string().min(5),
  address: z.string().min(8),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "client") {
    return jsonError("Faça login para continuar.", 401);
  }

  const client = await getClientById(session.id);
  if (!client) {
    return jsonError("Cliente não encontrado.", 404);
  }
  return jsonOk({ client });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "client") {
    return jsonError("Faça login para continuar.", 401);
  }
  const payload = schema.safeParse(await request.json());
  if (!payload.success) {
    return jsonError("Dados de perfil inválidos.", 400);
  }
  const client = await updateClient(session.id, payload.data);
  return jsonOk({ client });
}
