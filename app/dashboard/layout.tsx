"use client";
import React from "react";
import Navbar from "../components/Navbar"; 

/**
 * LAYOUT UTAMA DASHBOARD
 * Layout ini membungkus semua halaman yang ada di dalam folder /dashboard.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* NAVBAR: 
        PASTIKAN di folder app/components hanya ada SATU file bernama Navbar.tsx (N besar).
      */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-16 transition-all duration-300">
        <div className="w-full h-full">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-[10px] text-gray-400 border-t border-gray-100 bg-white">
        &copy; {new Date().getFullYear()} BookingApp Management System
      </footer>
    </div>
  );
}