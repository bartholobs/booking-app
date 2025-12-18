"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); // Data Paket buat Dropdown
  const [loading, setLoading] = useState(true);
  
  // Form Input
  const [newName, setNewName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState(""); // Ganti teks jadi ID

  // 1. Ambil Data Murid & Data Paket
  const fetchData = async () => {
    setLoading(true);
    
    // A. Ambil Murid (Join dengan Paket biar muncul namanya)
    const { data: studentData, error } = await supabase
      .from("students")
      .select(`
        *,
        package:packages (name, code)
      `)
      .order("created_at", { ascending: false }); 

    if (error) console.error("Error fetching students:", error);
    else setStudents(studentData || []);

    // B. Ambil List Paket buat Dropdown
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

  // 2. Tambah Murid
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const payload: any = { 
        name: newName, 
        status: 'active' 
    };

    // Kalau paket dipilih, simpan ID-nya
    if (selectedPackageId) {
        payload.package_id = parseInt(selectedPackageId);
    }

    const { error } = await supabase.from("students").insert([payload]);

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      setNewName("");
      setSelectedPackageId("");
      fetchData(); 
    }
  };

  // 3. Hapus Murid
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin mau hapus data murid ini?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) fetchData(); 
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Murid</h1>
              <p className="text-sm text-gray-500">Kelola siswa dan paket langganan</p>
            </div>
        </div>

        {/* FORM TAMBAH MURID */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Daftarkan Murid Baru</h3>
          <form onSubmit={handleAddStudent} className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 p-2 focus:border-blue-500 outline-none"
              required
            />
            
            {/* DROPDOWN PAKET (UPDATE) */}
            <select 
                value={selectedPackageId} 
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full md:w-1/3 rounded-md border border-gray-300 p-2 focus:border-blue-500 outline-none bg-white"
            >
                <option value="">-- Pilih Paket Belajar --</option>
                {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.total_sessions} Sesi)
                    </option>
                ))}
            </select>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700 transition shadow-sm"
            >
              + Simpan
            </button>
          </form>
        </div>

        {/* TABEL DATA MURID */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paket Aktif</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="text-center p-8 text-gray-500 italic">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-8 text-gray-400">Belum ada data.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                        {student.package ? (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold border border-purple-200">
                                {student.package.name}
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs italic">- Tidak ada paket -</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Hapus</button>
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