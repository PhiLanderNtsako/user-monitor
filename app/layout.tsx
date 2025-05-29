// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Work Status App",
  description: "Track and view work statuses in real time",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-white shadow-md p-4 flex justify-between">
          <div className="font-bold text-lg">Switchboard Monitor</div>
          <div className="space-x-4">
            <Link href="/user" className="hover:underline">
              User
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
