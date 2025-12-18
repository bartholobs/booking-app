"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import Router buat pindah halaman
import { supabase } from "../../../lib/supabaseClient";

// Helper: Generate list jam 08:00 - 21:00
const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function BookingsTimelinePage() {
  const router = useRouter(); // Init Router
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // State Filter Bulan (Default: Bulan Sekarang YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // 1. Ambil Data Jadwal berdasarkan Bulan
  const fetchBookings = async () => {
    setLoading(true);
    
    // Hitung tanggal awal & akhir bulan yang dipilih
    const [year, month] = selectedMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10); // Tgl terakhir bulan itu

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, date, time, status, topic,
        student:students (name),
        instructor:instructors (nickname), 
        location:locations (name)
      `)
      .gte("date", startDate) // >= Tanggal 1
      .lte("date", endDate);  // <= Tanggal 30/31

    if (error) {
      alert("Gagal ambil data: " + error.message);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedMonth]); // Refresh kalau ganti bulan

  // 2. Generate Tanggal 1 - 30/31 berdasarkan bulan yang dipilih
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    const days = [];
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    while (date.getMonth() === parseInt(month) - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  // 3. Mapping Data biar Pencarian Cepat (O(1))
  const bookingsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    bookings.forEach((b) => {
      const timeShort = b.time.slice(0, 5);
      const key = `${b.date}_${timeShort}`;
      
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  // Helper: Hapus Data
  const handleDelete = async (id: number) => {
    if(!confirm("Yakin hapus jadwal ini?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    fetchBookings();
  }

  // Helper: Pindah ke Halaman Edit
  const handleEdit = (id: number) => {
    router.push(`/dashboard/bookings/${id}`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-[calc(100vw-22rem)] bg-gray-50 overflow-hidden rounded-lg shadow-sm border border-gray-200">
      
      {/* --- HEADER TOOLBAR --- */}
      <div className="flex-none p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Timeline Jadwal</h1>
            <p className="text-xs text-gray-500">Monitoring kelas per bulan</p>
          </div>
          
          <div className="flex gap-3">
            {/* Filter Bulan */}
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-blue-500 bg-white shadow-sm"
            />
            
            {/* Tombol Buat Baru */}
            <Link 
              href="/dashboard/bookings/create" 
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span> Jadwal Baru
            </Link>
          </div>
        </div>
      </div>

      {/* --- TIMELINE MATRIX AREA (SCROLLABLE) --- */}
      <div className="flex-1 overflow-auto relative bg-white">
        <div className="inline-block min-w-full">
          {/* Pakai border-separate biar sticky shadow jalan mulus */}
          <table className="border-separate border-spacing-0 w-full">
            
            {/* HEADER JAM (STICKY TOP) */}
            <thead>
              <tr>
                {/* Pojok Kiri Atas */}
                <th className="sticky top-0 left-0 z-30 bg-gray-100 min-w-[80px] p-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-300 shadow-[2px_2px_0_#9ca3af]">
                  Tgl
                </th>
                
                {/* Loop Jam 08-21 */}
                {HOURS.map((h) => (
                  <th key={h} className="sticky top-0 z-20 bg-gray-50 border-b border-r border-gray-200 min-w-[140px] p-2 text-center text-sm font-semibold text-gray-700 shadow-[0_2px_0_#9ca3af]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY TANGGAL (STICKY LEFT) */}
            <tbody>
              {loading ? (
                <tr><td colSpan={15} className="p-10 text-center text-gray-400">Sedang memuat matrix...</td></tr>
              ) : daysInMonth.map((dayObj) => {
                const dateStr = dayObj.toISOString().slice(0, 10); // YYYY-MM-DD
                const dayName = dayObj.toLocaleDateString("id-ID", { weekday: "short" }); // Senin, Selasa
                const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6; // Sabtu/Minggu

                return (
                  <tr key={dateStr} className={isWeekend ? "bg-orange-50" : "bg-white hover:bg-gray-50"}>
                    
                    {/* Kolom Tanggal (Sticky Left) */}
                    <td className={`sticky left-0 z-10 border-b border-r border-gray-300 p-2 text-center min-w-[80px] shadow-[2px_0_0_#9ca3af] ${isWeekend ? "bg-orange-50 text-red-600" : "bg-white text-gray-800"}`}>
                      <div className="font-bold text-lg leading-none">{dayObj.getDate()}</div>
                      <div className="text-[10px] uppercase font-semibold mt-1">{dayName}</div>
                    </td>

                    {/* Kolom Jam (Grid Cells) */}
                    {HOURS.map((h) => {
                      const key = `${dateStr}_${h}`;
                      const classList = bookingsMap[key]; // Cek ada jadwal gak?

                      return (
                        <td key={key} className="border-r border-b border-gray-200 p-1 h-[90px] relative align-top transition-colors hover:bg-blue-50/30">
                          
                          {/* Slot Kosong */}
                          {!classList && (
                            <div className="w-full h-full flex items-center justify-center cursor-pointer group">
                              <span className="text-gray-200 group-hover:text-blue-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                            </div>
                          )}

                          {/* Jika Ada Jadwal */}
                          {classList && classList.map((item: any) => (
                            <div key={item.id} className="mb-1 p-1.5 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm cursor-pointer group relative overflow-hidden transition-all hover:scale-[1.02] z-0 hover:z-10">
                              {/* Garis Status Warna */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                item.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                              }`}></div>

                              <div className="pl-2">
                                <div className="font-bold text-xs text-gray-900 truncate" title={item.student?.name}>
                                  {item.student?.name}
                                </div>
                                <div className="text-[10px] text-gray-600 flex flex-wrap gap-1 mt-0.5">
                                  <span className="font-medium text-blue-700">{item.instructor?.nickname}</span>
                                  <span className="bg-white px-1 rounded border text-gray-400 text-[9px]">{item.location?.name}</span>
                                </div>
                              </div>

                              {/* Group Tombol Aksi */}
                              <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-1">
                                {/* Tombol Edit (Pencil) */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(item.id); }}
                                  className="flex items-center justify-center bg-white border border-gray-300 text-blue-600 rounded-full w-5 h-5 text-[10px] hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                                  title="Edit Jadwal"
                                >
                                  ✎
                                </button>
                                {/* Tombol Hapus (X) */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                  className="flex items-center justify-center bg-white border border-gray-300 text-red-500 rounded-full w-5 h-5 text-[10px] hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                                  title="Hapus Jadwal"
                                >
                                  ✕
                                </button>
                              </div>

                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}