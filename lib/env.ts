const required = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const env = {
  storageConnectionString: required(
    "AZURE_STORAGE_CONNECTION_STRING",
    "UseDevelopmentStorage=true"
  ),
  blobContainerName:
    process.env.AZURE_BLOB_CONTAINER_NAME ?? "igorfernandes-fotos-produtos",
  productsTableName:
    process.env.AZURE_PRODUCTS_TABLE_NAME ?? "IgorFernandesProdutos",
  clientsTableName:
    process.env.AZURE_CLIENTS_TABLE_NAME ?? "IgorFernandesClientes",
  ordersTableName:
    process.env.AZURE_ORDERS_TABLE_NAME ?? "IgorFernandesPedidos",
  sessionSecret: required("SESSION_SECRET", "dev-local-secret-change-me"),
  adminEmail: required("ADMIN_EMAIL", "admin@lentenorte.local"),
  adminPassword: required("ADMIN_PASSWORD", "admin123"),
};
