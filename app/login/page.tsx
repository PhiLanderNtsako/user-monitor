"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../utils/AuthContext";

const loginSchema = z.object({
	email: z.string().email({ message: "Invalid email address" }),
	password: z.string().min(1, { message: "Password is required" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();
	const [loading, setLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginForm) => {
		setLoading(true);

		try {
			const response = await fetch(
				"https://api.apbco.co.za/switchboard/public/index.php/auth/login/",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);
			const result = await response
				.json()
				.catch(() => toast.error("Invalid server response."));

			if (response.ok && result?.status === "success") {
				login(result.token, result.user);
				window.dispatchEvent(new Event("authChange"));

				const redirectTo = ["admin", "operator", "super"].includes(
					result.user.user_role
				)
					? "/dashboard"
					: "/user";

				router.push(redirectTo);
			} else {
				toast.error(result?.message || "Login failed. Try again.");
			}
		} catch {
			toast.error("Connection error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-lg mx-auto mt-20 p-8 bg-[#F4F6F8] shadow-lg rounded-2xl animate-fadeIn">
			<div className=" bg-white p-8 shadow-xl rounded-xl animate-fadeIn">
				<h2 className="text-3xl font-bold text-center text-[#1A73E8] mb-2">
					Switchboard Monitor
				</h2>
				<p className="text-center text-sm text-gray-500 mb-6">
					Track user availability in real-time
				</p>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							autoFocus
							{...register("email")}
							className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{errors.email && (
							<p className="text-sm text-red-600">
								{errors.email.message}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							{...register("password")}
							className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{errors.password && (
							<p className="text-sm text-red-600">
								{errors.password.message}
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white py-2 rounded-md transition disabled:opacity-50"
					>
						{loading ? "Logging in..." : "Login"}
					</button>
				</form>
			</div>
		</div>
	);
}
