import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { SiteShell } from "@/components/site-shell";
import { getProductById } from "@/lib/storage";

export default async function ProductDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    notFound();
  }

  return (
    <SiteShell title="Detalhe do equipamento" subtitle="Confira os dados antes de locar">
      <article className="grid gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-2 md:p-6">
        <div className="space-y-3">
          <div className="relative h-80 overflow-hidden rounded-xl bg-slate-800">
            <Image
              fill
              className="object-cover"
              src={product.imageUrls[0] ?? "/placeholder.svg"}
              alt={`${product.brand} ${product.model}`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.imageUrls.slice(1).map((url, index) => (
              <div key={url} className="relative h-20 overflow-hidden rounded bg-slate-800">
                <Image fill className="object-cover" src={url} alt={`Foto ${index + 2}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-amber-300">{product.brand}</p>
          <h2 className="text-3xl font-semibold">{product.model}</h2>
          <p className="text-lg text-slate-300">R$ {product.price.toFixed(2)} / diária</p>
          <p className="text-slate-400">Quantidade disponível: {product.quantity}</p>
          <AddToCartButton
            productId={product.id}
            price={product.price}
            disabled={product.quantity <= 0}
          />
          <Link
            className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
            href="/"
          >
            Voltar para a loja
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
