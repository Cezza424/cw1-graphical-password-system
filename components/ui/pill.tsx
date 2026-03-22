import type { HTMLAttributes } from "react";

type PillTone = "amber" | "emerald" | "sky" | "zinc";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
};

const TONE_CLASS: Record<PillTone, string> = {
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
};

export function Pill({ tone = "amber", className, children, ...rest }: PillProps) {
  const classes = `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASS[tone]} ${className ?? ""}`.trim();

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}

