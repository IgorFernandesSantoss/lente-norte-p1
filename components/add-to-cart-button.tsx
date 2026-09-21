"use client";

import { useState } from "react";

import { useCart } from "@/lib/cart";

export function AddToCartButton({
  productId,
  price,
  disabled,
}: {
  productId: string;
  price: number;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const { addItem } = useCart();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        onClick={() => {
          addItem({ productId, quantity: 1, expectedPrice: price });
          setMessage("Item adicionado ao carrinho.");
        }}
      >
        Adicionar ao carrinho
      </button>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
    </div>
  );
}
