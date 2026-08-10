"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./Toast.module.css";

/**
 * 화면 아래에 잠깐 떴다 사라지는 알림(토스트)을 앱 전체에 제공한다.
 *
 * 쓰는 쪽에서는 `const { showToast } = useToast()` 한 줄이면 된다.
 * `DisplayPreferencesProvider` 와 똑같은 Context 4단 구조로 되어 있다.
 */

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    // 4s, not the usual 2.5s: the audience skews older and some messages are
    // full sentences (import errors, undo hints) that need time to read.
    timerRef.current = setTimeout(() => setMessage(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.region} aria-live="polite" role="status">
        {message && <div className={styles.toast}>{message}</div>}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
