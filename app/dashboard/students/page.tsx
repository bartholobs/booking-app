"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useUserRole } from "../../../hooks/useUserRole"; // <-- PERBAIKAN: Mundur 3 langkah (../../../)

export default function StudentsPage() {
  // Panggil Hook Role
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [students, setStudents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Mode Edit & Search
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", package_id: "",
    join_date: new Date().toISOString().slice(0, 10),
    manual_usage: "0", graduation_status: "Belum Lulus"
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: studentData } = await supabase
      .from("students")
      .select(`*, package:packages (name, total_sessions), bookings (date)`)
      .order("name", { ascending: true });
    
    if (studentData) setStudents(studentData);

    const { data: packageData } = await supabase.from("packages").select("*").order("name");
    if (packageData) setPackages(packageData);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload: any = { 
        name: formData.name, phone: formData.phone, email: formData.email,
        join_date: formData.join_date, manual_usage: parseInt(formData.manual_usage) || 0,
        status: 'active' 
    };
    if (formData.package_id) payload.package_id = parseInt(formData.package_id);
    
    if (isEditing) {
        payload.graduation_status = formData.graduation_status;
        await supabase.from("students").update(payload).eq("id", editId);
    } else {
        payload.graduation_status = "Belum Lulus";
        await supabase.from("students").insert([payload]);
    }
    resetForm(); fetchData(); 
  };

  const resetForm = () => {
    setFormData({
        name: "", phone: "", email: "", package_id: "",
        join_date: new Date().toISOString().slice(0, 10),
        manual_usage: "0", graduation_status: "Belum Lulus"
    });
    setIsEditing(false); setEditId(null);
  };

  const handleEdit = (student: any) => {
    setIsEditing(true); setEditId(student.id);
    setFormData({
        name: student.name, phone: student.phone || "", email: student.email || "",
        package_id: student.package_id ? String(student.package_id) : "",
        join_date: student.join_date || new Date().toISOString().slice(0, 10),
        manual_usage: String(student.manual_usage || 0),
        graduation_status: student.graduation_status || "Belum Lulus"
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hapus Data (PROTECTED)
  const handleDelete = async (id: number) => {
    if (!isAdmin) {
        alert("⛔ Akses Ditolak!\nHanya Admin yang boleh menghapus data.");
        return;
    }
    if (!confirm("Yakin mau hapus data murid ini?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) fetchData(); 
  };

  const formatDateIndo = (dateStr: string) => {
    if(!dateStr) return "-";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  const filteredStudents = students.filter((student) => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-[1400px]">
        
        {/* HEADER & SEARCH */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Murid</h1>
              <p className="text-sm text-gray-500">
                Halo, Anda login sebagai <span className="font-bold text-blue-600 uppercase">{roleLoading ? "..." : (isAdmin ? "ADMIN" : "STAFF")}</span>
              </p>
            </div>
            <input type="text" placeholder="🔍 Cari nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-1/3 rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none" />
        </div>

        {/* FORM INPUT */}
        <div className={`mb-8 rounded-lg p-6 shadow-sm border ${isEditing ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isEditing ? 'text-yellow-700' : 'text-gray-700'}`}>{isEditing ? "✏️ Edit Data Murid" : "➕ Daftarkan Murid Baru"}</h3>
            {isEditing && <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 underline font-medium">❌ Batal Edit</button>}
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Tanggal Daftar</label>
                <input type="date" value={formData.join_date} onChange={e => setFormData({...formData, join_date: e.target.value})} className="w-full rounded border p-2 text-sm outline-none focus:border-blue-500" required />
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Nama Lengkap</label>
                <input type="text" placeholder="Nama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded border p-2 text-sm outline-none focus:border-blue-500" required />
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">No. HP / WA</label>
                <input type="text" placeholder="08..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded border p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input type="email" placeholder="email@contoh.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded border p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Pilih Paket</label>
                <select value={formData.package_id} onChange={e => setFormData({...formData, package_id: e.target.value})} className="w-full rounded border p-2 text-sm outline-none bg-white">
                    <option value="">-- Pilih Paket --</option>
                    {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1 text-orange-600 font-bold">Sesi Terpakai (Migrasi)</label>
                <input type="number" placeholder="0" value={formData.manual_usage} onChange={e => setFormData({...formData, manual_usage: e.target.value})} className="w-full rounded border border-orange-200 bg-orange-50 p-2 text-sm outline-none focus:border-orange-500" />
            </div>
            {isEditing ? (
                <div className="md:col-span-1">
                    <label className="text-xs text-gray-500 block mb-1 font-bold text-yellow-700">Status Kelulusan</label>
                    <select value={formData.graduation_status} onChange={e => setFormData({...formData, graduation_status: e.target.value})} className="w-full rounded border border-yellow-300 bg-yellow-50 p-2 text-sm outline-none">
                        <option value="Belum Lulus">Belum Lulus</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Cuti">Cuti</option>
                    </select>
                </div>
            ) : <div className="md:col-span-1"></div>}
            <div className="md:col-span-1 flex items-end">
                <button type="submit" className={`w-full rounded py-2 font-bold text-white transition ${isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isEditing ? "Simpan Perubahan" : "+ Simpan Data"}
                </button>
            </div>
          </form>
        </div>

        {/* TABEL */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Tgl Daftar</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Nama</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Kontak</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Paket</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Sisa Sesi</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? <tr><td colSpan={7} className="text-center p-8 text-gray-400">Data tidak ditemukan.</td></tr> : 
                  filteredStudents.map((s) => {
                    const total = s.package?.total_sessions || 0;
                    const used = (s.bookings?.length || 0) + (s.manual_usage || 0);
                    const sisa = total - used;
                    
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDateIndo(s.join_date)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{s.phone || "-"}</td>
                        <td className="px-4 py-3 text-xs">{s.package ? <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{s.package.name}</span> : "-"}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${sisa <= 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{sisa <= 0 ? `Over ${Math.abs(sisa)}` : sisa}</span></td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-gray-100 rounded-full text-[10px] uppercase font-bold">{s.graduation_status}</span></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                            <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 bg-blue-50 px-2 py-1 rounded">Edit</button>
                            
                            {/* TOMBOL HAPUS (HANYA MUNCUL JIKA ADMIN) */}
                            {isAdmin && (
                                <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 bg-red-50 px-2 py-1 rounded">Hapus</button>
                            )}
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}