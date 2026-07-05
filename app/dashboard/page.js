import { getPurchaseSummaryRows } from "@/app/lib/orders-storage";
import { supabase } from "@/app/lib/supabaseClient";

// server component อ่านอย่างเดียว -> ดึงข้อมูลแล้ว "สรุปด้วย JavaScript"
// (จงใจไม่ใช้ SQL GROUP BY/View เพื่อให้เห็นว่า reduce ใน JS ก็สรุปได้)
// *หน้านี้คือ "เฉลย" ของโจทย์ prompt แดชบอร์ดในภาคบ่าย*
export const dynamic = "force-dynamic"; // ให้ตัวเลขสดเสมอ

export default async function DashboardPage() {
  if (!supabase)
    return <p className="warn">ยังไม่ได้เชื่อม Supabase — ตั้งค่า .env.local ก่อน</p>;

  const purchases = await getPurchaseSummaryRows();

  // ---- สรุปภาพรวม ----
  const totalOrders = purchases.length;
  const totalRevenue = purchases.reduce((s, r) => s + Number(r.total), 0);

  // ---- จัดกลุ่ม "เมนูขายดี" (รวมจำนวนจาน + ยอดต่อเมนู) ----
  const byMenu = {};
  for (const r of purchases) {
    if (!byMenu[r.product_name]) byMenu[r.product_name] = { dishes: 0, revenue: 0 };
    byMenu[r.product_name].dishes += Number(r.quantity);
    byMenu[r.product_name].revenue += Number(r.total);
  }
  const bestSellers = Object.entries(byMenu)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.dishes - a.dishes);

  // ---- จัดกลุ่ม "โต๊ะที่คึกคัก" (ยอดต่อโต๊ะ) ----
  const byTable = {};
  for (const r of purchases) {
    const key = r.table_number;
    if (!byTable[key]) byTable[key] = { orders: 0, revenue: 0 };
    byTable[key].orders += 1;
    byTable[key].revenue += Number(r.total);
  }
  const busyTables = Object.entries(byTable)
    .map(([table, v]) => ({ table: Number(table), ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // เอา 5 อันดับแรก

  return (
    <div>
      <h2 className="page-title">แดชบอร์ด</h2>

      {/* การ์ดสรุป */}
      <div className="stat-grid">
        <StatCard label="ยอดขายรวม" value={`${totalRevenue.toLocaleString()} ฿`} />
        <StatCard label="จำนวนรายการสั่ง" value={totalOrders.toLocaleString()} />
      </div>

      {/* เมนูขายดี */}
      <div className="panel">
        <h3 className="section-title">เมนูขายดี</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>อันดับ</th>
              <th>เมนู</th>
              <th className="td-center">จำนวนจาน</th>
              <th className="td-right">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {bestSellers.map((m, i) => (
              <tr key={m.name}>
                <td>{i + 1}</td>
                <td>{m.name}</td>
                <td className="td-center">{m.dishes}</td>
                <td className="td-right">{m.revenue.toLocaleString()} ฿</td>
              </tr>
            ))}
            {bestSellers.length === 0 && (
              <tr><td colSpan={4} className="empty-row">ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* โต๊ะที่คึกคัก — มิติใหม่จากคอลัมน์ table_number */}
      {/* <div className="panel">
        <h3 className="section-title">โต๊ะที่คึกคัก (5 อันดับตามยอดขาย)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>โต๊ะ</th>
              <th className="td-center">จำนวนรายการ</th>
              <th className="td-right">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {busyTables.map((t) => (
              <tr key={t.table}>
                <td>โต๊ะ {t.table}</td>
                <td className="td-center">{t.orders}</td>
                <td className="td-right">{t.revenue.toLocaleString()} ฿</td>
              </tr>
            ))}
            {busyTables.length === 0 && (
              <tr><td colSpan={3} className="empty-row">ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div> */}
    </div>
  );
}

// การ์ดตัวเลขสรุปแบบง่าย
function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}
