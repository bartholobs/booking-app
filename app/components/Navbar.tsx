"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Database, 
  LogOut, 
  ChevronDown,
  UserSquare2,
  Package,
  BookOpen,
  MapPin,
  Menu,
  X,
  UserCircle
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Mengambil data user yang sedang login dari Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || null);
    };
    getUser();
  }, []);

  // Fungsi Logout
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  // Navigasi Utama
  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jadwal Kelas", href: "/dashboard/bookings", icon: CalendarDays },
    { name: "Murid", href: "/dashboard/students", icon: Users },
  ];

  // Navigasi Master Data (Dropdown)
  const masterDataLinks = [
    { name: "Instruktur", href: "/dashboard/instructors", icon: UserSquare2 },
    { name: "Master Paket", href: "/dashboard/packages", icon: Package },
    { name: "Bank Materi", href: "/dashboard/materials", icon: BookOpen },
    { name: "Lokasi", href: "/dashboard/locations", icon: MapPin },
  ];

  const isActive = (path: string) => pathname === path;
  const isMasterActive = masterDataLinks.some(link => pathname === link.href);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-xl tracking-tighter">B</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight hidden sm:block">
                  Booking<span className="text-blue-600">App</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase hidden sm:block leading-none mt-0.5">
                  Management
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive(link.href)
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100 scale-105"
                    : "text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <link.icon size={18} strokeWidth={isActive(link.href) ? 3 : 2} />
                {link.name}
              </Link>
            ))}

            {/* Master Data Dropdown */}
            <div className="relative ml-2">
              <button
                onMouseEnter={() => setIsMasterOpen(true)}
                onClick={() => setIsMasterOpen(!isMasterOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isMasterActive
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <Database size={18} strokeWidth={isMasterActive ? 3 : 2} />
                Master Data
                <ChevronDown size={14} className={`transition-transform duration-300 ${isMasterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Panel */}
              {isMasterOpen && (
                <div 
                  className="absolute top-full right-0 w-60 mt-2 py-3 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200"
                  onMouseLeave={() => setIsMasterOpen(false)}
                >
                  <div className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Database Master</div>
                  {masterDataLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMasterOpen(false)}
                      className={`flex items-center justify-between px-5 py-3 mx-2 rounded-xl text-sm transition-all group ${
                        isActive(link.href)
                          ? "text-blue-600 bg-blue-50 font-bold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon size={18} strokeWidth={isActive(link.href) ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
                        {link.name}
                      </div>
                      {isActive(link.href) && <div className="w-1.5 h-6 rounded-full bg-blue-600"></div>}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-8 w-[1px] bg-gray-200 mx-4"></div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <UserCircle size={20} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-bold max-w-[120px] truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-red-600 text-sm font-bold transition-all duration-300 hover:shadow-xl hover:shadow-red-200 group active:scale-95"
              >
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-8 space-y-4 shadow-2xl animate-in slide-in-from-top duration-300 overflow-y-auto max-h-[85vh]">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all ${
                isActive(link.href)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <link.icon size={24} strokeWidth={2.5} />
              {link.name}
            </Link>
          ))}
          
          <div className="pt-6 pb-2 text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 border-t border-gray-100 mt-4">Master Data</div>
          <div className="grid grid-cols-2 gap-3">
            {masterDataLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all ${
                  isActive(link.href)
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold"
                    : "bg-white border-gray-100 text-gray-600 hover:border-blue-100 shadow-sm"
                }`}
              >
                <link.icon size={24} strokeWidth={2} />
                <span className="text-[10px] uppercase font-bold text-center">{link.name}</span>
              </Link>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 font-black mt-6 border border-red-100 active:scale-95 transition-transform"
          >
            <LogOut size={22} />
            Keluar Aplikasi
          </button>
        </div>
      )}
    </nav>
  );
}