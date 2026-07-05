// ไฟล์นี้เตรียมไว้ใช้ "ภาคบ่าย" ตอนเชื่อมฐานข้อมูลจริง
// ภาคเช้ายังไม่ต้องแตะ และยังไม่มีหน้าไหน import ไฟล์นี้
//
// วิธีใช้ (ภาคบ่าย):
// 1. คัดลอก .env.local.example -> .env.local แล้วใส่ค่าจริงจาก Supabase
// 2. import { supabase } from "@/app/lib/supabaseClient";
// 3. เรียก เช่น const { data } = await supabase.from("products").select();

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
