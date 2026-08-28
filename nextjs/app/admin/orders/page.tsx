import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import OrdersAdmin from "@/components/admin/orders/OrdersAdmin";

export const metadata = { title: "অর্ডার ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminOrdersPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/orders");
  if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole)) redirect("/unauthorized");
  return <OrdersAdmin />;
}
