import { z } from "zod";

import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createProduct, listProducts, uploadProductImage } from "@/lib/storage";

const productSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().nonnegative(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const products = await listProducts({
    brand,
    model,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });
  return jsonOk({ products });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }

  const form = await request.formData();
  const fields = productSchema.safeParse({
    brand: form.get("brand"),
    model: form.get("model"),
    price: form.get("price"),
    quantity: form.get("quantity"),
  });
  if (!fields.success) {
    return jsonError("Dados de produto inválidos.", 400);
  }

  const files = form.getAll("images").filter((value) => value instanceof File) as File[];
  const imageBlobNames: string[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const blobName = await uploadProductImage(
      file.name,
      new Uint8Array(buffer),
      file.type
    );
    imageBlobNames.push(blobName);
  }

  const product = await createProduct({
    ...fields.data,
    imageBlobNames,
  });
  return jsonOk({ product }, { status: 201 });
}
