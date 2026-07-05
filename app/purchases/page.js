import { getPurchases } from "@/app/lib/orders-storage";
import { supabase } from "@/app/lib/supabaseClient";

// server component (ไม่มี "use client") เพราะหน้านี้แค่ "อ่านแล้วแสดง"
// ดึงข้อมูลด้วย await ตรง ๆ ได้เลย ไม่ต้องใช้ useState/useEffect
export const dynamic = "force-dynamic"; // ให้ข้อมูลสดเสมอ ไม่ถูก cache

export default async function PurchasesPage() {
  if (!supabase)
    return <p className="warn">ยังไม่ได้เชื่อม Supabase — ตั้งค่า .env.local ก่อน</p>;

  // ดึง log การสั่ง เรียงรายการล่าสุดก่อน
  const purchases = await getPurchases(100);

  return (
    <div>
      <h2 className="page-title">รายการสั่งซื้อ (ล่าสุด 100 รายการ)</h2>
      <p className="muted" style={{ marginBottom: "0.9rem" }}>
        รวมจากทุกโต๊ะ ทุกเครื่องที่เชื่อมฐานข้อมูลเดียวกัน — ลองให้เพื่อนสั่งจากเครื่องของเขา แล้วรีเฟรชหน้านี้
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>เมนู</th>
            <th className="td-center">โต๊ะ</th>
            <th className="td-center">จำนวน</th>
            <th className="td-right">ยอด</th>
            <th>เวลา</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((row) => (
            <tr key={row.id}>
              <td>{row.product_name}</td>
              <td className="td-center">{row.table_number}</td>
              <td className="td-center">{row.quantity}</td>
              <td className="td-right">{Number(row.total).toLocaleString()} ฿</td>
              <td className="td-muted">{new Date(row.created_at).toLocaleString("th-TH")}</td>
            </tr>
          ))}
          {purchases.length === 0 && (
            <tr><td colSpan={5} className="empty-row">ยังไม่มีรายการ</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
