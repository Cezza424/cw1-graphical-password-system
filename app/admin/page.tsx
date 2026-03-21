"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Password Admin</h1>
        <Link href="/" className="text-sm underline">
          Back to login
        </Link>
      </div>

      <label className="text-sm font-medium" htmlFor="user-select">
        User
      </label>
      <select
        id="user-select"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
        value={selectedUserId}
        onChange={(event) => setSelectedUserId(event.target.value)}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>

      <p className="text-sm text-zinc-600">Source: {source}</p>
      <p className="text-sm text-zinc-700">
        Current password:{" "}
        {currentPassword
          ? currentPassword
              .map((id) => `${emojiById.get(id) ?? "?"} (${id})`)
              .join("  ")
          : "Unavailable"}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={!selectedUserId || isSubmitting}
          onClick={() => updatePassword(DEFAULT_PASSWORD_IDS, "Reset to default password")}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Reset to Default
        </button>
        <button
          type="button"
          disabled={!selectedUserId || isSubmitting}
          onClick={() => updatePassword(randomPasswordIds(), "Rotating password")}
          className="rounded-full border border-zinc-400 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Rotate Randomly
        </button>
      </div>

      <p className="text-sm text-zinc-600">{status}</p>
    </main>
  );
}
