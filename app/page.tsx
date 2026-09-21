import { Catalog } from "@/components/catalog";
import { SiteShell } from "@/components/site-shell";
import { createInitialProducts, listProducts } from "@/lib/storage";

type SearchParams = {
  brand?: string;
  model?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  await createInitialProducts();
  const products = await listProducts({
    brand: filters.brand,
    model: filters.model,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
  });

  return (
    <SiteShell
      title="Locação de câmeras e lentes"
      subtitle="Catálogo online com disponibilidade em tempo real"
    >
      <form className="mb-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
        <input name="brand" placeholder="Marca" defaultValue={filters.brand ?? ""} />
        <input name="model" placeholder="Modelo" defaultValue={filters.model ?? ""} />
        <input
          name="minPrice"
          type="number"
          placeholder="Preço mínimo"
          defaultValue={filters.minPrice ?? ""}
        />
        <input
          name="maxPrice"
          type="number"
          placeholder="Preço máximo"
          defaultValue={filters.maxPrice ?? ""}
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 md:col-span-4"
        >
          Aplicar filtros
        </button>
      </form>
      <Catalog products={products} />
    </SiteShell>
  );
}