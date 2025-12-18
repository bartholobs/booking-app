import { createClient } from '@supabase/supabase-js'

// 1. Ambil URL dan Key dari file .env.local yang baru kamu buat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 2. Cek apakah kuncinya ada? (Buat jaga-jaga kalau lupa)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('⚠️ Kunci Supabase Hilang! Pastikan file .env.local sudah diisi dengan benar.')
}

// 3. Bikin dan Export koneksi biar bisa dipake file lain
export const supabase = createClient(supabaseUrl, supabaseAnonKey)