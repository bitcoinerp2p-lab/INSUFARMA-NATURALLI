import { Suspense } from "react";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import AffiliateTracker from "@/components/store/AffiliateTracker";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
