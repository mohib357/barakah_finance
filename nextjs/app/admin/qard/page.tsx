import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import QardAdmin from "@/components/admin/qard/QardAdmin";

export const metadata = { title: "করজে হাসানা ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminQardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/qard");
  if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole)) redirect("/unauthorized");
  return <QardAdmin />;
}
