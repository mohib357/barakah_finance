import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import CommitteeAdmin from "@/components/admin/committee/CommitteeAdmin";

export const metadata = { title: "কমিটি ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminCommitteePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/committee");
  if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole))
    redirect("/unauthorized");
  return <CommitteeAdmin isSuperAdmin={session.user.systemRole === UserSystemRole.SUPER_ADMIN} />;
}
