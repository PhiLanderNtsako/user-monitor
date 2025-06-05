// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "./components/Navigation"; // Client-side logic

export const metadata = {
	title: "Switchboard Monitor",
	description: "Track and view work statuses in real time",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navigation />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
