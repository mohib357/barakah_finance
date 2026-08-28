// Dashboard — Phase 4 will build out the full user dashboard
// For now: stub with session gate
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="min-h-screen p-8 bg-[#FDFAF3]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0D2B1A]">
          স্বাগতম, {session.user.firstName}!
        </h1>
        <p className="text-gray-500 mt-2">
          আপনার ড্যাশবোর্ড Phase 4-এ সম্পূর্ণরূপে তৈরি হবে।
        </p>
        <div className="mt-6 rounded-xl border border-[#1D9E75]/20 bg-white p-6">
          <p className="text-sm text-gray-600">
            🔑 আপনি সফলভাবে লগইন করেছেন।<br />
            ভূমিকা: <strong>{session.user.systemRole}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
