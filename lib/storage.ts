import crypto from "node:crypto";

import {
  AzureNamedKeyCredential,
  TableClient,
  TableEntityResult,
  TableServiceClient,
} from "@azure/data-tables";
import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

import { env } from "@/lib/env";
import type {
  CartItem,
  Client,
  DeliveryMethod,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
} from "@/lib/types";

type ProductEntity = TableEntityResult<Record<string, unknown>>;
type ClientEntity = TableEntityResult<Record<string, unknown>>;
type OrderEntity = TableEntityResult<Record<string, unknown>>;

const createdAtFromRowKey = () => new Date().toISOString();

const tableServiceClient = TableServiceClient.fromConnectionString(
  env.storageConnectionString
);
const blobServiceClient = BlobServiceClient.fromConnectionString(
  env.storageConnectionString
);

const productsTableClient = TableClient.fromConnectionString(
  env.storageConnectionString,
  env.productsTableName
);
const clientsTableClient = TableClient.fromConnectionString(
  env.storageConnectionString,
  env.clientsTableName
);
const ordersTableClient = TableClient.fromConnectionString(
  env.storageConnectionString,
  env.ordersTableName
);
const productsContainerClient = blobServiceClient.getContainerClient(
  env.blobContainerName
);

let ensurePromise: Promise<void> | null = null;

const parseConnectionString = () => {
  const parts = env.storageConnectionString
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const values = new Map<string, string>();
  for (const part of parts) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) continue;
    values.set(part.slice(0, separatorIndex), part.slice(separatorIndex + 1));
  }
  return values;
};

const sharedKeyCredential = () => {
  const values = parseConnectionString();
  const accountName = values.get("AccountName");
  const accountKey = values.get("AccountKey");
  if (!accountName || !accountKey) {
    return null;
  }
  return new StorageSharedKeyCredential(accountName, accountKey);
};

const embeddedSas = () => {
  const values = parseConnectionString();
  const tokenFromConnectionString = values.get("SharedAccessSignature");
  if (tokenFromConnectionString) {
    return tokenFromConnectionString.startsWith("?")
      ? tokenFromConnectionString.slice(1)
      : tokenFromConnectionString;
  }
  return null;
};

const toBrandKey = (brand: string) => brand.trim().toLowerCase();

const mapProduct = (entity: ProductEntity): Product => ({
  id: String(entity.rowKey),
  brand: String(entity.brand ?? ""),
  model: String(entity.model ?? ""),
  price: Number(entity.price ?? 0),
  quantity: Number(entity.quantity ?? 0),
  imageBlobNames: JSON.parse(String(entity.imageBlobNames ?? "[]")),
  imageUrls: [],
  createdAt: String(entity.createdAt ?? createdAtFromRowKey()),
});

const mapClient = (entity: ClientEntity): Client => ({
  id: String(entity.rowKey),
  name: String(entity.name ?? ""),
  email: String(entity.email ?? ""),
  phone: String(entity.phone ?? ""),
  document: String(entity.document ?? ""),
  address: String(entity.address ?? ""),
  createdAt: String(entity.createdAt ?? createdAtFromRowKey()),
});

const mapOrder = (entity: OrderEntity): Order => ({
  id: String(entity.orderId ?? entity.rowKey),
  clientId: String(entity.partitionKey),
  clientName: String(entity.clientName ?? ""),
  items: JSON.parse(String(entity.itemsJson ?? "[]")) as OrderItem[],
  totalValue: Number(entity.totalValue ?? 0),
  paymentMethod: String(entity.paymentMethod ?? "pix") as PaymentMethod,
  deliveryMethod: String(entity.deliveryMethod ?? "retirada") as DeliveryMethod,
  createdAt: String(entity.createdAt ?? createdAtFromRowKey()),
});

const withImageUrls = async (product: Product) => {
  const imageUrls = product.imageBlobNames.map((blobName) =>
    buildReadBlobUrl(blobName)
  );
  return { ...product, imageUrls };
};

const buildReadBlobUrl = (blobName: string) => {
  const blobClient = productsContainerClient.getBlobClient(blobName);
  const sharedKey = sharedKeyCredential();
  if (sharedKey) {
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: env.blobContainerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn,
      },
      sharedKey
    ).toString();
    return `${blobClient.url}?${sas}`;
  }

  const token = embeddedSas();
  if (token) {
    return `${blobClient.url}?${token}`;
  }

  return blobClient.url;
};

export const ensureStorage = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await tableServiceClient.createTable(env.productsTableName);
      await tableServiceClient.createTable(env.clientsTableName);
      await tableServiceClient.createTable(env.ordersTableName);
      await productsContainerClient.create();
    })().catch(async (error: unknown) => {
      const knownErrors = [
        "TableAlreadyExists",
        "ContainerAlreadyExists",
        "409",
      ];
      const message = String(error);
      if (knownErrors.some((item) => message.includes(item))) {
        return;
      }

      // Retry when only one resource existed and the rest is still pending.
      await tableServiceClient.createTable(env.productsTableName).catch(() => {});
      await tableServiceClient.createTable(env.clientsTableName).catch(() => {});
      await tableServiceClient.createTable(env.ordersTableName).catch(() => {});
      await productsContainerClient.create().catch(() => {});
    });
  }
  await ensurePromise;
};

export const listProducts = async (filters?: {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  await ensureStorage();

  const queryFilter =
    filters?.brand && filters.brand.trim()
      ? `PartitionKey eq '${toBrandKey(filters.brand)}'`
      : undefined;
  const items: Product[] = [];

  for await (const entity of productsTableClient.listEntities<ProductEntity>({
    queryOptions: queryFilter ? { filter: queryFilter } : undefined,
  })) {
    items.push(mapProduct(entity));
  }

  const modelFilter = filters?.model?.trim().toLowerCase();
  const minPrice = Number.isFinite(filters?.minPrice)
    ? Number(filters?.minPrice)
    : undefined;
  const maxPrice = Number.isFinite(filters?.maxPrice)
    ? Number(filters?.maxPrice)
    : undefined;

  const filtered = items.filter((item) => {
    if (modelFilter && !item.model.toLowerCase().includes(modelFilter)) {
      return false;
    }
    if (typeof minPrice === "number" && item.price < minPrice) {
      return false;
    }
    if (typeof maxPrice === "number" && item.price > maxPrice) {
      return false;
    }
    return true;
  });

  const withUrls = await Promise.all(filtered.map((item) => withImageUrls(item)));
  return withUrls.sort((a, b) => a.model.localeCompare(b.model));
};

export const getProductById = async (id: string) => {
  await ensureStorage();
  for await (const entity of productsTableClient.listEntities<ProductEntity>({
    queryOptions: { filter: `RowKey eq '${id}'` },
  })) {
    return withImageUrls(mapProduct(entity));
  }
  return null;
};

export const createProduct = async (input: {
  brand: string;
  model: string;
  price: number;
  quantity: number;
  imageBlobNames: string[];
}) => {
  await ensureStorage();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await productsTableClient.createEntity({
    partitionKey: toBrandKey(input.brand),
    rowKey: id,
    brand: input.brand.trim(),
    model: input.model.trim(),
    price: input.price,
    quantity: input.quantity,
    imageBlobNames: JSON.stringify(input.imageBlobNames),
    createdAt,
  });
  return getProductById(id);
};

export const updateProduct = async (
  id: string,
  input: {
    brand: string;
    model: string;
    price: number;
    quantity: number;
    imageBlobNames: string[];
  }
) => {
  const current = await getProductById(id);
  if (!current) {
    return null;
  }

  await productsTableClient.updateEntity(
    {
      partitionKey: toBrandKey(input.brand),
      rowKey: id,
      brand: input.brand.trim(),
      model: input.model.trim(),
      price: input.price,
      quantity: input.quantity,
      imageBlobNames: JSON.stringify(input.imageBlobNames),
      createdAt: current.createdAt,
    },
    "Replace"
  );
  return getProductById(id);
};

export const deleteBlobByName = async (blobName: string) => {
  await ensureStorage();
  await productsContainerClient.deleteBlob(blobName).catch(() => {});
};

export const uploadProductImage = async (
  originalName: string,
  payload: Uint8Array,
  contentType: string
) => {
  await ensureStorage();
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf("."))
    : ".bin";
  const blobName = `${crypto.randomUUID()}${ext}`;
  const client = productsContainerClient.getBlockBlobClient(blobName);
  await client.uploadData(payload, {
    blobHTTPHeaders: { blobContentType: contentType || "application/octet-stream" },
  });
  return blobName;
};

export const deleteProduct = async (id: string) => {
  const current = await getProductById(id);
  if (!current) {
    return false;
  }
  await productsTableClient.deleteEntity(toBrandKey(current.brand), id);
  await Promise.all(current.imageBlobNames.map((blobName) => deleteBlobByName(blobName)));
  return true;
};

export const listClients = async () => {
  await ensureStorage();
  const items: Client[] = [];
  for await (const entity of clientsTableClient.listEntities<ClientEntity>()) {
    items.push(mapClient(entity));
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
};

export const getClientById = async (id: string) => {
  await ensureStorage();
  try {
    const entity = await clientsTableClient.getEntity<ClientEntity>("cliente", id);
    return mapClient(entity);
  } catch {
    return null;
  }
};

export const getClientEntityByEmail = async (email: string) => {
  await ensureStorage();
  const normalizedEmail = email.trim().toLowerCase();
  for await (const entity of clientsTableClient.listEntities<ClientEntity>({
    queryOptions: { filter: `email eq '${normalizedEmail}'` },
  })) {
    return entity;
  }
  return null;
};

export const createClient = async (input: {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  passwordHash: string;
}) => {
  await ensureStorage();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await clientsTableClient.createEntity({
    partitionKey: "cliente",
    rowKey: id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    document: input.document.trim(),
    address: input.address.trim(),
    passwordHash: input.passwordHash,
    createdAt,
  });
  return getClientById(id);
};

export const updateClient = async (
  id: string,
  input: {
    name: string;
    phone: string;
    document: string;
    address: string;
  }
) => {
  await ensureStorage();
  const existing = await clientsTableClient.getEntity<ClientEntity>("cliente", id);
  await clientsTableClient.updateEntity(
    {
      partitionKey: "cliente",
      rowKey: id,
      name: input.name.trim(),
      email: String(existing.email),
      phone: input.phone.trim(),
      document: input.document.trim(),
      address: input.address.trim(),
      passwordHash: String(existing.passwordHash),
      createdAt: String(existing.createdAt),
    },
    "Replace"
  );
  return getClientById(id);
};

export const deleteClient = async (id: string) => {
  await ensureStorage();
  await clientsTableClient.deleteEntity("cliente", id);
};

const toOrderRowKey = (createdAt: string, id: string) => `${createdAt}__${id}`;

export const listOrders = async () => {
  await ensureStorage();
  const orders: Order[] = [];
  for await (const entity of ordersTableClient.listEntities<OrderEntity>()) {
    orders.push(mapOrder(entity));
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const listClientOrders = async (clientId: string) => {
  await ensureStorage();
  const orders: Order[] = [];
  for await (const entity of ordersTableClient.listEntities<OrderEntity>({
    queryOptions: { filter: `PartitionKey eq '${clientId}'` },
  })) {
    orders.push(mapOrder(entity));
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const createOrder = async (input: {
  clientId: string;
  clientName: string;
  items: OrderItem[];
  totalValue: number;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
}) => {
  await ensureStorage();
  const orderId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await ordersTableClient.createEntity({
    partitionKey: input.clientId,
    rowKey: toOrderRowKey(createdAt, orderId),
    orderId,
    clientName: input.clientName,
    itemsJson: JSON.stringify(input.items),
    totalValue: input.totalValue,
    paymentMethod: input.paymentMethod,
    deliveryMethod: input.deliveryMethod,
    createdAt,
  });
  return orderId;
};

export const validateCartAndBuildOrderItems = async (cart: CartItem[]) => {
  const items: OrderItem[] = [];
  let total = 0;
  const touchedProducts: Product[] = [];

  for (const cartItem of cart) {
    const product = await getProductById(cartItem.productId);
    if (!product) {
      throw new Error(`Produto ${cartItem.productId} não encontrado.`);
    }
    if (cartItem.quantity <= 0) {
      throw new Error(`Quantidade inválida para ${product.model}.`);
    }
    if (product.quantity < cartItem.quantity) {
      throw new Error(`Estoque insuficiente para ${product.model}.`);
    }
    if (Number(product.price) !== Number(cartItem.expectedPrice)) {
      throw new Error(`O valor do produto ${product.model} foi alterado.`);
    }

    touchedProducts.push(product);
    items.push({
      productId: product.id,
      brand: product.brand,
      model: product.model,
      quantity: cartItem.quantity,
      unitPrice: product.price,
    });
    total += product.price * cartItem.quantity;
  }

  return { items, total, touchedProducts };
};

export const decreaseStock = async (cart: CartItem[]) => {
  for (const cartItem of cart) {
    const product = await getProductById(cartItem.productId);
    if (!product) continue;
    await updateProduct(product.id, {
      brand: product.brand,
      model: product.model,
      price: product.price,
      quantity: product.quantity - cartItem.quantity,
      imageBlobNames: product.imageBlobNames,
    });
  }
};

export const hasAnyProduct = async () => {
  await ensureStorage();
  for await (const _entity of productsTableClient.listEntities<ProductEntity>()) {
    return true;
  }
  return false;
};

export const createInitialProducts = async () => {
  await ensureStorage();
  if (await hasAnyProduct()) {
    return false;
  }

  const samples = [
    { brand: "Sony", model: "Alpha A7 IV", price: 350, quantity: 4 },
    { brand: "Canon", model: "EOS R6 Mark II", price: 330, quantity: 3 },
    { brand: "Fujifilm", model: "X-T5", price: 290, quantity: 5 },
  ];

  for (const sample of samples) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#0f172a'/><text x='50%' y='45%' fill='#e2e8f0' font-size='64' font-family='Arial' dominant-baseline='middle' text-anchor='middle'>${sample.brand}</text><text x='50%' y='58%' fill='#94a3b8' font-size='52' font-family='Arial' dominant-baseline='middle' text-anchor='middle'>${sample.model}</text></svg>`;
    const blobName = await uploadProductImage(
      `${sample.brand}-${sample.model}.svg`,
      Buffer.from(svg),
      "image/svg+xml"
    );
    await createProduct({ ...sample, imageBlobNames: [blobName] });
  }

  return true;
};

export const adminCredential = () => {
  const values = parseConnectionString();
  const accountName = values.get("AccountName");
  const accountKey = values.get("AccountKey");
  if (!accountName || !accountKey) {
    return null;
  }
  return new AzureNamedKeyCredential(accountName, accountKey);
};
