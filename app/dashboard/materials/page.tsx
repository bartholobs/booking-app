"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sessions, setSessions] = useState("1"); // Default 1 sesi

  // 1. Ambil Data
  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("code", { ascending: true });

    if (error) alert("Error: " + error.message);
    else setMaterials(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  // 2. Tambah Data
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const { error } = await supabase.from("materials").insert([{
      name, 
      code, 
      session_count: parseInt(sessions)
    }]);

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      setName(""); setCode(""); setSessions("1");
      fetchMaterials();
    }
  };

  // 3. Hapus Data
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus materi ini?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (!error) fetchMaterials();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">Bank Materi</h1></div>

        {/* FORM INPUT */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Tambah Materi Baru</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row">
            <input type="text" placeholder="Kode (Misal: MTK-01)" value={code} onChange={(e) => setCode(e.target.value)} className="w-full md:w-1/4 rounded-md border p-2 focus:border-blue-500 outline-none" required />
            <input type="text" placeholder="Nama Materi" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-md border p-2 focus:border-blue-500 outline-none" required />
            <div className="w-full md:w-1/6 relative">
                 <input type="number" placeholder="Sesi" value={sessions} onChange={(e) => setSessions(e.target.value)} className="w-full rounded-md border p-2 pr-8 focus:border-blue-500 outline-none" required />
                 <span className="absolute right-2 top-2 text-xs text-gray-400">Sesi</span>
            </div>
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700">+ Simpan</button>
          </form>
        </div>

        {/* TABEL */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Materi</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Jml Sesi</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm text-blue-600">{m.code}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-gray-500">{m.session_count}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-800 text-sm">Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}