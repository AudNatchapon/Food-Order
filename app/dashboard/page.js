import { getPurchaseSummaryRowsFiltered, getDailyRevenue } from "@/app/lib/orders-storage";
import { supabase } from "@/app/lib/supabaseClient";
import DashboardClient from "./DashboardClient";

// server component — ดึงข้อมูลทั้งหมดแล้วส่งให้ client component
export const dynamic = "force-dynamic"; // ให้ตัวเลขสดเสมอ

export default async function DashboardPage() {
  if (!supabase)
    return (
      <p className="warn">ยังไม่ได้เชื่อม Supabase — ตั้งค่า .env.local ก่อน</p>
    );

  // ดึงข้อมูลทั้งหมดจาก Supabase (ไม่ filter วันที่ที่ server — ปล่อยให้ client กรองเอง)
  const [purchases, dailyRevenue] = await Promise.all([
    getPurchaseSummaryRowsFiltered(),
    getDailyRevenue(),
  ]);

  return <DashboardClient initialData={{ purchases, dailyRevenue }} />;
}
