import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office Booking",
  description: "Reserve your workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
