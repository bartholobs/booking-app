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

  // State Form Standard
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [topic, setTopic] = useState("");

  // --- LOGIKA PENCARIAN MURID (AUTOCOMPLETE) ---
  const [studentId, setStudentId] = useState(""); // ID yang akan disimpan
  const [studentSearch, setStudentSearch] = useState(""); // Teks yang diketik admin
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Buka/Tutup list
  const dropdownRef = useRef<HTMLDivElement>(null); // Buat deteksi klik di luar

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

    // Event listener: Kalau klik di luar dropdown, tutup dropdown-nya
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi tutup dropdown kalau klik di luar area
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  // Filter murid berdasarkan ketikan
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Saat murid dipilih dari list
  const handleSelectStudent = (id: string, name: string) => {
    setStudentId(id);
    setStudentSearch(name); // Isi kotak input dengan nama lengkap
    setIsDropdownOpen(false); // Tutup list
  };

  // 2. Fungsi Simpan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!date || !time || !studentId || !instructorId || !locationId) {
        alert("Semua data wajib diisi (termasuk Murid)!");
        setLoading(false);
        return;
    }

    const { error } = await supabase.from("bookings").insert([{
        date,
        time,
        student_id: parseInt(studentId),
        instructor_id: parseInt(instructorId),
        location_id: parseInt(locationId),
        topic,
        status: "scheduled",
    }]);

    if (error) {
      alert("Gagal simpan: " + error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/bookings");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buat Jadwal Baru</h1>
            <p className="text-sm text-gray-500">Sistem Booking Pintar</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Baris 1: Tanggal & Jam */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Tanggal Kelas</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Jam Mulai</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none" required />
                    </div>
                </div>

                {/* Baris 2: Murid (SEARCHABLE DROPDOWN) */}
                <div className="relative" ref={dropdownRef}>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Pilih Murid (Ketik untuk mencari)</label>
                    
                    {/* Input Pencarian */}
                    <input 
                        type="text"
                        value={studentSearch}
                        onChange={(e) => {
                            setStudentSearch(e.target.value);
                            setStudentId(""); // Reset ID kalau user ngetik ulang (biar gak salah orang)
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Ketik nama murid..."
                        className={`w-full rounded-md border p-2.5 outline-none ${studentId ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    
                    {/* Status Terpilih (Visual Feedback) */}
                    {studentId && <div className="absolute right-3 top-9 text-green-600 text-xs font-bold">✓ Terpilih</div>}

                    {/* List Hasil Pencarian */}
                    {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((s) => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => handleSelectStudent(s.id, s.name)}
                                        className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                                    >
                                        {s.name}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500 italic">Murid tidak ditemukan...</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Baris 3: Instruktur & Lokasi */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Pilih Instruktur</label>
                        <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none bg-white" required>
                            <option value="">-- Pilih Guru --</option>
                            {instructors.map((i) => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Pilih Lokasi</label>
                        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none bg-white" required>
                            <option value="">-- Pilih Ruangan --</option>
                            {locations.map((l) => (
                                <option key={l.id} value={l.id}>{l.name} ({l.duration} mnt)</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Baris 4: Topik */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Topik / Catatan</label>
                    <textarea 
                        value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
                        className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none"
                        placeholder="Materi yang akan dipelajari..."
                    ></textarea>
                </div>

                {/* Tombol */}
                <div className="flex items-center gap-4 pt-4">
                    <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition">
                        Batal
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 rounded-md bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 transition disabled:bg-gray-400">
                        {loading ? "Menyimpan..." : "Simpan Jadwal"}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}