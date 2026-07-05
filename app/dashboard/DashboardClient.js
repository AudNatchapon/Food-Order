"use client";

import { useState, useTransition } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────
function fmtBaht(v) {
  return Number(v).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " ฿";
}

const MEDAL = ["🥇", "🥈", "🥉"];
const BAR_COLOR = "#1E3A8A";
const LINE_COLOR = "#38BDF8";
const ACCENT = "#F59E0B";

// ────────────────────────────────────────────────────────────
//  Custom tooltip for Recharts
// ────────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{fmtBaht(payload[0].value)}</p>
    </div>
  );
}

function BestSellerTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} จาน</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Main client component
// ────────────────────────────────────────────────────────────
export default function DashboardClient({ initialData }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo]     = useState(today);

  // All data comes from the server — we do client-side filtering by date
  // so there's no extra network round-trip needed.
  const { purchases: allPurchases, dailyRevenue: allDaily } = initialData;

  // Filter purchases by date range
  const purchases = allPurchases.filter((r) => {
    const day = r.created_at ? r.created_at.slice(0, 10) : "";
    return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
  });

  // Filter daily revenue by date range
  const dailyRevenue = allDaily.filter(
    (d) => (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo)
  );

  // ── KPIs ──
  const totalRevenue = purchases.reduce((s, r) => s + Number(r.total), 0);
  const totalOrders  = purchases.length;
  const avgOrderVal  = totalOrders ? totalRevenue / totalOrders : 0;

  // ── Best sellers ──
  const byMenu = {};
  for (const r of purchases) {
    if (!byMenu[r.product_name])
      byMenu[r.product_name] = { dishes: 0, revenue: 0 };
    byMenu[r.product_name].dishes  += Number(r.quantity);
    byMenu[r.product_name].revenue += Number(r.total);
  }
  const bestSellers = Object.entries(byMenu)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.dishes - a.dishes);

  const top5Chart = bestSellers.slice(0, 5).map((m) => ({
    name: m.name.length > 12 ? m.name.slice(0, 12) + "…" : m.name,
    fullName: m.name,
    จาน: m.dishes,
    ยอดขาย: m.revenue,
  }));

  // ────────────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Title ── */}
      <div className="dash-header">
        <h2 className="page-title" style={{ marginBottom: 0 }}>📊 แดชบอร์ด</h2>
        <p className="muted" style={{ fontSize: "0.85rem" }}>ภาพรวมยอดขายและเมนูยอดนิยม</p>
      </div>

      {/* ── Date Picker ── */}
      <div className="date-filter-bar">
        <span className="date-filter-label">📅 ช่วงวันที่</span>
        <div className="date-filter-inputs">
          <div className="date-field">
            <label htmlFor="dateFrom">ตั้งแต่</label>
            <input
              id="dateFrom"
              type="date"
              className="input date-input"
              value={dateFrom}
              max={dateTo || today}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <span className="date-sep">—</span>
          <div className="date-field">
            <label htmlFor="dateTo">ถึง</label>
            <input
              id="dateTo"
              type="date"
              className="input date-input"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-sm"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stat-grid stat-grid-3">
        <StatCard
          icon="💰"
          label="ยอดขายรวม"
          value={fmtBaht(totalRevenue)}
          accent="#1E3A8A"
        />
        <StatCard
          icon="🧾"
          label="จำนวนรายการสั่ง"
          value={totalOrders.toLocaleString()}
          accent="#059669"
        />
        <StatCard
          icon="📈"
          label="ยอดเฉลี่ยต่อรายการ"
          value={fmtBaht(avgOrderVal)}
          accent="#D97706"
        />
      </div>

      {/* ── Revenue Graph ── */}
      <div className="panel">
        <h3 className="section-title">📉 ยอดขายรายวัน</h3>
        {dailyRevenue.length === 0 ? (
          <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
            ไม่มีข้อมูลในช่วงวันที่เลือก
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyRevenue} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickFormatter={(d) => {
                  const [, m, dd] = d.split("-");
                  return `${dd}/${m}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickFormatter={(v) => v.toLocaleString()}
                width={70}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={LINE_COLOR}
                strokeWidth={2.5}
                dot={{ r: 4, fill: LINE_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="ยอดขาย"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Best Seller: Bar Chart ── */}
      <div className="panel">
        <h3 className="section-title">🏆 กราฟเมนูขายดี (Top 5)</h3>
        {top5Chart.length === 0 ? (
          <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
            ไม่มีข้อมูลในช่วงวันที่เลือก
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5Chart} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                allowDecimals={false}
                width={36}
              />
              <Tooltip content={<BestSellerTooltip />} />
              <Bar dataKey="จาน" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Best Seller: Table ── */}
      <div className="panel">
        <h3 className="section-title">🥇 เมนูขายดี — ตาราง</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>อันดับ</th>
              <th>เมนู</th>
              <th className="td-center">จำนวนจาน</th>
              <th className="td-right">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {bestSellers.map((m, i) => (
              <tr key={m.name} className={i < 3 ? "best-row" : ""}>
                <td className="td-center rank-cell">
                  {i < 3 ? MEDAL[i] : i + 1}
                </td>
                <td>
                  <span className="menu-name-text">{m.name}</span>
                  {i < 3 && <span className="badge-hot">HOT</span>}
                </td>
                <td className="td-center">
                  <div className="dishes-bar-wrap">
                    <span>{m.dishes}</span>
                    <div className="dishes-bar">
                      <div
                        className="dishes-bar-fill"
                        style={{
                          width: `${Math.round((m.dishes / bestSellers[0].dishes) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="td-right revenue-cell">{fmtBaht(m.revenue)}</td>
              </tr>
            ))}
            {bestSellers.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">ยังไม่มีข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon, label, value, accent = "#1E3A8A" }) {
  return (
    <div className="stat-card stat-card-v2" style={{ "--accent": accent }}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value" style={{ color: accent }}>{value}</p>
      </div>
    </div>
  );
}
