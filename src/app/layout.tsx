import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PDH Smart Payment", template: "%s | PDH Smart Payment" },
  description: "ระบบบริหารจัดการรับชำระเงิน โรงพยาบาลปลวกแดง",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
