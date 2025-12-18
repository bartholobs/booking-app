"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60"); // Default 60 menit

  // 1. Ambil Data
  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // 2. Tambah Data
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const { error } = await supabase
      .from("locations")
      .insert([{ name, duration: parseInt(duration) }]);

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      setName(""); 
      setDuration("60");
      fetchLocations();
    }
  };

  // 3. Hapus Data
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus lokasi ini?")) return;
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (!error) fetchLocations();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Lokasi</h1>
              <p className="text-sm text-gray-500">Daftar ruangan atau jenis kelas</p>
            </div>
            <a href="/dashboard" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm border border-gray-200 hover:bg-gray-50">
              ← Kembali ke Dashboard
            </a>
        </div>

        {/* FORM INPUT */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Tambah Lokasi Baru</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
                <input
                type="text" placeholder="Nama Lokasi (Misal: Ruang A / Online)" 
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-1 focus:ring-blue-500 outline-none" required
                />
            </div>
            <div className="w-full md:w-1/4">
                <div className="relative">
                    <input
                    type="number" placeholder="Durasi" 
                    value={duration} onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 pr-12 focus:ring-1 focus:ring-blue-500 outline-none" required
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm">Menit</span>
                </div>
            </div>
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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Lokasi</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durasi Default</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="text-center p-8 text-gray-500 italic">Loading...</td></tr>
              ) : locations.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-8 text-gray-400">Belum ada data lokasi.</td></tr>
              ) : (
                locations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {item.duration} Menit
                        </span>
                    </td>
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