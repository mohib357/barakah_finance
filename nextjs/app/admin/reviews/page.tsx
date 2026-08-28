import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import ReviewsAdmin from "@/components/admin/reviews/ReviewsAdmin";

export const metadata = { title: "রিভিউ মডারেশন | বারাকাহ ফাইন্যান্স" };

export default async function AdminReviewsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/admin/reviews");
  if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never))
    redirect("/unauthorized");
  return <ReviewsAdmin />;
}
