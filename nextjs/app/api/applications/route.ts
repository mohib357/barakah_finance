// Quick-apply endpoint — accepts member / product / qard pre-applications
// from the landing page apply section (no auth required)
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  type:       z.enum(["member", "product", "qard"]),
  name:       z.string().min(2).max(80),
  phone:      z.string().min(10).max(15),
  // member fields
  nid:        z.string().optional(),
  profession: z.string().optional(),
  address:    z.string().optional(),
  // product fields
  product:    z.string().optional(),
  price:      z.string().optional(),
  // qard fields
  amount:     z.string().optional(),
  startMonth: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "অবৈধ তথ্য।" }, { status: 400 });
    }

    const data = parsed.data;

    // Store as a lightweight application note — admin reviews via panel
    // We use the Note-like approach since CharityApplication / QardApplication
    // both need full KYC later; this is just the initial interest form.
    // Store in AuditLog as activity record (quick-apply doesn't need a full model)
    await prisma.activityFeed.create({
      data: {
        action: `QUICK_APPLY_${data.type.toUpperCase()}`,
        module: "applications",
        detail: JSON.stringify({
          name: data.name,
          phone: data.phone,
          type: data.type,
          ...(data.nid       && { nid: data.nid }),
          ...(data.profession && { profession: data.profession }),
          ...(data.address    && { address: data.address }),
          ...(data.product    && { product: data.product }),
          ...(data.price      && { price: data.price }),
          ...(data.amount     && { amount: data.amount }),
          ...(data.startMonth && { startMonth: data.startMonth }),
        }),
      },
    });

    const messages = {
      member:  "✅ সদস্য আবেদন জমা হয়েছে! কমিটি শীঘ্রই যোগাযোগ করবেন।",
      product: "✅ পণ্য রিকোয়েস্ট জমা হয়েছে!",
      qard:    "✅ করজে হাসানা আবেদন জমা হয়েছে!",
    };

    return NextResponse.json({ message: messages[data.type] });
  } catch {
    return NextResponse.json({ error: "সার্ভার সমস্যা।" }, { status: 500 });
  }
}
