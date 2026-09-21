"use client";

import { FormEvent, useEffect, useState } from "react";

import type { Client, Order } from "@/lib/types";

type SessionResponse = {
  session:
    | null
    | {
        id: string;
        role: "client" | "admin";
        name: string;
        client?: Client;
      };
};

const defaultRegister = {
  name: "",
  email: "",
  phone: "",
  document: "",
  address: "",
  password: "",
};

export function AccountView() {
  const [session, setSession] = useState<SessionResponse["session"]>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    document: "",
    address: "",
  });

  const refreshSession = async () => {
    const response = await fetch("/api/session");
    const data = (await response.json()) as SessionResponse;
    setSession(data.session);
    if (data.session?.client) {
      setProfileForm({
        name: data.session.client.name,
        phone: data.session.client.phone,
        document: data.session.client.document,
        address: data.session.client.address,
      });
    }
  };

  const refreshOrders = async () => {
    const response = await fetch("/api/orders/mine");
    if (!response.ok) {
      setOrders([]);
      return;
    }
    const data = await response.json();
    setOrders(data.orders ?? []);
  };

  useEffect(() => {
    const run = async () => {
      await refreshSession();
      await refreshOrders();
    };
    run();
  }, []);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha no cadastro.");
      return;
    }
    setMessage("Cadastro realizado com sucesso.");
    setRegisterForm(defaultRegister);
    await refreshSession();
    await refreshOrders();
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha no login.");
      return;
    }
    setMessage(`Bem-vindo(a), ${data.client.name}.`);
    await refreshSession();
    await refreshOrders();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMessage("Sessão encerrada.");
    setSession(null);
    setOrders([]);
  };

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/clients/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Falha ao atualizar.");
      return;
    }
    setMessage("Perfil atualizado.");
    await refreshSession();
  };

  if (session?.role === "client" && session.client) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Meus dados</h2>
          <form className="mt-3 space-y-2" onSubmit={updateProfile}>
            <input
              value={profileForm.name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nome"
              required
            />
            <input
              value={profileForm.phone}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Telefone"
              required
            />
            <input
              value={profileForm.document}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, document: event.target.value }))
              }
              placeholder="Documento"
              required
            />
            <textarea
              value={profileForm.address}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, address: event.target.value }))
              }
              placeholder="Endereço"
              required
            />
            <div className="flex gap-2">
              <button className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">
                Salvar dados
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                onClick={logout}
              >
                Sair
              </button>
            </div>
          </form>
          {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Histórico de locações</h2>
          <div className="mt-3 space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-slate-400">Sem pedidos ainda.</p>
            ) : (
              orders.map((order) => (
                <article key={order.id} className="rounded-lg border border-slate-800 p-3">
                  <p className="text-sm text-slate-300">
                    Pedido {order.id.slice(0, 8)} - {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-300">
                    {order.paymentMethod} | {order.deliveryMethod}
                  </p>
                  <p className="font-medium">Total: R$ {order.totalValue.toFixed(2)}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Criar conta</h2>
        <form className="mt-3 space-y-2" onSubmit={register}>
          <input
            value={registerForm.name}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Nome completo"
            required
          />
          <input
            type="email"
            value={registerForm.email}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="E-mail"
            required
          />
          <input
            value={registerForm.phone}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Telefone"
            required
          />
          <input
            value={registerForm.document}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, document: event.target.value }))
            }
            placeholder="Documento"
            required
          />
          <textarea
            value={registerForm.address}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, address: event.target.value }))
            }
            placeholder="Endereço"
            required
          />
          <input
            type="password"
            value={registerForm.password}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Senha"
            required
          />
          <button className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Cadastrar
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Entrar</h2>
        <form className="mt-3 space-y-2" onSubmit={login}>
          <input
            type="email"
            value={loginForm.email}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="E-mail"
            required
          />
          <input
            type="password"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Senha"
            required
          />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Entrar
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
      </section>
    </div>
  );
}
