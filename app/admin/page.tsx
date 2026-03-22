"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<EmojiId[] | null>(null);
  const [source, setSource] = useState<string>("unknown");
  const [status, setStatus] = useState<string>("Loading users...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojiById = useMemo(
    () => new Map(EMOJI_TILES.map((tile) => [tile.id, tile.emoji])),
    [],
  );

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const loadPassword = async () => {
      try {
        const response = await fetch(`/api/password?userId=${encodeURIComponent(selectedUserId)}`, {
          cache: "no-store",
        });
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

  return (
    <main className="min-h-screen bg-(--color-background)">
      <TopAppBar active="admin" />

      <div className="relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

        <Card className="relative mx-auto w-full max-w-5xl rounded-4xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm" padding="lg">
          <header>
            <Pill>Teacher controls</Pill>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Password Admin
            </h1>
          </header>

          <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-12">
            <Card as="aside" tone="muted" className="lg:col-span-4" padding="md">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200" htmlFor="user-select">
                Select user
              </label>
              <select
                id="user-select"
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none ring-amber-300 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>

              <Card className="mt-5" padding="sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Password source
                </p>
                <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-100">{source}</p>
              </Card>

              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{status}</p>
            </Card>

            <div className="space-y-4 sm:space-y-5 lg:col-span-8">
              <Card as="section" tone="gradient" padding="md">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  Current emoji key
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                  {currentPassword
                    ? currentPassword
                        .map((id) => `${emojiById.get(id) ?? "?"} (${id})`)
                        .join("  ")
                    : "Unavailable"}
                </p>
              </Card>

              <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <Card as="article" className="text-left transition hover:-translate-y-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800" padding="md">
                  <Pill tone="zinc">Safe action</Pill>
                  <h2 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Reset to Default</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Restore the classroom default sequence.
                  </p>
                  <PrimaryButton
                    className="mt-4"
                    disabled={!selectedUserId || isSubmitting}
                    onClick={() => updatePassword(DEFAULT_PASSWORD_IDS, "Reset to default password")}
                  >
                    Reset to Default
                  </PrimaryButton>
                </Card>

                <Card
                  as="article"
                  className="border-sky-200 bg-sky-100/60 text-left transition hover:-translate-y-0.5 hover:bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/30 dark:hover:bg-sky-900/40"
                  padding="md"
                >
                  <Pill tone="sky">Recommended</Pill>
                  <h2 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Rotate Randomly</h2>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Generate a brand-new 3 emoji password.
                  </p>
                  <PrimaryButton
                    className="mt-4"
                    disabled={!selectedUserId || isSubmitting}
                    onClick={() => updatePassword(randomPasswordIds(), "Rotating password")}
                  >
                    Rotate Randomly
                  </PrimaryButton>
                </Card>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
