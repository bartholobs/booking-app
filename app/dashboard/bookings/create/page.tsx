"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient"; // Mundur 4 folder

export default function CreateBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Data Master (Untuk Dropdown)
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Form Input
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [studentId, setStudentId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [topic, setTopic] = useState("");

  // 1. Ambil Data Master saat Halaman Dibuka
  useEffect(() => {
    const fetchMasterData = async () => {
      // Kita panggil 3 tabel sekaligus biar cepat (Parallel Fetching)
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
  }, []);

  // 2. Fungsi Simpan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validasi
    if (!date || !time || !studentId || !instructorId || !locationId) {
        alert("Semua data wajib diisi!");
        setLoading(false);
        return;
    }

    // Insert ke Database
    const { error } = await supabase.from("bookings").insert([
      {
        date,
        time,
        student_id: parseInt(studentId),
        instructor_id: parseInt(instructorId),
        location_id: parseInt(locationId),
        topic,
        status: "scheduled",
      },
    ]);

    if (error) {
      alert("Gagal simpan: " + error.message);
      setLoading(false);
    } else {
      // Sukses! Balik ke halaman list jadwal
      router.push("/dashboard/bookings");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buat Jadwal Baru</h1>
            <p className="text-sm text-gray-500">Isi form di bawah ini untuk menjadwalkan kelas</p>
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

                {/* Baris 2: Murid (Dropdown) */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Pilih Murid</label>
                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none bg-white" required>
                        <option value="">-- Cari Murid --</option>
                        {students.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
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
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Topik / Catatan (Opsional)</label>
                    <textarea 
                        value={topic} onChange={(e) => setTopic(e.target.value)} 
                        rows={3}
                        className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 outline-none"
                        placeholder="Contoh: Matematika Bab 3..."
                    ></textarea>
                </div>

                {/* Tombol Aksi */}
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