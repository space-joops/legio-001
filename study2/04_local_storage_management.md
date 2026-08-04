# 4. 로컬 스토리지 접근 및 관리 (상태 및 데이터 저장)

이 프로젝트는 백엔드 서버(DB) 없이 기기의 브라우저 저장소인 `localStorage`를 사용하여 데이터를 저장합니다.
따라서 오프라인에서도 동작할 수 있습니다.

## LocalStorage 란?

사용자 브라우저에 텍스트 형태로 데이터를 저장하는 기능입니다. 껐다 켜도 데이터가 유지됩니다.

## 데이터 저장과 읽기

저장할 때는 문자열이어야 하므로 `JSON.stringify()`로 변환하고, 읽을 때는 `JSON.parse()`로 되돌립니다.

실제 코드 예시 (`src/lib/storage.ts`):
```typescript
// 데이터 읽기 함수
function readJson<T>(key: string, fallback: T): T {
  // 브라우저 환경인지 확인합니다 (Next.js는 서버에서도 코드를 실행하기 때문)
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback; // 저장된 게 없으면 기본값 반환
    return JSON.parse(raw) as T; // 문자열을 자바스크립트 객체로 변환
  } catch {
    return fallback;
  }
}

// 데이터 저장 함수
function writeJson<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 객체를 문자열로 변환하여 저장
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // 용량 부족이나 사파리 개인정보 보호 모드 등으로 저장이 실패할 경우를 대비한 예외 처리
    return false;
  }
}
```

## 데이터 관리 구조

이 프로젝트에서는 여러 데이터를 다루기 쉽게 하나의 `storage` 객체로 묶어서 관리합니다.
```typescript
export const storage = {
  getProfile(): Profile {
    // 저장된 데이터가 불완전할 수 있으므로, 기본값(DEFAULT_PROFILE)과 합쳐서(merge) 반환합니다.
    return { ...DEFAULT_PROFILE, ...readJson("legioMariae.profile", {}) };
  },
  setProfile(profile: Profile): void {
    writeJson("legioMariae.profile", profile);
  }
};
```
