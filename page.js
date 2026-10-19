"use client";

import { useRef, useState } from "react";

const starters = [
  "ช่วยคิดโพสต์ให้คนอยากตอบกลับ",
  "วางแผนคอนเทนต์ X เป็นเวลา 7 วัน",
  "ช่วยเขียนเธรดให้ความรู้ 5 โพสต์",
  "วิเคราะห์ยอดวิวกับไลก์จากข้อมูลที่ฉันส่งให้",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setMessages(nextMessages);
      setError(e.message || "เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">𝕏</span><span>X AI <b>ASSISTANT</b></span></div>
        <button className="new-chat" onClick={() => { setMessages([]); setError(""); }}>＋ แชตใหม่</button>
        <div className="side-label">เครื่องมือของคุณ</div>
        <div className="side-item active">✦ ผู้ช่วย X AI</div>
        <div className="side-item">↗ ไอเดียคอนเทนต์</div>
        <div className="side-item">▤ วิเคราะห์โพสต์</div>
        <div className="sidebar-bottom">
          <div className="status-dot" /> พร้อมช่วยคิดคอนเทนต์
          <p>เวอร์ชันเริ่มต้น · ยังไม่เชื่อมบัญชี X โดยตรง</p>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div><div className="eyebrow">YOUR X GROWTH PARTNER</div><h1>ผู้ช่วยของคุณ <span>✦</span></h1></div>
          <div className="model-pill"><span /> AI Assistant</div>
        </header>

        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="hero-icon">𝕏</div>
              <div className="eyebrow">คิดให้คม · เขียนให้น่าอ่าน</div>
              <h2>วันนี้อยากทำให้ <span>X ของคุณ</span><br />ดีขึ้นด้านไหน?</h2>
              <p className="welcome-copy">ช่วยคิดโพสต์ วางแผนคอนเทนต์ และอ่านผลลัพธ์จากตัวเลขที่คุณส่งมา</p>
              <div className="starter-grid">
                {starters.map((item) => <button key={item} onClick={() => sendMessage(item)}>{item}<span>↗</span></button>)}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((m, i) => (
                <div className={`message-row ${m.role}`} key={i}>
                  <div className="avatar">{m.role === "assistant" ? "✦" : "คุณ"}</div>
                  <div className="bubble"><div className="message-label">{m.role === "assistant" ? "X AI ASSISTANT" : "คุณ"}</div><div className="message-text">{m.content}</div></div>
                </div>
              ))}
              {loading && <div className="message-row assistant"><div className="avatar">✦</div><div className="bubble"><div className="message-label">X AI ASSISTANT</div><div className="typing"><i /><i /><i /> กำลังคิดคำตอบ...</div></div></div>}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <div className="error-box">{error}</div>}
          <form className="composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="ถามเกี่ยวกับการทำคอนเทนต์บน X..." rows={1} maxLength={5000} />
            <div className="composer-bottom"><span>Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</span><button type="submit" disabled={loading || !input.trim()} aria-label="ส่งข้อความ">↑</button></div>
          </form>
          <p className="disclaimer">AI อาจให้ข้อมูลคลาดเคลื่อน · อย่าส่งรหัสผ่านหรือ API Key ลงในแชต</p>
        </div>
      </section>
    </main>
  );
}
