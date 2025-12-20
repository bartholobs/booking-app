"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient"; // Pastikan path ke client supabase bener bro
import Navbar from "../components/Navbar"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Cek apakah ada session aktif
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Kalau nggak ada, tendang balik ke login (halaman root)
        router.replace("/");
      } else {
        // Kalau ada, matikan loading
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  // Tampilan Loading pas lagi verifikasi session
  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
          Verifikasi Sesi...
        </p>
      </div>
    );
  }

  // Jika sudah login, tampilkan layout dashboard yang lama
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-16 transition-all duration-500 ease-in-out">
        <div className="w-full h-full animate-in fade-in duration-700">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-4 text-center text-[10px] text-gray-400 border-t border-gray-100 bg-white">
        &copy; {new Date().getFullYear()} BookingApp Management System
      </footer>
    </div>
  );
}