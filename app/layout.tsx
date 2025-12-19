import type { Metadata } from "next";
import { Nunito } from "next/font/google"; // Import Nunito
import "./globals.css";

// Konfigurasi Nunito
const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-nunito", // Kita bikin variable CSS-nya
});

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
      {/* Pasang variable-nya di sini agar Tailwind bisa baca */}
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}