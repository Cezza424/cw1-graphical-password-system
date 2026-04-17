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
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  rejectionReason: string | null;
};

type AdminUsersApiResponse = {
  users?: UserProfile[];
  source?: "database";
  error?: string;
};

type PasswordApiResponse = {
  emojiIds?: string[];
  source?: "database" | "fallback";
  error?: string;
};

type MutationResponse = {
  success?: boolean;
  user?: UserProfile;
  deletedUserId?: string;
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

  const approvedUsers = useMemo(
    () => users.filter((profile) => profile.status === "approved"),
    [users],
  );
  const pendingUsers = useMemo(
    () => users.filter((profile) => profile.status === "pending"),
    [users],
  );
  const rejectedUsers = useMemo(
    () => users.filter((profile) => profile.status === "rejected"),
    [users],
  );

  const selectedUser = useMemo(
    () => users.find((profile) => profile.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

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
    if (!user) {
      return;
    }

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        const data = (await response.json()) as AdminUsersApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load users");
        }

        if (!Array.isArray(data.users)) {
          throw new Error("Invalid users response");
        }

        const nextUsers = data.users ?? [];
        setUsers(nextUsers);

        setSelectedUserId((current) => {
          const stillExists = nextUsers.some((profile) => profile.id === current);
          if (stillExists) {
            return current;
          }

          return nextUsers.find((profile) => profile.status === "approved")?.id ?? "";
        });

        setStatus("Manage approvals, passwords, and profile removal from here.");
      } catch (error) {
        console.error(error);
        setStatus("Could not load users.");
      }
    };

    loadUsers();
  }, [user]);

  useEffect(() => {
    if (!selectedUserId) {
      setCurrentPassword(null);
      setSource("unknown");
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

  const reloadUsers = async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = (await response.json()) as AdminUsersApiResponse;

    if (!response.ok || !Array.isArray(data.users)) {
      throw new Error(data.error ?? "Could not refresh users");
    }

    const nextUsers = data.users ?? [];
    setUsers(nextUsers);
    setSelectedUserId((current) => {
      const stillExists = nextUsers.some((profile) => profile.id === current);
      if (stillExists) {
        return current;
      }

      return nextUsers.find((profile) => profile.status === "approved")?.id ?? "";
    });
  };

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

  const moderateProfile = async (
    profileId: string,
    mode: "approve" | "reject" | "delete",
  ) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus(
      mode === "approve"
        ? "Approving profile..."
        : mode === "reject"
          ? "Rejecting profile..."
          : "Deleting profile...",
    );

    try {
      const requestInit: RequestInit =
        mode === "delete"
          ? {
              method: "DELETE",
            }
          : {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: mode,
                rejectionReason: mode === "reject" ? "Removed by admin" : undefined,
              }),
            };

      const response = await fetch(`/api/admin/users/${profileId}`, requestInit);

      const data = (await response.json()) as MutationResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Moderation failed");
      }

      await reloadUsers();
      setStatus(
        mode === "approve"
          ? "Profile approved."
          : mode === "reject"
            ? "Profile rejected."
            : "Profile deleted.",
      );
    } catch (error) {
      console.error(error);
      setStatus("Could not update the profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSelectedUser = async () => {
    if (!selectedUserId || !window.confirm("Delete this profile permanently?")) {
      return;
    }

    await moderateProfile(selectedUserId, "delete");
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

        <Card className="relative mx-auto w-full max-w-6xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.08)]" padding="lg">
          <header className="text-center">
            <Pill>Manual Approval</Pill>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Profile Administration
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Signed in as {user?.username}
            </p>
          </header>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card tone="muted" padding="sm" className="text-center">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Approved</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {approvedUsers.length}
              </p>
            </Card>
            <Card tone="muted" padding="sm" className="text-center">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Pending</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {pendingUsers.length}
              </p>
            </Card>
            <Card tone="muted" padding="sm" className="text-center">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Rejected</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {rejectedUsers.length}
              </p>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card as="section" tone="muted" padding="md">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Approved Profiles
                </h2>
                <Pill>{approvedUsers.length} active</Pill>
              </div>

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
                  <option value="">Select a profile</option>
                  {approvedUsers.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-2 rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Source</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {source}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Selected Profile
                </p>
                {selectedUser ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedUser.username}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Status: {selectedUser.status}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedUser.avatarUrl}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    No profile selected.
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <PrimaryButton
                  disabled={!selectedUserId || isSubmitting}
                  onClick={() => updatePassword(DEFAULT_PASSWORD_IDS, "Reset to default password")}
                  fullWidth={false}
                >
                  Reset to Default
                </PrimaryButton>
                <button
                  type="button"
                  disabled={!selectedUserId || isSubmitting}
                  onClick={() => updatePassword(randomPasswordIds(), "Rotate random password")}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Rotate Randomly
                </button>
                <button
                  type="button"
                  disabled={!selectedUserId || isSubmitting}
                  onClick={deleteSelectedUser}
                  className="rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950"
                >
                  Delete Selected
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  Current Password
                </h3>

                <div className="flex gap-2">
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

                <p className="text-xs text-zinc-500 dark:text-zinc-400">{status}</p>
              </div>
            </Card>

            <Card as="section" tone="muted" padding="md">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Pending Registrations
                </h2>
                <Pill>{pendingUsers.length} waiting</Pill>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No registrations are waiting for approval.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {pendingUsers.map((profile) => (
                    <div
                      key={profile.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {profile.username}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {profile.avatarUrl}
                          </p>
                        </div>
                        <Pill>Pending</Pill>
                      </div>

                      {profile.rejectionReason ? (
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {profile.rejectionReason}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <PrimaryButton
                          fullWidth={false}
                          disabled={isSubmitting}
                          onClick={() => moderateProfile(profile.id, "approve")}
                        >
                          Approve
                        </PrimaryButton>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => moderateProfile(profile.id, "reject")}
                          className="rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => moderateProfile(profile.id, "delete")}
                          className="rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </Card>
      </div>
    </main>
  );
}
