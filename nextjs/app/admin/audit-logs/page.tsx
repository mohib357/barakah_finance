import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import AuditLogViewer from "@/components/admin/audit/AuditLogViewer";

export const metadata = { title: "অডিট লগ | বারাকাহ ফাইন্যান্স" };

export default async function AdminAuditLogsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/audit-logs");
  // Spec: "শুধুমাত্র Super Admin ... দেখতে পারবে"
  if (session.user.systemRole !== UserSystemRole.SUPER_ADMIN) redirect("/unauthorized");
  return <AuditLogViewer />;
}
