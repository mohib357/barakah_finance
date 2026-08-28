export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { updateProduct, deactivateProduct, adjustStock } from "@/lib/services/ProductService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where:   { id: params.id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি।" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await req.json();
    await updateProduct(params.id, body, session.user.id);
    return NextResponse.json({ message: "পণ্য আপডেট হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

const StockSchema = z.object({ delta: z.number(), reason: z.string().min(3) });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // PUT /api/products/[id] with { delta, reason } = adjust stock
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = StockSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    await adjustStock(params.id, parsed.data.delta, parsed.data.reason, session.user.id);
    return NextResponse.json({ message: "স্টক আপডেট হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    await deactivateProduct(params.id, session.user.id);
    return NextResponse.json({ message: "পণ্য নিষ্ক্রিয় করা হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
