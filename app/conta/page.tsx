import { AccountView } from "@/components/account-view";
import { SiteShell } from "@/components/site-shell";

export default function AccountPage() {
  return (
    <SiteShell
      title="Área do cliente"
      subtitle="Cadastro, edição de dados e histórico de locações"
    >
      <AccountView />
    </SiteShell>
  );
}
