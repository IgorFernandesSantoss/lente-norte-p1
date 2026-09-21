"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function CartView() {
  const { items, removeItem, updateItemQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.products ?? []);
      setLoading(false);
    };
    run();
  }, []);

  const lines = useMemo(() => {
    return items
      .map((cartItem) => {
        const product = products.find((item) => item.id === cartItem.productId);
        if (!product) return null;
        return {
          product,
          quantity: cartItem.quantity,
          subtotal: cartItem.quantity * product.price,
        };
      })
      .filter(Boolean) as Array<{
      product: Product;
      quantity: number;
      subtotal: number;
    }>;
  }, [items, products]);

  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);

  if (loading) {
    return <p className="text-slate-400">Carregando carrinho...</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-slate-300">Seu carrinho está vazio.</p>
        <Link className="mt-3 inline-flex text-amber-300 hover:text-amber-200" href="/">
          Ir para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lines.map((line) => (
        <article
          key={line.product.id}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-300">
                {line.product.brand}
              </p>
              <h3 className="text-lg font-medium">{line.product.model}</h3>
              <p className="text-sm text-slate-400">
                R$ {line.product.price.toFixed(2)} por diária
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-slate-700 px-2 py-1 text-sm"
                onClick={() => updateItemQuantity(line.product.id, line.quantity - 1)}
              >
                -
              </button>
              <span>{line.quantity}</span>
              <button
                type="button"
                className="rounded border border-slate-700 px-2 py-1 text-sm"
                onClick={() => updateItemQuantity(line.product.id, line.quantity + 1)}
              >
                +
              </button>
              <button
                type="button"
                className="rounded border border-rose-800 px-2 py-1 text-sm text-rose-300"
                onClick={() => removeItem(line.product.id)}
              >
                remover
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Subtotal: R$ {line.subtotal.toFixed(2)}
          </p>
        </article>
      ))}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-lg font-semibold">Total estimado: R$ {total.toFixed(2)}</p>
        <Link
          href="/checkout"
          className="mt-3 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Ir para checkout
        </Link>
      </div>
    </div>
  );
}
