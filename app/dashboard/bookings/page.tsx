"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { supabase } from "../../../lib/supabaseClient";
import { 
  CalendarPlus, 
  Search, 
  Clock, 
  MapPin, 
  RefreshCcw, 
  Info,
  Trash2,
  Menu,
  X,
  UserPlus,
  Check
} from "lucide-react";

// --- KONFIGURASI JAM (08:00 - 21:00) ---
const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // --- STATE LAYOUT ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- STATE MASTER DATA ---
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // --- STATE FORM SIDEBAR (MULTI STUDENT) ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [locationId, setLocationId] = useState("");
  
  // Multi Student Selection
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]); // Array object murid
  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- STATE TIMELINE FILTER ---
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // 1. FETCH DATA (Master & Bookings)
  const fetchAllData = async () => {
    setLoading(true);
    
    // A. Master Data (Cuma sekali idealnya, tapi disini digabung biar aman)
    const [resStudent, resInstructor, resLocation] = await Promise.all([
      supabase.from("students").select("id, name, package_id").eq("status", "active").order("name"),
      supabase.from("instructors").select("id, nickname, name").order("name"),
      supabase.from("locations").select("id, name, duration").order("name"),
    ]);

    if (resStudent.data) setAllStudents(resStudent.data);
    if (resInstructor.data) setInstructors(resInstructor.data);
    if (resLocation.data) setLocations(resLocation.data);

    // B. Booking Data (Sesuai Bulan)
    const [year, month] = selectedMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const lastDayObj = new Date(parseInt(year), parseInt(month), 0);
    const endDate = `${year}-${month}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

    const { data: bookingData, error } = await supabase
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

    if (!error) setBookings(bookingData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    // Click outside handler for dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedMonth]);

  // --- LOGIKA FORM ---
  const handleSelectStudent = (student: any) => {
    // Cek duplikat
    if (!selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setStudentSearch(""); 
    setIsDropdownOpen(false);
  };

  const removeSelectedStudent = (id: number) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || selectedStudents.length === 0 || !instructorId || !locationId) {
      return alert("Mohon lengkapi data: Tanggal, Jam, Minimal 1 Murid, Guru, dan Lokasi.");
    }
    
    setSaving(true);

    // Siapkan array insert (Satu murid = Satu baris booking)
    const inserts = selectedStudents.map(s => ({
      date, 
      time: time.length === 5 ? time + ":00" : time,
      student_id: s.id,
      instructor_id: parseInt(instructorId),
      location_id: parseInt(locationId),
      status: "scheduled",
      topic: "" // Topik dikosongkan sesuai request
    }));

    const { error } = await supabase.from("bookings").insert(inserts);

    if (!error) {
      alert("Berhasil menyimpan jadwal!");
      setSelectedStudents([]); 
      // Keep date/time/instructor for faster input next class
      fetchAllData();
    } else {
      alert("Error: " + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal ini?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    fetchAllData();
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/bookings/${id}`);
  };

  // --- LOGIKA TIMELINE DATA ---
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

  // Helper Format Tanggal Timeline: SEN 29 DES
  const formatTimelineDate = (dateObj: Date) => {
    const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    const months = ['JAN', 'PEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOP', 'DES'];
    
    const dayName = days[dateObj.getDay()];
    const dateNum = dateObj.getDate();
    const monthName = months[dateObj.getMonth()];

    return { dayName, dateNum, monthName };
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-100">
      
      {/* === SIDEBAR (FORM INPUT) === */}
      {/* Tampilan Sidebar bisa di-hide (w-0) atau show (w-80) */}
      <aside 
        className={`
          flex-shrink-0 bg-white border-r border-gray-200 shadow-xl z-30 transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="p-5 border-b border-gray-100 bg-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarPlus size={20} />
            <h2 className="font-bold text-lg">Buat Jadwal</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-blue-700 p-1 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Tanggal & Jam */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tanggal</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 outline-none" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Jam</label>
                <select value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 outline-none bg-white" required>
                  <option value="">-Pilih-</option>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* 2. Multi Student Select */}
            <div className="relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Murid (Bisa Banyak)</label>
              
              {/* Chips Murid Terpilih */}
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedStudents.map(s => (
                  <span key={s.id} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs flex items-center gap-1">
                    {s.name}
                    <button type="button" onClick={() => removeSelectedStudent(s.id)} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>

              {/* Input Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text" value={studentSearch} placeholder="Cari & tambah murid..."
                  onChange={(e) => { setStudentSearch(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              
              {/* Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
                  {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => (
                    <div 
                      key={s.id} onClick={() => handleSelectStudent(s)} 
                      className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50 flex justify-between items-center"
                    >
                      <span>{s.name}</span>
                      {selectedStudents.find(sel => sel.id === s.id) && <Check size={12} className="text-green-500"/>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Instruktur & Lokasi */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Instruktur</label>
                <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 outline-none bg-white" required>
                  <option value="">-- Pilih Guru --</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.nickname}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Lokasi</label>
                <select value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 outline-none bg-white" required>
                  <option value="">-- Pilih Ruang --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white rounded py-3 font-bold text-sm hover:bg-blue-700 transition disabled:bg-gray-400">
              {saving ? "MENYIMPAN..." : "SIMPAN JADWAL"}
            </button>
          </form>
        </div>
      </aside>

      {/* === CONTENT AREA (TIMELINE & TABLE) === */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* HEADER BAR */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            {/* Tombol Burger untuk Show/Hide Sidebar */}
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                <Menu size={20} />
              </button>
            )}
            
            <h1 className="text-lg font-bold text-gray-800 hidden sm:block">TIMELINE</h1>
            
            {/* Filter Bulan */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <span className="text-xs font-bold text-gray-400 uppercase">Bulan:</span>
              <input 
                type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} 
                className="bg-transparent text-sm font-bold text-blue-700 focus:outline-none" 
              />
            </div>
          </div>

          <button onClick={fetchAllData} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium">
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* SCROLL AREA UTAMA */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 custom-scrollbar">
          <div className="flex flex-col gap-6">
            
            {/* 1. TIMELINE MATRIX */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="border-separate border-spacing-0 w-full min-w-max">
                  {/* Header Jam (Sticky Top) */}
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="bg-gray-50 border-b border-r border-gray-200 w-20 p-2 text-center text-xs font-bold text-gray-400 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        TGL
                      </th>
                      {HOURS.map(h => (
                        <th key={h} className="bg-white border-b border-r border-gray-100 w-32 p-2 text-center text-xs font-bold text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  {/* Body Timeline */}
                  <tbody>
                    {daysInMonth.map((dayObj) => {
                      const { dayName, dateNum, monthName } = formatTimelineDate(dayObj);
                      
                      // Format key YYYY-MM-DD
                      const y = dayObj.getFullYear();
                      const m = String(dayObj.getMonth() + 1).padStart(2, '0');
                      const d = String(dayObj.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      
                      const isSunday = dayObj.getDay() === 0;

                      return (
                        <tr key={dateStr} className={`group ${isSunday ? 'bg-red-50/30' : 'bg-white hover:bg-gray-50'}`}>
                          {/* Kolom Tanggal (Sticky Left) */}
                          <td className={`sticky left-0 z-10 border-b border-r border-gray-200 p-2 text-center w-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${isSunday ? 'bg-red-50 text-red-600' : 'bg-white text-gray-700'}`}>
                            <div className="flex flex-col items-center leading-tight">
                              <span className="text-[9px] font-bold opacity-60">{dayName}</span>
                              <span className="text-xl font-bold">{dateNum}</span>
                              <span className="text-[8px] font-bold opacity-60">{monthName}</span>
                            </div>
                          </td>

                          {/* Kolom Jam */}
                          {HOURS.map(h => {
                            const key = `${dateStr}_${h}`;
                            const cellBookings = bookingsMap[key];
                            return (
                              <td 
                                key={key} 
                                className="border-b border-r border-gray-100 p-1 h-20 align-top relative transition-colors cursor-pointer hover:bg-blue-50/20"
                                onClick={() => { setDate(dateStr); setTime(h); if(!isSidebarOpen) setIsSidebarOpen(true); }} // Klik sel -> Set form
                              >
                                {cellBookings && cellBookings.map((b: any) => (
                                  <div key={b.id} className="mb-1 p-1.5 rounded border border-l-4 text-[10px] shadow-sm bg-white border-gray-200 border-l-blue-500 hover:shadow-md transition-all group/card relative">
                                    <div className="font-bold text-gray-800 truncate">{b.student?.name}</div>
                                    <div className="flex justify-between text-gray-500 mt-0.5">
                                      <span>{b.instructor?.nickname}</span>
                                      <span>{b.location?.name}</span>
                                    </div>
                                    {/* Actions Hover */}
                                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/90 hidden group-hover/card:flex items-center justify-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(b.id); }} className="text-blue-600 font-bold hover:underline">Edit</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} className="text-red-600 font-bold hover:underline">Del</button>
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

            {/* 2. TABEL BOOKING DETAIL (BAWAH) */}
            <div className="bg-white rounded border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200 font-bold text-gray-700 text-sm uppercase tracking-wide">
                Detail List Jadwal
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Waktu</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Murid</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Paket</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Instruktur</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Lokasi</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Status</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="font-bold text-gray-800">{item.date}</div>
                          <div className="text-xs text-gray-500">{item.time?.slice(0,5)}</div>
                        </td>
                        <td className="px-4 py-2 font-medium text-blue-700">{item.student?.name}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{item.student?.package?.name || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{item.instructor?.nickname}</td>
                        <td className="px-4 py-2 text-gray-600">{item.location?.name}</td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 border border-red-200 rounded">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}