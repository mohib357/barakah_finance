import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import NoticeBar from "@/components/layout/NoticeBar";
import Footer from "@/components/layout/Footer";
import ShopCatalog from "@/components/shop/ShopCatalog";
import { ToastProvider } from "@/components/ui/Toast";

interface Props { params: { category: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decoded = decodeURIComponent(params.category);
  return { title: `${decoded} | বারাকাহ ফাইন্যান্স শপ` };
}

export default function ShopCategoryPage({ params }: Props) {
  const category = decodeURIComponent(params.category);
  return (
    <ToastProvider>
      <Navbar />
      <NoticeBar />
      <main className="min-h-screen bg-[#FDFAF3]">
        <ShopCatalog initialCategory={category} />
      </main>
      <Footer />
    </ToastProvider>
  );
}
