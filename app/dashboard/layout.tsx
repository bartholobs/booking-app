"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Buat tau kita lagi di halaman mana
  const router = useRouter();

  const handleLogout = async () => {
    // Logout dari Supabase & Tendang ke Login
    await supabase.auth.signOut();
    router.push("/");
  };

  // Daftar Menu Lengkap
  const menus = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Jadwal Kelas", href: "/dashboard/bookings", icon: "📅" },
    { name: "Murid", href: "/dashboard/students", icon: "👨‍🎓" },
    { name: "Instruktur", href: "/dashboard/instructors", icon: "👩‍🏫" },
    { name: "Master Paket", href: "/dashboard/packages", icon: "📦" }, // Baru
    { name: "Bank Materi", href: "/dashboard/materials", icon: "📚" }, // Baru
    { name: "Lokasi", href: "/dashboard/locations", icon: "📍" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- SIDEBAR KIRI (Tetap) --- */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg border-r border-gray-200 z-10 overflow-y-auto">
        <div className="flex h-16 items-center justify-center border-b border-gray-100 bg-white sticky top-0 z-20">
          <h2 className="text-xl font-bold text-blue-600 tracking-wider">ADMIN PANEL</h2>
        </div>
        
        <nav className="p-4 space-y-2">
          {menus.map((menu) => {
            const isActive = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{menu.icon}</span>
                {menu.name}
              </Link>
            );
          })}
        </nav>

        {/* Tombol Logout di Bawah */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* --- KONTEN KANAN (Berubah-ubah) --- */}
      <main className="ml-64 w-full p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}