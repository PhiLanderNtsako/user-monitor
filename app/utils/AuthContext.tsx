"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
} from "react";
import { useRouter } from "next/navigation";

type User = {
	id: number;
	name: string;
	user_role: string;
	department: string;
};

type AuthContextType = {
	sessionUser: User | null;
	token: string | null;
	isAuthReady: boolean;
	login: (token: string, sessionUser: User) => void;
	logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EXPIRY_TIME = 10 * 60 * 60 * 1000; // 10 Hours
const TOKEN = "token";
const SESSION_USER = "sessionUser";
const LOGIN_TIME = "loginTime";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [sessionUser, setSessionUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isAuthReady, setIsAuthReady] = useState(false);
	const router = useRouter();

	const login = (token: string, sessionUser: User) => {
		setToken(token);
		setSessionUser(sessionUser);
		localStorage.setItem(TOKEN, token);
		localStorage.setItem(SESSION_USER, JSON.stringify(sessionUser));
		localStorage.setItem(LOGIN_TIME, Date.now().toString());
	};

	const logout = useCallback(() => {
		setToken(null);
		setSessionUser(null);
		localStorage.removeItem(TOKEN);
		localStorage.removeItem(SESSION_USER);
		localStorage.removeItem(LOGIN_TIME);
		router.push("/login");

		window.location.href = "/login";
	},[router]);

		useEffect(() => {
	const storedToken = localStorage.getItem(TOKEN);
	const storedSessionUser = localStorage.getItem(SESSION_USER);
	const storedLoginTime = localStorage.getItem(LOGIN_TIME);

	if (storedToken && storedSessionUser && storedLoginTime) {
		const loginTime = parseInt(storedLoginTime, 10);
		const timeElapsed = Date.now() - loginTime;
		const timeRemaining = EXPIRY_TIME - timeElapsed;

		if (timeElapsed > EXPIRY_TIME) {
			logout();
		} else {
			setToken(storedToken);
			setSessionUser(JSON.parse(storedSessionUser));

			// Set timeout to auto-logout when session expires
			const timeoutId = setTimeout(() => {
				logout();
			}, timeRemaining);

			// Clear timeout if component unmounts
			return () => clearTimeout(timeoutId);
		}
	}

	setIsAuthReady(true);
}, [logout]);


	return (
		<AuthContext.Provider value={{ sessionUser, token, login, logout, isAuthReady }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
}
