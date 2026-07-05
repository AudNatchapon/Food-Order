# ระบบสั่งอาหาร — Next.js + Supabase (Workshop ภาคบ่าย)

ระบบตัวอย่างสำหรับสอนโครงสร้าง Next.js (App Router) และการเชื่อมฐานข้อมูลจริง
**สั่งอาหาร**: เลือกเมนูใส่ตะกร้า → ระบุโต๊ะ (1–12) → ยืนยันสั่ง → ดู log และแดชบอร์ด

เทคโนโลยี: **Next.js 14 (App Router) · React 18 · CSS ธรรมดา · Supabase**

---

## ✅ สิ่งที่ต้องมีก่อน
- Node.js เวอร์ชัน 18.17 ขึ้นไป (ตรวจด้วย `node -v`)
- บัญชี GitHub, Supabase, Vercel
- VS Code + GitHub Copilot

---

## 🚀 วิธีรัน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — ก่อนตั้งค่า Supabase ทุกหน้าจะขึ้นข้อความเตือนสีแดง เป็นเรื่องปกติ

### 1) ขึ้นฐานข้อมูล (Supabase)
1. สร้าง project ใน Supabase
2. ไปที่ **SQL Editor** → วางเนื้อหาทั้งไฟล์ `supabase/seed-food-ordering.sql` → กด **Run**
3. ผลลัพธ์ท้ายสคริปต์ต้องเห็น `products = 10` และ `purchases = 300`
4. ดูข้อมูลได้ที่ **Table Editor** (คล้าย phpMyAdmin)

### 2) ตั้งค่าการเชื่อมต่อ
```bash
cp .env.local.example .env.local
```
ใส่ค่าจริงจาก Supabase (**Settings → API** ใช้ anon/public key เท่านั้น):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
แล้ว **รีสตาร์ท** `npm run dev` ทุกครั้งหลังแก้ไฟล์ env

---

## 🎯 จุดที่อยากให้สังเกต

| เรื่อง | อยู่ที่ไหน | ทำไมออกแบบแบบนี้ |
|---|---|---|
| ชั้นข้อมูล (data layer) | `app/lib/orders-storage.js` | รวมการเรียก Supabase ทุกอย่างไว้ไฟล์เดียว หน้า page เรียกผ่านฟังก์ชัน — "UI ไม่สนว่าข้อมูลมาจากไหน" |
| client component | `app/products/page.js` | หน้า "สั่งอาหาร" มีตะกร้า (useState) และปุ่มโต้ตอบ จึงต้องเป็น client |
| server component | `app/purchases/page.js`, `app/dashboard/page.js` | อ่านแล้วแสดงอย่างเดียว จึง `await` ตรง ๆ ได้เลย ไม่ต้อง useEffect + ใช้ `force-dynamic` ให้ข้อมูลสดเสมอ |
| denormalize | ตาราง `purchases` | จดชื่อเมนู+ยอดเป็น snapshot ลงแถวเลย ไม่ผูก foreign key → อ่านไม่ต้อง JOIN, แก้เมนูไม่กระทบ log เก่า |
| สรุปข้อมูลด้วย JS | `app/dashboard/page.js` | ใช้ `reduce`/จัดกลุ่มใน JavaScript แทน SQL GROUP BY — ไม่ต้องสอน SQL View กลางคาบ |
| หมายเลขโต๊ะ | คอลัมน์ `table_number` (1–12) | หนึ่งคน "ประจำ" หนึ่งโต๊ะ ตอนทดสอบ → เปิด `/purchases` เห็นออเดอร์ของเพื่อนโต๊ะอื่นไหลเข้ามา = พิสูจน์ฐานข้อมูลกลาง |

## โครงสร้างไฟล์
```
app/
 ├─ layout.js              กรอบครอบทุกหน้า (เหมือน header+footer ใน PHP)
 ├─ page.js                หน้าแรก "/"
 ├─ globals.css            สไตล์รวม (CSS ธรรมดา)
 ├─ products/page.js       สั่งอาหาร: การ์ดเมนู + ตะกร้า + เลือกโต๊ะ + จัดการเมนู (client)
 ├─ purchases/page.js      log การสั่งจากทุกโต๊ะ (server + force-dynamic)
 ├─ dashboard/page.js      แดชบอร์ด: ยอดรวม เมนูขายดี โต๊ะคึกคัก (เฉลยโจทย์ prompt)
 └─ lib/
     ├─ supabaseClient.js  สร้าง Supabase client จาก .env.local
     └─ orders-storage.js  ชั้นข้อมูล: getProducts / placeOrder / getPurchases ...
supabase/
 └─ seed-food-ordering.sql สร้าง 2 ตาราง + RLS + seed 300 รายการ (รันไฟล์เดียวจบ)
```

## ☁️ Deploy ขึ้น Vercel
1. commit + push ขึ้น GitHub (`.env.local` ไม่ถูก push เพราะอยู่ใน `.gitignore`)
2. Vercel → **Add New → Project → Import** repo
3. ใส่ **Environment Variables** (URL + anon key) ให้ตรงกับ `.env.local`
4. กด **Deploy** — ถ้า deploy ไปก่อนใส่ env ต้อง **Redeploy** ซ้ำ เพราะค่า `NEXT_PUBLIC_` ฝังตอน build

## 🔧 ปัญหาที่พบบ่อย
| อาการ | ทางแก้ |
|---|---|
| `useState is not defined` | ไฟล์นั้นต้องมี `"use client"` บรรทัดบนสุด |
| ข้อมูล Supabase เป็น null / ว่าง | `.env.local` ผิด, ลืมรีสตาร์ท `npm run dev` หรือ RLS ไม่มี policy (seed ใส่ให้แล้ว) |
| `Module not found` | ลืม `npm install` |
| Deploy แล้วข้อมูลไม่ขึ้น | ลืมใส่ Environment Variables ใน Vercel แล้ว Redeploy |
