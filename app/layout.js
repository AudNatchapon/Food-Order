import "./globals.css";
import Link from "next/link";

// layout.js = กรอบครอบทุกหน้า (คล้าย header.php + footer.php ในโลก PHP)
export const metadata = {
  title: "ระบบสั่งอาหาร — Workshop",
  description: "Next.js + Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <h1 className="site-title">🍜 ระบบสั่งอาหาร</h1>
            {/* เมนูนำทางหลักของแอป */}
            <nav className="nav">
              <Link href="/">หน้าแรก</Link>
              <Link href="/products">สั่งอาหาร</Link>
              <Link href="/purchases">รายการสั่งซื้อ</Link>
              <Link href="/dashboard">แดชบอร์ด</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
