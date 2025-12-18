"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function EditBookingPage() {
  const router = useRouter();
  const { id } = useParams(); // Ambil ID dari URL
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Kurikulum
  const [activePackage, setActivePackage] = useState<any>(null);
  const [curriculumList, setCurriculumList] = useState<any[]>([]);

  // 1. Ambil Data Master & Data Booking Lama
  useEffect(() => {
    const initData = async () => {
      // A. Ambil Data Master Dropdown
      const [resStudent, resInstructor, resLocation] = await Promise.all([
        supabase.from("students").select("id, name").eq("status", "active").order("name"),
        supabase.from("instructors").select("id, name").order("name"),
        supabase.from("locations").select("id, name, duration").order("name"),
      ]);

      if (resStudent.data) setStudents(resStudent.data);
      if (resInstructor.data) setInstructors(resInstructor.data);
      if (resLocation.data) setLocations(resLocation.data);

      // B. Ambil Data Booking Lama
      const { data: oldData, error } = await supabase
        .from("bookings")
        .select(`
            *,
            student:students (name)
        `)
        .eq("id", id)
        .single();

      if (error || !oldData) {
        alert("Data tidak ditemukan!");
        router.push("/dashboard/bookings");
        return;
      }

      // C. Isi Form dengan Data Lama
      setDate(oldData.date);
      setTime(oldData.time);
      setInstructorId(oldData.instructor_id);
      setLocationId(oldData.location_id);
      setTopic(oldData.topic || "");
      
      // Isi Data Murid & Trigger Cek Kurikulum
      setStudentId(oldData.student_id);
      setStudentSearch(oldData.student?.name || "");
      
      setLoading(false);
    };

    initData();
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, router]);

  // 2. Cek Paket Murid (Sama kayak Create)
  useEffect(() => {
    const checkStudentPackage = async () => {
      if (!studentId) return;

      const { data: sData } = await supabase
        .from("students")
        .select(`package_id, package:packages (name, total_sessions)`)
        .eq("id", studentId)
        .single();

      if (sData?.package_id) {
        setActivePackage(sData.package);
        const { data: cData } = await supabase
          .from("curriculum")
          .select(`sort_order, material:materials (name, code)`)
          .eq("package_id", sData.package_id)
          .order("sort_order");
        setCurriculumList(cData || []);
      } else {
        setActivePackage(null);
        setCurriculumList([]);
      }
    };

    if (studentId) checkStudentPackage();
  }, [studentId]);

  // Helper
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectStudent = (id: string, name: string) => {
    setStudentId(id);
    setStudentSearch(name);
    setIsDropdownOpen(false);
  };

  // 3. Update Data (Action)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        date, time,
        student_id: parseInt(studentId),
        instructor_id: parseInt(instructorId),
        location_id: parseInt(locationId),
        topic
      })
      .eq("id", id); // Kunci update: WHERE id = ...

    if (error) {
      alert("Gagal update: " + error.message);
      setSaving(false);
    } else {
      router.push("/dashboard/bookings");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">Edit Jadwal</h1></div>

        <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200">
            <form onSubmit={handleUpdate} className="space-y-6">
                
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
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Murid</label>
                    <input 
                        type="text" value={studentSearch} placeholder="Ketik nama murid..."
                        onChange={(e) => { setStudentSearch(e.target.value); setStudentId(""); setIsDropdownOpen(true); }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className={`w-full rounded-md border p-2.5 outline-none ${studentId ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                            {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => (
                                <div key={s.id} onClick={() => handleSelectStudent(s.id, s.name)} className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50">
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Kurikulum (Opsional Tampil) */}
                {activePackage && (
                    <div className="rounded-md bg-blue-50 p-4 border border-blue-100 text-xs text-blue-800">
                        <strong>Paket: {activePackage.name}</strong>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {curriculumList.map((item, idx) => (
                                <button key={idx} type="button" onClick={() => setTopic(`${item.material.code} - ${item.material.name}`)} className="bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition">
                                    {item.material.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instruktur & Lokasi */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Instruktur</label>
                        <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 outline-none bg-white" required>
                            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Lokasi</label>
                        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2.5 outline-none bg-white" required>
                            {locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.duration} mnt)</option>)}
                        </select>
                    </div>
                </div>

                {/* Topik */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Topik / Catatan</label>
                    <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-blue-500"></textarea>
                </div>

                {/* Tombol */}
                <div className="flex items-center gap-4 pt-4">
                    <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                    <button type="submit" disabled={saving} className="flex-1 rounded-md bg-green-600 px-6 py-2.5 font-bold text-white hover:bg-green-700 transition disabled:bg-gray-400">
                        {saving ? "Menyimpan..." : "Update Jadwal"}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}