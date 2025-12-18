"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function CreateBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Data Master
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // State Form
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [topic, setTopic] = useState("");

  // Search Murid
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- FITUR BARU: KURIKULUM PINTAR ---
  const [activePackage, setActivePackage] = useState<any>(null); // Nama Paket Murid
  const [curriculumList, setCurriculumList] = useState<any[]>([]); // Daftar Materi
  const [isLoadingCurr, setIsLoadingCurr] = useState(false);

  // 1. Ambil Data Master
  useEffect(() => {
    const fetchMasterData = async () => {
      const [resStudent, resInstructor, resLocation] = await Promise.all([
        supabase.from("students").select("id, name").eq("status", "active").order("name"),
        supabase.from("instructors").select("id, name").order("name"),
        supabase.from("locations").select("id, name, duration").order("name"),
      ]);

      if (resStudent.data) setStudents(resStudent.data);
      if (resInstructor.data) setInstructors(resInstructor.data);
      if (resLocation.data) setLocations(resLocation.data);
    };

    fetchMasterData();
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. DETEKTIF PAKET: Setiap kali Murid Dipilih, Cek Paketnya!
  useEffect(() => {
    const checkStudentPackage = async () => {
      if (!studentId) {
        setActivePackage(null);
        setCurriculumList([]);
        return;
      }

      setIsLoadingCurr(true);
      
      // A. Cek dia paketnya apa?
      const { data: sData } = await supabase
        .from("students")
        .select(`
          package_id,
          package:packages (name, total_sessions)
        `)
        .eq("id", studentId)
        .single();

      if (sData?.package_id) {
        setActivePackage(sData.package);

        // B. Ambil Materi dari Paket itu (Join ke Curriculum -> Materials)
        const { data: cData } = await supabase
          .from("curriculum")
          .select(`
            sort_order,
            material:materials (name, code, session_count)
          `)
          .eq("package_id", sData.package_id)
          .order("sort_order", { ascending: true });
        
        setCurriculumList(cData || []);
      } else {
        setActivePackage(null);
        setCurriculumList([]);
      }
      setIsLoadingCurr(false);
    };

    checkStudentPackage();
  }, [studentId]);

  // Fungsi Helper
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleSelectStudent = (id: string, name: string) => {
    setStudentId(id);
    setStudentSearch(name);
    setIsDropdownOpen(false);
  };

  // 3. Simpan Jadwal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!date || !time || !studentId || !instructorId || !locationId) {
        alert("Wajib diisi semua!");
        setLoading(false);
        return;
    }

    const { error } = await supabase.from("bookings").insert([{
        date, time,
        student_id: parseInt(studentId),
        instructor_id: parseInt(instructorId),
        location_id: parseInt(locationId),
        topic,
        status: "scheduled",
    }]);

    if (error) {
      alert("Gagal: " + error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/bookings");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">Buat Jadwal Baru</h1></div>

        <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tanggal & Jam */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Tanggal</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Jam</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-blue-500" required />
                    </div>
                </div>

                {/* Pilih Murid */}
                <div className="relative" ref={dropdownRef}>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Pilih Murid</label>
                    <input 
                        type="text" value={studentSearch} placeholder="Ketik nama murid..."
                        onChange={(e) => { setStudentSearch(e.target.value); setStudentId(""); setIsDropdownOpen(true); }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className={`w-full rounded-md border p-2.5 outline-none ${studentId ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {studentId && <div className="absolute right-3 top-9 text-green-600 text-xs font-bold">✓ Terpilih</div>}
                    {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                            {filteredStudents.map((s) => (
                                <div key={s.id} onClick={() => handleSelectStudent(s.id, s.name)} className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50">
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- KOTAK BIRU AJAIB (KURIKULUM) --- */}
                {isLoadingCurr ? (
                    <div className="text-center text-sm text-blue-500">Mengecek kurikulum... ⏳</div>
                ) : activePackage ? (
                    <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="font-bold text-blue-800 text-sm">🎯 Kurikulum: {activePackage.name}</h4>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{activePackage.total_sessions} Sesi</span>
                        </div>
                        <p className="text-xs text-blue-600 mb-3">Klik materi di bawah untuk menyalin ke kolom Topik:</p>
                        <div className="flex flex-wrap gap-2">
                            {curriculumList.length > 0 ? curriculumList.map((item, idx) => (
                                <button
                                    key={idx} type="button"
                                    onClick={() => setTopic(`${item.material.code} - ${item.material.name}`)}
                                    className="text-xs bg-white border border-blue-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition shadow-sm"
                                >
                                    {idx + 1}. {item.material.name}
                                </button>
                            )) : <span className="text-xs text-gray-400 italic">Belum ada materi di paket ini.</span>}
                        </div>
                    </div>
                ) : null}
                {/* ------------------------------------- */}

                {/* Instruktur & Lokasi */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Instruktur</label>
                        <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 outline-none bg-white" required>
                            <option value="">-- Pilih Guru --</option>
                            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Lokasi</label>
                        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 outline-none bg-white" required>
                            <option value="">-- Pilih Ruangan --</option>
                            {locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.duration} mnt)</option>)}
                        </select>
                    </div>
                </div>

                {/* Topik */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Topik / Catatan</label>
                    <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-blue-500" placeholder="Pilih materi dari kotak biru di atas..."></textarea>
                </div>

                {/* Tombol */}
                <div className="flex items-center gap-4 pt-4">
                    <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                    <button type="submit" disabled={loading} className="flex-1 rounded-md bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 transition">{loading ? "Menyimpan..." : "Simpan Jadwal"}</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}