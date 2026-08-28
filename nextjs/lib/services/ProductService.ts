// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Product Catalog Service
//
//  Website.txt rules:
//  • Products have stock tracking (stockQty, outOfStock)
//  • Each product has a profit method override
//  • Stock reservation: cart → reserved → confirmed → deducted
//  • No hard-delete for products that have existing orders;
//    mark isActive=false instead
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import { ProfitMethod } from "@/types/enums";
import { writeAuditLog } from "./AuditService";

// ─────────────────────────────────────────────────────────────
// List products (public-safe: no purchase cost for non-admins)
// ─────────────────────────────────────────────────────────────

export interface ProductListItem {
  id:           string;
  productCode:  string;
  name:         string;
  nameEn?:      string | null;
  category:     string;
  description?: string | null;
  purchaseCost: number;
  sellingPrice?: number | null;
  stockQty:     number;
  isActive:     boolean;
  isFeatured:   boolean;
  outOfStock:   boolean;
  profitMethod: ProfitMethod;
  profitRate:   number;
  images:       { url: string; type: string; altText?: string | null; sortOrder: number }[];
  createdAt:    Date;
}

export async function listProducts(filters?: {
  category?:   string;
  isActive?:   boolean;
  isFeatured?: boolean;
  search?:     string;
}): Promise<ProductListItem[]> {
  const where: Record<string, unknown> = {};
  if (filters?.category)            where.category  = filters.category;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;
  if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters?.search) {
    where.OR = [
      { name:       { contains: filters.search, mode: "insensitive" } },
      { nameEn:     { contains: filters.search, mode: "insensitive" } },
      { category:   { contains: filters.search, mode: "insensitive" } },
      { productCode:{ contains: filters.search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where:   where as never,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, type: true, altText: true, sortOrder: true } },
    },
  });

  return products.map((p) => ({
    ...p,
    purchaseCost: Number(p.purchaseCost),
    sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
    profitRate:   Number(p.profitRate),
    profitMethod: p.profitMethod as ProfitMethod,
  }));
}

// ─────────────────────────────────────────────────────────────
// Get product categories (distinct)
// ─────────────────────────────────────────────────────────────

export async function getProductCategories(): Promise<string[]> {
  const result = await prisma.product.findMany({
    select:   { category: true },
    distinct: ["category"],
    orderBy:  { category: "asc" },
  });
  return result.map((r) => r.category);
}

// ─────────────────────────────────────────────────────────────
// Create product
// ─────────────────────────────────────────────────────────────

export interface CreateProductInput {
  productCode:  string;
  name:         string;
  nameEn?:      string;
  category:     string;
  description?: string;
  purchaseCost: number;
  sellingPrice?: number;
  stockQty?:    number;
  isFeatured?:  boolean;
  profitMethod?: ProfitMethod;
  profitRate?:  number;
  createdBy:    string;
}

export async function createProduct(input: CreateProductInput): Promise<string> {
  const product = await prisma.product.create({
    data: {
      productCode:  input.productCode,
      name:         input.name,
      nameEn:       input.nameEn       ?? null,
      category:     input.category,
      description:  input.description  ?? null,
      purchaseCost: input.purchaseCost,
      sellingPrice: input.sellingPrice ?? null,
      stockQty:     input.stockQty     ?? 0,
      isFeatured:   input.isFeatured   ?? false,
      profitMethod: (input.profitMethod ?? ProfitMethod.FINANCED_AMOUNT) as never,
      profitRate:   input.profitRate   ?? 10,
      outOfStock:   (input.stockQty ?? 0) === 0,
      createdBy:    input.createdBy,
    },
  });

  await writeAuditLog({
    userId:   input.createdBy,
    action:   "CREATE",
    module:   "products",
    recordId: product.id,
    newValue: { name: input.name, category: input.category, purchaseCost: input.purchaseCost },
  });

  return product.id;
}

// ─────────────────────────────────────────────────────────────
// Update product
// ─────────────────────────────────────────────────────────────

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<CreateProductInput, "createdBy">>,
  updatedBy: string
): Promise<void> {
  const old = await prisma.product.findUniqueOrThrow({ where: { id: productId } });

  const data: Record<string, unknown> = { ...updates };
  // Sync outOfStock flag if stockQty changes
  if (updates.stockQty !== undefined) {
    data.outOfStock = updates.stockQty === 0;
  }

  await prisma.product.update({ where: { id: productId }, data: data as never });

  await writeAuditLog({
    userId:   updatedBy,
    action:   "UPDATE",
    module:   "products",
    recordId: productId,
    oldValue: { name: old.name, stockQty: Number(old.stockQty), isActive: old.isActive },
    newValue: updates as Record<string, unknown>,
  });
}

// ─────────────────────────────────────────────────────────────
// Soft-delete product (only if no active orders)
// ─────────────────────────────────────────────────────────────

export async function deactivateProduct(productId: string, deletedBy: string): Promise<void> {
  const activeOrders = await prisma.order.count({
    where: { productId, status: { notIn: ["CANCELLED", "COMPLETED"] as never[] } },
  });
  if (activeOrders > 0) {
    throw new Error(`এই পণ্যের ${activeOrders}টি সক্রিয় অর্ডার আছে — নিষ্ক্রিয় করা যাবে না।`);
  }

  const old = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });

  await writeAuditLog({
    userId:   deletedBy,
    action:   "DELETE",
    module:   "products",
    recordId: productId,
    oldValue: { name: old.name, isActive: old.isActive },
    newValue: { isActive: false },
    reason:   "Product deactivated",
  });
}

// ─────────────────────────────────────────────────────────────
// Stock management
// ─────────────────────────────────────────────────────────────

export async function adjustStock(
  productId: string,
  delta: number,   // positive = add, negative = reduce
  reason: string,
  adjustedBy: string
): Promise<void> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { stockQty: true, name: true },
  });

  const newQty = product.stockQty + delta;
  if (newQty < 0) throw new Error(`স্টক শূন্যের নিচে যেতে পারে না। বর্তমান: ${product.stockQty}`);

  await prisma.product.update({
    where: { id: productId },
    data:  { stockQty: newQty, outOfStock: newQty === 0 },
  });

  await writeAuditLog({
    userId:   adjustedBy,
    action:   "UPDATE",
    module:   "products",
    recordId: productId,
    oldValue: { stockQty: product.stockQty },
    newValue: { stockQty: newQty, delta },
    reason,
  });
}
