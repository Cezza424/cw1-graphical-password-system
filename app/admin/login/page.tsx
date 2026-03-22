"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { Card } from "@/components/ui/card";
import { PrimaryButton } from "@/components/ui/primary-button";

type LoginState = "idle" | "loading" | "error";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        setError(data.error || "Login failed");
        return;
      }

      // Success - redirect to admin dashboard route
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setState("error");
      setError("An error occurred. Please try again.");
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-(--color-background)">
      <TopAppBar active="admin" />

      <div className="relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <Card className="relative mx-auto w-full max-w-md rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.08)]" padding="lg">
          <header className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Teacher Admin
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Sign in to manage student passwords
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={state === "loading"}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={state === "loading"}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="Enter your password"
              />
            </div>

            {state === "error" && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={state === "loading" || !username || !password}
              className="w-full"
            >
              {state === "loading" ? "Signing in..." : "Sign In"}
            </PrimaryButton>
          </form>

          <div className="mt-6 border-t border-zinc-200 pt-6 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Not an admin?{" "}
              <Link href="/login" className="font-medium text-amber-600 hover:underline dark:text-amber-400">
                Go to student login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

