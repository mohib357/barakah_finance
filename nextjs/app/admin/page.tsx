import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "অ্যাডমিন ড্যাশবোর্ড | বারাকাহ ফাইন্যান্স" };

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never)) redirect("/unauthorized");
  return <AdminDashboard user={session.user} />;
}
