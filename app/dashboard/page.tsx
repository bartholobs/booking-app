"use client";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
            <p className="text-gray-500">Selamat datang kembali!</p>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-200"
          >
            Log Out
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Status Sistem</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">Online 🟢</p>
          </div>
        </div>
        
        <div className="mt-8 p-8 text-center bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
            Menu manajemen murid ada di sidebar (Next Update)
        </div>
      </div>
    </div>
  );
}