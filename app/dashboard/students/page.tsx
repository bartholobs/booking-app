"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient"; // Pastikan path ini benar (Mundur 3 folder)

export default function StudentsPage() {
  // State (Memori Sementara)
  const [students, setStudents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // State Form Input
  const [newName, setNewName] = useState("");
  const [newPackage, setNewPackage] = useState("");

  // 1. Fungsi Ambil Data (READ)
  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false }); 

    if (error) {
      console.error("Error fetching students:", error);
      alert("Gagal ambil data: " + error.message);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  // 2. Jalankan saat halaman pertama kali dibuka
  useEffect(() => {
    fetchStudents();
  }, []);

  // 3. Fungsi Tambah Data (CREATE)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    // Insert ke database
    const { error } = await supabase
      .from("students")
      .insert([{ name: newName, package: newPackage, status: 'active' }]);

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      // Reset form & Refresh data
      setNewName("");
      setNewPackage("");
      fetchStudents(); 
    }
  };

  // 4. Fungsi Hapus Data (DELETE)
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin mau hapus data murid ini?")) return;

    const { error } = await supabase.from("students").delete().eq("id", id);
    
    if (error) {
      alert("Gagal hapus: " + error.message);
    } else {
      fetchStudents(); 
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header Halaman */}
        <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Murid</h1>
              <p className="text-sm text-gray-500">Kelola data siswa dan paket les</p>
            </div>
            <a href="/dashboard" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-gray-50 border border-gray-200">
              ← Kembali ke Dashboard
            </a>
        </div>

        {/* FORM TAMBAH MURID */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Tambah Murid Baru</h3>
          <form onSubmit={handleAddStudent} className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Paket (misal: 10 Sesi)"
              value={newPackage}
              onChange={(e) => setNewPackage(e.target.value)}
              className="w-full md:w-1/3 rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paket</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={4} className="text-center p-8 text-gray-500 italic">Sedang memuat data dari database...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={4} className="text-center p-8 text-gray-400">Belum ada data murid. Silakan tambah di atas.</td></tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.package || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}