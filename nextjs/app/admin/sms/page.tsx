import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import SMSAdmin from "@/components/admin/sms/SMSAdmin";

export const metadata = { title: "SMS ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminSMSPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/sms");
  if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole))
    redirect("/unauthorized");
  return <SMSAdmin />;
}
