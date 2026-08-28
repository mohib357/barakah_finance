// Barakah Finance — Admin Accounts Page
// Route: /admin/accounts
// Tabs: Summary | Income | Expense | Fund Transfer | Reconciliation

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import AccountsDashboard from "@/components/admin/accounts/AccountsDashboard";

export const metadata = { title: "হিসাব ব্যবস্থাপনা | বারাকাহ ফাইন্যান্স" };

export default async function AdminAccountsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/accounts");
  const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                  session.user.systemRole === UserSystemRole.SUPER_ADMIN;
  if (!isAdmin) redirect("/unauthorized");

  return <AccountsDashboard />;
}
