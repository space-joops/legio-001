# 3. 로컬 스토리지와 데이터 관리

웹 브라우저의 `localStorage`를 사용하면 사용자가 앱을 껐다 켜도 데이터가 유지됩니다.
이 프로젝트에서는 `src/lib/storage.ts` 파일에서 이 모든 것을 관리합니다.

## 3.1 데이터를 읽고 쓰는 기본 구조

**실제 코드 예제: `src/lib/storage.ts`**
```typescript
// 데이터를 읽어오는 공통 함수
function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback; // 브라우저 환경이 아니면(서버 등) 기본값 반환
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T; // 문자열을 자바스크립트 객체로 변환
  } catch {
    return fallback; // 에러가 나면 기본값 반환
  }
}

// 데이터를 저장하는 공통 함수
function writeJson<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    // 자바스크립트 객체를 문자열로 변환하여 저장
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // 저장 공간 부족 등의 에러 처리
  }
}
```

## 3.2 데이터 접근 및 관리하기

`storage` 객체를 통해 구체적인 데이터를 관리합니다.

```typescript
export const storage = {
  // 프로필 가져오기
  getProfile(): Profile {
    // 기존에 저장된 데이터가 없으면 DEFAULT_PROFILE과 합쳐서 반환
    return { ...DEFAULT_PROFILE, ...readJson<Partial<Profile>>(KEYS.profile, {}) };
  },

  // 프로필 저장하기
  setProfile(profile: Profile): void {
    writeJson(KEYS.profile, profile);
  }
};
```

### 👩‍💻 이렇게 활용해보세요!
새로운 데이터를 저장하고 싶다면?
1. `KEYS` 객체에 새로운 키를 추가합니다 (예: `myNewData: "legioMariae.myNewData"`).
2. `storage` 객체 안에 `getMyData()`와 `setMyData()` 함수를 만듭니다.
