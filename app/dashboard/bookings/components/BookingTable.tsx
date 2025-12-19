"use client";
import React from "react";
import { Search, FileText, Trash2, Edit, User, Package, BookOpen } from "lucide-react";

interface TableProps {
  data: any[];
  instructors: any[];
  filters: {
    search: string; setSearch: (v: string) => void;
    instructor: string; setInstructor: (v: string) => void;
    startDate: string; setStartDate: (v: string) => void;
    endDate: string; setEndDate: (v: string) => void;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

export default function BookingTable({ data, instructors, filters, onEdit, onDelete, onStatusChange }: TableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* FILTER HEADER */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white sticky left-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
                <FileText size={20} className="text-slate-600"/>
            </div>
            <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Detail Booking</h3>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Riwayat & Daftar Hadir</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder="Cari Murid..." 
                value={filters.search} 
                onChange={e => filters.setSearch(e.target.value)} 
                className="text-sm border border-slate-200 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-blue-500 w-56 transition-all bg-slate-50/50" 
            />
          </div>

          <select 
            value={filters.instructor} 
            onChange={e => filters.setInstructor(e.target.value)} 
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 bg-white cursor-pointer font-medium text-slate-600 shadow-sm"
          >
              <option value="all">Semua Guru</option>
              {instructors.map(i => <option key={i.id} value={i.nickname}>{i.nickname}</option>)}
          </select>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <input type="date" value={filters.startDate} onChange={e => filters.setStartDate(e.target.value)} className="text-xs outline-none bg-transparent text-slate-600 font-semibold" />
              <span className="text-slate-300">/</span>
              <input type="date" value={filters.endDate} onChange={e => filters.setEndDate(e.target.value)} className="text-xs outline-none bg-transparent text-slate-600 font-semibold" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[11px]">Waktu</th>
              <th className="px-5 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[11px]">Murid</th>
              <th className="px-5 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[11px]">Paket</th>
              <th className="px-5 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[11px]">Materi</th>
              <th className="px-5 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-[11px]">Sesi</th>
              <th className="px-5 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[11px]">Guru</th>
              <th className="px-5 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
              <th className="px-5 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-[11px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-400 font-medium">Data Tidak Ditemukan</td></tr>
            ) : data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                {/* WAKTU */}
                <td className="px-5 py-2 whitespace-nowrap">
                    <div className="font-medium text-slate-800 text-[13px]">
                      {new Date(item.date).toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'short' })                             
                      }
                    </div>
                    <div className="text-slate-500 text-[12px] font-reguler">{item.time?.slice(0,5)} WIB</div>
                    
                </td>

                {/* MURID */}
                <td className="px-5 py-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <User size={20}/>
                        </div>
                        <span className="font-semibold text-slate-700 text-[13px]">{item.student?.name}</span>
                    </div>
                </td>

                {/* PAKET */}
                <td className="px-5 py-2">
                    <div className="flex items-center gap-2">
                        <Package size={20} className="text-indigo-400"/>
                        <span className="text-slate-600 font-semibold tracking-tight text-[12px]">
                            {item.student?.package?.name || item.student?.package_id || "-"}
                        </span>
                    </div>
                </td>

                {/* MATERI */}
                <td className="px-5 py-2 max-w-[220px]">
                    <div className="flex items-center gap-2">
                        <BookOpen size={20} className="text-slate-400"/>
                        <span className="text-slate-600 font-medium truncate tracking-tight text-[12px]">
                            {item.computedMaterialName}
                        </span>
                    </div>
                </td>

                {/* SESI */}
                <td className="px-5 py-2 text-center">
                    <span className="bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-s font-medium">
                        {item.computedSession}
                    </span>
                </td>

                {/* GURU */}
                <td className="px-5 py-2">
                    <span className="text-slate-700 font-semibold text-[13px]">{item.instructor?.nickname}</span>
                </td>

                {/* STATUS */}
                <td className="px-5 py-2 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        item.status === 'done' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                        {item.status === 'done' ? 'Hadir' : item.status}
                    </span>
                </td>

                {/* AKSI (LANGSUNG MUNCUL) */}
                <td className="px-5 py-2 text-right">
                  <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(item.id)} 
                        className="p-2 hover:bg-blue-600 hover:text-white text-blue-500 rounded-xl transition-all border border-blue-100 bg-white shadow-sm"
                        title="Edit"
                      >
                        <Edit size={16}/>
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)} 
                        className="p-2 hover:bg-rose-600 hover:text-white text-rose-500 rounded-xl transition-all border border-rose-100 bg-white shadow-sm"
                        title="Hapus"
                      >
                        <Trash2 size={16}/>
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}