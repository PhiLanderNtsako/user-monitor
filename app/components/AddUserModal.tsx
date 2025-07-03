"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

type FormData = {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    extension_number: string;
    cellphone: string;
    telephone: string;
    password: string;
    department_id: number;
    verification_code: string;
    role_id: number;
    user_role: string;
};

type Departments = {
    id: string;
    name: string;
};

type AddUserModalProps = {
    modalClose: () => void;
	departmentsData: Departments[];
	user_role?: string;
	departmentId?: string | null;
};

export default function AddUserModal({
	modalClose,
	departmentsData,
	user_role,
	departmentId,
}: AddUserModalProps) {
    const router = useRouter();
    const [submitMessage, setSubmitMessage] = useState({ text: "", type: "" });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormData>();

    const onSubmit = async (formData: FormData) => {
        setSubmitMessage({ text: "", type: "" });
        try {
            const response = await fetch(
                `https://test.apbco.co.za/switchboard/api/public/index.php/users/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const result = await response.json();

            if (result.status === "success") {
                setSubmitMessage({
                    text: "✅ User successfully saved! Redirecting...",
                    type: "success",
                });
                reset();
                setTimeout(() => {
                    modalClose();
                    router.push(`/admin/users/${result.id}`);
                }, 1000);
            } else {
                setSubmitMessage({
                    text: result.message || "❌ Failed to save user.",
                    type: "error",
                });
            }
        } catch (err) {
            console.error("Error:", err);
            setSubmitMessage({
                text: "❌ Failed to save user due to network error.",
                type: "error",
            });
        }
    };

    const getMessageClass = (type: string) => {
        switch (type) {
            case "success":
                return "bg-green-100 border-green-400 text-green-700";
            case "error":
                return "bg-red-100 border-red-400 text-red-700";
            default:
                return "bg-blue-100 border-blue-400 text-blue-700";
        }
    };

	const generatePassword = () => {
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$&*-_";
		let password = "";
		for (let i = 0; i < 12; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setValue("password", password); // sets the password field
	};

	console.log(departmentsData)

    return (
					<div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-xl font-bold text-gray-800">
										Add New User
									</h2>
									<button
										onClick={() => {
											modalClose();
								setSubmitMessage({
									text: "",
									type: "",
								});
								reset();
										}}
										className="text-gray-500 hover:text-gray-700"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-6 w-6"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>

								{submitMessage.text && (
									<div
										className={`mb-4 p-3 border rounded-md ${getMessageClass(
											submitMessage.type
										)}`}
									>
										{submitMessage.text}
									</div>
								)}

								<form
									onSubmit={handleSubmit(onSubmit)}
									className="space-y-4"
								>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												First Name *
											</label>
											<input
												type="text"
												{...register("first_name", {
													required:
														"First name is required",
												})}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											/>
											{errors.first_name && (
												<p className="mt-1 text-sm text-red-600">
													{errors.first_name.message}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Last Name *
											</label>
											<input
												type="text"
												{...register("last_name", {
													required:
														"Last name is required",
												})}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											/>
											{errors.last_name && (
												<p className="mt-1 text-sm text-red-600">
													{errors.last_name.message}
												</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Email *
											</label>
											<input
												type="email"
												{...register("email", {
													required:
														"Email is required",
													pattern: {
														value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
														message:
															"Invalid email address",
													},
												})}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											/>
											{errors.email && (
												<p className="mt-1 text-sm text-red-600">
													{errors.email.message}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Extension *
											</label>
											<input
												type="text"
												{...register(
													"extension_number",
													{
														required:
															"Extension is required",
														pattern: {
															value: /^[0-9]+$/,
															message:
																"Only numbers are allowed",
														},
													}
												)}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											/>
											{errors.extension_number && (
												<p className="mt-1 text-sm text-red-600">
													{
														errors.extension_number
															.message
													}
												</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Cellphone
											</label>
											<input
												type="tel"
												{...register("cellphone")}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Telephone
											</label>
											<input
												type="tel"
												{...register("telephone")}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Role *
											</label>
											<select
												{...register("role_id", {
													required:
														"Role is required",
												})}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
											>
												<option value="">
													Select role
												</option>
												<option value="1">User</option>
												<option value="2">Operator</option>
												<option value="3">Admin</option>
											</select>
											{errors.role_id && (
												<p className="mt-1 text-sm text-red-600">
													{errors.role_id.message}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Department
											</label>
											<select
												{...register("department_id")}
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
								>
											{user_role === 'super' ? (
												<>
													<option>Select Department</option>
													{departmentsData?.map((department) => (
														<option key={department.id} value={department.id}>
															{department.name}
														</option>
													))}
												</>
											) : (
												departmentsData
												.filter((d) => d.id === departmentId)
													.map((department) => (
														<option key={department.id} value={department.id}>
															{department.name}
														</option>
													))
											)}
											</select>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Password *
											</label>
											<div className="flex space-x-2">
												<input
													type="text"
													{...register("password", {
														required:
															"Password is required",
													})}
													className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
												/>
												<button
													type="button"
													onClick={generatePassword}
													className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
												>
													Generate
												</button>
											</div>
											{errors.password && (
												<p className="mt-1 text-sm text-red-600">
													{errors.password.message}
												</p>
											)}
										</div>
									</div>

									<div className="flex justify-end space-x-3 pt-4">
										<button
											type="button"
											onClick={() => {
												modalClose();
                                                setSubmitMessage({
                                                    text: "",
                                                    type: "",
                                                });
                                                reset();
											}}
											className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={isSubmitting}
											className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center min-w-[120px]"
										>
											{isSubmitting ? (
												<>
													<svg
														className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														></circle>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														></path>
													</svg>
													Saving...
												</>
											) : (
												"Save User"
											)}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
    );
}