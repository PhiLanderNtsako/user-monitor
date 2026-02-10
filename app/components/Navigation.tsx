"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../utils/AuthContext";

export default function Navigation() {
	const { sessionUser, logout, token } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	const isAdmin =
		sessionUser?.user_role === "admin" ||
		sessionUser?.user_role === "super" ||
		sessionUser?.user_role === "operator";

	const handleLogout = async () => {
		if (!sessionUser) return;
		try {
			await fetch(
				`https://api.apbco.co.za/switchboard/public/index.php/auth/logout/?userid=${sessionUser.id}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}
			);
		} catch (err) {
			console.error("Logout failed", err);
		} finally {
			logout();
			router.push("/login");
		}
	};

	const isActive = (href: string) => pathname === href;

	return (
		<nav className="bg-white shadow-sm border-b sticky top-0 z-50">
			<div className="max-w-screen-lg mx-auto px-4 py-3 flex justify-between items-center">
				<div className="flex items-center space-x-3">
					<Image
						src="/logo.png"
						alt="Switchboard Logo"
						width={40}
						height={40}
						className="rounded-full"
					/>
					<div>
						<h1 className="text-lg font-bold text-gray-800 leading-tight">
							Switchboard Monitor
						</h1>
						{token && sessionUser && (
							<p className="text-xs text-gray-500">
								<span className="font-medium">
									{sessionUser.name}
								</span>{" "}
								({sessionUser.user_role})
							</p>
						)}
					</div>
				</div>

				{token && sessionUser && (
					<div className="flex items-center space-x-4 text-sm">
						{isAdmin ? (
							<>
								<NavLink
									href="/dashboard/status/"
									isActive={isActive("/dashboard/status")}
								>
									Status
								</NavLink>
								<NavLink
									href="/dashboard"
									isActive={isActive("/dashboard")}
								>
									Dashboard
								</NavLink>
								{sessionUser?.user_role != "operator" && (
									<NavLink
										href="/admin/users"
										isActive={isActive("/admin/users")}
									>
										Users
									</NavLink>
								)}
							</>
						) : (
							<>
								<NavLink
									href={`/user`}
									isActive={isActive(`/user`)}
								>
									Dashboard
								</NavLink>
								<NavLink
									href={`/admin/users/${sessionUser.id}`}
									isActive={isActive(
										`/admin/users/${sessionUser.id}`
									)}
								>
									Profile
								</NavLink>
							</>
						)}

						<button
							onClick={handleLogout}
							className="px-4 py-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md font-medium transition"
						>
							Logout
						</button>
					</div>
				)}
			</div>
		</nav>
	);
}

function NavLink({
	href,
	isActive,
	children,
}: {
	href: string;
	isActive: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className={`px-4 py-1.5 rounded-md font-medium transition ${
				isActive
					? "bg-blue-100 text-blue-700"
					: "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
			}`}
		>
			{children}
		</Link>
	);
}
