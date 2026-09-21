export type PaymentMethod = "pix" | "cartao" | "dinheiro";
export type DeliveryMethod = "retirada" | "entrega";

export type Product = {
  id: string;
  brand: string;
  model: string;
  price: number;
  quantity: number;
  imageBlobNames: string[];
  imageUrls: string[];
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
  expectedPrice: number;
};

export type OrderItem = {
  productId: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  totalValue: number;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
};

export type SessionPayload = {
  id: string;
  role: "client" | "admin";
  name: string;
  issuedAt: string;
};
