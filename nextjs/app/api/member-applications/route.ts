// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Member Application Submission
//  POST /api/member-applications
//  Accepts multipart/form-data (photo + signature + NID files)
//  Spec flow:
//    User submits → Application = PENDING
//    Admin/Committee reviews → Approved / Rejected
//    If Approved → Payment Request → Member ID Activated
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ApplicationStatus, InvestType, Gender } from "@/types/enums";
import { sendSMS } from "@/lib/auth/otp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";

/** Save a base64 data-URL to disk and return the public path */
async function saveDataUrl(dataUrl: string, subdir: string, filename: string): Promise<string> {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image data");
  const buffer = Buffer.from(matches[2], "base64");
  const dir    = path.join(process.cwd(), UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);
  return `/${subdir}/${filename}`;
}

/** Save a file buffer (NID upload) */
async function saveUploadedFile(file: File, subdir: string, filename: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);
  const dir         = path.join(process.cwd(), UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);
  return `/${subdir}/${filename}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
    }

    const userId = session.user.id;

    // ── Check for duplicate pending application ──────────────
    const existing = await prisma.memberApplication.findFirst({
      where: { userId, status: { in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "আপনার একটি আবেদন ইতিমধ্যে পেন্ডিং অবস্থায় আছে।" },
        { status: 409 }
      );
    }

    // ── Parse multipart form ─────────────────────────────────
    const formData = await req.formData();
    const g = (key: string) => (formData.get(key) as string | null) ?? "";

    // Personal
    const nameBn     = g("nameBn").trim();
    const nameEn     = g("nameEn").trim();
    const fatherName = g("fatherName").trim();
    const motherName = g("motherName").trim();
    const dob        = g("dob");
    const gender     = g("gender") as Gender | "";
    const phone      = g("phone").trim();
    const email      = g("email").trim() || null;
    const nid        = g("nid").trim();
    const profession = g("profession").trim() || null;
    const division   = g("division").trim();
    const district   = g("district").trim();
    const upazila    = g("upazila").trim() || null;
    const village    = g("village").trim();

    // Nominee
    const nomineeName     = g("nomineeName").trim();
    const nomineeRelation = g("nomineeRelation").trim();
    const nomineePhone    = g("nomineePhone").trim();
    const nomineeGender   = g("nomineeGender") as Gender | "" | null;
    const nomineeAddress  = g("nomineeAddress").trim() || null;

    // Investment
    const investType   = g("investType") as InvestType;
    const investAmount = parseFloat(g("investAmount") || "0");
    const investStart  = g("investStart") || null;

    // Validate required fields
    if (!nameBn || !nameEn || !fatherName || !dob || !gender || !phone || !nid || !division || !district || !village) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য অনুপস্থিত।" }, { status: 400 });
    }
    if (!nomineeName || !nomineeRelation || !nomineePhone) {
      return NextResponse.json({ error: "নমিনির তথ্য অনুপস্থিত।" }, { status: 400 });
    }

    // ── Save images ──────────────────────────────────────────
    const ts        = Date.now();
    let photoUrl    = "";
    let signUrl     = "";
    let nidFrontUrl = "";
    let nidBackUrl  = "";

    const photoDataUrl = g("photoDataUrl");
    const signDataUrl  = g("signDataUrl");

    if (photoDataUrl) {
      photoUrl = await saveDataUrl(photoDataUrl, `photos`,     `${userId}_${ts}.webp`);
    }
    if (signDataUrl) {
      signUrl  = await saveDataUrl(signDataUrl,  `signatures`, `${userId}_${ts}.webp`);
    }

    const nidFrontFile = formData.get("nidFront") as File | null;
    const nidBackFile  = formData.get("nidBack")  as File | null;

    if (nidFrontFile?.name) {
      const ext = path.extname(nidFrontFile.name) || ".jpg";
      nidFrontUrl = await saveUploadedFile(nidFrontFile, `kyc`, `${userId}_front_${ts}${ext}`);
    }
    if (nidBackFile?.name) {
      const ext = path.extname(nidBackFile.name) || ".jpg";
      nidBackUrl = await saveUploadedFile(nidBackFile, `kyc`, `${userId}_back_${ts}${ext}`);
    }

    // ── Update user profile with submitted data ──────────────
    await prisma.userProfile.upsert({
      where:  { userId },
      create: {
        userId,
        fatherName,    fatherNameEn: nameEn ? fatherName : undefined,
        motherName:    motherName || null,
        dateOfBirth:   dob ? new Date(dob) : null,
        gender:        gender || undefined,
        occupation:    profession || null,
        division,      district,      upazila: upazila || null,
        village,       villageEn:     null,
        photoUrl:      photoUrl  || null,
        signatureUrl:  signUrl   || null,
      },
      update: {
        fatherName,
        motherName:    motherName || null,
        dateOfBirth:   dob ? new Date(dob) : null,
        gender:        gender || undefined,
        occupation:    profession || null,
        division,      district,   upazila: upazila || null,
        village,
        ...(photoUrl && { photoUrl }),
        ...(signUrl  && { signatureUrl: signUrl }),
      },
    });

    // ── Update KYC ───────────────────────────────────────────
    if (nidFrontUrl) {
      await prisma.userKYC.upsert({
        where:  { userId },
        create: {
          userId,
          nidNumber:    nid,
          nidType:      "nid",
          nidFrontUrl,
          nidBackUrl:   nidBackUrl || null,
          status:       "SUBMITTED",
          submittedAt:  new Date(),
        },
        update: {
          nidNumber:    nid,
          nidFrontUrl,
          nidBackUrl:   nidBackUrl || null,
          status:       "SUBMITTED",
          submittedAt:  new Date(),
        },
      });
    }

    // ── Create MemberApplication record ──────────────────────
    const application = await prisma.memberApplication.create({
      data: {
        userId,
        investType:   investType   || InvestType.MONTHLY_SAVINGS,
        investAmount: investAmount || 0,
        formFee:      100,
        status:       ApplicationStatus.PENDING,
        notes: JSON.stringify({
          nameBn, nameEn, nomineeName, nomineeRelation, nomineePhone,
          nomineeGender: nomineeGender || null, nomineeAddress,
          investStart,
        }),
      },
    });

    // ── Audit log ────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        userId,
        action:   "CREATE",
        module:   "members",
        recordId: application.id,
        newValue: { status: ApplicationStatus.PENDING, investType },
      },
    });

    // ── Activity feed ─────────────────────────────────────────
    await prisma.activityFeed.create({
      data: {
        userId,
        userName: nameBn,
        action:   "MEMBER_APPLICATION_SUBMITTED",
        module:   "members",
        detail:   `${nameBn} (${phone}) — আবেদন জমা করেছেন।`,
      },
    });

    // ── Confirmation SMS to admin (optional) ─────────────────
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    if (settings?.phone) {
      await sendSMS(
        settings.phone,
        `নতুন সদস্য আবেদন: ${nameBn} (${phone}) — পর্যালোচনা করুন।`
      );
    }

    return NextResponse.json({
      message: "আবেদন সফলভাবে জমা হয়েছে। কমিটি অনুমোদন দিলে SMS পাবেন।",
      applicationId: application.id,
    }, { status: 201 });

  } catch (err) {
    console.error("[member-applications]", err);
    const msg = err instanceof Error ? err.message : "সার্ভার সমস্যা।";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
