"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense, useState } from "react";
import ErrorMessage from "../components/ErrorMessage"; // adjust path as needed

const loginSchema = z.object({
	email: z.string().email({ message: "Invalid email address" }),
	password: z.string().min(1, { message: "Password is required" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [serverError, setServerError] = useState("");
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
		setServerError("");

		try {
			const response = await fetch(
				"https://test.apbco.co.za/switchboard/api/public/index.php/auth/login/",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);
			const result = await response.json();

			if (result.status === "success") {
				localStorage.setItem("token", result.token);
				localStorage.setItem("user", JSON.stringify(result.user));
				window.dispatchEvent(new Event("authChange"));

				if (
					result.user.user_role === "admin" ||
					result.user.user_role === "operator" ||
					result.user.user_role === "super"
				) {
					router.push("/dashboard");
				} else {
					router.push("/user");
				}
			} else {
				setServerError(result.message || "Login failed");
			}
		} catch (err) {
			setServerError("Something went wrong. Try again." + err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto mt-12 p-8 bg-white shadow-md rounded-lg">
			<h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

			<Suspense fallback={null}>
				<ErrorMessage />
			</Suspense>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1">
						Email
					</label>
					<input
						type="email"
						{...register("email")}
						className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-500"
					/>
					{errors.email && (
						<p className="text-red-600 text-sm">
							{errors.email.message}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Password
					</label>
					<input
						type="password"
						{...register("password")}
						className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-500"
					/>
					{errors.password && (
						<p className="text-red-600 text-sm">
							{errors.password.message}
						</p>
					)}
				</div>

				{serverError && (
					<p className="text-red-600 text-sm">{serverError}</p>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
				>
					{loading ? "Logging in..." : "Login"}
				</button>
			</form>
		</div>
	);
}
