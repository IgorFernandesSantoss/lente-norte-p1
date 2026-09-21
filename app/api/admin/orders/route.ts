import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { listOrders } from "@/lib/storage";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }
  const orders = await listOrders();
  return jsonOk({ orders });
}
