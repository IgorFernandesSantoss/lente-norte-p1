"use client";

import { useMemo, useState } from "react";

import type { CartItem } from "@/lib/types";

const cartKey = "lente-norte-cart";

const readCart = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(cartKey);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartKey, JSON.stringify(items));
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  const sync = (nextItems: CartItem[]) => {
    setItems(nextItems);
    writeCart(nextItems);
  };

  const addItem = (input: CartItem) => {
    const found = items.find((item) => item.productId === input.productId);
    if (!found) {
      sync([...items, input]);
      return;
    }
    sync(
      items.map((item) =>
        item.productId === input.productId
          ? { ...item, quantity: item.quantity + input.quantity }
          : item
      )
    );
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    sync(items.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  };

  const removeItem = (productId: string) => {
    sync(items.filter((item) => item.productId !== productId));
  };

  const clear = () => sync([]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return { items, addItem, updateItemQuantity, removeItem, clear, totalItems };
};
