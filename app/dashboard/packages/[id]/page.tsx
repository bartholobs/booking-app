"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // useParams buat ambil ID dari URL
import { supabase } from "../../../../lib/supabaseClient"; // Mundur 4 folder

export default function PackageDetailPage() {
  const { id } = useParams(); // Ambil ID Paket
  const router = useRouter();
  
  const [pkg, setPkg] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); // Bank Materi (Dropdown)
  
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  // 1. Ambil Data Paket & Kurikulum
  const fetchData = async () => {
    // A. Ambil Info Paket
    const { data: pkgData } = await supabase.from("packages").select("*").eq("id", id).single();
    if (pkgData) setPkg(pkgData);

    // B. Ambil Isi Kurikulum (Join dengan Materials)
    const { data: currData } = await supabase
      .from("curriculum")
      .select(`
        id, sort_order,
        material:materials (id, name, code, session_count)
      `)
      .eq("package_id", id)
      .order("sort_order", { ascending: true });
    
    if (currData) setCurriculum(currData);

    // C. Ambil Semua Opsi Materi (Buat Dropdown)
    const { data: matData } = await supabase.from("materials").select("*").order("name");
    if (matData) setMaterials(matData);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // 2. Fungsi Hitung Ulang Total Sesi (Automation)
  const recalculateTotalSessions = async () => {
    // Ambil data kurikulum terbaru
    const { data: currList } = await supabase
      .from("curriculum")
      .select(`material:materials (session_count)`)
      .eq("package_id", id);
    
    if (currList) {
        // Jumlahkan semua sesi
        const total = currList.reduce((sum, item: any) => sum + (item.material?.session_count || 0), 0);
        
        // Update ke Tabel Packages
        await supabase.from("packages").update({ total_sessions: total }).eq("id", id);
        
        // Refresh tampilan header
        const { data: updatedPkg } = await supabase.from("packages").select("*").eq("id", id).single();
        if (updatedPkg) setPkg(updatedPkg);
    }
  };

  // 3. Tambah Materi ke Kurikulum
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    const { error } = await supabase.from("curriculum").insert([{
      package_id: id,
      material_id: parseInt(selectedMaterial),
      sort_order: parseInt(sortOrder) || (curriculum.length + 1) // Default urutan terakhir
    }]);

    if (!error) {
      setSelectedMaterial(""); setSortOrder("");
      await fetchData(); // Refresh list
      await recalculateTotalSessions(); // Update total sesi
    } else {
      alert("Gagal: " + error.message);
    }
  };

  // 4. Hapus Materi
  const handleDelete = async (currId: number) => {
    if (!confirm("Hapus materi ini dari kurikulum?")) return;
    
    const { error } = await supabase.from("curriculum").delete().eq("id", currId);
    if (!error) {
        await fetchData();
        await recalculateTotalSessions();
    }
  };

  if (!pkg) return <div className="p-8">Loading Data...</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
            <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">← Kembali ke Master Paket</button>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Setting Kurikulum: <span className="text-blue-600">{pkg.name}</span></h1>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Total Durasi</p>
                    <p className="text-2xl font-bold text-green-600">{pkg.total_sessions} Sesi</p>
                </div>
            </div>
        </div>

        {/* FORM TAMBAH */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Tambahkan Materi ke Paket Ini</h3>
          <form onSubmit={handleAdd} className="flex gap-4">
            <div className="w-20">
                <input type="number" placeholder="No." value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full rounded-md border p-2 focus:border-blue-500 outline-none" title="Urutan" />
            </div>
            <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)} className="flex-1 rounded-md border p-2 focus:border-blue-500 outline-none bg-white" required>
                <option value="">-- Pilih Materi --</option>
                {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name} ({m.session_count} Sesi)</option>
                ))}
            </select>
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700">+ Tambah</button>
          </form>
        </div>

        {/* LIST KURIKULUM */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Urutan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Materi</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sesi</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {curriculum.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-gray-400">Belum ada materi di paket ini.</td></tr>
              ) : (
                curriculum.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-700">#{item.sort_order}</td>
                    <td className="px-6 py-4 font-mono text-sm text-blue-600">{item.material?.code}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.material?.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.material?.session_count}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded">Lepas</button>
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