// Barakah Finance — Member Application Submission
// POST /api/member-applications
// Accepts multipart/form-data (photo + signature + NID files)
// Spec flow: User submits -> PENDING -> Admin/Committee review -> Approved/Rejected -> Payment -> Member ID

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ApplicationStatus, InvestType } from "@/types/enums";
import { sendSMS } from "@/lib/auth/otp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";

async function saveDataUrl(dataUrl: string, subdir: string, filename: string): Promise<string> {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image data");
  const buffer = Buffer.from(matches[2], "base64");
  const dir = path.join(process.cwd(), UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

async function saveUploadedFile(file: File, subdir: string, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for duplicate pending application
    const existing = await prisma.memberApplication.findFirst({
      where: { userId, status: { in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "আপনার একটি আবেদন ইতিমধ্যে পেন্ডিং অবস্থায় আছে।" },
        { status: 409 }
      );
    }

    const formData = await req.formData();
    const g = (key: string) => (formData.get(key) as string | null) ?? "";

    const nameBn     = g("nameBn").trim();
    const nameEn     = g("nameEn").trim();
    const fatherName = g("fatherName").trim();
    const motherName = g("motherName").trim() || null;
    const dob        = g("dob");
    const gender     = g("gender");
    const phone      = g("phone").trim();
    const email      = g("email").trim() || null;
    const nid        = g("nid").trim();
    const profession = g("profession").trim() || null;
    const division   = g("division").trim();
    const district   = g("district").trim();
    const upazila    = g("upazila").trim() || null;
    const village    = g("village").trim();

    const nomineeName     = g("nomineeName").trim();
    const nomineeRelation = g("nomineeRelation").trim();
    const nomineePhone    = g("nomineePhone").trim();
    const nomineeGender   = g("nomineeGender") || null;
    const nomineeAddress  = g("nomineeAddress").trim() || null;

    const investType   = g("investType") as InvestType || InvestType.MONTHLY_SAVINGS;
    const investAmount = parseFloat(g("investAmount") || "0");
    const investStart  = g("investStart") || null;

    if (!nameBn || !nameEn || !fatherName || !dob || !gender || !phone || !nid || !division || !district || !village) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য অনুপস্থিত।" }, { status: 400 });
    }
    if (!nomineeName || !nomineeRelation || !nomineePhone) {
      return NextResponse.json({ error: "নমিনির তথ্য অনুপস্থিত।" }, { status: 400 });
    }

    const ts = Date.now();
    let photoUrl = "";
    let signUrl  = "";
    let nidFrontUrl = "";
    let nidBackUrl  = "";

    const photoDataUrl = g("photoDataUrl");
    const signDataUrl  = g("signDataUrl");

    if (photoDataUrl) photoUrl = await saveDataUrl(photoDataUrl, "photos",     `${userId}_${ts}.webp`);
    if (signDataUrl)  signUrl  = await saveDataUrl(signDataUrl,  "signatures", `${userId}_${ts}.webp`);

    const nidFrontFile = formData.get("nidFront") as File | null;
    const nidBackFile  = formData.get("nidBack")  as File | null;
    if (nidFrontFile?.name) {
      nidFrontUrl = await saveUploadedFile(nidFrontFile, "kyc", `${userId}_front_${ts}${path.extname(nidFrontFile.name) || ".jpg"}`);
    }
    if (nidBackFile?.name) {
      nidBackUrl = await saveUploadedFile(nidBackFile, "kyc", `${userId}_back_${ts}${path.extname(nidBackFile.name) || ".jpg"}`);
    }

    // Update user profile
    await prisma.userProfile.upsert({
      where:  { userId },
      create: {
        userId,
        fatherName,
        motherName,
        dateOfBirth: dob ? new Date(dob) : null,
        occupation:  profession,
        division,    district,   upazila,   village,
        ...(photoUrl && { photoUrl }),
        ...(signUrl  && { signatureUrl: signUrl }),
      },
      update: {
        fatherName,  motherName,
        dateOfBirth: dob ? new Date(dob) : null,
        occupation:  profession,
        division,    district,   upazila,   village,
        ...(photoUrl && { photoUrl }),
        ...(signUrl  && { signatureUrl: signUrl }),
      },
    });

    // Update KYC
    if (nidFrontUrl) {
      await prisma.userKYC.upsert({
        where:  { userId },
        create: { userId, nidNumber: nid, nidType: "nid", nidFrontUrl, nidBackUrl: nidBackUrl || null, status: "SUBMITTED", submittedAt: new Date() },
        update: { nidNumber: nid, nidFrontUrl, nidBackUrl: nidBackUrl || null, status: "SUBMITTED", submittedAt: new Date() },
      });
    }

    // Create application
    const application = await prisma.memberApplication.create({
      data: {
        userId,
        investType,
        investAmount,
        formFee: 100,
        status:  ApplicationStatus.PENDING,
        notes: JSON.stringify({ nameBn, nameEn, nomineeName, nomineeRelation, nomineePhone, nomineeGender, nomineeAddress, investStart }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action:   "CREATE",
        module:   "members",
        recordId: application.id,
        newValue: { status: ApplicationStatus.PENDING, investType, nameBn },
      },
    });

    // Activity feed
    await prisma.activityFeed.create({
      data: {
        userId,
        userName: nameBn,
        action:   "MEMBER_APPLICATION_SUBMITTED",
        module:   "members",
        detail:   `${nameBn} (${phone}) আবেদন করেছেন।`,
      },
    });

    // SMS to admin
    try {
      const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
      if (settings?.phone) {
        await sendSMS(settings.phone, `নতুন সদস্য আবেদন: ${nameBn} (${phone}) — পর্যালোচনা করুন।`);
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({
      message: "আবেদন সফলভাবে জমা হয়েছে। কমিটি অনুমোদন দিলে SMS পাবেন।",
      applicationId: application.id,
    }, { status: 201 });

  } catch (err) {
    console.error("[member-applications]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "সার্ভার সমস্যা।" }, { status: 500 });
  }
}
