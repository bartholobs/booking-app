"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation"; 
import Link from "next/link";
import { 
  RefreshCcw, Menu, Edit, 
  CheckCircle2, AlertTriangle, ClipboardList, ChevronDown, 
  CalendarDays, UserCircle, X
} from "lucide-react";

// --- IMPORT SERVICE ---
import { 
  fetchMasterDataService, 
  fetchBookingsService, 
  createBookingService, 
  deleteBookingService, 
  updateBookingService, 
  updateBookingStatusService 
} from "../../../services/bookingService"; 

// --- IMPORT KOMPONEN ---
import BookingSidebar from "./components/BookingSidebar";
import BookingTimeline from "./components/BookingTimeline";
import BookingTable from "./components/BookingTable";

const HOURS = Array.from({ length: 14 }, (_, i) => {
    const h = i + 8;
    return `${h.toString().padStart(2, "0")}:00`;
});

export default function BookingsPage() {
  const router = useRouter();
  const monthInputRef = useRef<HTMLInputElement>(null);

  // --- STATE DATA ---
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [curriculumMap, setCurriculumMap] = useState<Record<number, any[]>>({});

  // --- STATE UI & FILTER ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" }); 
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timelineInstructorFilter, setTimelineInstructorFilter] = useState("all");

  const [tableSearch, setTableSearch] = useState("");
  const [tableInstructorFilter, setTableInstructorFilter] = useState("all");
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");

  // --- STATE FORM SIDEBAR ---
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [formNote, setFormNote] = useState(""); 
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // --- STATE MODAL EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // --- 1. FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { students, instructors, locations, curriculum } = await fetchMasterDataService();

      setAllStudents(students);
      setInstructors(instructors);
      setLocations(locations);

      if (curriculum.length > 0) {
        const expandedMap: Record<number, any[]> = {};
        const rawGroup: Record<number, any[]> = {};
        
        curriculum.forEach((item: any) => {
          if (!rawGroup[item.package_id]) rawGroup[item.package_id] = [];
          rawGroup[item.package_id].push(item);
        });

        Object.keys(rawGroup).forEach((pkgId: any) => {
          const sessionList: any[] = [];
          rawGroup[pkgId].forEach((currItem: any) => {
            const mat = currItem.material;
            if (mat) {
                const totalSesi = mat.session_count || 1;
                for (let i = 1; i <= totalSesi; i++) {
                    sessionList.push({ name: mat.name, code: mat.code, currentSession: i, totalSessions: totalSesi });
                }
            }
          });
          expandedMap[pkgId] = sessionList;
        });
        setCurriculumMap(expandedMap);
      }
      
      await fetchBookingsByMonth();
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Gagal memuat data", "error");
    }
    setLoading(false);
  };

  const fetchBookingsByMonth = async () => {
    const [year, month] = selectedMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const lastDayObj = new Date(parseInt(year), parseInt(month), 0);
    const endDate = `${year}-${month}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

    const { data, error } = await fetchBookingsService(startDate, endDate);

    if (!error) setBookings(data || []);
    else console.error("Error bookings:", error);
  };

  useEffect(() => { fetchAllData(); }, [selectedMonth]);

  // --- 2. DATA PROCESSING ---
  const enrichedBookings = useMemo(() => {
    const studentHistory: Record<number, any[]> = {};
    const sortedAll = [...bookings].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    sortedAll.forEach(b => {
      if (!studentHistory[b.student_id]) studentHistory[b.student_id] = [];
      studentHistory[b.student_id].push(b);
    });

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
        shortName: b.student?.name ? b.student.name.split(" ").slice(0, 2).join(" ") : "Unknown"
      };
    });
  }, [bookings, curriculumMap]);

  const timelineData = useMemo(() => {
    const map: Record<string, any[]> = {};
    enrichedBookings.forEach((b) => {
      if (timelineInstructorFilter !== "all" && b.instructor?.nickname !== timelineInstructorFilter) return;
      const timeShort = b.time.slice(0, 5);
      const key = `${b.date}_${timeShort}`;
      const groupKey = `${b.instructor?.nickname}-${b.location?.name}`;
      
      if (!map[key]) map[key] = [];
      
      const existingGroup = map[key].find((g: any) => g.groupId === groupKey);
      if (existingGroup) {
        existingGroup.students.push(b);
      } else {
        map[key].push({ 
            groupId: groupKey, 
            instructor: b.instructor?.nickname, 
            location: b.location?.name, 
            students: [b] 
        });
      }
    });
    return map;
  }, [enrichedBookings, timelineInstructorFilter]);

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

  const filteredTableData = enrichedBookings.filter(b => {
    const matchName = b.student?.name.toLowerCase().includes(tableSearch.toLowerCase());
    const matchInst = tableInstructorFilter === "all" || b.instructor?.nickname === tableInstructorFilter;
    let matchDate = true;
    if (tableStartDate && tableEndDate) matchDate = b.date >= tableStartDate && b.date <= tableEndDate;
    return matchName && matchInst && matchDate;
  });

  const formatMonthIndo = (yyyyMm: string) => {
    if(!yyyyMm) return "";
    const [y, m] = yyyyMm.split('-');
    const date = new Date(parseInt(y), parseInt(m)-1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  // --- 3. ACTIONS ---
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type: type as any });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formTime || selectedStudents.length === 0 || !selectedInstructorId || !selectedLocationId) {
      return showToast("Data belum lengkap!", "error");
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

    const { error } = await createBookingService(inserts);

    if (!error) {
      showToast("Jadwal Berhasil Dibuat!");
      setSelectedStudents([]); setFormNote(""); setSelectedInstructorId(""); setSelectedLocationId("");
      fetchBookingsByMonth();
    } else {
      showToast(error.message, "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal ini?")) return;
    await deleteBookingService(id);
    fetchBookingsByMonth();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await updateBookingStatusService(id, newStatus);
    if (!error) {
      showToast(newStatus === 'done' ? "Siswa Hadir ✅" : "Status diupdate");
      fetchBookingsByMonth();
    } else showToast("Gagal update status", "error");
  };

  const handleEditClick = (id: number) => {
     const booking = bookings.find(b => b.id === id);
     if(booking) {
        setEditData({
            id: booking.id, date: booking.date, time: booking.time.slice(0,5),
            instructor_id: String(booking.instructor_id), location_id: String(booking.location_id),
            topic: booking.topic || "", student_name: booking.student?.name
        });
        setIsEditModalOpen(true);
     }
  };

  const handleUpdate = async () => {
    if(!editData) return;
    const payload = {
        date: editData.date, time: editData.time + ":00",
        instructor_id: parseInt(editData.instructor_id), location_id: parseInt(editData.location_id),
        topic: editData.topic
    };
    const { error } = await updateBookingService(editData.id, payload);
    if(!error) {
        showToast("Data berhasil diupdate");
        setIsEditModalOpen(false); setEditData(null);
        fetchBookingsByMonth();
    } else showToast(error.message, "error");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50 relative text-sm font-sans">
      
      {/* Toast */}
      {toast.show && <div className={`absolute top-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span className="font-bold text-xs">{toast.msg}</span></div>}

      {/* Edit Modal */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="bg-slate-800 p-4 flex justify-between items-center text-white"><h3 className="font-bold flex items-center gap-2 text-sm uppercase"><Edit size={16}/> Edit Booking</h3><button onClick={() => setIsEditModalOpen(false)}><X size={18}/></button></div>
               <div className="p-6 space-y-4">
                  <div className="text-center font-bold text-blue-600 uppercase mb-2">{editData.student_name}</div>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] font-bold text-gray-400 block mb-1">TGL</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} className="w-full border rounded p-2 text-xs" /></div>
                      <div><label className="text-[10px] font-bold text-gray-400 block mb-1">JAM</label><select value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} className="w-full border rounded p-2 text-xs bg-white">{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">{instructors.map(i => <button key={i.id} onClick={() => setEditData({...editData, instructor_id: String(i.id)})} className={`text-[10px] py-1.5 rounded border ${editData.instructor_id === String(i.id) ? 'bg-blue-600 text-white' : 'bg-white'}`}>{i.nickname}</button>)}</div>
                  <div className="grid grid-cols-3 gap-2">{locations.map(l => <button key={l.id} onClick={() => setEditData({...editData, location_id: String(l.id)})} className={`text-[10px] py-1.5 rounded border ${editData.location_id === String(l.id) ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{l.name}</button>)}</div>
                  <input type="text" value={editData.topic} onChange={e => setEditData({...editData, topic: e.target.value})} className="w-full border rounded p-2 text-xs" placeholder="Catatan..." />
                  <button onClick={handleUpdate} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 text-xs">SIMPAN</button>
               </div>
           </div>
        </div>
      )}

      {/* 1. SIDEBAR COMPONENT */}
      <BookingSidebar 
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        students={allStudents} instructors={instructors} locations={locations}
        formDate={formDate} setFormDate={setFormDate}
        formTime={formTime} setFormTime={setFormTime}
        selectedInstructorId={selectedInstructorId} setSelectedInstructorId={setSelectedInstructorId}
        selectedLocationId={selectedLocationId} setSelectedLocationId={setSelectedLocationId}
        formNote={formNote} setFormNote={setFormNote}
        selectedStudents={selectedStudents} setSelectedStudents={setSelectedStudents}
        onSubmit={handleSubmit} saving={saving}
      />

      {/* --- CONTENT UTAMA --- */}
      {/* flex-1 dan h-full memastikan dia mengisi SISA tinggi browser setelah header (jika ada) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        
        {/* A. HEADER TOOLBAR (Fixed) */}
        <div className="shrink-0 bg-white border-b border-slate-200 p-2 flex justify-between items-center shadow-sm h-16 relative z-40">
             <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pl-1 w-full">
                 {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><Menu size={20}/></button>}
                 
                 {/* Filter Periode */}
                 <div onClick={() => monthInputRef.current?.showPicker()} className="group relative flex items-center gap-3 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-300 rounded-xl px-3 py-2 cursor-pointer min-w-[160px]">
                    <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors shrink-0"><CalendarDays size={16} className="text-slate-400 group-hover:text-blue-500"/></div>
                    <div className="flex flex-col flex-1 pointer-events-none">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-400">Periode</span>
                       <span className="text-xs font-bold text-slate-700">{formatMonthIndo(selectedMonth)}</span>
                    </div>
                    <input ref={monthInputRef} type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 pointer-events-none"/>
                 </div>
                 
                 {/* Filter Guru */}
                 <div className="hidden sm:flex group relative items-center gap-3 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-300 rounded-xl px-3 py-2 cursor-pointer min-w-[180px]">
                    <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors shrink-0 pointer-events-none"><UserCircle size={16} className="text-slate-400 group-hover:text-indigo-500"/></div>
                    <div className="flex flex-col flex-1 min-w-0 pointer-events-none">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400">Filter Guru</span>
                       <span className="text-xs font-bold text-slate-700 truncate">{timelineInstructorFilter === 'all' ? 'Semua Guru' : timelineInstructorFilter}</span>
                    </div>
                    <ChevronDown size={14} className="text-slate-300 group-hover:text-indigo-400 shrink-0 pointer-events-none"/>
                    <select value={timelineInstructorFilter} onChange={e => setTimelineInstructorFilter(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 appearance-none">
                      <option value="all">Semua Guru</option>
                      {instructors.map(i => <option key={i.id} value={i.nickname}>{i.nickname} - {i.name}</option>)}
                    </select>
                 </div>

                 <Link href="/dashboard/bookings/attendance" className="group flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100/50 rounded-xl transition-all duration-300 ml-auto sm:ml-2">
                     <div className="p-1.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors"><ClipboardList size={16} className="text-emerald-600"/></div>
                     <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-500">Menu</span><span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800">Absensi</span></div>
                 </Link>
             </div>
             <button onClick={fetchAllData} className="ml-2 p-2.5 hover:bg-white hover:shadow-sm text-blue-600 rounded-xl transition active:scale-95 border border-transparent hover:border-slate-200"><RefreshCcw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>

        {/* B. SCROLLABLE CONTAINER (Fills Remaining Height) */}
        {/* flex-1 & overflow-auto di sini yang bikin scrollbar verticalnya nempel di browser */}
        <div className="flex-1 w-full overflow-auto custom-scrollbar relative">
            
            {/* 1. TIMELINE (Wide Content) */}
            {/* min-w-max memaksa container melebar, memicu scrollbar horizontal MUNCUL DI CONTAINER B (di bawah layar) */}
            <div className="min-w-max pb-10">
               
               <BookingTimeline 
                   loading={loading} selectedMonth={selectedMonth} daysInMonth={daysInMonth} timelineData={timelineData}
                   onCellClick={(d, t) => { setFormDate(d); setFormTime(t); if(!isSidebarOpen) setIsSidebarOpen(true); }}
                   onEdit={handleEditClick} onDelete={handleDelete}
               />

               {/* 2. TABLE (Sticky Left & Full Screen Width) */}
               {/* LOGIC:
                   1. sticky left-0: Biar nempel di kiri pas scroll horizontal.
                   2. Width calculation: Kita paksa lebarnya ngikutin layar (vw), bukan ngikutin timeline.
                      - Sidebar Buka (w-64/16rem): 100vw - 19rem (sidebar + padding)
                      - Sidebar Tutup: 100vw - 3rem (padding doang)
               */}
               <div 
                  className="sticky left-0 mt-6 px-6 transition-all duration-300"
                  style={{ 
                    width: isSidebarOpen ? 'calc(100vw - 21rem)' : 'calc(100vw - 2rem)' 
                  }}
               >
                  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 px-2">
                    <ClipboardList className="text-blue-600"/> Detail Jadwal
                  </h3>
                  
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full">
                    <BookingTable 
                      data={filteredTableData} 
                      instructors={instructors}
                      filters={{ 
                        search: tableSearch, 
                        setSearch: setTableSearch, 
                        instructor: tableInstructorFilter, 
                        setInstructor: setTableInstructorFilter, 
                        startDate: tableStartDate, 
                        setStartDate: setTableStartDate, 
                        endDate: tableEndDate, 
                        setEndDate: setTableEndDate 
                      }}
                      onEdit={handleEditClick} 
                      onDelete={handleDelete} 
                      onStatusChange={handleStatusChange}
                    />
                  </div>
               </div>

            </div>

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 30px; height: 30px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #cbd5e1; 
          border: 3px solid #f1f5f9; 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        body { overflow: hidden; } 
      `}</style>
    </div>
  );
}