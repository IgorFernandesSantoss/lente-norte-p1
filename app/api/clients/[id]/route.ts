import { z } from "zod";

import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { deleteClient, getClientById, updateClient } from "@/lib/storage";

const clientUpdateSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(8),
  document: z.string().min(5),
  address: z.string().min(8),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }

  const { id } = await params;
  const payload = clientUpdateSchema.safeParse(await request.json());
  if (!payload.success) {
    return jsonError("Dados de cliente inválidos.", 400);
  }

  const existing = await getClientById(id);
  if (!existing) {
    return jsonError("Cliente não encontrado.", 404);
  }

  const client = await updateClient(id, payload.data);
  return jsonOk({ client });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }
  const { id } = await params;
  await deleteClient(id);
  return jsonOk({ ok: true });
}
