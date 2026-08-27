import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-3 flex items-center text-[var(--color-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// Textarea variant
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-all resize-none",
            "focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Select variant
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({ label, error, required, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-all appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]",
          error && "border-red-500",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
