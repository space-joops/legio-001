"use client";

import { useToast } from "./ToastProvider";
import styles from "./ShareButton.module.css";

/**
 * 보고 내용을 카카오톡 등으로 내보내는 버튼.
 *
 * 휴대폰에서는 운영체제의 공유 시트를 띄우고, 그 기능이 없는 PC 브라우저에서는
 * 클립보드 복사로 대신한다. 어느 쪽이 됐는지 토스트로 알려 준다.
 */

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const { showToast } = useToast();

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(url ? { title, text, url } : { title, text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
      showToast("보고 내용이 복사되었습니다.");
    } catch {
      // clipboard unavailable; nothing more we can do here
    }
  };

  return (
    <button type="button" className={styles.button} onClick={handleShare}>
      공유하기
    </button>
  );
}
