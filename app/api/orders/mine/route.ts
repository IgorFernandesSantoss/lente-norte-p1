import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { listClientOrders } from "@/lib/storage";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "client") {
    return jsonError("Faça login para continuar.", 401);
  }
  const orders = await listClientOrders(session.id);
  return jsonOk({ orders });
}
