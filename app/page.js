import Link from "next/link";

// หน้าแรก "/" — server component แสดงเมนูนำทาง
export default function Home() {
  return (
    <div>
      <h2 className="page-title">ระบบสั่งอาหาร 🍜</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        ระบบตัวอย่าง: เมนูอาหาร (products) + log การสั่ง (purchases) + แดชบอร์ดสรุปยอด
      </p>
      <div className="panel">
        <h3 className="section-title">ไปที่หน้า</h3>
        <ul className="home-menu">
          <li><Link href="/products">สั่งอาหาร — เลือกเมนูใส่ตะกร้า ระบุโต๊ะ แล้วยืนยันสั่ง</Link></li>
          <li><Link href="/purchases">รายการสั่งซื้อ — log จากทุกโต๊ะ (server component)</Link></li>
          <li><Link href="/dashboard">แดชบอร์ด — ยอดขายรวม เมนูขายดี โต๊ะที่คึกคัก</Link></li>
        </ul>
      </div>
    </div>
  );
}
