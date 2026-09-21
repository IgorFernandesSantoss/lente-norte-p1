"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { Client, Order, Product } from "@/lib/types";

type Session = {
  id: string;
  role: "client" | "admin";
  name: string;
  isAdmin: boolean;
};

const emptyProduct = {
  brand: "",
  model: "",
  price: "",
  quantity: "",
};

const emptyClientForm = {
  name: "",
  phone: "",
  document: "",
  address: "",
};

export function AdminView() {
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [keptBlobs, setKeptBlobs] = useState<string[]>([]);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState(emptyClientForm);

  const refreshSession = async () => {
    const response = await fetch("/api/session");
    const data = await response.json();
    setSession(data.session);
  };

  const refreshData = async () => {
    const [productsRes, clientsRes, ordersRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/admin/clients"),
      fetch("/api/admin/orders"),
    ]);
    const productsData = await productsRes.json();
    setProducts(productsData.products ?? []);
    if (clientsRes.ok) {
      const clientsData = await clientsRes.json();
      setClients(clientsData.clients ?? []);
    }
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders ?? []);
    }
  };

  useEffect(() => {
    const run = async () => {
      await refreshSession();
    };
    run();
  }, []);

  useEffect(() => {
    if (session?.role !== "admin") return;
    const timer = window.setTimeout(() => {
      void refreshData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [session]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha no login de admin.");
      return;
    }
    setMessage("Sessão administrativa iniciada.");
    await refreshSession();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession(null);
    setMessage("Sessão administrativa encerrada.");
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("brand", productForm.brand);
    formData.set("model", productForm.model);
    formData.set("price", productForm.price);
    formData.set("quantity", productForm.quantity);
    if (imageFiles) {
      Array.from(imageFiles).forEach((file) => formData.append("images", file));
    }
    if (editingProductId) {
      formData.set("keptBlobs", JSON.stringify(keptBlobs));
    }

    const response = await fetch(
      editingProductId ? `/api/products/${editingProductId}` : "/api/products",
      {
        method: editingProductId ? "PUT" : "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha ao salvar produto.");
      return;
    }
    setMessage(editingProductId ? "Produto atualizado." : "Produto criado.");
    setProductForm(emptyProduct);
    setImageFiles(null);
    setEditingProductId(null);
    setKeptBlobs([]);
    await refreshData();
  };

  const deleteProduct = async (id: string) => {
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Falha ao excluir produto.");
      return;
    }
    setMessage("Produto excluído.");
    await refreshData();
  };

  const deleteClient = async (id: string) => {
    const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Falha ao excluir cliente.");
      return;
    }
    setMessage("Cliente excluído.");
    await refreshData();
  };

  const submitClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClientId) {
      setMessage("Selecione um cliente para editar.");
      return;
    }

    const response = await fetch(`/api/clients/${editingClientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha ao atualizar cliente.");
      return;
    }
    setMessage("Cliente atualizado.");
    setEditingClientId(null);
    setClientForm(emptyClientForm);
    await refreshData();
  };

  const runSeed = async () => {
    const response = await fetch("/api/admin/seed", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha ao executar seed.");
      return;
    }
    setMessage(data.created ? "Seed aplicada com sucesso." : "Seed já estava aplicada.");
    await refreshData();
  };

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalValue, 0),
    [orders]
  );

  if (session?.role !== "admin") {
    return (
      <section className="mx-auto max-w-lg rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Acesso administrativo</h2>
        <form className="mt-3 space-y-2" onSubmit={login}>
          <input
            type="email"
            value={loginForm.email}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email de admin"
            required
          />
          <input
            type="password"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Senha de admin"
            required
          />
          <button className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Entrar no painel
          </button>
        </form>
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Credenciais para avaliação local</p>
          <p>E-mail: admin@lentenorte.local</p>
          <p>Senha: admin123</p>
        </div>
        {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Painel administrativo</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
              onClick={runSeed}
            >
              Seed de produtos
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
              onClick={logout}
            >
              Sair
            </button>
          </div>
        </div>
        {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <form
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
          onSubmit={submitProduct}
        >
          <h3 className="text-lg font-semibold">
            {editingProductId ? "Editar produto" : "Novo produto"}
          </h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input
              placeholder="Marca"
              value={productForm.brand}
              onChange={(event) => setProductForm((prev) => ({ ...prev, brand: event.target.value }))}
              required
            />
            <input
              placeholder="Modelo"
              value={productForm.model}
              onChange={(event) => setProductForm((prev) => ({ ...prev, model: event.target.value }))}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={productForm.quantity}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, quantity: event.target.value }))
              }
              required
            />
          </div>
          <label className="mt-3 block text-sm text-slate-300">Fotos do produto</label>
          <input
            className="mt-1 w-full"
            type="file"
            multiple
            accept="image/*,.svg"
            onChange={(event) => setImageFiles(event.target.files)}
          />
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">
              {editingProductId ? "Salvar alterações" : "Cadastrar produto"}
            </button>
            {editingProductId ? (
              <button
                type="button"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm(emptyProduct);
                  setKeptBlobs([]);
                }}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-lg font-semibold">Pedidos</h3>
          <p className="text-sm text-slate-400">
            Total de pedidos: {orders.length} | Receita bruta: R$ {totalRevenue.toFixed(2)}
          </p>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-slate-800 p-3 text-sm">
                <p className="font-medium">{order.clientName}</p>
                <p className="text-slate-400">
                  {new Date(order.createdAt).toLocaleString()} | {order.paymentMethod} |{" "}
                  {order.deliveryMethod}
                </p>
                <p className="text-slate-300">R$ {order.totalValue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-lg font-semibold">Produtos cadastrados</h3>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
            {products.map((product) => (
              <div key={product.id} className="rounded-lg border border-slate-800 p-3 text-sm">
                <p className="font-medium">
                  {product.brand} {product.model}
                </p>
                <p className="text-slate-400">
                  Estoque: {product.quantity} | R$ {product.price.toFixed(2)}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-700 px-2 py-1"
                    onClick={() => {
                      setEditingProductId(product.id);
                      setProductForm({
                        brand: product.brand,
                        model: product.model,
                        price: String(product.price),
                        quantity: String(product.quantity),
                      });
                      setKeptBlobs(product.imageBlobNames);
                    }}
                  >
                    editar
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rose-800 px-2 py-1 text-rose-300"
                    onClick={() => deleteProduct(product.id)}
                  >
                    excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-lg font-semibold">Clientes cadastrados</h3>
          <form className="mt-3 space-y-2 rounded-lg border border-slate-800 p-3" onSubmit={submitClient}>
            <p className="text-sm text-slate-300">
              {editingClientId ? "Editando cliente selecionado" : "Selecione um cliente para editar"}
            </p>
            <input
              placeholder="Nome"
              value={clientForm.name}
              onChange={(event) => setClientForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              disabled={!editingClientId}
            />
            <input
              placeholder="Telefone"
              value={clientForm.phone}
              onChange={(event) => setClientForm((prev) => ({ ...prev, phone: event.target.value }))}
              required
              disabled={!editingClientId}
            />
            <input
              placeholder="Documento"
              value={clientForm.document}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, document: event.target.value }))
              }
              required
              disabled={!editingClientId}
            />
            <textarea
              placeholder="Endereço"
              value={clientForm.address}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, address: event.target.value }))
              }
              required
              disabled={!editingClientId}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded border border-emerald-700 px-3 py-1 text-sm text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!editingClientId}
              >
                Salvar cliente
              </button>
              <button
                type="button"
                className="rounded border border-slate-700 px-3 py-1 text-sm"
                onClick={() => {
                  setEditingClientId(null);
                  setClientForm(emptyClientForm);
                }}
                disabled={!editingClientId}
              >
                Cancelar
              </button>
            </div>
          </form>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
            {clients.map((client) => (
              <div key={client.id} className="rounded-lg border border-slate-800 p-3 text-sm">
                <p className="font-medium">{client.name}</p>
                <p className="text-slate-400">{client.email}</p>
                <p className="text-slate-400">{client.phone}</p>
                <button
                  type="button"
                  className="mt-2 rounded border border-slate-700 px-2 py-1 text-slate-200"
                  onClick={() => {
                    setEditingClientId(client.id);
                    setClientForm({
                      name: client.name,
                      phone: client.phone,
                      document: client.document,
                      address: client.address,
                    });
                  }}
                >
                  editar cliente
                </button>
                <button
                  type="button"
                  className="mt-2 ml-2 rounded border border-rose-800 px-2 py-1 text-rose-300"
                  onClick={() => deleteClient(client.id)}
                >
                  excluir cliente
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
