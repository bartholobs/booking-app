import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- INI WAJIB ADA! Jangan sampai hilang.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Booking Kelas",
  description: "Aplikasi manajemen les privat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}