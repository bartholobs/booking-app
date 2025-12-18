"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // State untuk menyimpan angka-angka statistik
  const [stats, setStats] = useState({
    totalStudents: 0,
    classesToday: 0,
    totalInstructors: 0
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // 1. Tentukan Tanggal Hari Ini (Format YYYY-MM-DD)
      // Kita pakai toLocaleDateString('en-CA') biar formatnya pasti YYYY-MM-DD
      const todayStr = new Date().toLocaleDateString('en-CA'); 

      // 2. Jalankan 3 Query sekaligus (Parallel) biar ngebut
      const [resStudents, resClasses, resInstructors] = await Promise.all([
        // Hitung Murid Aktif
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
        
        // Hitung Kelas HARI INI
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("date", todayStr),
        
        // Hitung Total Instruktur
        supabase.from("instructors").select("*", { count: "exact", head: true })
      ]);

      // 3. Masukkan hasil hitungan ke State
      setStats({
        totalStudents: resStudents.count || 0,
        classesToday: resClasses.count || 0,
        totalInstructors: resInstructors.count || 0
      });

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
            <p className="text-gray-500">Ringkasan operasional hari ini</p>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition border border-red-100"
          >
            Log Out
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* Card 1: Total Murid */}
          <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-gray-200 group hover:border-blue-300 transition">
            <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-blue-50 transition group-hover:bg-blue-100"></div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Murid Aktif</h3>
            <p className="mt-2 text-4xl font-extrabold text-blue-600 relative z-10">
                {loading ? "..." : stats.totalStudents}
            </p>
            <div className="mt-4 text-xs text-gray-400">Total siswa terdaftar</div>
          </div>
          
          {/* Card 2: Kelas Hari Ini */}
          <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-gray-200 group hover:border-green-300 transition">
            <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-green-50 transition group-hover:bg-green-100"></div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Kelas Hari Ini</h3>
            <p className="mt-2 text-4xl font-extrabold text-green-600 relative z-10">
                {loading ? "..." : stats.classesToday}
            </p>
            <div className="mt-4 text-xs text-gray-400">Jadwal yang harus berjalan</div>
          </div>

          {/* Card 3: Instruktur */}
          <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-gray-200 group hover:border-purple-300 transition">
            <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-purple-50 transition group-hover:bg-purple-100"></div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Instruktur</h3>
            <p className="mt-2 text-4xl font-extrabold text-purple-600 relative z-10">
                {loading ? "..." : stats.totalInstructors}
            </p>
            <div className="mt-4 text-xs text-gray-400">Guru siap mengajar</div>
          </div>
        </div>

        {/* Info Tambahan */}
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 mb-3">
            <span className="text-xl">🚀</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Sistem Siap Digunakan</h3>
          <p className="mt-1 text-sm text-gray-500">Silakan gunakan menu di sidebar kiri untuk mulai mengelola jadwal.</p>
        </div>

      </div>
    </div>
  );
}