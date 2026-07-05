"use client";
// หน้า "สั่งอาหาร" — client component เพราะมีตะกร้า (state) และปุ่มกดโต้ตอบ
//
// ขั้นตอนการใช้: กด + ใส่เมนูลงตะกร้า -> เลือกหมายเลขโต๊ะ -> กด "ยืนยันสั่ง"
// การยืนยันหนึ่งครั้ง = insert ลง purchases หลายแถว (หนึ่งเมนูหนึ่งแถว) ผูกโต๊ะเดียวกัน
//
// ด้านล่างมีส่วน "จัดการเมนู" (เพิ่ม/ลบ) แยกไว้ต่างหาก

import { useState, useEffect } from "react";
import {
  getProducts, addProduct, deleteProduct, placeOrder,
} from "@/app/lib/orders-storage";
import { supabase } from "@/app/lib/supabaseClient";

// ร้านมีโต๊ะ 1-12
const TABLE_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function OrderPage() {
  const [menu, setMenu] = useState([]);       // เมนูจากตาราง products
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});       // ตะกร้า: { [id]: จำนวน }
  const [tableNumber, setTableNumber] = useState("");
  const [flash, setFlash] = useState("");

  // ฟอร์มจัดการเมนู
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  async function loadMenu() {
    const data = await getProducts();
    setMenu(data);
    setLoading(false);
  }
  useEffect(() => { if (supabase) loadMenu(); else setLoading(false); }, []);

  // ---------- ตะกร้า ----------
  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function removeFromCart(id) {
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }

  // รายการในตะกร้า (ผูกข้อมูลเมนูเข้ากับจำนวน)
  const cartItems = menu
    .filter((m) => cart[m.id])
    .map((m) => ({ ...m, qty: cart[m.id] }));
  const cartTotal = cartItems.reduce((s, it) => s + it.price * it.qty, 0);
  const cartCount = cartItems.reduce((s, it) => s + it.qty, 0);

  // ---------- ยืนยันสั่ง ----------
  async function confirmOrder() {
    if (cartItems.length === 0 || !tableNumber) return;
    await placeOrder(cartItems, tableNumber);
    setFlash(`สั่งอาหาร ${cartCount} จาน ให้โต๊ะ ${tableNumber} เรียบร้อย ✓`);
    setCart({});                       // ล้างตะกร้า
    setTimeout(() => setFlash(""), 2500);
  }

  // ---------- จัดการเมนู ----------
  async function handleAddMenu() {
    if (!name.trim()) return;
    await addProduct({ name, price });
    setName(""); setPrice("");
    loadMenu();
  }
  async function handleDeleteMenu(id) {
    await deleteProduct(id);
    loadMenu();
  }

  if (!supabase)
    return <p className="warn">ยังไม่ได้เชื่อม Supabase — ตั้งค่า .env.local ก่อน แล้วรีสตาร์ท npm run dev</p>;

  return (
    <div>
      <h2 className="page-title">สั่งอาหาร</h2>

      {flash && <p className="flash">{flash}</p>}
      {loading && <p className="muted">กำลังโหลดเมนู...</p>}

      {/* ===== การ์ดเมนู + ปุ่มใส่ตะกร้า ===== */}
      {!loading && (
        <div className="menu-grid">
          {menu.map((item) => (
            <article key={item.id} className="menu-card">
              <div className="menu-name">{item.name}</div>
              <div className="menu-price">{Number(item.price).toLocaleString()} ฿</div>
              <div className="menu-actions">
                <button className="btn-qty" onClick={() => removeFromCart(item.id)}>−</button>
                <span className="qty-in-cart">{cart[item.id] || 0}</span>
                <button className="btn-qty" onClick={() => addToCart(item.id)}>+</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ===== แถบตะกร้า: สรุป + เลือกโต๊ะ + ยืนยัน ===== */}
      <div className="cart-bar">
        <div className="cart-info">
          {cartCount === 0
            ? "ตะกร้าว่าง — กด + เพื่อเลือกเมนู"
            : <>ตะกร้า {cartCount} จาน · รวม <span className="cart-total">{cartTotal.toLocaleString()} ฿</span></>}
        </div>
        <select
          className="select"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
        >
          <option value="">เลือกโต๊ะ...</option>
          {TABLE_NUMBERS.map((n) => (
            <option key={n} value={n}>โต๊ะ {n}</option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={confirmOrder}
          disabled={cartItems.length === 0 || !tableNumber}
        >
          ยืนยันสั่ง
        </button>
      </div>

      {/* ===== ส่วนจัดการเมนู (เพิ่ม/ลบ) ===== */}
      <div className="panel" style={{ marginTop: "1.6rem" }}>
        <h3 className="section-title">จัดการเมนู</h3>
        <div className="form-row" style={{ marginBottom: "0.9rem" }}>
          <input
            className="input"
            placeholder="ชื่อเมนู เช่น ข้าวผัดปู"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="ราคา"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: "110px" }}
          />
          <button className="btn btn-primary" onClick={handleAddMenu}>เพิ่มเมนู</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>เมนู</th>
              <th className="td-right">ราคา</th>
              <th className="td-center">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {menu.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="td-right">{Number(item.price).toLocaleString()} ฿</td>
                <td className="td-center">
                  <button className="btn btn-danger" onClick={() => handleDeleteMenu(item.id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {menu.length === 0 && !loading && (
              <tr><td colSpan={3} className="empty-row">ยังไม่มีเมนู — รัน seed SQL ก่อน หรือเพิ่มจากฟอร์มด้านบน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
