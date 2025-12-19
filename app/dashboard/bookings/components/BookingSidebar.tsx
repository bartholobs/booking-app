"use client";
import React, { useState, useRef, useEffect } from "react";
import { 
  CalendarPlus, Search, X, Check, RefreshCcw, 
  UserPlus, MapPin, MessageSquare, Clock, Calendar, 
  ChevronDown // <-- Tambahin ini bro!
} from "lucide-react";


const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  instructors: any[];
  locations: any[];
  formDate: string; setFormDate: (v: string) => void;
  formTime: string; setFormTime: (v: string) => void;
  selectedInstructorId: string; setSelectedInstructorId: (v: string) => void;
  selectedLocationId: string; setSelectedLocationId: (v: string) => void;
  formNote: string; setFormNote: (v: string) => void;
  selectedStudents: any[]; setSelectedStudents: (v: any[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export default function BookingSidebar({
  isOpen, onClose,
  students, instructors, locations,
  formDate, setFormDate,
  formTime, setFormTime,
  selectedInstructorId, setSelectedInstructorId,
  selectedLocationId, setSelectedLocationId,
  formNote, setFormNote,
  selectedStudents, setSelectedStudents,
  onSubmit, saving
}: SidebarProps) {
  
  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStudent = (student: any) => {
    if (!selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setStudentSearch(""); 
    setIsDropdownOpen(false);
  };

  return (
    <aside 
      className={`
        flex-shrink-0 bg-white border-r border-slate-200 shadow-2xl z-40 
        transition-all duration-500 ease-in-out flex flex-col overflow-hidden
        ${isOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0'}
      `}
    >
      {/* HEADER SECTION */}
      <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <CalendarPlus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800 tracking-tight">Buat Jadwal</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Entry Baru</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-slate-100 p-2 rounded-xl transition-colors group"
          >
            <X size={18} className="text-slate-400 group-hover:text-slate-600"/>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* TANGGAL & JAM SECTION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Calendar size={12} />
              <label className="text-[15px] font-bold uppercase tracking-[1px]">Waktu Belajar</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {/* WRAPPER TANGGAL - CLICKABLE AREA */}
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Calendar size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors"/>
                    </div>
                    {/* Trik: Pakai showPicker() di onClick div pembungkus */}
                    <input 
                      type="date" 
                      value={formDate} 
                      onClick={(e) => (e.target as any).showPicker()}
                      onChange={e => setFormDate(e.target.value)} 
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-2 py-2.5 text-[12px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-semibold cursor-pointer appearance-none" 
                      required 
                    />
                </div>

                {/* WRAPPER JAM */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Clock size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors"/>
                    </div>
                    <select 
                      value={formTime} 
                      onChange={e => setFormTime(e.target.value)} 
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-2 py-2.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-semibold cursor-pointer appearance-none" 
                      required
                    >
                        <option value="">Jam</option>
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50">
                      <ChevronDown size={14} />
                    </div>
                </div>
            </div>
          </div>
          
          {/* MURID MULTI SELECT SECTION */}
          <div className="space-y-3" ref={dropdownRef}>
            <div className="flex items-center gap-2 text-slate-400 mb-1">
               <UserPlus size={12} />
               <label className="text-[15px] font-bold uppercase tracking-[1px]">Daftar Murid</label>
            </div>
            
            {/* Selected Badges */}
            <div className="flex flex-wrap gap-2 min-h-[20px]">
              {selectedStudents.map(s => (
                <span key={s.id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 pl-3 pr-1.5 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 animate-in zoom-in-95">
                  {s.name} 
                  <button 
                    type="button" 
                    onClick={() => setSelectedStudents(selectedStudents.filter(x => x.id !== s.id))} 
                    className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="relative group">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                value={studentSearch} 
                placeholder="Cari nama murid..." 
                onChange={(e) => { setStudentSearch(e.target.value); setIsDropdownOpen(true); }} 
                onFocus={() => setIsDropdownOpen(true)} 
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all shadow-sm" 
              />
              
              {isDropdownOpen && (
                <div className="absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl py-1 animate-in fade-in slide-in-from-top-2">
                  {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).length > 0 ? (
                    students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => (
                      <div 
                        key={s.id} 
                        onClick={() => handleSelectStudent(s)} 
                        className="cursor-pointer px-4 py-2.5 hover:bg-indigo-50 text-xs font-medium text-slate-700 flex justify-between items-center transition-colors"
                      >
                        <span>{s.name}</span>
                        {selectedStudents.find(sel => sel.id === s.id) && <div className="p-0.5 bg-emerald-500 rounded-full"><Check size={10} className="text-white"/></div>}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-400 italic">Murid tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* INSTRUKTUR SECTION */}
          <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock size={12} />
                <label className="text-[15px] font-bold uppercase tracking-[1px]">Pilih Instruktur</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  {instructors.map(i => (
                      <button 
                        type="button" 
                        key={i.id} 
                        onClick={() => setSelectedInstructorId(String(i.id))} 
                        className={`
                          py-2.5 rounded-xl text-[14px] font-bold border transition-all duration-200
                          ${selectedInstructorId === String(i.id) 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02]' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'}
                        `}
                      >
                          {i.nickname}
                      </button>
                  ))}
              </div>
          </div>

          {/* LOKASI SECTION */}
          <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <MapPin size={12} />
                <label className="text-[15px] font-bold uppercase tracking-[1px]">Lokasi Belajar</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  {locations.map(l => (
                      <button 
                        type="button" 
                        key={l.id} 
                        onClick={() => setSelectedLocationId(String(l.id))} 
                        className={`
                          py-2.5 rounded-xl text-[12px] font-bold border transition-all duration-200
                          ${selectedLocationId === String(l.id) 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-100 scale-[1.02]' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'}
                        `}
                      >
                          {l.name}
                      </button>
                  ))}
              </div>
          </div>

          {/* CATATAN SECTION */}
          <div className="space-y-3 pb-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <MessageSquare size={12} />
                <label className="text-[15px] font-bold uppercase tracking-[1px]">Catatan Tambahan</label>
              </div>
              <textarea 
                value={formNote} 
                onChange={e => setFormNote(e.target.value)} 
                rows={2}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all resize-none" 
                placeholder="Misal: Bawa laptop sendiri..." 
              />
          </div>
        </form>
      </div>

      {/* FOOTER BUTTON */}
      <div className="p-5 border-t border-slate-100 bg-white">
        <button 
          onClick={onSubmit}
          disabled={saving || selectedStudents.length === 0} 
          className="
            w-full bg-indigo-600 text-white rounded-xl py-3.5 font-bold text-xs shadow-xl 
            shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.97] 
            disabled:opacity-50 disabled:grayscale disabled:pointer-events-none 
            flex justify-center items-center gap-3
          "
        >
            {saving ? <RefreshCcw size={16} className="animate-spin"/> : <Check size={18}/>}
            {saving ? "SEDANG MENYIMPAN..." : "SIMPAN JADWAL BELAJAR"}
        </button>
      </div>
    </aside>
  );
}