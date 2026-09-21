import { AdminView } from "@/components/admin-view";
import { SiteShell } from "@/components/site-shell";

export default function AdminPage() {
  return (
    <SiteShell
      title="Painel administrativo"
      subtitle="Gerenciamento de produtos, clientes e pedidos"
    >
      <AdminView />
    </SiteShell>
  );
}
