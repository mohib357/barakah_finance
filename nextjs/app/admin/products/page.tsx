import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import ProductsAdmin from "@/components/admin/products/ProductsAdmin";

export const metadata = { title: "পণ্য ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminProductsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/products");
  const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
  if (!isAdmin) redirect("/unauthorized");
  return <ProductsAdmin />;
}
