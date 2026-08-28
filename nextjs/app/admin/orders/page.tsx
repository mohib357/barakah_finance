import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";

export const metadata = { title: "অর্ডার ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminOrdersPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/orders");
  const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
  if (!isAdmin) redirect("/unauthorized");
  return (
    <div className="min-h-screen bg-[#FDFAF3] p-8">
      <h1 className="text-xl font-bold text-[#0D2B1A]">📦 অর্ডার ব্যবস্থাপনা</h1>
      <p className="text-gray-500 mt-1">কিস্তি অর্ডার তালিকা ও সংগ্রহ — Phase 4 UI সম্পূর্ণ করা হচ্ছে।</p>
    </div>
  );
}
