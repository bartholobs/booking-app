"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { supabase } from "../../../lib/supabaseClient";
import { 
  CalendarPlus, Search, Clock, MapPin, RefreshCcw, 
  Info, Trash2, Menu, X, Check, User, Filter, 
  ChevronDown, ChevronUp, FileText, CheckCircle2
} from "lucide-react";

// --- KONFIGURASI JAM (08:00 - 21:00) ---
const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function BookingsPage() {
  const router = useRouter();
  
  // --- STATE DATA ---
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [curriculumMap, setCurriculumMap] = useState<Record<number, any[]>>({});

  // --- STATE UI & FILTER ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMsg, setToastMsg] = useState(""); // Custom Notification
  
  // Filter Timeline
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timelineInstructorFilter, setTimelineInstructorFilter] = useState("all");

  // Filter Tabel Detail
  const [tableSearch, setTableSearch] = useState("");
  const [tableInstructorFilter, setTableInstructorFilter] = useState("all");
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");

  // --- STATE FORM SIDEBAR ---
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [formNote, setFormNote] = useState(""); // Catatan Booking
  
  // Multi Student Selection
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA (INIT) ---
  const fetchAllData = async () => {
    setLoading(true);
    
    // Master Data
    const [resStudent, resInstructor, resLocation, resCurr] = await Promise.all([
      supabase.from("students").select("id, name, package_id, package:packages(code)").eq("status", "active").order("name"),
      supabase.from("instructors").select("id, nickname, name").order("name"),
      supabase.from("locations").select("id, name, duration").order("name"),
      supabase.from("curriculum").select(`package_id, sort_order, material:materials (name, code, session_count)`).order("sort_order")
    ]);

    if (resStudent.data) setAllStudents(resStudent.data);
    if (resInstructor.data) setInstructors(resInstructor.data);
    if (resLocation.data) setLocations(resLocation.data);

    // Proses Curriculum Expand
    if (resCurr.data) {
      const expandedMap: Record<number, any[]> = {};
      const rawGroup: Record<number, any[]> = {};
      resCurr.data.forEach((item: any) => {
        if (!rawGroup[item.package_id]) rawGroup[item.package_id] = [];
        rawGroup[item.package_id].push(item);
      });

      Object.keys(rawGroup).forEach((pkgId: any) => {
        const sessionList: any[] = [];
        rawGroup[pkgId].forEach((currItem: any) => {
          const mat = currItem.material;
          const totalSesi = mat.session_count || 1;
          for (let i = 1; i <= totalSesi; i++) {
            sessionList.push({ 
              name: mat.name, 
              code: mat.code, 
              currentSession: i, 
              totalSessions: totalSesi 
            });
          }
        });
        expandedMap[pkgId] = sessionList;
      });
      setCurriculumMap(expandedMap);
    }

    // Fetch Booking berdasarkan Bulan
    await fetchBookingsByMonth();
    setLoading(false);
  };

  const fetchBookingsByMonth = async () => {
    const [year, month] = selectedMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const lastDayObj = new Date(parseInt(year), parseInt(month), 0);
    const endDate = `${year}-${month}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, date, time, status, topic, student_id,
        student:students (name, package_id, package:packages (code, name)),
        instructor:instructors (nickname, name), 
        location:locations (name)
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (!error) setBookings(data || []);
  };

  useEffect(() => {
    fetchAllData();
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedMonth]);

  // --- 2. LOGIKA DATA PINTAR (ENRICHED BOOKINGS) ---
  const enrichedBookings = useMemo(() => {
    // A. Kelompokkan history per murid
    const studentHistory: Record<number, any[]> = {};
    const sortedAll = [...bookings].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

    sortedAll.forEach(b => {
      if (!studentHistory[b.student_id]) studentHistory[b.student_id] = [];
      studentHistory[b.student_id].push(b);
    });

    // B. Map data dengan info Kurikulum & Sesi
    return bookings.map(b => {
      const history = studentHistory[b.student_id] || [];
      const sessionIndex = history.findIndex(h => h.id === b.id);
      const pkgId = b.student?.package_id;
      const curriculum = curriculumMap[pkgId] || [];
      const sessionData = curriculum[sessionIndex];

      return {
        ...b,
        computedSession: sessionData ? `#${sessionData.currentSession}` : `#${sessionIndex + 1}`,
        computedMaterialCode: sessionData ? sessionData.code : "-",
        computedMaterialName: sessionData ? sessionData.name : (b.topic || "-"),
        shortName: b.student?.name.split(" ").slice(0, 2).join(" ") // Ambil 2 kata pertama
      };
    });
  }, [bookings, curriculumMap]);

  // --- 3. TIMELINE DATA PREPARATION ---
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

  // Grouping Logic untuk Timeline (One Card Multiple Students)
  const timelineData = useMemo(() => {
    const map: Record<string, any[]> = {};
    
    enrichedBookings.forEach((b) => {
      // Filter Instruktur Timeline
      if (timelineInstructorFilter !== "all" && b.instructor?.nickname !== timelineInstructorFilter) return;

      const timeShort = b.time.slice(0, 5);
      const key = `${b.date}_${timeShort}`; // Key cell
      
      // Grouping Key untuk Card: Instructor + Location
      const groupKey = `${b.instructor?.nickname}-${b.location?.name}`;
      
      if (!map[key]) map[key] = [];
      
      // Cek apakah group ini sudah ada di cell ini?
      const existingGroup = map[key].find((g: any) => g.groupId === groupKey);
      
      if (existingGroup) {
        existingGroup.students.push(b);
      } else {
        map[key].push({
          groupId: groupKey,
          instructor: b.instructor?.nickname,
          location: b.location?.name,
          status: b.status, // Ambil status murid pertama (atau logic lain)
          id: b.id, // ID referensi (bisa dihapus)
          students: [b]
        });
      }
    });
    return map;
  }, [enrichedBookings, timelineInstructorFilter]);

  // --- 4. FORM HANDLERS ---
  const handleSelectStudent = (student: any) => {
    if (!selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setStudentSearch(""); setIsDropdownOpen(false);
  };

  const removeSelectedStudent = (id: number) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== id));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formTime || selectedStudents.length === 0 || !selectedInstructorId || !selectedLocationId) {
      return alert("Mohon lengkapi data: Tanggal, Jam, Minimal 1 Murid, Guru, dan Lokasi.");
    }
    
    setSaving(true);

    const inserts = selectedStudents.map(s => ({
      date: formDate, 
      time: formTime.length === 5 ? formTime + ":00" : formTime,
      student_id: s.id,
      instructor_id: parseInt(selectedInstructorId),
      location_id: parseInt(selectedLocationId),
      status: "scheduled",
      topic: formNote 
    }));

    const { error } = await supabase.from("bookings").insert(inserts);

    if (!error) {
      showToast("✅ Jadwal Berhasil Dibuat!");
      setSelectedStudents([]);
      setFormNote("");
      fetchBookingsByMonth();
    } else {
      alert("Error: " + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal murid ini?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    fetchBookingsByMonth();
  };

  // --- 5. TABEL DETAIL FILTERED ---
  const filteredTableData = enrichedBookings.filter(b => {
    const matchName = b.student?.name.toLowerCase().includes(tableSearch.toLowerCase());
    const matchInst = tableInstructorFilter === "all" || b.instructor?.nickname === tableInstructorFilter;
    
    let matchDate = true;
    if (tableStartDate && tableEndDate) {
      matchDate = b.date >= tableStartDate && b.date <= tableEndDate;
    }

    return matchName && matchInst && matchDate;
  });

  return (
    // FULL SCREEN NO SCROLLBAR DI BODY
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-gray-100 relative">
      
      {/* --- CUSTOM NOTIFICATION TOAST --- */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce flex items-center gap-2">
          <CheckCircle2 size={20} /> {toastMsg}
        </div>
      )}

      {/* === SIDEBAR (ELEGANT ROUNDED) === */}
      <aside className={`flex-shrink-0 bg-white shadow-2xl z-30 transition-all duration-300 ease-in-out flex flex-col m-2 rounded-2xl border border-gray-100 overflow-hidden ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none hidden'}`}>
        
        {/* Header Sidebar */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarPlus size={20} />
            <h2 className="font-bold text-lg">Jadwal Baru</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={18} /></button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tanggal</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Jam</label>
                <select value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                  <option value="">-Pilih-</option>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* 2. Murid Multi Select */}
            <div className="relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Murid (Multi)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedStudents.map(s => (
                  <span key={s.id} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md text-xs flex items-center gap-1 font-medium">
                    {s.name} <button type="button" onClick={() => removeSelectedStudent(s.id)} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" value={studentSearch} placeholder="Cari & tambah murid..." onChange={(e) => { setStudentSearch(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                  {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => (
                    <div key={s.id} onClick={() => handleSelectStudent(s)} className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50 flex justify-between">
                      <span>{s.name}</span>
                      {selectedStudents.find(sel => sel.id === s.id) && <Check size={12} className="text-green-500"/>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Instruktur (Buttons) */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Pilih Instruktur</label>
              <div className="grid grid-cols-2 gap-2">
                {instructors.map(i => (
                  <button 
                    key={i.id} type="button" onClick={() => setSelectedInstructorId(String(i.id))}
                    className={`px-2 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedInstructorId === String(i.id) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {i.nickname}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Lokasi (Buttons) */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Pilih Lokasi</label>
              <div className="grid grid-cols-2 gap-2">
                {locations.map(l => (
                  <button 
                    key={l.id} type="button" onClick={() => setSelectedLocationId(String(l.id))}
                    className={`px-2 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedLocationId === String(l.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Catatan */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Catatan (Optional)</label>
              <textarea 
                value={formNote} onChange={e => setFormNote(e.target.value)} rows={2} 
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Topik / Catatan khusus..."
              />
            </div>

            <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70">
              {saving ? "Menyimpan..." : "SIMPAN JADWAL"}
            </button>
          </form>
        </div>
      </aside>

      {/* === MAIN CONTENT (TIMELINE & TABLE) === */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 gap-4 p-2 h-full overflow-hidden">
        
        {/* TOP BAR TIMELINE */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Menu size={20} /></button>}
            
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Bulan:</span>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent text-sm font-bold text-blue-700 outline-none" />
            </div>

            {/* Filter Instruktur Timeline */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <Filter size={12} className="text-gray-400" />
              <select value={timelineInstructorFilter} onChange={e => setTimelineInstructorFilter(e.target.value)} className="bg-transparent text-xs font-bold text-gray-600 outline-none">
                <option value="all">Semua Guru</option>
                {instructors.map(i => <option key={i.id} value={i.nickname}>{i.nickname}</option>)}
              </select>
            </div>
          </div>
          
          <button onClick={fetchAllData} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"><RefreshCcw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>

        {/* 1. TIMELINE MATRIX (Scrollable Area) */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="border-separate border-spacing-0 w-full min-w-max">
              {/* Header Jam (Sticky Top) */}
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="bg-gray-50 border-b border-r border-gray-200 w-24 p-2 sticky left-0 z-30 text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    TGL
                  </th>
                  {HOURS.map(h => (
                    <th key={h} className="bg-white border-b border-r border-gray-100 min-w-[160px] p-2 text-center text-xs font-bold text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Body Timeline */}
              <tbody>
                {daysInMonth.map((dayObj) => {
                  const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
                  const months = ['JAN', 'PEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOP', 'DES'];
                  const dateNum = dayObj.getDate();
                  const dayName = days[dayObj.getDay()];
                  const monthName = months[dayObj.getMonth()];
                  const isSunday = dayObj.getDay() === 0;
                  
                  // Key string
                  const y = dayObj.getFullYear();
                  const m = String(dayObj.getMonth() + 1).padStart(2, '0');
                  const d = String(dayObj.getDate()).padStart(2, '0');
                  const dateStr = `${y}-${m}-${d}`;

                  return (
                    <tr key={dateStr} className={`group ${isSunday ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                      {/* Tanggal (Sticky Left) */}
                      <td className={`sticky left-0 z-10 border-b border-r border-gray-200 p-2 text-center w-24 shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${isSunday ? 'bg-red-50 text-red-600' : 'bg-white text-gray-700'}`}>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold opacity-70">{dayName}</span>
                          <span className="text-xl font-black leading-none my-0.5">{dateNum}</span>
                          <span className="text-[9px] font-bold opacity-70 bg-gray-100 px-1.5 rounded">{monthName}</span>
                        </div>
                      </td>

                      {/* Cells */}
                      {HOURS.map(h => {
                        const key = `${dateStr}_${h}`;
                        const cellData = timelineData[key] || []; // Array of groups

                        return (
                          <td 
                            key={key} 
                            className="border-b border-r border-gray-100 p-1.5 align-top h-24 hover:bg-blue-50/30 transition-colors cursor-pointer"
                            onClick={() => { 
                              setFormDate(dateStr); 
                              setFormTime(h); 
                              if(!isSidebarOpen) setIsSidebarOpen(true); 
                            }}
                          >
                            {cellData.map((group: any, idx: number) => (
                              <div key={idx} className="mb-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden group/card border-l-4 border-l-blue-500">
                                {/* Header Card: Instruktur & Lokasi */}
                                <div className="bg-gray-50 px-2 py-1 flex justify-between items-center border-b border-gray-100">
                                  <span className="text-[10px] font-bold text-blue-700 uppercase truncate">{group.instructor}</span>
                                  <span className="text-[9px] font-medium text-gray-500 bg-white px-1 rounded border border-gray-200">{group.location}</span>
                                </div>
                                
                                {/* List Murid dalam 1 Card */}
                                <div className="p-1.5 flex flex-col gap-1.5">
                                  {group.students.map((stu: any) => (
                                    <div key={stu.id} className="relative pl-1">
                                      <div className="flex justify-between items-start">
                                        <span className="text-[11px] font-bold text-gray-900 leading-tight block">
                                          {stu.shortName}
                                        </span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDelete(stu.id); }}
                                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover/card:opacity-100"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                      
                                      {/* Detail Paket & Sesi */}
                                      <div className="text-[9px] text-gray-500 leading-tight mt-0.5 flex flex-wrap gap-1">
                                        <span className="text-purple-600 font-medium">{stu.student?.package?.code}</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{stu.computedMaterialCode}</span>
                                        <span className="bg-blue-50 text-blue-600 px-1 rounded font-bold">{stu.computedSession}</span>
                                      </div>
                                    </div>
                                  ))}
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

        {/* 2. TABEL DETAIL (BAWAH) */}
        <div className="h-[300px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} /> Detail Booking
            </h3>
            
            {/* Filter Tabel */}
            <div className="flex gap-2">
              <input type="date" value={tableStartDate} onChange={e => setTableStartDate(e.target.value)} className="text-xs border rounded px-2 py-1 outline-none focus:border-blue-500" />
              <span className="text-gray-400">-</span>
              <input type="date" value={tableEndDate} onChange={e => setTableEndDate(e.target.value)} className="text-xs border rounded px-2 py-1 outline-none focus:border-blue-500" />
              
              <select value={tableInstructorFilter} onChange={e => setTableInstructorFilter(e.target.value)} className="text-xs border rounded px-2 py-1 outline-none focus:border-blue-500 bg-white">
                <option value="all">Semua Guru</option>
                {instructors.map(i => <option key={i.id} value={i.nickname}>{i.nickname}</option>)}
              </select>

              <div className="relative">
                <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
                <input type="text" placeholder="Cari Murid..." value={tableSearch} onChange={e => setTableSearch(e.target.value)} className="text-xs border rounded pl-7 pr-2 py-1 outline-none focus:border-blue-500 w-32" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Waktu</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Murid</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Paket</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Materi</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-500">Sesi</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Guru</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Lokasi</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-500">Catatan</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTableData.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">Tidak ada data sesuai filter.</td></tr>
                ) : filteredTableData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-bold text-gray-800">{item.date}</div>
                      <div className="text-gray-400">{item.time?.slice(0,5)}</div>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">{item.student?.name}</td>
                    <td className="px-4 py-2 text-gray-500">{item.student?.package?.code || "-"}</td>
                    <td className="px-4 py-2 text-blue-600 font-medium truncate max-w-[150px]" title={item.computedMaterialName}>{item.computedMaterialName}</td>
                    <td className="px-4 py-2 text-center"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">{item.computedSession}</span></td>
                    <td className="px-4 py-2 text-gray-600">{item.instructor?.nickname}</td>
                    <td className="px-4 py-2 text-gray-600">{item.location?.name}</td>
                    <td className="px-4 py-2 text-gray-400 italic truncate max-w-[100px]">{item.topic || "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 font-bold hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* CSS KHUSUS SCROLLBAR */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        /* Hide Browser Default Scrollbar */
        body { overflow: hidden; }
      `}</style>
    </div>
  );
}