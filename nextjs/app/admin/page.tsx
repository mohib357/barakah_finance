import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";

export const metadata = { title: "অ্যাডমিন ড্যাশবোর্ড | বারাকাহ ফাইন্যান্স" };

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
  if (!isAdmin) redirect("/unauthorized");

  return (
    <div className="min-h-screen bg-[#FDFAF3] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0D2B1A] mb-2">
          অ্যাডমিন ড্যাশবোর্ড
        </h1>
        <p className="text-gray-500 mb-8">স্বাগতম, {session.user.firstName}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { href: "/admin/accounts", icon: "💼", label: "হিসাব ব্যবস্থাপনা",    desc: "আয়, ব্যয়, ট্রান্সফার" },
            { href: "/admin/products", icon: "🛒", label: "পণ্য ব্যবস্থাপনা",     desc: "ক্যাটালগ, স্টক" },
            { href: "/admin/orders",   icon: "📦", label: "অর্ডার ব্যবস্থাপনা",   desc: "কিস্তি অর্ডার" },
            { href: "/admin/qard",     icon: "🤝", label: "করজে হাসানা",          desc: "আবেদন, অনুমোদন" },
            { href: "/admin/members",  icon: "👥", label: "সদস্য ব্যবস্থাপনা",   desc: "সদস্য তালিকা" },
            { href: "/audit-log",      icon: "📋", label: "অডিট লগ",              desc: "সমস্ত কার্যক্রম" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md hover:border-[#1D9E75]/30 transition-all"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h2 className="font-bold text-[#0D2B1A] text-sm mb-0.5">{item.label}</h2>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
