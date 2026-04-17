"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TopAppBar } from "@/components/ui/top-app-bar";
import {
  EMOJI_TILES,
  shuffleTiles,
  type EmojiId,
} from "@/lib/emoji-password";

type RegisterApiResponse = {
  success?: boolean;
  status?: "pending";
  user?: {
    id: string;
    username: string;
    avatarUrl: string;
    status: "pending" | "approved" | "rejected";
  };
  error?: string;
};

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gridTiles, setGridTiles] = useState(() => shuffleTiles(EMOJI_TILES));
  const [selectedIds, setSelectedIds] = useState<EmojiId[]>([]);
  const [status, setStatus] = useState("Pick three emojis to start your request.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingUser, setPendingUser] = useState<RegisterApiResponse["user"] | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const canSubmit = username.trim().length >= 3 && selectedCount === 3 && !isSubmitting;

  const resetPassword = () => {
    setSelectedIds([]);
    setGridTiles(shuffleTiles(EMOJI_TILES));
    setStatus("Pick three emojis to start your request.");
    setPendingUser(null);
  };

  const onTileClick = (emojiId: EmojiId) => {
    if (isSubmitting || selectedCount >= 3 || selectedSet.has(emojiId)) {
      return;
    }

    setSelectedIds((current) => [...current, emojiId]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setStatus("Submitting registration request...");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          avatarUrl,
          emojiIds: selectedIds,
        }),
      });

      const data = (await response.json()) as RegisterApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create registration request");
      }

      setPendingUser(data.user ?? null);
      setStatus("Registration received. An admin must approve this profile before login.");
    } catch (error) {
      console.error(error);
      setPendingUser(null);
      setStatus(error instanceof Error ? error.message : "Could not submit registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-(--color-background)">
      <TopAppBar active="register" />

      <div className="relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

        <Card className="relative mx-auto w-full max-w-5xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.08)]" padding="lg">
          <header className="text-center">
            <Pill>Manual Approval</Pill>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Create Your Profile
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Choose a username, optional avatar, and your own 3-emoji password. Your request will be reviewed by an admin.
            </p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card as="section" tone="muted" padding="md">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Profile Details
              </h2>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Username
                  </label>
                  <input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="e.g. jamie"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="avatarUrl" className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Avatar URL <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="Leave blank to auto-generate an avatar"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Password Preview
                  </p>
                  <div className="mt-3 flex gap-2">
                    {selectedIds.length > 0 ? (
                      selectedIds.map((id) => {
                        const tile = EMOJI_TILES.find((entry) => entry.id === id);
                        return (
                          <div
                            key={id}
                            className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-2xl dark:bg-zinc-900"
                          >
                            {tile?.emoji ?? "?"}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No emojis selected yet.
                      </div>
                    )}
                  </div>
                </div>

                {pendingUser ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <p className="font-semibold">Registration submitted</p>
                    <p className="mt-1">{pendingUser.username} is waiting for admin approval.</p>
                  </div>
                ) : null}

                <p className="text-sm text-zinc-500 dark:text-zinc-400">{status}</p>

                <div className="flex flex-wrap gap-3">
                  <PrimaryButton disabled={!canSubmit} onClick={handleSubmit} fullWidth={false}>
                    Submit for Approval
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={resetPassword}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Reset Emojis
                  </button>
                </div>

                <Link href="/login" className="inline-flex text-sm font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-300">
                  Back to login
                </Link>
              </div>
            </Card>

            <Card as="section" tone="muted" padding="md">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Choose 3 Emojis
                </h2>
                <Pill>{selectedCount}/3 selected</Pill>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
                {gridTiles.map((tile) => {
                  const isSelected = selectedSet.has(tile.id);
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => onTileClick(tile.id)}
                      disabled={isSubmitting || isSelected || selectedCount >= 3}
                      className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-4xl transition ${
                        isSelected
                          ? "border-amber-400 bg-amber-100 dark:border-amber-500 dark:bg-amber-950"
                          : "border-white bg-white shadow-sm hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-950"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {tile.emoji}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-white/70 p-4 dark:bg-zinc-950/50">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  How it works
                </p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <li>• Pick any 3 unique emojis.</li>
                  <li>• Submit your profile for admin review.</li>
                  <li>• Once approved, you can use the login page.</li>
                </ul>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </main>
  );
}

