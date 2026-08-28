import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("u");
  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, message: "à¦‡à¦‰à¦œà¦¾à¦°à¦¨à§‡à¦® à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§© à¦…à¦•à§à¦·à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡à¥¤" });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, message: "à¦¶à§à¦§à§à¦®à¦¾à¦¤à§à¦° à¦‡à¦‚à¦°à§‡à¦œà¦¿ à¦…à¦•à§à¦·à¦°, à¦¸à¦‚à¦–à§à¦¯à¦¾ à¦“ à¦†à¦¨à§à¦¡à¦¾à¦°à¦¸à§à¦•à§‹à¦° à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨à¥¤" });
  }
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  return NextResponse.json({
    available: !existing,
    message: existing ? "à¦à¦‡ à¦‡à¦‰à¦œà¦¾à¦°à¦¨à§‡à¦® à¦¨à§‡à¦“à¦¯à¦¼à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" : "à¦‡à¦‰à¦œà¦¾à¦°à¦¨à§‡à¦®à¦Ÿà¦¿ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦šà§à¦›à§‡à¥¤",
  });
}
