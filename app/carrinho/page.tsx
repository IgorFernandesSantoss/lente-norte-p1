import { CartView } from "@/components/cart-view";
import { SiteShell } from "@/components/site-shell";

export default function CartPage() {
  return (
    <SiteShell title="Carrinho de locação" subtitle="Revise quantidades e valores antes do checkout">
      <CartView />
    </SiteShell>
  );
}
