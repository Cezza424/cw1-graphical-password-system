"use client";

import Link from "next/link";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { Card } from "@/components/ui/card";
import { PrimaryButton } from "@/components/ui/primary-button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      <TopAppBar active="home" />

      <div className="relative overflow-hidden px-3 py-8 sm:px-4 sm:py-12 md:px-8 md:py-20">
        {/* Background accents */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="mx-auto w-full max-w-5xl space-y-12">
          {/* Hero Section */}
          <section className="relative space-y-6 text-center">
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl md:text-7xl dark:text-zinc-100">
                Welcome to Emoji Login
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-zinc-600 sm:text-xl dark:text-zinc-300">
                A fun, child-friendly authentication system that makes learning and security engaging for young learners.
              </p>
            </div>
          </section>

          {/* Features Grid */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="space-y-3" padding="md">
              <div className="text-4xl">😊</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Child-Friendly</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Designed with young learners in mind. Fun, engaging, and easy to use.</p>
            </Card>
            <Card className="space-y-3" padding="md">
              <div className="text-4xl">🔒</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Secure</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Modern cryptography protects student profiles with emoji-based passwords.</p>
            </Card>
            <Card className="space-y-3" padding="md">
              <div className="text-4xl">👨‍🏫</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Teacher Control</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Teachers can easily manage passwords and reset them when needed.</p>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="space-y-6">
            <Card className="space-y-6 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.08)]" padding="lg">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                  Get Started
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                  Choose your path below
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Student Login */}
                <div className="space-y-3 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Student Login
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Enter your emoji password to access your account
                  </p>
                  <Link href="/login" className="inline-block w-full">
                    <PrimaryButton className="w-full">
                      Go to Login
                    </PrimaryButton>
                  </Link>
                </div>

                {/* Teacher Admin */}
                <div className="space-y-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Teacher Admin
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Manage student passwords and account settings
                  </p>
                  <Link href="/admin/login" className="inline-block w-full">
                    <button className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                      Go to Admin
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* How it Works */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              How It Works
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Select Profile</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Choose your student profile</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Tap Emojis</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Tap your 3 secret emojis</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Logged In!</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Access your account</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

