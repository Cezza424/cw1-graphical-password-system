import type { HTMLAttributes } from "react";

type CardTone = "default" | "muted" | "gradient";
type CardPadding = "sm" | "md" | "lg";
type CardElement = "div" | "section" | "aside" | "article";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  tone?: CardTone;
  padding?: CardPadding;
};

const TONE_CLASS: Record<CardTone, string> = {
  default: "border border-zinc-200/70 bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/90",
  muted: "border border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/70",
  gradient:
    "border border-zinc-200 bg-linear-to-br from-amber-100/80 to-emerald-100/60 dark:border-zinc-700 dark:from-amber-950/30 dark:to-emerald-950/20",
};

const PADDING_CLASS: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-8",
};

export function Card({
  as: Element = "div",
  tone = "default",
  padding = "md",
  className,
  children,
  ...rest
}: CardProps) {
  const classes = `rounded-3xl ${TONE_CLASS[tone]} ${PADDING_CLASS[padding]} ${className ?? ""}`.trim();

  return (
    <Element className={classes} {...rest}>
      {children}
    </Element>
  );
}

