import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("u");
  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, message: "ইউজারনেম কমপক্ষে ৩ অক্ষর হতে হবে।" });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, message: "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা ও আন্ডারস্কোর ব্যবহার করুন।" });
  }
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  return NextResponse.json({
    available: !existing,
    message: existing ? "এই ইউজারনেম নেওয়া হয়েছে।" : "ইউজারনেমটি পাওয়া যাচ্ছে।",
  });
}
