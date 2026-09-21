# Lente Norte

Aplicação web de locação de câmeras e lentes para a P1 de Computação em Nuvem II, com:

- front-end responsivo (loja, carrinho, checkout, conta e admin),
- fotos de produto no Azure Blob Storage,
- cadastros/pedidos no Azure Table Storage.

## Pré-requisitos

- `bun` instalado
- `docker` e `docker compose` instalados

## Subir local (sem publicar)

No diretório do repositório (`p1`):

```bash
docker compose up -d
```

No diretório da aplicação (`p1/app`):

```bash
cp .env.example .env.local
bun dev
```

Abrir em [http://localhost:3000](http://localhost:3000).

## Fluxo recomendado para demo

1. Acesse `/admin` e faça login com credenciais do `.env.local`.
2. Clique em `Seed de produtos` para popular produtos iniciais com imagem no Blob.
3. Acesse `/` e valide busca por marca/modelo/preço.
4. Adicione itens ao carrinho e finalize em `/checkout`.
5. Veja o histórico em `/conta`.
6. Volte ao `/admin`, use `editar cliente`, salve alterações e confirme o reflexo em `/conta`.

## Variáveis de ambiente

Base local:

- `AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true`
- `AZURE_BLOB_CONTAINER_NAME=fotos-produtos`
- `AZURE_PRODUCTS_TABLE_NAME=produtos`
- `AZURE_CLIENTS_TABLE_NAME=clientes`
- `AZURE_ORDERS_TABLE_NAME=pedidos`
- `SESSION_SECRET=...`
- `ADMIN_EMAIL=...`
- `ADMIN_PASSWORD=...`

## Preparado para subir depois

Na publicação, troque apenas:

- `AZURE_STORAGE_CONNECTION_STRING` para a da conta Azure real.

O projeto já está com `output: "standalone"` no `next.config.ts`, facilitando build/deploy.
