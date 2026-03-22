"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TopAppBar } from "@/components/ui/top-app-bar";
import {
  EMOJI_TILES,
  shuffleTiles,
  type EmojiId,
} from "@/lib/emoji-password";

type LoadState = "loading" | "ready" | "error" | "unauthorized";
type AuthState = "idle" | "checking" | "success" | "failure" | "rate-limited";

type SessionUser = {
  userId: string;
  username: string;
  isAdmin: boolean;
};

type UserProfile = {
  id: string;
  username: string;
  avatarUrl: string;
};

type UsersApiResponse = {
  users?: UserProfile[];
  source?: "database" | "fallback";
  error?: string;
};

type VerifyApiResponse = {
  isMatch?: boolean;
  source?: "database" | "fallback";
  retryAfterSeconds?: number;
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<SessionUser | null>(null);
  const [usersLoadState, setUsersLoadState] = useState<LoadState>("loading");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [carouselPage, setCarouselPage] = useState(0);

  const [authState, setAuthState] = useState<AuthState>("idle");
  const [passwordSource, setPasswordSource] = useState<"database" | "fallback" | "unknown">(
    "unknown",
  );
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [gridTiles, setGridTiles] = useState(() => shuffleTiles(EMOJI_TILES));
  const [selectedIds, setSelectedIds] = useState<EmojiId[]>([]);

  const selectedCount = selectedIds.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const totalProfiles = users.length;
  const previewUser = users[carouselPage] ?? null;

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const resetAttempt = () => {
    setSelectedIds([]);
    setAuthState("idle");
    setRetryAfterSeconds(null);
    setGridTiles(shuffleTiles(EMOJI_TILES));
  };

  // Check admin authentication FIRST
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();

        if (!data.authenticated || !data.user?.isAdmin) {
          // No admin logged in - show unauthorized
          setUsersLoadState("unauthorized");
          return;
        }

        setAdminUser(data.user);
        setUsersLoadState("loading");
      } catch (error) {
        console.error("Auth check failed:", error);
        setUsersLoadState("unauthorized");
      }
    };

    checkAdminAuth();
  }, []);

  // Load students ONLY if admin is authenticated
  useEffect(() => {
    if (!adminUser) return;

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load users");
        }

        const data = (await response.json()) as UsersApiResponse;
        if (data.error) {
          console.warn("API Warning:", data.error);
        }

        if (!Array.isArray(data.users) || data.users.length === 0) {
          throw new Error("No users were returned by the API");
        }

        setUsers(data.users);
        setUsersLoadState("ready");
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsersLoadState("error");
      }
    };

    loadUsers();
  }, [adminUser]);

  useEffect(() => {
    if (totalProfiles === 0) {
      return;
    }

    if (carouselPage >= totalProfiles) {
      setCarouselPage(totalProfiles - 1);
    }
  }, [carouselPage, totalProfiles]);

  useEffect(() => {
    if (selectedCount !== 3 || !selectedUserId) {
      return;
    }

    let resetTimer: number | undefined;
    let isCancelled = false;

    const verifySelection = async () => {
      setAuthState("checking");
      setRetryAfterSeconds(null);

      try {
        const response = await fetch("/api/password/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUserId,
            emojiIds: selectedIds,
          }),
        });

        const data = (await response.json()) as VerifyApiResponse;
        const nextSource =
          data.source === "database" || data.source === "fallback" ? data.source : "unknown";
        setPasswordSource(nextSource);

        if (response.status === 429) {
          setAuthState("rate-limited");
          setRetryAfterSeconds(data.retryAfterSeconds ?? null);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Could not verify emoji selection");
        }

        if (isCancelled) {
          return;
        }

        if (data.isMatch) {
          setAuthState("success");
          return;
        }

        setAuthState("failure");
        resetTimer = window.setTimeout(() => {
          resetAttempt();
        }, 1200);
      } catch (error) {
        console.error("Failed to verify password:", error);
        if (isCancelled) {
          return;
        }

        setPasswordSource("unknown");
        setAuthState("failure");
        resetTimer = window.setTimeout(() => {
          resetAttempt();
        }, 1200);
      }
    };

    verifySelection();

    return () => {
      isCancelled = true;
      if (typeof resetTimer === "number") {
        window.clearTimeout(resetTimer);
      }
    };
  }, [selectedCount, selectedIds, selectedUserId]);

  const onTileClick = (emojiId: EmojiId) => {
    if (
      !selectedUserId ||
      usersLoadState !== "ready" ||
      authState === "success" ||
      authState === "checking" ||
      authState === "rate-limited" ||
      selectedCount >= 3
    ) {
      return;
    }

    if (selectedSet.has(emojiId)) {
      return;
    }

    setSelectedIds((current) => [...current, emojiId]);
  };

  const onUserSelect = (userId: string) => {
    if (userId === selectedUserId) {
      return;
    }

    setSelectedUserId(userId);
    setPasswordSource("unknown");
    resetAttempt();
  };

  const onChangeProfile = () => {
    setSelectedUserId(null);
    setPasswordSource("unknown");
    resetAttempt();
  };

  const statusText =
    usersLoadState === "loading"
      ? "Loading profiles..."
      : usersLoadState === "error"
        ? "Could not load profiles. Refresh to try again."
        : !selectedUserId
          ? "Choose your profile first."
          : authState === "success"
          ? "Great job! You are authorised."
          : authState === "rate-limited"
            ? `Too many attempts. ${retryAfterSeconds ? `Try again in ${retryAfterSeconds}s.` : "Please wait and try again."}`
          : authState === "failure"
            ? "Not quite right. Shuffling for another try..."
            : authState === "checking"
              ? "Checking your emojis..."
              : "Tap 3 emojis to log in.";

  // Show unauthorized message if admin not logged in
  if (usersLoadState === "unauthorized") {
    return (
      <main className="min-h-screen bg-(--color-background)">
        <TopAppBar active="login" />
        <div className="relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-red-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-red-300/20 blur-3xl" />

          <Card className="relative mx-auto w-full max-w-md rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.08)]" padding="lg">
            <header className="text-center">
              <Pill>Access Restricted</Pill>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
                Teacher Login Required
              </h1>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                A teacher must log in first to access the student login area.
              </p>
            </header>

            <div className="mt-8 space-y-3">
              <PrimaryButton
                onClick={() => router.push("/admin/login")}
                className="w-full"
              >
                Go to Teacher Login
              </PrimaryButton>
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Back to Home
              </button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--color-background)">
      <TopAppBar active="login" />

      <div className="relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

        <Card className="relative mx-auto w-full max-w-5xl rounded-4xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm" padding="lg">
          <header className="text-center">
            <Pill>Child-friendly sign in</Pill>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-5xl dark:text-zinc-100">
              Emoji Login
            </h1>
            <p className="mt-2 text-xs text-zinc-600 md:text-sm dark:text-zinc-300">
              Teacher: <span className="font-semibold text-amber-600 dark:text-amber-400">{adminUser?.username}</span> • {statusText}
            </p>
          </header>

          <div className="mt-6 sm:mt-8">
            {!selectedUser ? (
              <Card as="section" tone="muted" className="mx-auto w-full max-w-lg" padding="md">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-100">Pick your profile</h2>
                  <Pill>{totalProfiles} users</Pill>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCarouselPage((current) => Math.max(0, current - 1))}
                    disabled={carouselPage === 0 || usersLoadState !== "ready"}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 sm:px-4 sm:text-sm"
                  >
                    Prev
                  </button>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:text-xs">
                    Profile {totalProfiles === 0 ? 0 : carouselPage + 1}/{totalProfiles}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCarouselPage((current) => Math.min(totalProfiles - 1, current + 1))}
                    disabled={carouselPage >= totalProfiles - 1 || usersLoadState !== "ready"}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-transform hover:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 sm:px-4 sm:text-sm"
                  >
                    Next
                  </button>
                </div>

                {previewUser ? (
                  <Card className="mt-4 text-center" padding="md">
                    <Image
                      src={previewUser.avatarUrl}
                      alt={`${previewUser.username} avatar`}
                      width={96}
                      height={96}
                      unoptimized
                      className="mx-auto h-20 w-20 rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950 sm:h-24 sm:w-24"
                    />
                    <p className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100 sm:text-lg">{previewUser.username}</p>
                    <PrimaryButton
                      className="mt-5"
                      onClick={() => onUserSelect(previewUser.id)}
                      disabled={usersLoadState !== "ready"}
                    >
                      Use this profile
                    </PrimaryButton>
                  </Card>
                ) : (
                  <Card className="mt-4 border-dashed bg-zinc-100 text-center text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300" padding="md">
                    No profiles available.
                  </Card>
                )}
              </Card>
            ) : (
              <Card as="section" tone="muted" className="mx-auto w-full max-w-3xl" padding="md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-100">
                      Welcome, {selectedUser.username}!
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {passwordSource !== "unknown" ? `Source: ${passwordSource}` : ""}
                    </p>
                  </div>
                  <Pill tone="emerald">{selectedCount}/3 selected</Pill>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                  {gridTiles.map((tile) => {
                    const isHidden = selectedSet.has(tile.id);
                    const isDisabled =
                      usersLoadState !== "ready" ||
                      isHidden ||
                      authState === "success" ||
                      authState === "checking" ||
                      authState === "rate-limited";

                    return (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => onTileClick(tile.id)}
                        disabled={isDisabled}
                        className={`aspect-square rounded-2xl border border-zinc-200 bg-white text-4xl shadow-[0_8px_0_rgba(228,228,231,1)] transition-all active:shadow-none dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-[0_8px_0_rgba(39,39,42,1)] sm:text-5xl ${
                          isHidden ? "invisible" : "hover:-translate-y-0.5 active:translate-y-1"
                        }`}
                      >
                        <span aria-hidden="true">{tile.emoji}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <PrimaryButton
                    onClick={resetAttempt}
                    disabled={usersLoadState !== "ready" || authState === "checking"}
                  >
                    Start a New Attempt
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={onChangeProfile}
                    disabled={authState === "checking"}
                    className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Change Profile
                  </button>
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

