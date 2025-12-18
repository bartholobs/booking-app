"use client";
import { useState, useEffect } from "react";
import Link from "next/link"; // Import Link
import { supabase } from "../../../lib/supabaseClient";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  // Total sesi kita disable inputnya karena nanti otomatis dihitung dari kurikulum
  const [totalSessions, setTotalSessions] = useState("0"); 

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("packages").select("*").order("code", { ascending: true });
    if (!error) setPackages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPackages(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("packages").insert([{
      name, code, total_sessions: 0 // Default 0 dulu
    }]);

    if (!error) {
      setName(""); setCode(""); 
      fetchPackages();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus paket ini?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (!error) fetchPackages();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">Master Paket</h1></div>

        {/* FORM INPUT PAKET */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Buat Paket Baru</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row">
            <input type="text" placeholder="Kode (Misal: PKG-01)" value={code} onChange={(e) => setCode(e.target.value)} className="w-full md:w-1/4 rounded-md border p-2 focus:border-blue-500 outline-none" required />
            <input type="text" placeholder="Nama Paket" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-md border p-2 focus:border-blue-500 outline-none" required />
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700">+ Simpan</button>
          </form>
        </div>

        {/* TABEL PAKET */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Paket</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total Sesi</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm text-purple-600">{p.code}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">
                      {p.total_sessions} Sesi
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {/* TOMBOL BARU: ATUR KURIKULUM */}
                    <Link 
                      href={`/dashboard/packages/${p.id}`}
                      className="rounded-md bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700 hover:bg-orange-200 transition"
                    >
                      ⚙️ Atur Kurikulum
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 text-sm font-medium px-2">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}