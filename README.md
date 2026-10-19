# X AI Assistant

เว็บแชต AI ภาษาไทยสำหรับช่วยคิดโพสต์ วางแผนคอนเทนต์ และวิเคราะห์ข้อมูล X ที่ผู้ใช้ส่งให้

## เริ่มใช้งานในเครื่อง

1. ติดตั้ง Node.js รุ่น LTS
2. แตก ZIP แล้วเปิดเทอร์มินัลในโฟลเดอร์โปรเจกต์
3. ติดตั้งแพ็กเกจด้วย `npm install`
4. คัดลอก `.env.local.example` เป็น `.env.local`
5. ใส่ API Key ใหม่ของคุณใน `.env.local` (อย่าแชร์ไฟล์นี้หรืออัปโหลดขึ้น GitHub)
6. รัน `npm run dev` แล้วเปิด `http://localhost:3000`

## Deploy ไป Vercel

1. อัปโหลดไฟล์โปรเจกต์ไป GitHub โดยไม่อัปโหลด `.env.local`
2. ใน Vercel เลือก Add New Project แล้ว Import repository
3. ที่ Project Settings → Environment Variables เพิ่ม:
   - Name: `OPENAI_API_KEY`
   - Value: API Key ใหม่ของคุณ
   - เลือก Environment ที่ต้องการ
4. Deploy หรือ Redeploy โปรเจกต์

## สำคัญ

- API Key ที่เคยส่งในแชตควรถูกเพิกถอน เพราะถือว่าเปิดเผยแล้ว ให้สร้าง key ใหม่
- ห้ามใส่ API Key ใน `app/page.js` หรือไฟล์ที่ส่งไปยังเบราว์เซอร์
- การใช้ OpenAI API อาจมีค่าใช้จ่ายแยกจาก ChatGPT และขึ้นกับบัญชี API
- โปรเจกต์นี้ยังไม่ได้เชื่อมต่อบัญชี X จริง จึงวิเคราะห์ได้เฉพาะข้อมูลที่ผู้ใช้พิมพ์หรือส่งมา
