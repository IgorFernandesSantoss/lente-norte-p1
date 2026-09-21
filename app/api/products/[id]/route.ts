import { z } from "zod";

import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import {
  deleteBlobByName,
  deleteProduct,
  getProductById,
  updateProduct,
  uploadProductImage,
} from "@/lib/storage";

const productSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().nonnegative(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return jsonError("Produto não encontrado.", 404);
  }
  return jsonOk({ product });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }

  const { id } = await params;
  const current = await getProductById(id);
  if (!current) {
    return jsonError("Produto não encontrado.", 404);
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

  const keptBlobsRaw = form.get("keptBlobs");
  const keptBlobs = keptBlobsRaw ? JSON.parse(String(keptBlobsRaw)) : [];
  const safeKeptBlobs = Array.isArray(keptBlobs)
    ? keptBlobs.filter((item) => typeof item === "string")
    : [];

  const files = form.getAll("images").filter((value) => value instanceof File) as File[];
  const newBlobs: string[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const blobName = await uploadProductImage(
      file.name,
      new Uint8Array(buffer),
      file.type
    );
    newBlobs.push(blobName);
  }

  const mergedBlobs = [...safeKeptBlobs, ...newBlobs];
  const updated = await updateProduct(id, {
    ...fields.data,
    imageBlobNames: mergedBlobs,
  });

  const removedBlobs = current.imageBlobNames.filter(
    (blobName) => !safeKeptBlobs.includes(blobName)
  );
  await Promise.all(removedBlobs.map((blobName) => deleteBlobByName(blobName)));

  return jsonOk({ product: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return jsonError("Acesso negado.", 401);
  }
  const { id } = await params;
  const done = await deleteProduct(id);
  if (!done) {
    return jsonError("Produto não encontrado.", 404);
  }
  return jsonOk({ ok: true });
}
