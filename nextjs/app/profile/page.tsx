import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?callbackUrl=/profile");
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">প্রোফাইল — Phase 4-এ আসবে</h1>
    </div>
  );
}
