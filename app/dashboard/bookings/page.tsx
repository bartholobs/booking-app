"use client";
import { useState, useEffect } from "react";
import Link from "next/link"; // <--- 1. Import Link
import { supabase } from "../../../lib/supabaseClient";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        date,
        time,
        status,
        topic,
        student:students (name),
        instructor:instructors (name),
        location:locations (name)
      `)
      .order("date", { ascending: false })
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      alert("Gagal ambil jadwal: " + error.message);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus jadwal ini?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (!error) fetchBookings();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Jadwal Kelas</h1>
              <p className="text-sm text-gray-500">Daftar semua kelas yang terdaftar</p>
            </div>
            {/* 2. Ganti Button jadi Link yang hidup */}
            <Link 
              href="/dashboard/bookings/create" 
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              + Buat Jadwal Baru
            </Link>
        </div>

        <div className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tanggal & Jam</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Murid</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Instruktur</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lokasi</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8 text-gray-500 italic">Memuat jadwal...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-gray-400">Belum ada jadwal.</td></tr>
              ) : (
                bookings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{item.date}</div>
                        <div className="text-sm text-gray-500">{item.time?.slice(0,5)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-blue-600">
                        {item.student?.name || <span className="text-red-400 italic">Terhapus</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.instructor?.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-300">
                            {item.location?.name}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.status === 'done' ? 'bg-green-100 text-green-700' : 
                            item.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                            'bg-blue-50 text-blue-600'
                        }`}>
                            {item.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Hapus</button>
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