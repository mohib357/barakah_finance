import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "danger" | "gold";
type Size    = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary: "bg-[#1D9E75] hover:bg-[#0F6E56] text-white border-transparent shadow-sm",
  outline: "border-2 border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white bg-transparent",
  ghost:   "border border-[var(--color-border,#e2e8f0)] text-[var(--color-text)] hover:bg-[var(--color-surface)] bg-transparent",
  danger:  "bg-red-600 hover:bg-red-700 text-white border-transparent",
  gold:    "bg-[#C9A227] hover:bg-[#a67c00] text-[#0D2B1A] border-transparent font-bold",
};

const sizeClasses: Record<Size, string> = {
  sm:   "px-3 py-1.5 text-sm",
  md:   "px-4 py-2 text-sm",
  lg:   "px-6 py-3 text-base",
  icon: "p-2 w-9 h-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, leftIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
