import "./globals.css";

export const metadata = {
  title: "X AI Assistant",
  description: "ผู้ช่วย AI สำหรับสร้างโพสต์และวางแผนคอนเทนต์บน X",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
