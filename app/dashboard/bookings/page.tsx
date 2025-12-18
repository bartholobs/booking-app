"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { supabase } from "../../../lib/supabaseClient";

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function BookingsTimelinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // State untuk Data Master Kurikulum (Kamus Materi yang sudah dimekarkan)
  const [curriculumMap, setCurriculumMap] = useState<Record<number, any[]>>({});

  // Fix Timezone: Gunakan waktu lokal saat inisialisasi bulan
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // 1. Load & Expand Data Kurikulum
  useEffect(() => {
    const fetchCurriculum = async () => {
      // Ambil session_count juga!
      const { data } = await supabase
        .from("curriculum")
        .select(`
          package_id, 
          sort_order, 
          material:materials (name, code, session_count)
        `)
        .order("sort_order", { ascending: true });

      if (data) {
        // Kelompokkan dulu per Paket
        const rawGroup: Record<number, any[]> = {};
        data.forEach((item: any) => {
          if (!rawGroup[item.package_id]) rawGroup[item.package_id] = [];
          rawGroup[item.package_id].push(item);
        });

        // PROSES EXPAND (MEKARKAN SESI)
        // Jika Photoshop 6 sesi, kita bikin arraynya jadi [Ps1, Ps2, Ps3, Ps4, Ps5, Ps6]
        const expandedMap: Record<number, any[]> = {};
        
        Object.keys(rawGroup).forEach((pkgId: any) => {
            const items = rawGroup[pkgId];
            const sessionList: any[] = [];

            // Loop setiap Materi di paket ini
            items.forEach((currItem) => {
                const mat = currItem.material;
                const totalSesi = mat.session_count || 1; // Default 1 kalau null

                // Duplikat materi sebanyak jumlah sesinya
                for (let i = 1; i <= totalSesi; i++) {
                    sessionList.push({
                        name: mat.name,
                        code: mat.code,
                        currentSession: i,      // Ini sesi ke berapa (1, 2, ... 6)
                        totalSessions: totalSesi // Dari total berapa (6)
                    });
                }
            });
            expandedMap[pkgId] = sessionList;
        });

        setCurriculumMap(expandedMap);
      }
    };
    fetchCurriculum();
  }, []);

  // 2. Ambil Data Jadwal
  const fetchBookings = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split("-");
    
    // Fix Timezone: Construct string manual YYYY-MM-DD
    const startDate = `${year}-${month}-01`;
    
    // Hitung tanggal terakhir bulan dengan aman (Local Time)
    const lastDayObj = new Date(parseInt(year), parseInt(month), 0);
    const lastY = lastDayObj.getFullYear();
    const lastM = String(lastDayObj.getMonth() + 1).padStart(2, '0');
    const lastD = String(lastDayObj.getDate()).padStart(2, '0');
    const endDate = `${lastY}-${lastM}-${lastD}`;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, date, time, status, topic, student_id,
        student:students (name, package_id, package:packages (name)),
        instructor:instructors (nickname), 
        location:locations (name)
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      alert("Gagal ambil data: " + error.message);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedMonth]);

  // 3. LOGIKA PINTAR V2: Mencocokkan dengan Expand Map
  const enrichedBookings = useMemo(() => {
    // A. Kelompokkan booking per murid untuk tau urutan history
    const studentHistory: Record<number, any[]> = {};
    
    // B. Sortir semua booking (harus urut waktu biar history bener)
    const sortedAll = [...bookings].sort((a, b) => 
      new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );

    sortedAll.forEach(b => {
      if (!studentHistory[b.student_id]) studentHistory[b.student_id] = [];
      studentHistory[b.student_id].push(b);
    });

    // C. Mapping Data
    return bookings.map(booking => {
      const history = studentHistory[booking.student_id] || [];
      
      // Cari ini booking urutan ke berapa (Index 0 = Pertemuan Pertama)
      const bookingSequenceIndex = history.findIndex(h => h.id === booking.id);
      
      // Ambil Paket Murid
      const packageId = booking.student?.package_id;
      
      // Ambil Daftar Materi yang SUDAH DIMEKARKAN
      const expandedSessions = curriculumMap[packageId] || [];
      
      // Ambil data sesi yang cocok dengan urutan booking
      const sessionData = expandedSessions[bookingSequenceIndex]; 

      let displayMaterial = booking.topic || "-";
      let displaySession = `Ke-${bookingSequenceIndex + 1}`; // Default fallback

      if (sessionData) {
        // Kalau ketemu di kurikulum, pake data kurikulum
        displayMaterial = sessionData.name;
        // Format: "Sesi 1/6"
        displaySession = `Sesi ${sessionData.currentSession} / ${sessionData.totalSessions}`;
      } else if (bookingSequenceIndex >= expandedSessions.length && expandedSessions.length > 0) {
        // Kalau bookingnya melebihi kurikulum (misal paket cuma 16 sesi, tapi ini booking ke-17)
        displayMaterial = "Materi Tambahan / Selesai";
        displaySession = `Extra #${bookingSequenceIndex + 1}`;
      }

      return {
        ...booking,
        computedSession: displaySession, 
        computedMaterial: displayMaterial
      };
    });
  }, [bookings, curriculumMap]);

  // Generate Tanggal & Map Timeline (Logic Lama)
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

  const handleDelete = async (id: number) => {
    if(!confirm("Yakin hapus jadwal ini?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    fetchBookings();
  }

  const handleEdit = (id: number) => {
    router.push(`/dashboard/bookings/${id}`);
  }

  return (
    <div className="flex flex-col gap-8 w-[calc(100vw-22rem)] pb-10">
      
      {/* TIMELINE MATRIX */}
      <div className="flex flex-col h-[calc(100vh-6rem)] bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 shrink-0">
        <div className="flex-none p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Timeline Jadwal</h1>
              <p className="text-xs text-gray-500">Monitoring visual per bulan</p>
            </div>
            <div className="flex gap-3">
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-blue-500 bg-white shadow-sm" />
              <Link href="/dashboard/bookings/create" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-2"><span>+</span> Jadwal Baru</Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative bg-white">
          <div className="inline-block min-w-full">
            <table className="border-separate border-spacing-0 w-full">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-gray-100 min-w-[80px] p-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-300 shadow-[2px_2px_0_#9ca3af]">Tgl</th>
                  {HOURS.map((h) => (
                    <th key={h} className="sticky top-0 z-20 bg-gray-50 border-b border-r border-gray-200 min-w-[140px] p-2 text-center text-sm font-semibold text-gray-700 shadow-[0_2px_0_#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={15} className="p-10 text-center text-gray-400">Sedang memuat matrix...</td></tr>
                ) : daysInMonth.map((dayObj) => {
                  
                  // Fix Timezone
                  const y = dayObj.getFullYear();
                  const m = String(dayObj.getMonth() + 1).padStart(2, '0');
                  const d = String(dayObj.getDate()).padStart(2, '0');
                  const dateStr = `${y}-${m}-${d}`; 

                  const dayName = dayObj.toLocaleDateString("id-ID", { weekday: "short" });
                  const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;
                  
                  return (
                    <tr key={dateStr} className={isWeekend ? "bg-orange-50" : "bg-white hover:bg-gray-50"}>
                      <td className={`sticky left-0 z-10 border-b border-r border-gray-300 p-2 text-center min-w-[80px] shadow-[2px_0_0_#9ca3af] ${isWeekend ? "bg-orange-50 text-red-600" : "bg-white text-gray-800"}`}>
                        <div className="font-bold text-lg leading-none">{dayObj.getDate()}</div>
                        <div className="text-[10px] uppercase font-semibold mt-1">{dayName}</div>
                      </td>
                      {HOURS.map((h) => {
                        const key = `${dateStr}_${h}`;
                        const classList = bookingsMap[key];
                        return (
                          <td key={key} className="border-r border-b border-gray-200 p-1 h-[90px] relative align-top transition-colors hover:bg-blue-50/30">
                            {!classList && <div className="w-full h-full flex items-center justify-center cursor-pointer group"><span className="text-gray-200 group-hover:text-blue-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity">+</span></div>}
                            {classList && classList.map((item: any) => (
                              <div key={item.id} className="mb-1 p-1.5 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm cursor-pointer group relative overflow-hidden transition-all hover:scale-[1.02] z-0 hover:z-10">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                <div className="pl-2">
                                  <div className="font-bold text-xs text-gray-900 truncate" title={item.student?.name}>{item.student?.name}</div>
                                  <div className="text-[10px] text-gray-600 flex flex-wrap gap-1 mt-0.5">
                                    <span className="font-medium text-blue-700">{item.instructor?.nickname}</span>
                                    <span className="bg-white px-1 rounded border text-gray-400 text-[9px]">{item.location?.name}</span>
                                  </div>
                                </div>
                                <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); handleEdit(item.id); }} className="flex items-center justify-center bg-white border border-gray-300 text-blue-600 rounded-full w-5 h-5 text-[10px] hover:bg-blue-600 hover:text-white transition-colors shadow-sm" title="Edit">✎</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="flex items-center justify-center bg-white border border-gray-300 text-red-500 rounded-full w-5 h-5 text-[10px] hover:bg-red-500 hover:text-white transition-colors shadow-sm" title="Hapus">✕</button>
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

      {/* DETAIL LIST BOOKING */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Detail List Booking</h2>
          <p className="text-xs text-gray-500">Daftar lengkap jadwal bulan ini</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Tanggal & Waktu</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Murid</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Paket</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Materi (Otomatis)</th>
                <th className="px-6 py-3 text-center font-bold text-gray-600 uppercase tracking-wider">Sesi Ke</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Instruktur</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrichedBookings.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400 italic">Belum ada data di bulan ini.</td></tr>
              ) : (
                enrichedBookings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{item.date}</div>
                      <div className="text-gray-500 text-xs">{item.time?.slice(0,5)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.student?.name || <span className="text-red-400 italic">Terhapus</span>}
                    </td>
                    
                    {/* KOLOM PAKET */}
                    <td className="px-6 py-4 text-xs">
                      {item.student?.package?.name ? (
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-semibold">
                          {item.student.package.name}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>

                    {/* KOLOM MATERI (LOGIC BARU) */}
                    <td className="px-6 py-4 text-xs font-medium text-blue-700 max-w-[200px] truncate" title={item.computedMaterial}>
                      {item.computedMaterial}
                    </td>

                    {/* KOLOM SESI (LOGIC BARU) */}
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 whitespace-nowrap">
                        {item.computedSession}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600">{item.instructor?.nickname}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                        {item.location?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(item.id)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition">Hapus</button>
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