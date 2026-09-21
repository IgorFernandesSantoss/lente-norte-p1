import { CheckoutView } from "@/components/checkout-view";
import { SiteShell } from "@/components/site-shell";

export default function CheckoutPage() {
  return (
    <SiteShell
      title="Checkout da locação"
      subtitle="Validamos valor e estoque no momento da finalização"
    >
      <CheckoutView />
    </SiteShell>
  );
}
