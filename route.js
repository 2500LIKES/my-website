import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน Environment Variables" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "พิมพ์ข้อความก่อนนะ" }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "ข้อความยาวเกินไป (สูงสุด 5,000 ตัวอักษร)" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const safeHistory = history
      .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
      .slice(-10)
      .map((item) => ({ role: item.role, content: item.content.slice(0, 3000) }));

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `คุณคือ X AI Assistant ผู้ช่วยภาษาไทยที่เชี่ยวชาญเฉพาะการใช้งานแพลตฟอร์ม X (Twitter)
ช่วยผู้ใช้คิดโพสต์ เขียนเธรด ปรับข้อความให้น่าอ่าน วางแผนคอนเทนต์ ตอบคอมเมนต์ และวิเคราะห์ตัวเลขที่ผู้ใช้ส่งมา
ถ้าผู้ใช้ขอวิเคราะห์ยอดวิวหรือผู้ติดตาม ให้บอกตามข้อมูลที่มี ห้ามแต่งตัวเลขหรืออ้างว่าเข้าถึงบัญชี X ได้เอง
คุณไม่ได้เชื่อมต่อบัญชี X โดยอัตโนมัติ และห้ามอ้างว่าดูข้อมูลสดหรือโพสต์แทนผู้ใช้ได้ หากยังไม่มีการเชื่อมต่อ API จริง
ไม่ช่วยสแปม ปั่นยอด ปลอมผู้ติดตาม หลอกลวง หรือเข้าถึงบัญชีคนอื่น
ตอบเป็นภาษาไทย กระชับ เป็นกันเอง และจัดรูปแบบให้อ่านง่าย`,
      input: [
        ...safeHistory,
        { role: "user", content: message }
      ],
      max_output_tokens: 900
    });

    return NextResponse.json({ reply: response.output_text || "ขอโทษนะ ตอนนี้ยังสร้างคำตอบไม่ได้ ลองใหม่อีกครั้ง" });
  } catch (error) {
    console.error("X AI chat error:", error?.message || error);
    return NextResponse.json(
      { error: "ระบบตอบกลับไม่สำเร็จ ตรวจสอบ API Key และสถานะการใช้งาน API แล้วลองใหม่" },
      { status: 500 }
    );
  }
}
