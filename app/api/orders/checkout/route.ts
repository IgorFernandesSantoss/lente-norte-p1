import { z } from "zod";

import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import {
  createOrder,
  decreaseStock,
  getClientById,
  validateCartAndBuildOrderItems,
} from "@/lib/storage";

const payloadSchema = z.object({
  paymentMethod: z.enum(["pix", "cartao", "dinheiro"]),
  deliveryMethod: z.enum(["retirada", "entrega"]),
  cart: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      expectedPrice: z.number().positive(),
    })
  ),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "client") {
    return jsonError("Faça login para finalizar o checkout.", 401);
  }

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return jsonError("Dados de checkout inválidos.", 400);
  }

  const client = await getClientById(session.id);
  if (!client) {
    return jsonError("Cliente não encontrado.", 404);
  }

  try {
    const { items, total } = await validateCartAndBuildOrderItems(payload.data.cart);
    await decreaseStock(payload.data.cart);
    const orderId = await createOrder({
      clientId: client.id,
      clientName: client.name,
      items,
      totalValue: total,
      paymentMethod: payload.data.paymentMethod,
      deliveryMethod: payload.data.deliveryMethod,
    });
    return jsonOk({
      orderId,
      total,
    });
  } catch (error) {
    return jsonError(String(error instanceof Error ? error.message : error), 400);
  }
}
