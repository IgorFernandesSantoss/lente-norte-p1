"use client";

import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/lib/cart";
import type { CartItem, DeliveryMethod, PaymentMethod, Product } from "@/lib/types";

const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

const deliveryLabels: Record<DeliveryMethod, string> = {
  retirada: "Retirada na loja",
  entrega: "Entrega",
};

export function CheckoutView() {
  const { items, clear } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("retirada");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.products ?? []);
    };
    run();
  }, []);

  const lines = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((productItem) => productItem.id === item.productId);
          if (!product) return null;
          return {
            ...item,
            product,
            subtotal: item.quantity * product.price,
          };
        })
        .filter(Boolean) as Array<
        CartItem & {
          product: Product;
          subtotal: number;
        }
      >,
    [items, products]
  );

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.subtotal, 0),
    [lines]
  );

  const submitCheckout = async () => {
    if (!lines.length) {
      setStatus("Adicione itens no carrinho antes de finalizar.");
      return;
    }
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod,
        deliveryMethod,
        cart: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          expectedPrice: line.product.price,
        })),
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(data.error ?? "Falha ao concluir checkout.");
      return;
    }
    clear();
    setStatus(`Pedido ${data.orderId} confirmado com sucesso.`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Itens do pedido</h2>
        <div className="mt-3 space-y-2">
          {lines.map((line) => (
            <div key={line.productId} className="rounded-lg border border-slate-800 p-3">
              <p className="font-medium">{line.product.brand + " " + line.product.model}</p>
              <p className="text-sm text-slate-400">
                Quantidade: {line.quantity} | Unitário: R$ {line.product.price.toFixed(2)}
              </p>
              <p className="text-sm text-slate-300">Subtotal: R$ {line.subtotal.toFixed(2)}</p>
            </div>
          ))}
          <p className="pt-2 text-lg font-semibold">Total: R$ {total.toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Pagamento e entrega</h2>
        <label className="mt-3 block text-sm text-slate-300">Método de pagamento</label>
        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
          className="mt-1 w-full"
        >
          {Object.entries(paymentLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm text-slate-300">Método de entrega</label>
        <select
          value={deliveryMethod}
          onChange={(event) => setDeliveryMethod(event.target.value as DeliveryMethod)}
          className="mt-1 w-full"
        >
          {Object.entries(deliveryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          onClick={submitCheckout}
        >
          {loading ? "Finalizando..." : "Finalizar pedido"}
        </button>
        {status ? <p className="mt-3 text-sm text-slate-200">{status}</p> : null}
      </section>
    </div>
  );
}
