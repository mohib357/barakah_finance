import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function ShopPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/shop");
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">ই-কমার্স শপ — Phase 4-এ আসবে</h1>
    </div>
  );
}
