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

export enum AffiliateStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BLOCKED = "BLOCKED",
}

export enum CommissionType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export enum CommissionStatus {
  PENDING = "PENDING",
  AVAILABLE = "AVAILABLE",
  PAID = "PAID",
}

export enum WithdrawalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PRODUCT_CHANGE = "PRODUCT_CHANGE",
  COMMISSION_CHANGE = "COMMISSION_CHANGE",
  AFFILIATE_APPROVE = "AFFILIATE_APPROVE",
  AFFILIATE_SUSPEND = "AFFILIATE_SUSPEND",
  SALE = "SALE",
  REFUND = "REFUND",
  WITHDRAWAL = "WITHDRAWAL",
  COUPON_CHANGE = "COUPON_CHANGE",
  ORDER_STATUS_CHANGE = "ORDER_STATUS_CHANGE",
}

// ─── Base Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  cpf: string | null;
  createdAt: string;
  updatedAt: string;
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
  supplierCost: number;
  defaultAffiliateCommission: number;
  affiliateCommissionType: CommissionType;
  createdAt: string;
  updatedAt: string;
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
  expiresAt: string | null;
  affiliateId: string | null;
  productId: string | null;
  createdAt: string;
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
  affiliateId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  trafficOrigin: string | null;
  mpPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Affiliate {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  code: string;
  status: AffiliateStatus;
  commissionRate: number;
  commissionType: CommissionType;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateLink {
  id: string;
  affiliateId: string;
  productId: string | null;
  code: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  orderId: string | null;
  affiliateId: string | null;
  productId: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  grossAmount: number;
  supplierAmount: number;
  netAmount: number;
  affiliateAmount: number;
  couponCode: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  trafficOrigin: string | null;
  mpPaymentId: string | null;
  mpStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  id: string;
  affiliateId: string;
  saleId: string;
  amount: number;
  status: CommissionStatus;
  availableAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AffiliateWallet {
  id: string;
  affiliateId: string;
  pendingBalance: number;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  affiliateId: string;
  walletId: string;
  amount: number;
  status: WithdrawalStatus;
  pixKey: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
}

// ─── Relation Types ───────────────────────────────────────────────────────────

export type ProductWithCategory = Product & { category: Category };
export type OrderItemWithProduct = OrderItem & { product: Product };
export type OrderWithItems = Order & {
  items: OrderItemWithProduct[];
  user: Pick<User, "id" | "name" | "email" | "phone">;
  address: Address;
};
export type AffiliateWithWallet = Affiliate & { wallet: AffiliateWallet | null };
export type SaleWithRelations = Sale & {
  product: Pick<Product, "id" | "name" | "sku">;
  affiliate: Pick<Affiliate, "id" | "name" | "code"> | null;
};
export type UserPublic = Omit<User, "password">;

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueTotal: number;
  avgTicket: number;
  totalAffiliates: number;
  totalSales: number;
  conversionRate: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  salesByDay: Array<{ date: string; count: number; revenue: number }>;
  salesByProduct: Array<{ productId: string; name: string; revenue: number }>;
  salesByAffiliate: Array<{ affiliateId: string; name: string; revenue: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  trafficByOrigin: Array<{ origin: string; count: number }>;
}

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

export interface AuthPayload {
  id: string;
  role: Role;
  email: string;
}
