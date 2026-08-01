"use client";

/**
 * Last-resort boundary. The app is a static export with no server, so an
 * uncaught render error would otherwise leave a blank white page with no way
 * back — worse than useless for the audience this app is built for. Text is
 * hardcoded Korean rather than going through useTranslation: the i18n provider
 * lives below this boundary and may be exactly what failed.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#fef7ff",
          color: "#1d1b20",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem" }}>
            화면을 표시하지 못했습니다
          </h1>
          <p style={{ fontSize: "1.1875rem", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
            아래 버튼을 눌러 다시 시도해 주세요. 기록된 활동 내용은 이 기기에 그대로 남아
            있습니다.
          </p>
          <p style={{ fontSize: "1.1875rem", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
            같은 화면이 계속 나오면 앱을 완전히 닫았다가 다시 열어 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "3.5rem",
              width: "100%",
              padding: "0 2rem",
              border: "none",
              borderRadius: "0.875rem",
              background: "#6750a4",
              color: "#ffffff",
              fontSize: "1.1875rem",
              fontWeight: 800,
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
