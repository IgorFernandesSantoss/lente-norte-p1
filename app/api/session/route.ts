import { getSession } from "@/lib/auth";
import { jsonOk } from "@/lib/http";
import { getClientById } from "@/lib/storage";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonOk({ session: null });
  }

  if (session.role === "admin") {
    return jsonOk({ session: { ...session, isAdmin: true } });
  }

  const client = await getClientById(session.id);
  return jsonOk({ session: { ...session, isAdmin: false, client } });
}
