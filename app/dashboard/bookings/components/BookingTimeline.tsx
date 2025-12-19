"use client";
import React from "react";
import { Edit, Trash2, User, BookOpen, Layers } from "lucide-react";

// Konfigurasi Jam
const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, "0")}:00`;
});

interface TimelineProps {
  loading: boolean;
  selectedMonth: string;
  daysInMonth: Date[];
  timelineData: Record<string, any[]>;
  onCellClick: (date: string, time: string) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function BookingTimeline({
  loading,
  daysInMonth,
  timelineData,
  onCellClick,
  onEdit,
  onDelete
}: TimelineProps) {

  const formatVerticalDate = (dateObj: Date) => {
    const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
    return { day: days[dateObj.getDay()], date: dateObj.getDate(), month: months[dateObj.getMonth()] };
  };

  return (
    // FIX: Hapus 'overflow-hidden' agar sticky header bekerja dengan scroll parent
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg mb-6 relative">
      <div className="min-w-max pb-6 bg-white rounded-xl">
        <table className="border-separate border-spacing-0 w-full">
          
          {/* HEADER JAM (STICKY TOP) */}
          <thead>
            <tr>
              {/* Pojok Kiri Atas: Sticky Kiri & Atas (Z-Index Paling Tinggi 50) */}
              <th className="bg-slate-50 border-b border-r border-slate-200 w-20 p-2 sticky left-0 top-0 z-50 text-slate-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05)]">
                <span className="text-[12px] font-bold tracking-widest">HARI</span>
              </th>
              
              {HOURS.map(h => (
                // Header Jam: Sticky Atas (Z-Index 40)
                <th key={h} className="text-[15px] bg-slate-50/95 backdrop-blur border-b border-r border-slate-200 min-w-[140px] p-2 sticky top-0 z-40 text-center text-[10px] font-bold text-slate-600 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
                 <tr><td colSpan={15} className="p-10 text-center text-gray-400">Sedang memuat timeline...</td></tr>
            ) : daysInMonth.map((dayObj) => {
              const { day, date, month } = formatVerticalDate(dayObj);
              const y = dayObj.getFullYear();
              const m = String(dayObj.getMonth() + 1).padStart(2, '0');
              const d = String(dayObj.getDate()).padStart(2, '0');
              const dateStr = `${y}-${m}-${d}`;
              const isSunday = dayObj.getDay() === 0;

              return (
                <tr key={dateStr} className={`group ${isSunday ? 'bg-rose-50/30' : 'bg-white hover:bg-slate-50/50'}`}>
                  
                  {/* KOLOM TANGGAL (STICKY LEFT) - Z-Index 30 */}
                  <td className={`sticky left-0 z-30 border-b border-r border-slate-200 p-2 text-center w-20 shadow-[4px_0_10px_rgba(0,0,0,0.03)] backdrop-blur-sm ${isSunday ? 'text-rose-500 bg-rose-50/90' : 'text-slate-600 bg-white/95'}`}>
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-[12px] font-bold uppercase opacity-60 tracking-wider">{day}</span>
                      <span className="text-xl font-bold my-0.5">{date}</span>
                      <span className="text-[9px] font-bold uppercase opacity-60">{month}</span>
                    </div>
                  </td>

                  {/* CELL MATRIX */}
                  {HOURS.map(h => {
                    const key = `${dateStr}_${h}`;
                    const cellData = timelineData[key] || [];

                    return (
                      <td 
                        key={key} 
                        className="border-b border-r border-slate-100 p-1 align-top h-24 transition-all cursor-pointer hover:bg-blue-50/30 group/cell relative"
                        onClick={() => onCellClick(dateStr, h)}
                      >
                        {/* Slot Kosong (Hover Plus) */}
                        {cellData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-4xl text-slate-300/50 font-thin select-none">+</span>
                            </div>
                        )}

                        {/* Booking Cards */}
                        {cellData.map((group: any, idx: number) => {
                            const isMulti = group.students.length > 1;
                            const hasActivity = group.students.some((s: any) => s.status === 'done' || s.status === 'cancelled');
                            
                            // Styling Logic
                            let cardStyle = "bg-sky-50 border-sky-200 shadow-sky-100";
                            let headerColor = "text-sky-700 bg-sky-100/50";
                            if ((isMulti && hasActivity) || (!isMulti && group.students[0].status === 'done')) {
                                cardStyle = "bg-emerald-50 border-emerald-200 shadow-emerald-100";
                                headerColor = "text-emerald-700 bg-emerald-100/50";
                            } else if (!isMulti && group.students[0].status === 'cancelled') {
                                cardStyle = "bg-rose-50 border-rose-200 shadow-rose-100 opacity-70";
                                headerColor = "text-rose-700 bg-rose-100/50";
                            }

                            return (
                              <div key={idx} className={`mb-1.5 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group/card relative ${cardStyle}`}>
                                
                                {/* HEADER CARD: Instruktur & Lokasi */}
                                <div className={`px-1.5 py-0.5 flex justify-start gap-2 items-center border-b border-black/5 ${headerColor}`}>
                                  <div className="flex items-center gap-1 min-w-0 shrink-0">
                                      <User size={10} className="shrink-0 opacity-70"/>
                                      <span className="text-[11px] font-bold uppercase tracking-tight truncate max-w-[80px]">{group.instructor}</span>
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-100 truncate">{group.location}</span>
                                </div>
                                
                                {/* LIST MURID */}
                                <div className="p-1 flex flex-col gap-1">
                                  {group.students.map((stu: any) => (
                                    <div key={stu.id} className="relative pl-0.5 group/student hover:bg-white/60 rounded-sm transition-colors">
                                      
                                      {/* Nama Murid */}
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-[12px] font-bold leading-tight block truncate max-w-[120px] ${
                                            stu.status === 'done' ? 'text-emerald-700' : 
                                            stu.status === 'cancelled' ? 'text-rose-600 line-through decoration-rose-300' : 
                                            'text-slate-600'
                                        }`}>
                                            {stu.shortName}
                                        </span>

                                        {/* Hover Actions */}
                                        <div className="hidden group-hover/student:flex items-center gap-0.5 absolute right-0 -top-1 bg-white shadow-sm p-[1px] rounded border border-slate-100 z-20">
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(stu.id); }} className="p-1 hover:bg-blue-50 text-blue-500 rounded"><Edit size={10} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(stu.id); }} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={10} /></button>
                                        </div>
                                      </div>
                                      
                                      {/* INFO DETAIL (Paket, Materi, Sesi) */}
                                      <div className="flex items-center flex-wrap gap-1.5 w-full mt-0.5">
                                         
                                         {/* Paket */}
                                         <div className="flex items-center gap-1 px-1 py-0 bg-white/60 rounded border border-slate-200/60" title="Kode Paket">
                                            <Layers size={8} className="text-slate-400"/>
                                            <span className="text-[10px] font-medium text-slate-600">{stu.student?.package?.code || "-"}</span>
                                         </div>
                                         
                                         {/* Materi */}
                                         {stu.computedMaterialCode !== "-" && (
                                            <div className="flex items-center gap-1 px-1 py-0 bg-white/60 rounded border border-slate-200/60 max-w-[60px] overflow-hidden" title="Materi">
                                                <BookOpen size={8} className="text-slate-400"/>
                                                <span className="text-[10px] font-medium text-slate-600 truncate">{stu.computedMaterialCode}</span>
                                            </div>
                                         )}

                                         {/* Sesi */}
                                         <div className="bg-blue-100/50 text-purple-500 px-2 py-0 rounded-[3px] border border-blue-200/50">
                                            <span className="text-[10px] font-bold">{stu.computedSession}</span>
                                         </div>
                                      </div>

                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                        })}
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
  );
}