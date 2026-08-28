export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { sendSMS, interpolateSMSTemplate } from "@/lib/auth/otp";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  // Send to specific phone numbers OR a group
  phones:      z.array(z.string()).optional(),
  group:       z.enum(["members","clients","qard","committee","all"]).optional(),
  templateId:  z.string().optional(),
  message:     z.string().min(1),
  // Dynamic token values (for template interpolation)
  tokens:      z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const { phones, group, message, templateId, tokens } = parsed.data;

    // Resolve final message (apply template tokens if provided)
    let finalMessage = message;
    if (templateId) {
      const tmpl = await prisma.sMSTemplate.findUnique({ where: { id: templateId } });
      if (tmpl) finalMessage = interpolateSMSTemplate(tmpl.template, tokens ?? {});
    } else if (tokens && Object.keys(tokens).length) {
      finalMessage = interpolateSMSTemplate(message, tokens);
    }

    // Resolve target phone numbers
    let targetPhones: string[] = phones ?? [];

    if (group && targetPhones.length === 0) {
      switch (group) {
        case "members": {
          const members = await prisma.user.findMany({
            where: { systemRole: { in: ["MEMBER","ADMIN","SUPER_ADMIN"] as never[] }, phone: { not: null } },
            select: { phone: true },
          });
          targetPhones = members.map((m) => m.phone!).filter(Boolean);
          break;
        }
        case "clients": {
          const clients = await prisma.customer.findMany({ where: { status: "active" }, select: { phone: true } });
          targetPhones = clients.map((c) => c.phone).filter(Boolean);
          break;
        }
        case "qard": {
          const qardBorrowers = await prisma.qardApplication.findMany({
            where: { status: { in: ["ACTIVE","APPLIED","UNDER_REVIEW","APPROVED"] as never[] } },
            select: { borrowerPhone: true },
          });
          targetPhones = [...new Set(qardBorrowers.map((q) => q.borrowerPhone).filter(Boolean))];
          break;
        }
        case "committee": {
          const committee = await prisma.committeeMember.findMany({
            where: { status: "ACTIVE" as never, phone: { not: null } },
            select: { phone: true },
          });
          targetPhones = committee.map((c) => c.phone!).filter(Boolean);
          break;
        }
        case "all": {
          const allUsers = await prisma.user.findMany({
            where: { phone: { not: null }, isActive: true },
            select: { phone: true },
          });
          targetPhones = allUsers.map((u) => u.phone!).filter(Boolean);
          break;
        }
      }
    }

    if (targetPhones.length === 0) {
      return NextResponse.json({ error: "পাঠানোর জন্য কোনো নম্বর পাওয়া যায়নি।" }, { status: 400 });
    }

    // Send to all targets and record
    let sentCount = 0;
    let failedCount = 0;

    for (const phone of targetPhones) {
      try {
        const result = await sendSMS(phone, finalMessage);
        await prisma.sMSRecord.create({
          data: {
            phone,
            message: finalMessage,
            status:  result.sent ? "SENT" : ("FAILED" as never),
            sentAt:  result.sent ? new Date() : null,
            sentById: session.user.id,
            relatedType: group ?? "manual",
            count: Math.ceil(finalMessage.length / 160),
          },
        });
        if (result.sent) sentCount++; else failedCount++;
      } catch {
        failedCount++;
      }
    }

    return NextResponse.json({
      message:     `SMS পাঠানো হয়েছে: ${sentCount}টি সফল, ${failedCount}টি ব্যর্থ।`,
      sentCount,
      failedCount,
      total:       targetPhones.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
