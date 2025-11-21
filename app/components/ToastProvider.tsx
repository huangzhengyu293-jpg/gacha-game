"use client";

import React from "react";

type ToastVariant = "success" | "error";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = Required<ToastOptions> & { id: string };

type ToastContextValue = {
  show: (opts: ToastOptions) => void;
  close: (id: string) => void;
};

const Ctx = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// 全局 toast 函数（供非 React 组件使用）
let globalToastFn: ((opts: ToastOptions) => void) | null = null;

export function setGlobalToast(fn: (opts: ToastOptions) => void) {
  globalToastFn = fn;
}

export function showGlobalToast(opts: ToastOptions) {
  if (globalToastFn) {
    globalToastFn(opts);
  }
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastItem & { entering: boolean; closing: boolean }>>([]);

  const close = React.useCallback((id: string) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, closing: true } : t));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 280);
  }, []);

  const show = React.useCallback((opts: ToastOptions) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item: ToastItem & { entering: boolean; closing: boolean } = {
      id,
      title: opts.title ?? "",
      description: opts.description ?? "",
      variant: opts.variant ?? "success",
      durationMs: typeof opts.durationMs === "number" ? opts.durationMs : 2200,
      entering: true,
      closing: false,
    };
    setToasts((prev) => [...prev, item]);
    requestAnimationFrame(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, entering: false } : t));
    });
    // auto dismiss
    window.setTimeout(() => close(id), item.durationMs);
  }, [close]);

  // 注册全局 toast 函数
  React.useEffect(() => {
    setGlobalToast(show);
    return () => {
      setGlobalToast(() => {});
    };
  }, [show]);

  const value = React.useMemo<ToastContextValue>(() => ({ show, close }), [show, close]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Right-bottom stack */}
      <ol className="fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" style={{ bottom: 0, right: 0 }}>
        {toasts.map((t) => (
          <li
            key={t.id}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-6 pr-8 shadow-lg border-0 transition-transform duration-300 ease-out ${t.entering ? 'translate-x-full' : ''} ${t.closing ? 'translate-x-full' : 'translate-x-0'}`}
            style={{
              backgroundColor: t.variant === 'success' ? '#68D391' : '#EB4B4B',
              color: '#1D2125',
            }}
          >
            <div className="grid gap-1">
              {t.title ? <div className="text-base font-semibold">{t.title}</div> : null}
              {t.description ? <div className="text-base font-semibold leading-5">{t.description}</div> : null}
            </div>
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
              onClick={() => close(t.id)}
              aria-label="关闭"
              style={{ cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </li>
        ))}
      </ol>
    </Ctx.Provider>
  );
}


