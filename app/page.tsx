"use client";

import Image from "next/image";
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

type PasswordApiResponse = {
  userId?: string;
  emojiIds?: string[];
  source?: "database" | "fallback";
  error?: string;
};

const CAROUSEL_PAGE_SIZE = 5;

export default function Home() {
  const [usersLoadState, setUsersLoadState] = useState<LoadState>("loading");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [carouselPage, setCarouselPage] = useState(0);

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
  const totalPages = Math.max(1, Math.ceil(users.length / CAROUSEL_PAGE_SIZE));

  const visibleUsers = useMemo(() => {
    const start = carouselPage * CAROUSEL_PAGE_SIZE;
    return users.slice(start, start + CAROUSEL_PAGE_SIZE);
  }, [users, carouselPage]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const resetAttempt = () => {
    setSelectedIds([]);
    setAuthState("idle");
    setGridTiles(shuffleTiles(EMOJI_TILES));
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setLoadState("loading");
      return;
    }

    const loadPassword = async () => {
      setLoadState("loading");

      try {
        const response = await fetch(`/api/password?userId=${encodeURIComponent(selectedUserId)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Could not load password settings");
        }

        const data = (await response.json()) as PasswordApiResponse;
        if (data.error) {
          console.warn("API Warning:", data.error);
        }

        if (isValidPasswordIds(data.emojiIds)) {
          setPasswordIds(data.emojiIds);
        }

        setPasswordSource(data.source === "database" ? "database" : "fallback");

        setLoadState("ready");
      } catch (error) {
        console.error("Failed to load password:", error);
        setLoadState("error");
      }
    };

    loadPassword();
  }, [selectedUserId]);

  useEffect(() => {
    if (carouselPage >= totalPages) {
      setCarouselPage(totalPages - 1);
    }
  }, [carouselPage, totalPages]);

  useEffect(() => {
    if (selectedCount !== 3 || loadState !== "ready" || !selectedUserId) {
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
  }, [selectedCount, selectedIds, passwordIds, loadState, selectedUserId]);

  const onTileClick = (emojiId: EmojiId) => {
    if (!selectedUserId || loadState !== "ready" || authState === "success" || selectedCount >= 3) {
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
    resetAttempt();
  };

  const statusText =
    usersLoadState === "loading"
      ? "Loading profiles..."
      : usersLoadState === "error"
        ? "Could not load profiles. Refresh to try again."
        : !selectedUserId
          ? "Select a profile to continue."
          : loadState === "loading"
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
      <section className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Emoji Login
        </h1>
        <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">{statusText}</p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCarouselPage((current) => Math.max(0, current - 1))}
              disabled={carouselPage === 0 || usersLoadState !== "ready"}
              className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200"
            >
              Prev
            </button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Page {carouselPage + 1}/{totalPages}
            </p>
            <button
              type="button"
              onClick={() => setCarouselPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={carouselPage >= totalPages - 1 || usersLoadState !== "ready"}
              className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200"
            >
              Next
            </button>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-3">
            {visibleUsers.map((user) => {
              const isSelected = user.id === selectedUserId;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onUserSelect(user.id)}
                  className={`rounded-xl border p-2 text-center transition-colors ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-200 dark:border-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Image
                    src={user.avatarUrl}
                    alt={`${user.username} avatar`}
                    width={48}
                    height={48}
                    unoptimized
                    className="mx-auto h-12 w-12 rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <p className="mt-2 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    {user.username}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedUser ? (
          <>
            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">
              Signed profile: {selectedUser.username} • Selection: {selectedCount}/3 • Source: {passwordSource}
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
          </>
        ) : null}
      </section>
    </main>
  );
}
