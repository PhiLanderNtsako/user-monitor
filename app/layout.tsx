// app/layout.tsx

import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./utils/AuthContext";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Switchboard Monitor",
	description: "Track and view work statuses in real time",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#2563eb" />
				<link rel="apple-touch-icon" href="/icons/icon-192.png" />
			</head>
			<body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
				<AuthProvider>
					<Toaster
						position="top-center"
						reverseOrder={false}
						toastOptions={{
							style: {
								fontSize: "1rem",
								padding: "16px 20px",
								borderRadius: "10px",
								fontWeight: "600",
								boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
							},
							success: {
								style: { background: "#34A853", color: "#fff" },
							},
							error: {
								style: { background: "#EA4335", color: "#fff" },
							},
							loading: {
								style: { background: "#1A73E8", color: "#fff" },
							},
						}}
					/>
					<Navigation />
					<main className="p-6">{children}</main>
				</AuthProvider>
			</body>
		</html>
	);
}
