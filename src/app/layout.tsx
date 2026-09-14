import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIO PALLET CRM",
  description: "BIO PALLET firmasi uchun mijozlar, buyurtmalar va ombor boshqaruv tizimi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
