import Navbar from "@/components/layout/Navbar";
import NoticeBar from "@/components/layout/NoticeBar";
import Footer from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Navbar />
      <NoticeBar />
      <main>{children}</main>
      <Footer />
    </ToastProvider>
  );
}
