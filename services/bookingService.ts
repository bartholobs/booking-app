import { supabase } from "../lib/supabaseClient"; 
// ⚠️ Pastikan path import supabase ini sesuai dengan struktur folder kamu ya.
// Kalau pake alias, bisa jadi: import { supabase } from "@/lib/supabaseClient";

// 1. Ambil Data Master (Siswa, Guru, Lokasi, Kurikulum)
export const fetchMasterDataService = async () => {
  const [resStudent, resInstructor, resLocation, resCurr] = await Promise.all([
    supabase.from("students").select("id, name, package_id, package:packages(code)").eq("status", "active").order("name"),
    supabase.from("instructors").select("id, nickname, name").order("name"),
    supabase.from("locations").select("id, name, duration").order("name"),
    supabase.from("curriculum").select(`package_id, sort_order, material:materials (name, code, session_count)`).order("sort_order")
  ]);

  return {
    students: resStudent.data || [],
    instructors: resInstructor.data || [],
    locations: resLocation.data || [],
    curriculum: resCurr.data || []
  };
};

// 2. Ambil Booking berdasarkan Range Tanggal
export const fetchBookingsService = async (startDate: string, endDate: string) => {
  return await supabase
    .from("bookings")
    .select(`
      id, date, time, status, topic, student_id, instructor_id, location_id,
      student:students (name, package_id, package:packages (code, name)),
      instructor:instructors (nickname, name), 
      location:locations (name)
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
};

// 3. Create Booking Baru (Bulk Insert)
export const createBookingService = async (payload: any[]) => {
  return await supabase.from("bookings").insert(payload);
};

// 4. Update Booking
export const updateBookingService = async (id: number, payload: any) => {
  return await supabase.from("bookings").update(payload).eq("id", id);
};

// 5. Update Status Booking (Hadir/Cancel)
export const updateBookingStatusService = async (id: number, status: string) => {
  return await supabase.from("bookings").update({ status }).eq("id", id);
};

// 6. Delete Booking
export const deleteBookingService = async (id: number) => {
  return await supabase.from("bookings").delete().eq("id", id);
};