"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PASSWORD_IDS,
  EMOJI_TILES,
  isPasswordMatchAnyOrder,
  isValidPasswordIds,
  shuffleTiles,
  type EmojiId,
} from "@/lib/emoji-password";

type LoadState = "loading" | "ready" | "error";
type AuthState = "idle" | "checking" | "success" | "failure";

type PasswordApiResponse = {
  emojiIds?: string[];
  source?: "database" | "fallback";
  error?: string;
};

export default function Home() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [passwordIds, setPasswordIds] = useState<EmojiId[]>(DEFAULT_PASSWORD_IDS);
  const [passwordSource, setPasswordSource] = useState<"database" | "fallback">(
    "fallback",
  );
  const [gridTiles, setGridTiles] = useState(() => shuffleTiles(EMOJI_TILES));
  const [selectedIds, setSelectedIds] = useState<EmojiId[]>([]);

  const selectedCount = selectedIds.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const resetAttempt = () => {
    setSelectedIds([]);
    setAuthState("idle");
    setGridTiles(shuffleTiles(EMOJI_TILES));
  };

  useEffect(() => {
    const loadPassword = async () => {
      try {
        const response = await fetch("/api/password", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load password settings");
        }

        const data = (await response.json()) as PasswordApiResponse;
        if (isValidPasswordIds(data.emojiIds)) {
          setPasswordIds(data.emojiIds);
        }

        if (data.source === "database") {
          setPasswordSource("database");
        }

        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    };

    loadPassword();
  }, []);

  useEffect(() => {
    if (selectedCount !== 3 || loadState !== "ready") {
      return;
    }

    setAuthState("checking");
    const isMatch = isPasswordMatchAnyOrder(selectedIds, passwordIds);

    if (isMatch) {
      setAuthState("success");
      return;
    }

    setAuthState("failure");
    const timer = window.setTimeout(() => {
      resetAttempt();
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [selectedCount, selectedIds, passwordIds, loadState]);

  const onTileClick = (emojiId: EmojiId) => {
    if (loadState !== "ready" || authState === "success" || selectedCount >= 3) {
      return;
    }

    if (selectedSet.has(emojiId)) {
      return;
    }

    setSelectedIds((current) => [...current, emojiId]);
  };

  const statusText =
    loadState === "loading"
      ? "Loading password settings..."
      : loadState === "error"
        ? "Could not load backend settings. Refresh to try again."
        : authState === "success"
          ? "Great job! You are authorised."
          : authState === "failure"
            ? "Not quite right. Shuffling for another try..."
            : authState === "checking"
              ? "Checking your emojis..."
              : "Tap 3 emojis to log in.";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Emoji Login
        </h1>
        <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">{statusText}</p>
        <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Selection: {selectedCount}/3 • Source: {passwordSource}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {gridTiles.map((tile) => {
            const isHidden = selectedSet.has(tile.id);
            const isDisabled = loadState !== "ready" || isHidden || authState === "success";

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onTileClick(tile.id)}
                disabled={isDisabled}
                className={`aspect-square rounded-2xl border border-zinc-200 bg-zinc-100 text-4xl shadow-sm transition-transform dark:border-zinc-700 dark:bg-zinc-900 ${
                  isHidden ? "invisible" : "hover:scale-[1.02] active:scale-95"
                }`}
              >
                <span aria-hidden="true">{tile.emoji}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={resetAttempt}
          disabled={loadState !== "ready" || authState === "checking"}
          className="mt-6 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Start a New Attempt
        </button>
      </section>
    </main>
  );
}
