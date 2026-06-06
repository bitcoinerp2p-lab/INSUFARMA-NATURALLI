import { z } from "zod";
import { CouponType, OrderStatus } from "@/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail obrigatório" })
    .email("E-mail inválido"),
  password: z
    .string({ required_error: "Senha obrigatória" })
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Nome obrigatório" })
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome muito longo"),
  email: z
    .string({ required_error: "E-mail obrigatório" })
    .email("E-mail inválido"),
  password: z
    .string({ required_error: "Senha obrigatória" })
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(72, "Senha muito longa"),
  phone: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido")
    .optional(),
  cpf: z
    .string()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
    .optional(),
});

// ─── Product ──────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z
    .string({ required_error: "Nome obrigatório" })
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(200, "Nome muito longo"),
  slug: z
    .string({ required_error: "Slug obrigatório" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (use letras minúsculas e hífens)"),
  description: z
    .string({ required_error: "Descrição obrigatória" })
    .min(10, "Descrição muito curta"),
  shortDescription: z
    .string({ required_error: "Descrição curta obrigatória" })
    .min(10, "Descrição curta muito curta")
    .max(300, "Descrição curta muito longa"),
  price: z
    .number({ required_error: "Preço obrigatório" })
    .positive("Preço deve ser positivo"),
  salePrice: z
    .number()
    .positive("Preço promocional deve ser positivo")
    .optional()
    .nullable(),
  images: z
    .array(z.string().url("URL de imagem inválida"))
    .min(1, "Pelo menos uma imagem é obrigatória"),
  stock: z
    .number({ required_error: "Estoque obrigatório" })
    .int("Estoque deve ser inteiro")
    .min(0, "Estoque não pode ser negativo"),
  sku: z
    .string({ required_error: "SKU obrigatório" })
    .min(1, "SKU obrigatório"),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  brand: z.string().max(100, "Marca muito longa").optional().nullable(),
  benefits: z.array(z.string()).default([]),
  howToUse: z.string().optional().nullable(),
  composition: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
  categoryId: z.string({ required_error: "Categoria obrigatória" }).uuid("Categoria inválida"),
});

// ─── Coupon ───────────────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z
    .string({ required_error: "Código obrigatório" })
    .min(3, "Código muito curto")
    .max(20, "Código muito longo")
    .regex(/^[A-Z0-9]+$/, "Use apenas letras maiúsculas e números"),
  type: z.nativeEnum(CouponType, { required_error: "Tipo obrigatório" }),
  value: z
    .number({ required_error: "Valor obrigatório" })
    .positive("Valor deve ser positivo"),
  minOrderValue: z
    .number()
    .positive("Valor mínimo deve ser positivo")
    .optional()
    .nullable(),
  maxUses: z
    .number()
    .int("Limite de usos deve ser inteiro")
    .positive("Limite de usos deve ser positivo")
    .optional()
    .nullable(),
  active: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
});

// ─── Order ────────────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string().uuid("Produto inválido"),
  quantity: z
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser positiva"),
  price: z.number().positive("Preço deve ser positivo"),
});

export const orderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Pedido deve ter pelo menos um item"),
  couponCode: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  whatsappRedirect: z.boolean().default(false),
  addressId: z.string().uuid("Endereço inválido"),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, { required_error: "Status obrigatório" }),
});

// ─── Address ──────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  name: z
    .string({ required_error: "Nome do endereço obrigatório" })
    .min(2, "Nome muito curto")
    .max(100, "Nome muito longo"),
  cep: z
    .string({ required_error: "CEP obrigatório" })
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z
    .string({ required_error: "Rua obrigatória" })
    .min(2, "Rua muito curta"),
  number: z
    .string({ required_error: "Número obrigatório" })
    .min(1, "Número obrigatório"),
  complement: z.string().max(100, "Complemento muito longo").optional().nullable(),
  neighborhood: z
    .string({ required_error: "Bairro obrigatório" })
    .min(2, "Bairro muito curto"),
  city: z
    .string({ required_error: "Cidade obrigatória" })
    .min(2, "Cidade muito curta"),
  state: z
    .string({ required_error: "Estado obrigatório" })
    .length(2, "Use a sigla do estado (ex: SP)"),
  isDefault: z.boolean().default(false),
});

// ─── Blog Post ────────────────────────────────────────────────────────────────

export const blogPostSchema = z.object({
  title: z
    .string({ required_error: "Título obrigatório" })
    .min(5, "Título muito curto")
    .max(200, "Título muito longo"),
  slug: z
    .string({ required_error: "Slug obrigatório" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  content: z
    .string({ required_error: "Conteúdo obrigatório" })
    .min(50, "Conteúdo muito curto"),
  excerpt: z
    .string({ required_error: "Resumo obrigatório" })
    .min(10, "Resumo muito curto")
    .max(500, "Resumo muito longo"),
  coverImage: z.string().url("URL da imagem inválida").optional().nullable(),
  published: z.boolean().default(false),
  categoryName: z.string().optional().nullable(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
