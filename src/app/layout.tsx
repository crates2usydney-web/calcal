import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "calcal — Meetings, handled",
  description: "Scheduling, reminders and payments for people whose work runs on meetings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
