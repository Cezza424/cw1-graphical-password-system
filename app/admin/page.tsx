"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TopAppBar } from "@/components/ui/top-app-bar";
import {
  DEFAULT_PASSWORD_IDS,
  EMOJI_TILES,
  isValidPasswordIds,
  type EmojiId,
} from "@/lib/emoji-password";

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
  error?: string;
};

type PasswordApiResponse = {
  emojiIds?: string[];
  source?: "database" | "fallback";
  error?: string;
};

function randomPasswordIds(): EmojiId[] {
  const ids = EMOJI_TILES.map((tile) => tile.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]];
  }

  return ids.slice(0, 3);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<EmojiId[] | null>(null);
  const [source, setSource] = useState<string>("unknown");
  const [status, setStatus] = useState<string>("Loading...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojiById = useMemo(
    () => new Map(EMOJI_TILES.map((tile) => [tile.id, tile.emoji])),
    [],
  );

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!data.authenticated || !data.user?.isAdmin) {
          router.push("/admin/login");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        const data = (await response.json()) as UsersApiResponse;

        if (!response.ok || !Array.isArray(data.users) || data.users.length === 0) {
          throw new Error(data.error ?? "Could not load users");
        }

        setUsers(data.users);
        setSelectedUserId(data.users[0].id);
        setStatus("Select an action to manage this user's password.");
      } catch (error) {
        console.error(error);
        setStatus("Could not load users.");
      }
    };

    loadUsers();
  }, [user]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const loadPassword = async () => {
      try {
        const response = await fetch(
          `/api/password?userId=${encodeURIComponent(selectedUserId)}`,
          {
            cache: "no-store",
          },
        );
        const data = (await response.json()) as PasswordApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load password");
        }

        setSource(data.source ?? "unknown");
        setCurrentPassword(isValidPasswordIds(data.emojiIds) ? data.emojiIds : null);
      } catch (error) {
        console.error(error);
        setSource("unknown");
        setCurrentPassword(null);
      }
    };

    loadPassword();
  }, [selectedUserId]);

  const updatePassword = async (emojiIds: EmojiId[], actionLabel: string) => {
    if (!selectedUserId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus(`${actionLabel}...`);

    try {
      const response = await fetch("/api/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          emojiIds,
        }),
      });

      const data = (await response.json()) as PasswordApiResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Update failed");
      }

      setSource(data.source ?? "unknown");
      setCurrentPassword(emojiIds);
      setStatus(`${actionLabel} complete.`);
    } catch (error) {
      console.error(error);
      setStatus(`${actionLabel} failed.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-(--color-background)">
        <TopAppBar active="dashboard" />
        <div className="flex items-center justify-center px-4 py-12">
          <p className="text-zinc-600 dark:text-zinc-300">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--color-background)">
      <TopAppBar active="dashboard" />

      <div className="relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <Card className="relative mx-auto w-full max-w-4xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.08)]" padding="lg">
          <header className="text-center">
            <Pill>Teacher Administration</Pill>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Password Admin
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Signed in as {user?.username}
            </p>
          </header>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Left column: User selection */}
            <Card as="section" tone="muted" padding="md">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Select Student
              </h2>

              <div className="mt-4 space-y-2">
                <label
                  htmlFor="user-select"
                  className="block text-sm font-medium text-zinc-600 dark:text-zinc-300"
                >
                  Student
                </label>
                <select
                  id="user-select"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-2 rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Source
                </p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {source}
                </p>
              </div>
            </Card>

            {/* Right column: Current password display */}
            <Card as="section" tone="muted" padding="md">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Current Password
              </h2>

              <div className="mt-4 flex gap-2">
                {currentPassword ? (
                  currentPassword.map((id) => (
                    <div
                      key={id}
                      className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-2xl dark:bg-zinc-900"
                    >
                      {emojiById.get(id) ?? "?"}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Unavailable
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {status}
              </p>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton
              disabled={!selectedUserId || isSubmitting}
              onClick={() => updatePassword(DEFAULT_PASSWORD_IDS, "Reset to default password")}
              className="flex-1"
            >
              Reset to Default
            </PrimaryButton>
            <button
              type="button"
              disabled={!selectedUserId || isSubmitting}
              onClick={() => updatePassword(randomPasswordIds(), "Rotating password")}
              className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Rotate Randomly
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
