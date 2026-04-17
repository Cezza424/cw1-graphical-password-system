"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TopAppBarProps = {
  active: "home" | "login" | "admin" | "dashboard" | "register";
};

type SessionUser = {
  userId: string;
  username: string;
  isAdmin: boolean;
};

export function TopAppBar({ active }: TopAppBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to check session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 rounded-b-3xl border-b border-zinc-200/80 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-300 sm:text-2xl">
          Emoji Login
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active === "login"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active === "register"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Register
          </Link>
          {!loading && (
            <>
              {user && user.isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                      active === "dashboard"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    active === "admin"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

