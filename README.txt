SZ — เว็บไซต์ระบบเงินทดลอง (Supabase)

ไฟล์:
- index.html
- style.css
- app.js
- supabase.sql

ตั้งค่า:
1. เปิด Supabase project เดิมของคุณ
2. ไป SQL Editor > New query
3. คัดลอก supabase.sql ทั้งหมดไป Run
4. ไป Authentication > Providers > Email
   - สำหรับเดโม ปิด Confirm email ได้ถ้าต้องการเข้าสู่ระบบทันที
   - หมายเหตุ: เว็บนี้ใช้เบอร์โทรศัพท์เป็นตัวระบุชื่อผู้ใช้ผ่านอีเมลจำลอง u{เบอร์}@sz-demo.invalid
5. ไป Database > Publications แล้วเปิด Realtime สำหรับ profiles, transactions, withdrawals
6. อัปโหลด index.html, style.css, app.js ไป GitHub Pages / Netlify / Vercel (เว็บ static ใช้ได้)
7. อย่าใส่ service_role/secret key ใน app.js ใช้เฉพาะ publishable key เท่านั้น

เปิดสิทธิ์แอดมิน:
1. สมัครสมาชิกผ่านเว็บด้วยบัญชีที่คุณควบคุม
2. ไป Supabase SQL Editor แล้วรัน:
   UPDATE public.profiles SET is_admin = true WHERE username = 'ชื่อผู้ใช้ของคุณ';
3. ออกจากระบบแล้วเข้าสู่ระบบใหม่

ข้อจำกัด/ความปลอดภัย:
- เงิน/ยอดถอนทั้งหมดเป็นตัวเลขจำลอง ไม่มีการโอนเงินจริง
- รหัสผ่านจัดการโดย Supabase Auth ไม่เก็บ plaintext
- RPC ฝั่งฐานข้อมูลเป็นผู้ตัดสิทธิ์หมุนและสร้างคำขอถอนเพื่อป้องกันการใช้ซ้ำข้ามอุปกรณ์
- ห้ามใช้ข้อมูลลับ service_role key ในเว็บ
- ควรทดสอบในโปรเจกต์แยกก่อนใช้กับข้อมูลจริง
- ระบบสมัครใช้เบอร์โทรศัพท์เป็น unique ใน profiles; ถ้าการสมัครล้มเหลวจาก trigger ให้ตรวจ logs ใน Supabase.
- ถ้าโปรเจกต์มีตาราง/policies เดิมชื่อเดียวกัน ให้ตรวจสอบก่อนรัน SQL.
