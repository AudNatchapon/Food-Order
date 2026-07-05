// ===== ชั้นข้อมูล (data layer) ของระบบสั่งอาหาร =====
// รวมการอ่าน/เขียน Supabase ทุกอย่างไว้ไฟล์เดียว
// หน้า page ไม่ต้องรู้รายละเอียดตาราง/คิวรี — เรียกผ่านฟังก์ชันพวกนี้พอ
// (pattern เดียวกับที่ใช้ทั้ง workshop: "UI ไม่สนว่าข้อมูลมาจากไหน")
//
// ตารางที่เกี่ยวข้อง (ดู supabase/seed-food-ordering.sql):
//   products  = เมนูอาหาร (id, name, price)
//   purchases = log การสั่ง (product_name, quantity, total, table_number, created_at)
//     * เก็บแบบ denormalize: จดชื่อเมนู+ยอดเป็น snapshot ลงแถวเลย ไม่ผูก FK
//       ข้อดี: อ่านตรง ๆ ไม่ต้อง JOIN และแก้เมนูภายหลังไม่กระทบ log เก่า

import { supabase } from "@/app/lib/supabaseClient";

// ---------- เมนูอาหาร (products) ----------

// ดึงเมนูทั้งหมด เรียงตาม id
export async function getProducts() {
  const { data, error } = await supabase.from("products").select().order("id");
  if (error) throw error;
  return data || [];
}

// เพิ่มเมนูใหม่
export async function addProduct({ name, price }) {
  const { error } = await supabase
    .from("products")
    .insert({ name: name.trim(), price: Number(price) || 0 });
  if (error) throw error;
}

// ลบเมนูตาม id
export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ---------- การสั่งอาหาร (purchases) ----------

// ยืนยันสั่งทั้งตะกร้าในครั้งเดียว
// items = [{ name, price, qty }], tableNumber = 1-12
// จะ insert หลายแถวพร้อมกัน (หนึ่งเมนู = หนึ่งแถว) โดยผูกเลขโต๊ะเดียวกัน
export async function placeOrder(items, tableNumber) {
  const rows = items.map((item) => ({
    product_name: item.name,          // snapshot ชื่อเมนู ณ ตอนสั่ง
    quantity: item.qty,
    total: item.price * item.qty,     // snapshot ยอด = ราคา x จำนวน
    table_number: Number(tableNumber),
  }));
  const { error } = await supabase.from("purchases").insert(rows);
  if (error) throw error;
}

// ดึง log การสั่งล่าสุด (จำกัดจำนวนแถว)
export async function getPurchases(limit = 100) {
  const { data, error } = await supabase
    .from("purchases")
    .select()
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ดึงข้อมูลสำหรับหน้าสรุป (dashboard) — เอาเฉพาะคอลัมน์ที่ใช้จริง
export async function getPurchaseSummaryRows() {
  const { data, error } = await supabase
    .from("purchases")
    .select("product_name, quantity, total, table_number");
  if (error) throw error;
  return data || [];
}
