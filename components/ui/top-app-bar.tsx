import Link from "next/link";

type TopAppBarProps = {
  active: "login" | "admin";
};

export function TopAppBar({ active }: TopAppBarProps) {
  const isLogin = active === "login";
  const isAdmin = active === "admin";

  return (
    <header className="sticky top-0 z-50 rounded-b-3xl border-b border-zinc-200/80 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-300 sm:text-2xl">
          Emoji Login
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              isLogin
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Login
          </Link>
          <Link
            href="/admin"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              isAdmin
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

