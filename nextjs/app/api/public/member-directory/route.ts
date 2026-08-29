export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      where:   { status: "APPROVED" },
      orderBy: { memberID: "asc" },
      select: {
        id:       true,
        memberID: true,
        user: {
          select: {
            firstName: true,
            lastName:  true,
            phone:     true,
            profile:   { select: { district: true, village: true } },
          },
        },
      },
      take: 200,
    });

    const result = members.map((m) => ({
      id:       m.id,
      memberID: m.memberID,
      name:     [m.user.firstName, m.user.lastName].filter(Boolean).join(" "),
      phone:    m.user.phone ?? undefined,
      address:  [m.user.profile?.village, m.user.profile?.district]
                  .filter(Boolean).join(", ") || undefined,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
