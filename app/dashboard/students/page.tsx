"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Mode Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // State Search
  const [searchQuery, setSearchQuery] = useState(""); // <--- State baru buat search

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    package_id: "",
    join_date: new Date().toISOString().slice(0, 10), // Default hari ini (YYYY-MM-DD)
    manual_usage: "0", // Sesi migrasi
    graduation_status: "Belum Lulus"
  });

  // 1. Ambil Data Murid Lengkap
  const fetchData = async () => {
    setLoading(true);
    
    const { data: studentData, error } = await supabase
      .from("students")
      .select(`
        *,
        package:packages (name, total_sessions),
        bookings (date, status)
      `)
      .order("name", { ascending: true });

    if (error) console.error("Error fetching students:", error);
    else setStudents(studentData || []);

    const { data: packageData } = await supabase
      .from("packages")
      .select("*")
      .order("name");
      
    if (packageData) setPackages(packageData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle Simpan (Tambah / Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload: any = { 
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        join_date: formData.join_date,
        manual_usage: parseInt(formData.manual_usage) || 0,
        status: 'active' 
    };

    if (formData.package_id) payload.package_id = parseInt(formData.package_id);
    
    // Logic Status Kelulusan: Hanya update jika sedang mode Edit
    if (isEditing) {
        payload.graduation_status = formData.graduation_status;
    } else {
        payload.graduation_status = "Belum Lulus"; // Default anak baru
    }

    let error;

    if (isEditing && editId) {
        // --- MODE UPDATE ---
        const res = await supabase.from("students").update(payload).eq("id", editId);
        error = res.error;
    } else {
        // --- MODE INSERT ---
        const res = await supabase.from("students").insert([payload]);
        error = res.error;
    }

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      resetForm();
      fetchData(); 
    }
  };

  // 3. Fungsi Reset Form (Balik ke Mode Tambah)
  const resetForm = () => {
    setFormData({
        name: "", phone: "", email: "", package_id: "",
        join_date: new Date().toISOString().slice(0, 10),
        manual_usage: "0", graduation_status: "Belum Lulus"
    });
    setIsEditing(false);
    setEditId(null);
  };

  // 4. Fungsi Klik Tombol Edit (Load Data ke Form)
  const handleEdit = (student: any) => {
    setIsEditing(true);
    setEditId(student.id);
    setFormData({
        name: student.name,
        phone: student.phone || "",
        email: student.email || "",
        // Pastikan dikonversi ke String agar Dropdown terpilih otomatis
        package_id: student.package_id ? String(student.package_id) : "",
        join_date: student.join_date || new Date().toISOString().slice(0, 10),
        manual_usage: String(student.manual_usage || 0),
        graduation_status: student.graduation_status || "Belum Lulus"
    });
    // Scroll smooth ke atas biar admin sadar formnya berubah
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Hapus Murid
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin mau hapus data murid ini?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) fetchData(); 
  };

  // Helper Format Tanggal Indonesia (dd/mm/yyyy) untuk tampilan tabel
  const formatDateIndo = (dateStr: string) => {
    if(!dateStr) return "-";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  // --- LOGIC FILTERING ---
  const filteredStudents = students.filter((student) => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Murid</h1>
              <p className="text-sm text-gray-500">Database lengkap siswa dan progress belajar</p>
            </div>
        </div>

        {/* FORM INPUT / EDIT */}
        <div className={`mb-8 rounded-lg p-6 shadow-sm border ${isEditing ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isEditing ? 'text-yellow-700' : 'text-gray-700'}`}>
                {isEditing ? "✏️ Edit Data Murid" : "➕ Daftarkan Murid Baru"}
            </h3>
            {isEditing && (
                <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 underline font-medium">
                    ❌ Batal Edit
                </button>
            )}
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Baris 1 */}
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
                <input type="text" placeholder="Contoh: 0812... atau 628..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded border p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input type="email" placeholder="email@contoh.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded border p-2 text-sm outline-none focus:border-blue-500" />
            </div>

            {/* Baris 2 */}
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Pilih Paket</label>
                <select value={formData.package_id} onChange={e => setFormData({...formData, package_id: e.target.value})} className="w-full rounded border p-2 text-sm outline-none bg-white">
                    <option value="">-- Pilih Paket --</option>
                    {packages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.total_sessions} Sesi)</option>)}
                </select>
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1 text-orange-600 font-bold">Sesi Terpakai (Migrasi)</label>
                <input type="number" placeholder="0" value={formData.manual_usage} onChange={e => setFormData({...formData, manual_usage: e.target.value})} className="w-full rounded border border-orange-200 bg-orange-50 p-2 text-sm outline-none focus:border-orange-500" title="Isi jika murid pindahan dari sistem lama" />
            </div>
            
            {/* Status Kelulusan (Hanya Muncul Saat Edit) */}
            {isEditing ? (
                <div className="md:col-span-1">
                    <label className="text-xs text-gray-500 block mb-1 font-bold text-yellow-700">Status Kelulusan</label>
                    <select value={formData.graduation_status} onChange={e => setFormData({...formData, graduation_status: e.target.value})} className="w-full rounded border border-yellow-300 bg-yellow-50 p-2 text-sm outline-none font-medium text-gray-700">
                        <option value="Belum Lulus">Belum Lulus</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Cuti">Cuti</option>
                    </select>
                </div>
            ) : (
                <div className="md:col-span-1"></div> // Spacer kosong biar rapi
            )}

            <div className="md:col-span-1 flex items-end">
                <button type="submit" className={`w-full rounded py-2 font-bold text-white transition ${isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isEditing ? "Simpan Perubahan" : "+ Simpan Data"}
                </button>
            </div>

          </form>
        </div>

        {/* INPUT PENCARIAN */}
        <div className="mb-4">
            <input 
                type="text" 
                placeholder="🔍 Cari nama murid..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-1/3 rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
            />
        </div>

        {/* TABEL DATA MURID */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Tgl Daftar</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Nama Murid</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Kontak</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Paket Aktif</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase" title="Booking + Migrasi">Terpakai</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase">Sisa</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Terakhir Hadir</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={10} className="text-center p-8 text-gray-500 italic">Loading...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={10} className="text-center p-8 text-gray-400">Data tidak ditemukan.</td></tr>
                ) : (
                  filteredStudents.map((student) => {
                    // LOGIKA HITUNG SESI
                    const totalSesi = student.package?.total_sessions || 0;
                    const bookingCount = student.bookings?.length || 0; // History Booking
                    const manualCount = student.manual_usage || 0; // Migrasi
                    const usedSesi = bookingCount + manualCount;
                    const sisaSesi = totalSesi - usedSesi;

                    // LOGIKA OVER SESI
                    let sisaDisplay: React.ReactNode = sisaSesi;
                    let sisaClass = "bg-green-100 text-green-700";

                    if (sisaSesi < 0) {
                        sisaDisplay = `Over ${Math.abs(sisaSesi)}`;
                        sisaClass = "bg-red-100 text-red-700 font-bold border border-red-200";
                    } else if (sisaSesi < 3) {
                        sisaClass = "bg-yellow-100 text-yellow-700";
                    } else if (sisaSesi === 0) {
                        sisaClass = "bg-gray-100 text-gray-700";
                    }

                    // LOGIKA LAST SEEN (Sementara dari Booking Terakhir)
                    let lastSeen = "-";
                    if (student.bookings && student.bookings.length > 0) {
                        const dates = student.bookings.map((b: any) => b.date).sort().reverse();
                        lastSeen = formatDateIndo(dates[0]); // Format dd/mm/yyyy
                    }

                    // LOGIKA WA LINK (Support 62 dan +CountryCode)
                    let waLink = "#";
                    if (student.phone) {
                        let cleanPhone = student.phone.trim();
                        // Kalau diawali 0, ganti 62. Kalau diawali +, biarin. Kalau angka biasa, biarin.
                        if (cleanPhone.startsWith('0')) {
                            cleanPhone = '62' + cleanPhone.slice(1);
                        }
                        waLink = `https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}`;
                    }

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                            {formatDateIndo(student.join_date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                            <div>{student.name}</div>
                            <div className="text-xs text-gray-400">{student.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                            {student.phone ? (
                                <a href={waLink} target="_blank" className="text-green-600 hover:underline flex items-center gap-1">
                                    <span className="text-[10px]">📱</span> {student.phone}
                                </a>
                            ) : "-"}
                        </td>
                        <td className="px-4 py-3">
                            {student.package ? (
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 text-xs font-semibold">
                                    {student.package.name}
                                </span>
                            ) : <span className="text-gray-400 text-xs">-</span>}
                        </td>
                        
                        <td className="px-4 py-3 text-center font-bold text-gray-700">{totalSesi}</td>
                        <td className="px-4 py-3 text-center text-gray-600 text-xs">
                            {usedSesi} 
                            {manualCount > 0 && <span className="text-orange-500 ml-1 font-bold" title="Ada data migrasi">*</span>}
                        </td>

                        <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${sisaClass}`}>
                                {sisaDisplay}
                            </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600 text-center">
                            {lastSeen}
                        </td>

                        <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                                student.graduation_status === 'Lulus' ? 'bg-green-50 text-green-600 border-green-200' :
                                student.graduation_status === 'Cuti' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                                {student.graduation_status}
                            </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(student)} className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 bg-blue-50 px-2 py-1 rounded">Edit</button>
                            <button onClick={() => handleDelete(student.id)} className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 bg-red-50 px-2 py-1 rounded">Hapus</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}