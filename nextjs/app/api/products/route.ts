export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { listProducts, getProductCategories, createProduct } from "@/lib/services/ProductService";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const [products, categories] = await Promise.all([
      listProducts({
        category:   searchParams.get("category")  ?? undefined,
        isActive:   searchParams.get("active")    !== "false",
        isFeatured: searchParams.get("featured")  === "true" ? true : undefined,
        search:     searchParams.get("q")         ?? undefined,
      }),
      getProductCategories(),
    ]);
    return NextResponse.json({ products, categories }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

const CreateSchema = z.object({
  productCode:  z.string().min(1),
  name:         z.string().min(1),
  nameEn:       z.string().optional(),
  category:     z.string().min(1),
  description:  z.string().optional(),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().optional(),
  stockQty:     z.number().int().nonnegative().optional(),
  isFeatured:   z.boolean().optional(),
  profitMethod: z.enum(["FULL_COST_BASED","FINANCED_AMOUNT","CUSTOM"]).optional(),
  profitRate:   z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const id = await createProduct({ ...parsed.data, createdBy: session.user.id });
    return NextResponse.json({ id, message: "পণ্য তৈরি হয়েছে।" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
