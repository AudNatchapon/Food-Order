-- =============================================================
-- seed-food-ordering.sql — ตั้งค่าฐานข้อมูลระบบสั่งอาหาร (รันไฟล์เดียวจบ)
-- ใช้กับ Supabase: Dashboard -> SQL Editor -> วางทั้งไฟล์ -> กด Run
-- Supabase = PostgreSQL (SQL ที่เคยใช้กับ MySQL จะคุ้นมือ)
--
-- ได้อะไรบ้าง:
--   1) ตาราง products  = เมนูอาหาร 10 รายการ
--   2) ตาราง purchases = log การสั่ง ~300 รายการ (มีหมายเลขโต๊ะ 1-12)
--   3) RLS policy แบบเปิดกว้างสำหรับห้องเรียน ทั้งสองตาราง
--
-- ออกแบบข้อมูลให้ "มีเรื่องเล่า": บางเมนูขายดีชัดเจน บางโต๊ะคึกคักกว่า
-- เพื่อให้แดชบอร์ดเห็นภาพทันทีที่เปิด
--
-- เก็บ purchases แบบ denormalize (จดชื่อเมนู+ยอดลงแถวเลย ไม่ผูก foreign key)
-- ข้อดีสำหรับห้องเรียน: อ่านตรง ๆ ไม่ต้อง JOIN และลบ/แก้เมนูไม่กระทบ log เก่า
-- =============================================================


-- 0) ลบของเดิม (เผื่อรันซ้ำตอนซ้อม จะได้เริ่มสะอาด)
drop table if exists purchases;
drop table if exists products;


-- 1) ตารางเมนูอาหาร
create table products (
  id         bigint generated always as identity primary key,
  name       text not null,
  price      numeric not null default 0,
  created_at timestamptz default now()
);

-- 2) ตาราง log การสั่ง — เพิ่ม table_number (โต๊ะ 1-12)
create table purchases (
  id           bigint generated always as identity primary key,
  product_name text        not null,          -- ชื่อเมนู (snapshot ตอนสั่ง)
  quantity     int         not null default 1,
  total        numeric     not null default 0, -- ราคา x จำนวน (snapshot)
  table_number int         not null,           -- โต๊ะที่สั่ง (1-12)
  created_at   timestamptz not null default now()
);


-- 3) RLS: เปิดสิทธิ์แบบเปิดกว้าง "เพื่อสาธิตในห้องเรียนเท่านั้น"
--    งานจริงต้องตั้ง Row Level Security ให้รัดกุมกว่านี้
alter table products enable row level security;
create policy "demo allow all" on products
  for all using (true) with check (true);

alter table purchases enable row level security;
create policy "demo allow all" on purchases
  for all using (true) with check (true);


-- 4) เมนูอาหาร 10 รายการ (ชุดเดียวกับที่ใช้สุ่ม log ด้านล่าง)
insert into products (name, price) values
  ('ข้าวกะเพราหมูไข่ดาว', 60),
  ('ข้าวมันไก่',          50),
  ('ผัดไทยกุ้งสด',        65),
  ('ส้มตำไทย',            45),
  ('ก๋วยเตี๋ยวเรือ',      55),
  ('ข้าวผัดกุ้ง',         75),
  ('ต้มยำกุ้งน้ำข้น',    130),
  ('ชาเย็น',              30),
  ('น้ำส้มคั้น',          35),
  ('ข้าวเหนียวมะม่วง',    70);


-- 5) log การสั่ง ~300 รายการ แบบถ่วงน้ำหนักความนิยม + โต๊ะ 1-12
--    วันที่กระจายย้อนหลัง 6 เดือน (ไม่ใช่ 30 วัน) เพื่อให้แดชบอร์ดที่มี
--    DatePicker เลือกช่วงเดือน และกราฟรายได้ต่อเดือน มีข้อมูลจริงให้เห็นหลายแท่ง/หลายเดือน
with menu(name, price, weight) as (
  values
    ('ข้าวกะเพราหมูไข่ดาว', 60, 30),   -- เมนูขายดีอันดับหนึ่ง
    ('ข้าวมันไก่',          50, 22),
    ('ผัดไทยกุ้งสด',        65, 18),
    ('ส้มตำไทย',            45, 17),
    ('ก๋วยเตี๋ยวเรือ',      55, 14),
    ('ข้าวผัดกุ้ง',         75, 12),
    ('ต้มยำกุ้งน้ำข้น',    130,  8),   -- ราคาสูง สั่งน้อย แต่ดันยอดขาย
    ('ชาเย็น',              30, 25),   -- เครื่องดื่มยอดนิยม
    ('น้ำส้มคั้น',          35, 11),
    ('ข้าวเหนียวมะม่วง',    70,  9)
),
-- ขยายเมนูตามน้ำหนัก: เมนูยอดนิยมมีหลายแถวใน "สระ" (pool) ให้สุ่มหยิบ
menu_pool as (
  select name, price, row_number() over () as rn
  from menu, generate_series(1, menu.weight)
),
menu_pool_size as ( select count(*)::int as n from menu_pool ),
-- โต๊ะ 1-12 ถ่วงน้ำหนักเช่นกัน: โต๊ะโซนหน้าร้าน (1-4) คึกคักกว่า
tables(table_number, weight) as (
  values (1, 16), (2, 14), (3, 13), (4, 12),
         (5,  9), (6,  8), (7,  7), (8,  6),
         (9,  5), (10, 4), (11, 3), (12, 3)
),
table_pool as (
  select table_number, row_number() over () as rn
  from tables, generate_series(1, tables.weight)
),
table_pool_size as ( select count(*)::int as n from table_pool ),
-- สร้าง 300 ออเดอร์: สุ่มเมนู + สุ่มโต๊ะ + สุ่มจำนวน 1-3 + สุ่มเวลาใน 6 เดือนล่าสุด
orders as (
  select
    (floor(random() * (select n from menu_pool_size)) + 1)::int  as menu_pick,
    (floor(random() * (select n from table_pool_size)) + 1)::int as table_pick,
    (floor(random() * 3) + 1)::int                               as quantity,
    (now() - (random() * interval '6 months'))                   as created_at
  from generate_series(1, 300)
)
insert into purchases (product_name, quantity, total, table_number, created_at)
select m.name, o.quantity, m.price * o.quantity, t.table_number, o.created_at
from orders o
join menu_pool  m on m.rn = o.menu_pick
join table_pool t on t.rn = o.table_pick;


-- 6) ตรวจผล: ควรได้ products 10 แถว และ purchases 300 แถว
select 'products' as table_name, count(*) from products
union all
select 'purchases', count(*) from purchases;


-- =============================================================
-- คิวรีพรีวิว "คาแรคเตอร์ข้อมูล" — คัดลอกไปรันทีละอันใน SQL Editor
-- (คอมเมนต์ไว้ เพื่อให้การรันไฟล์หลักจบด้วยผลตรวจข้อ 6 ชุดเดียว)
-- =============================================================

-- เมนูขายดี (เรียงตามจำนวนจาน) -> ใช้ตรวจกับตาราง "เมนูขายดี" บนแดชบอร์ด
-- select product_name,
--        count(*)      as orders,
--        sum(quantity) as dishes,
--        sum(total)    as revenue
-- from purchases
-- group by product_name
-- order by dishes desc;

-- ภาพรวมร้าน -> ใช้ตรวจกับการ์ดสรุป
-- select count(*) as total_orders,
--        sum(total) as total_revenue,
--        round(avg(total), 2) as avg_per_order
-- from purchases;

-- ยอดต่อโต๊ะ -> ใช้ตรวจกับตาราง "โต๊ะที่คึกคัก"
-- select table_number,
--        count(*)   as orders,
--        sum(total) as revenue
-- from purchases
-- group by table_number
-- order by revenue desc;

-- ยอดขายรายวัน -> ต่อยอดเป็นกราฟภายหลังได้
-- select date(created_at) as day,
--        count(*) as orders,
--        sum(total) as revenue
-- from purchases
-- group by day
-- order by day;
