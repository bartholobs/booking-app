"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");

  // 1. Ambil Data
  const fetchInstructors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("instructors")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error: " + error.message);
    } else {
      setInstructors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  // 2. Tambah Data
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nickname) return alert("Nama & Panggilan wajib diisi!");

    const { error } = await supabase
      .from("instructors")
      .insert([{ name, nickname, phone }]);

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      setName(""); setNickname(""); setPhone("");
      fetchInstructors();
    }
  };

  // 3. Hapus Data
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus instruktur ini?")) return;
    const { error } = await supabase.from("instructors").delete().eq("id", id);
    if (!error) fetchInstructors();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Instruktur</h1>
              <p className="text-sm text-gray-500">Daftar guru pengajar</p>
            </div>
            <a href="/dashboard" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm border border-gray-200 hover:bg-gray-50">
              ← Kembali ke Dashboard
            </a>
        </div>

        {/* FORM INPUT */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Tambah Guru Baru</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row">
            <input
              type="text" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 p-2 focus:ring-1 focus:ring-blue-500 outline-none" required
            />
            <input
              type="text" placeholder="Panggilan (Utk Kalender)" value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="w-full md:w-1/4 rounded-md border border-gray-300 p-2 focus:ring-1 focus:ring-blue-500 outline-none" required
            />
             <input
              type="text" placeholder="No. WA (Opsional)" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full md:w-1/4 rounded-md border border-gray-300 p-2 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700 transition shadow-sm">
              + Simpan
            </button>
          </form>
        </div>

        {/* TABEL */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Lengkap</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Panggilan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">WhatsApp</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="text-center p-8 text-gray-500 italic">Loading...</td></tr>
              ) : instructors.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-8 text-gray-400">Belum ada data instruktur.</td></tr>
              ) : (
                instructors.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.nickname}</td>
                    <td className="px-6 py-4 text-gray-500">{item.phone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}