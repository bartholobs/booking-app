"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // 1. Wajib import ini buat pindah halaman
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 2. Inisialisasi router
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // 3. LOGIKA PINDAH HALAMAN
        // Kalau login sukses, langsung lempar ke folder 'dashboard'
        console.log("Login sukses, mengarahkan ke dashboard...");
        router.push("/dashboard");
      }
      
    } catch (error: any) {
      alert("❌ Gagal Login:\n" + (error.message || "Terjadi kesalahan sistem"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-600">Admin Login</h1>
          <p className="text-gray-500">Sistem Booking Kelas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              placeholder="admin@test.com"
              required
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 font-bold text-white transition hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "MASUK DASHBOARD"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-400">
          Powered by Supabase Auth
        </div>
      </div>
    </div>
  );
}