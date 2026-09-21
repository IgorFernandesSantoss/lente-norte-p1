"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function Catalog({ products }: { products: Product[] }) {
  const [notice, setNotice] = useState<string>("");
  const { addItem, totalItems } = useCart();

  const stockLabel = useMemo(
    () =>
      totalItems > 0
        ? `${totalItems} item(ns) no carrinho`
        : "Carrinho vazio no momento",
    [totalItems]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
        <p className="font-medium text-slate-100">Resumo rápido</p>
        <p>{stockLabel}</p>
        {notice ? <p className="mt-2 text-emerald-300">{notice}</p> : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm"
          >
            <div className="relative h-48 w-full bg-slate-800">
              <Image
                fill
                className="object-cover"
                src={product.imageUrls[0] ?? "/placeholder.svg"}
                alt={`${product.brand} ${product.model}`}
              />
            </div>
            <div className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-300">{product.brand}</p>
              <h3 className="text-lg font-semibold text-slate-100">{product.model}</h3>
              <p className="text-slate-300">R$ {product.price.toFixed(2)} / diária</p>
              <p className="text-sm text-slate-400">Disponível: {product.quantity}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                  type="button"
                  onClick={() => {
                    if (product.quantity <= 0) {
                      setNotice(`"${product.model}" está sem estoque.`);
                      return;
                    }
                    addItem({
                      productId: product.id,
                      quantity: 1,
                      expectedPrice: product.price,
                    });
                    setNotice(`"${product.model}" adicionado ao carrinho.`);
                  }}
                >
                  Adicionar
                </button>
                <Link
                  href={`/produto/${product.id}`}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
