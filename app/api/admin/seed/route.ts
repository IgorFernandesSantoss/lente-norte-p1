import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createInitialProducts } from "@/lib/storage";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }
  const created = await createInitialProducts();
  return jsonOk({ created });
}
