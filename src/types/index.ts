// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Role {
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum CouponType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
  FREE_SHIPPING = "FREE_SHIPPING",
}

// ─── Base Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string | null;
  cpf: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  images: string[];
  stock: number;
  sku: string;
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  isNew: boolean;
  brand: string | null;
  benefits: string[];
  howToUse: string | null;
  composition: string | null;
  warnings: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentLink: string | null;
  whatsappRedirect: boolean;
  addressId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  published: boolean;
  categoryName: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SEO {
  id: string;
  page: string;
  title: string;
  description: string;
  keywords: string | null;
  ogImage: string | null;
}

// ─── Relation Types ───────────────────────────────────────────────────────────

export type ProductWithCategory = Product & {
  category: Category;
};

export type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export type OrderWithItems = Order & {
  items: OrderItemWithProduct[];
  user: Pick<User, "id" | "name" | "email" | "phone">;
  address: Address;
};

export type UserPublic = Omit<User, "password">;

export type BlogPostWithAuthor = BlogPost & {
  author: Pick<User, "id" | "name">;
};

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: ProductWithCategory;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  id: string;
  role: Role;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: UserPublic;
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: OrderWithItems[];
  topProducts: Array<ProductWithCategory & { totalSold: number }>;
}
