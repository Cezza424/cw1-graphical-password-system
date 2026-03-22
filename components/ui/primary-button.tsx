import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ fullWidth = true, className, children, ...rest }: PrimaryButtonProps) {
  const widthClass = fullWidth ? "w-full" : "";
  const classes = `${widthClass} rounded-full bg-amber-500 px-5 py-3 text-sm font-bold text-amber-950 shadow-[0_6px_0_rgba(133,92,0,0.9)] transition-transform hover:scale-[1.01] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`.trim();

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

