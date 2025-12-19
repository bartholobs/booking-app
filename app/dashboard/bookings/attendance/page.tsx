"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabaseClient";
import { 
  ArrowLeft, CalendarCheck, Clock, MapPin, User, 
  CheckCircle2, XCircle, AlertCircle, Filter, Search 
} from "lucide-react";

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default Hari Ini
  const [searchQuery, setSearchQuery] = useState("");

  // Statistik Harian
  const stats = {
    total: bookings.length,
    present: bookings.filter(b => b.status === 'done').length,
    pending: bookings.filter(b => b.status === 'scheduled').length
  };

  // 1. Fetch Jadwal Harian
  const fetchDailyBookings = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, date, time, status, topic,
        student:students (name, package:packages(code)),
        instructor:instructors (nickname),
        location:locations (name)
      `)
      .eq("date", filterDate) // Filter Tanggal
      .order("time", { ascending: true });

    if (error) {
      alert("Gagal ambil data: " + error.message);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDailyBookings();
  }, [filterDate]);

  // 2. Update Status (Check-In)
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    // Optimistic UI Update (Ubah tampilan dulu biar cepet)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Gagal update status!");
      fetchDailyBookings(); // Rollback kalau error
    }
  };

  // Filter Search Nama
  const filteredBookings = bookings.filter(b => 
    b.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER NAVIGASI */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/bookings" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarCheck size={20} className="text-emerald-600" />
                Absensi Kelas
              </h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                Halaman Check-in Harian
              </p>
            </div>
          </div>
          
          {/* Date Picker */}
          <div>
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* STATISTIK CARD */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="text-xs text-gray-400 font-bold uppercase">Total</div>
            <div className="text-2xl font-black text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
            <div className="text-xs text-emerald-600 font-bold uppercase">Hadir</div>
            <div className="text-2xl font-black text-emerald-700">{stats.present}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 shadow-sm text-center">
            <div className="text-xs text-orange-600 font-bold uppercase">Pending</div>
            <div className="text-2xl font-black text-orange-700">{stats.pending}</div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input 
                type="text" 
                placeholder="Cari nama murid..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-sm transition"
            />
        </div>

        {/* LIST JADWAL */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400 italic">Memuat jadwal...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">Tidak ada jadwal pada tanggal ini.</p>
            </div>
          ) : (
            filteredBookings.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl p-4 border transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.status === 'done' ? 'border-emerald-200 ring-1 ring-emerald-100' : 
                    item.status === 'cancelled' ? 'border-red-200 bg-red-50/30' : 
                    'border-gray-200 hover:border-emerald-300'
                }`}
              >
                {/* INFO KIRI */}
                <div className="flex items-start gap-4">
                  {/* Jam Box */}
                  <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-16 h-16 shrink-0 border border-gray-200">
                    <Clock size={16} className="text-gray-400 mb-1" />
                    <span className="font-black text-gray-800 text-sm">{item.time?.slice(0,5)}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.student?.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-medium">
                            {item.student?.package?.code || "No Package"}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            <User size={10} /> {item.instructor?.nickname}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            <MapPin size={10} /> {item.location?.name}
                        </div>
                    </div>
                    {item.topic && (
                        <p className="text-xs text-gray-400 mt-2 italic line-clamp-1">"{item.topic}"</p>
                    )}
                  </div>
                </div>

                {/* TOMBOL AKSI KANAN */}
                <div className="flex items-center gap-2 sm:border-l sm:border-gray-100 sm:pl-4 sm:ml-2">
                    
                    {item.status === 'done' ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-bold border border-emerald-100 w-full sm:w-auto justify-center">
                            <CheckCircle2 size={18} /> HADIR
                            <button 
                                onClick={() => handleStatusUpdate(item.id, 'scheduled')}
                                className="ml-2 text-xs underline text-gray-400 hover:text-red-500 font-normal"
                            >
                                Batal
                            </button>
                        </div>
                    ) : item.status === 'cancelled' ? (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg font-bold border border-red-100 w-full sm:w-auto justify-center">
                            <XCircle size={18} /> ABSEN/IZIN
                            <button 
                                onClick={() => handleStatusUpdate(item.id, 'scheduled')}
                                className="ml-2 text-xs underline text-gray-400 hover:text-blue-500 font-normal"
                            >
                                Reset
                            </button>
                        </div>
                    ) : (
                        // TOMBOL AKSI DEFAULT (BELUM ABSEN)
                        <div className="flex w-full sm:w-auto gap-2">
                            <button 
                                onClick={() => handleStatusUpdate(item.id, 'done')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-sm active:scale-95"
                            >
                                <CheckCircle2 size={18} /> Hadir
                            </button>
                            <button 
                                onClick={() => handleStatusUpdate(item.id, 'cancelled')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-2.5 rounded-lg font-medium transition active:scale-95"
                                title="Izin / Sakit / Batal"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>
                    )}

                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}