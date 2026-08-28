export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { createOrder } from "@/lib/services/OrderService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    const { searchParams } = req.nextUrl;

    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      // Regular users see only their own orders
      const customer = await prisma.customer.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      if (!customer) return NextResponse.json({ orders: [] });
      where.customerId = customer.id;
    }
    if (searchParams.get("status")) where.status = searchParams.get("status");
    if (searchParams.get("customerId")) where.customerId = searchParams.get("customerId");

    const orders = await prisma.order.findMany({
      where:   where as never,
      orderBy: { createdAt: "desc" },
      include: {
        customer:     { select: { id: true, name: true, phone: true, clientID: true } },
        product:      { select: { id: true, name: true, category: true } },
        installments: { orderBy: { installmentNumber: "asc" }, take: 1 },
        _count:       { select: { installments: true } },
      },
      take: 200,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

const CreateOrderSchema = z.object({
  customerId:       z.string(),
  productId:        z.string(),
  purchaseCost:     z.number().positive(),
  downPayment:      z.number().nonnegative().optional(),
  profitMethod:     z.enum(["FULL_COST_BASED","FINANCED_AMOUNT","CUSTOM"]).optional(),
  profitRate:       z.number().min(0).max(200).optional(),
  customProfit:     z.number().nonnegative().optional(),
  numInstallments:  z.number().int().min(1).max(60),
  orderDate:        z.string().optional(),
  notes:            z.string().optional(),
  guarantorUserId:  z.string().optional(),
  witnesses:        z.array(z.object({
    name:       z.string(),
    fatherName: z.string().optional(),
    phone:      z.string(),
    address:    z.string().optional(),
    nidNumber:  z.string().optional(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const { orderDate, ...rest } = parsed.data;
    const result = await createOrder({
      ...rest,
      orderDate:  orderDate ? new Date(orderDate) : undefined,
      createdBy:  session.user.id,
    });

    return NextResponse.json({
      orderId:     result.orderId,
      orderNumber: result.orderNumber,
      plan: {
        totalPayable:     result.plan.totalPayable,
        profitAmount:     result.plan.profitAmount,
        numInstallments:  result.plan.numInstallments,
        regularAmount:    result.plan.regularAmount,
        lastAmount:       result.plan.lastAmount,
        scheduleCount:    result.plan.schedule.length,
      },
      message: "অর্ডার তৈরি হয়েছে। অনুমোদনের অপেক্ষায়।",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
