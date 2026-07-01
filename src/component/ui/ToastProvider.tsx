"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

const styles: Record<
  ToastType,
  { bg: string; progress: string; Icon: typeof FaCheckCircle }
> = {
  success: {
    bg: "bg-emerald-500",
    progress: "bg-emerald-300",
    Icon: FaCheckCircle,
  },
  error: {
    bg: "bg-red-500",
    progress: "bg-red-300",
    Icon: FaExclamationCircle,
  },
  info: {
    bg: "bg-blue-500",
    progress: "bg-blue-300",
    Icon: FaInfoCircle,
  },
};

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { bg, progress, Icon } = styles[item.type];

  return (
    <div
      role="status"
      className={`relative min-w-[280px] max-w-sm overflow-hidden rounded-xl ${bg} px-4 py-3.5 text-white shadow-xl shadow-black/30`}
    >
      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon className="text-white" size={16} />
        </div>
        <p className="text-sm font-semibold leading-snug">{item.message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(item.id)}
        className="absolute right-3 top-3 text-white/80 hover:text-white"
      >
        <FaTimes size={12} />
      </button>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
        <div
          className={`h-full ${progress} toast-progress`}
          style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), TOAST_DURATION_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type?: ToastType }>)
        .detail;
      toast(message, type ?? "success");
    };
    window.addEventListener("snapmart-toast", handler);
    return () => window.removeEventListener("snapmart-toast", handler);
  }, [toast]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-20 z-[9999] flex flex-col gap-3 sm:right-6"
      >
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("snapmart-toast", { detail: { message, type } })
    );
  }
}
