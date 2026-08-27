"use client";
import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const colors: Record<ToastType, string> = {
    success: "bg-[#065F46] text-white",
    error:   "bg-red-600 text-white",
    info:    "bg-[#185FA5] text-white",
    warning: "bg-[#BA7517] text-white",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto max-w-sm rounded-xl px-5 py-3 text-sm font-medium shadow-lg",
              "animate-fade-in",
              colors[t.type]
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
