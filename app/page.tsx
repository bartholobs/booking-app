"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  
  // State Mode: 'login' | 'signup' | 'verify'
  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(false);

  // Form Data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Nama untuk pendaftar baru
  const [otp, setOtp] = useState(""); // Kode OTP

  // --- LOGIC 1: LOGIN (MASUK) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Jika login berhasil, cek role user di database
      if (data.user) {
        checkUserRole(data.user.id);
      }
    } catch (error: any) {
      alert("❌ Gagal Login: " + error.message);
      setLoading(false);
    }
  };

  // --- LOGIC 2: SIGN UP (DAFTAR BARU) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }, // Simpan nama lengkap di metadata biar ditangkap trigger SQL
        },
      });

      if (error) throw error;

      // Jika sukses daftar, sistem Supabase akan mengirim email OTP
      if (data.user) {
        alert("✅ Pendaftaran berhasil! Silakan cek email Anda untuk kode OTP.");
        setView("verify"); // Pindah ke layar input OTP
      }
    } catch (error: any) {
      alert("❌ Gagal Daftar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC 3: VERIFIKASI OTP ---
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) throw error;

      if (data.session) {
        alert("✅ Verifikasi Sukses! Akun Anda telah aktif.");
        checkUserRole(data.user?.id); // Cek role lalu masuk dashboard
      }
    } catch (error: any) {
      alert("❌ Kode OTP Salah atau Kadaluarsa: " + error.message);
      setLoading(false);
    }
  };

  // --- HELPER: CEK ROLE & REDIRECT ---
  const checkUserRole = async (userId: string | undefined) => {
    if(!userId) return;

    // Ambil data role dari tabel profiles yang dibuat otomatis oleh Trigger SQL
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role || "staff"; // Default staff kalau belum diset
    
    // Tampilkan pesan selamat datang sesuai jabatan
    // alert(`Selamat datang! Anda login sebagai: ${role.toUpperCase()}`);
    
    // Disini lu bisa arahkan ke halaman beda kalau mau membedakan tampilan Admin vs Staff
    // Untuk sekarang kita arahkan semua ke dashboard yang sama
    router.push("/dashboard"); 
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl border border-gray-100">
        
        {/* Header Logo/Judul */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            {view === "login" ? "Selamat Datang" : view === "signup" ? "Buat Akun Baru" : "Verifikasi Email"}
          </h1>
          <p className="text-gray-500 text-sm">Sistem Manajemen Booking Kelas</p>
        </div>

        {/* --- TAMPILAN 1: FORM LOGIN --- */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin@contoh.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••" required />
            </div>
            <button disabled={loading} className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 transition disabled:bg-gray-400">
              {loading ? "Memproses..." : "MASUK DASHBOARD"}
            </button>
            <div className="text-center text-sm text-gray-600">
              Belum punya akun? <button type="button" onClick={() => setView("signup")} className="text-blue-600 font-bold hover:underline">Daftar staff disini</button>
            </div>
          </form>
        )}

        {/* --- TAMPILAN 2: FORM SIGN UP --- */}
        {view === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Budi Santoso" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="staff@sekolah.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buat password kuat" required minLength={6} />
            </div>
            <button disabled={loading} className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 transition disabled:bg-gray-400">
              {loading ? "Mendaftarkan..." : "DAFTAR SEKARANG"}
            </button>
            <div className="text-center text-sm text-gray-600">
              Sudah punya akun? <button type="button" onClick={() => setView("login")} className="text-blue-600 font-bold hover:underline">Login disini</button>
            </div>
          </form>
        )}

        {/* --- TAMPILAN 3: INPUT OTP --- */}
        {view === "verify" && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-200">
              Kode OTP 6 digit telah dikirim ke <strong>{email}</strong>. Silakan cek Inbox atau Spam folder Anda.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masukkan Kode OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" className="w-full rounded-lg border border-gray-300 p-3 text-center text-2xl tracking-widest font-mono outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <button disabled={loading} className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white hover:bg-purple-700 transition disabled:bg-gray-400">
              {loading ? "Memverifikasi..." : "KONFIRMASI OTP"}
            </button>
            <div className="text-center text-sm text-gray-600">
              Salah email? <button type="button" onClick={() => setView("signup")} className="text-red-600 hover:underline">Kembali</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}