import os

def create_study_docs():
    docs_dir = "study3"
    os.makedirs(docs_dir, exist_ok=True)

    # 00. 표지 및 학습 계획
    with open(f"{docs_dir}/00_cover.md", "w", encoding="utf-8") as f:
        f.write("""# 레지오 마리애 앱(legio-001) 코드 분석 및 학습 가이드 🚀

초보 웹 개발자를 위한 React, Next.js, 그리고 프론트엔드 핵심 기술 마스터하기!

## 📚 학습 목차

1. **[Next.js와 React 기초 (01_react_nextjs.md)](./01_react_nextjs.md)**
   - 프로젝트 구조 이해 (`app` 디렉토리, `layout.tsx`)
   - 컴포넌트(Component)란 무엇인가?
   - 상태 관리(`useState`, `useEffect`)와 `use client` 지시어
2. **[HTML과 CSS 마스터하기 (02_html_css.md)](./02_html_css.md)**
   - CSS 모듈(`*.module.css`) 사용법
   - 여백 조정 (Margin, Padding, Gap)
   - 요소 배치 (Flexbox로 아래로 붙이기, 가운데 정렬)
   - 애니메이션 효과 (`@keyframes`, `transition`)
3. **[로컬 스토리지와 데이터 관리 (03_local_storage.md)](./03_local_storage.md)**
   - 브라우저 로컬 스토리지(`localStorage`) 접근 방법
   - 커스텀 훅(`useLocalStorageReady`, `useCurrentReport`) 만들기
   - 예외 처리와 데이터 스키마 관리
4. **[고급 기능 및 설정 (04_advanced.md)](./04_advanced.md)**
   - 다국어 처리 (i18n)
   - PWA (Progressive Web App) 오프라인 지원
   - 린팅(ESLint)과 빌드 스크립트

---
💡 **학습 팁:** 각 문서에는 실제 코드 예제가 포함되어 있습니다. 직접 코드를 수정해보고 브라우저에서 어떻게 변하는지 확인해 보세요!
""")

    # 01. React & Next.js 기초
    with open(f"{docs_dir}/01_react_nextjs.md", "w", encoding="utf-8") as f:
        f.write("""# 1. Next.js와 React 기초

## 1.1 `use client`와 컴포넌트
Next.js 13부터는 '서버 컴포넌트'가 기본입니다. 사용자와 상호작용(클릭, 상태 변화 등)이 필요한 컴포넌트는 파일 맨 위에 `"use client";`를 적어주어야 합니다.

**실제 코드 예제: `src/hooks/useLocalStorageReady.ts`**
```typescript
"use client"; // 이 파일은 클라이언트(브라우저)에서 실행됨을 선언합니다.

import { useEffect, useState } from "react";

export function useLocalStorageReady(): boolean {
  // 상태 변수 'ready' 선언. 초기값은 false
  const [ready, setReady] = useState(false);

  // 컴포넌트가 화면에 나타날 때(마운트될 때) 한 번 실행됨
  useEffect(() => {
    setReady(true); // ready 값을 true로 변경
  }, []); // 빈 배열 []은 이 코드가 처음에 딱 한 번만 실행됨을 의미합니다.

  return ready;
}
```

### 👩‍💻 직접 수정해보기!
- `useState(false)`를 `useState(true)`로 바꿔보세요. 어떤 문제가 생길까요? (로컬 스토리지를 읽기 전에 준비된 것으로 착각해서 오류가 날 수 있습니다.)

## 1.2 재사용 가능한 UI 블록 만들기
버튼, 입력창 등을 하나의 '컴포넌트'로 만들어서 여러 곳에서 재사용합니다.

**실제 코드 예제: `src/components/CounterButton.tsx` 구조 (요약)**
```tsx
import styles from './CounterButton.module.css';

export function CounterButton({ count, label }) {
  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.unit}>{label}</span>
      </div>
      {/* 탭할 수 있는 영역 */}
      <button className={styles.tapArea}>
        <span className={styles.count}>{count}</span>
      </button>
    </div>
  );
}
```
""")

    # 02. HTML & CSS
    with open(f"{docs_dir}/02_html_css.md", "w", encoding="utf-8") as f:
        f.write("""# 2. HTML과 CSS 마스터하기

이 프로젝트는 **CSS Modules**(`*.module.css`)를 사용하여 스타일이 다른 컴포넌트와 충돌하지 않도록 합니다.

## 2.1 여백 조정과 배치 (Margin, Padding, Flexbox)

**실제 코드 예제: `src/components/CounterButton.module.css`**
```css
.card {
  background: var(--color-surface); /* 변수 사용 */
  border-radius: var(--radius-lg);

  /* Padding(안쪽 여백): 상하좌우 안쪽으로 공간을 만듭니다 */
  padding: var(--space-3);

  /* Flexbox 사용: 요소들을 세로(column)로 배치 */
  display: flex;
  flex-direction: column;

  /* Gap(요소 사이 간격): flex 자식 요소들 사이의 간격 */
  gap: var(--space-2);
}

.textLink {
  /* Margin-left: auto -> 왼쪽 여백을 자동으로 채워 요소를 '오른쪽 끝'으로 밀어냅니다 */
  margin-left: auto;
}
```

### 💡 요소를 아래로 붙이는 방법 (Sticky / Flex)
화면 맨 아래에 버튼을 고정하고 싶다면?
```css
.bottomButton {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}
/* 또는 Flexbox 활용 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.content {
  flex-grow: 1; /* 남은 공간을 모두 차지함 */
}
.bottomButton {
  /* 자동으로 맨 아래에 위치하게 됩니다 */
}
```

## 2.2 애니메이션 효과 주기

**실제 코드 예제: `src/components/SplashOverlay.module.css`**
```css
.dialog {
  /* fadeIn 애니메이션을 400ms 동안 부드럽게(ease-out) 실행 */
  animation: fadeIn 400ms ease-out both;
}

.leaving {
  /* fadeOut 애니메이션 */
  animation: fadeOut 600ms ease-in both;
}

/*
 * 주의: fadeIn과 fadeOut의 실제 프레임(keyframes)은
 * 이 프로젝트의 전역 CSS(global.css 등)에 정의되어 있을 가능성이 높습니다.
 * 예시:
 * @keyframes fadeIn {
 *   from { opacity: 0; }
 *   to { opacity: 1; }
 * }
 */
```

### 👩‍💻 직접 수정해보기!
- `animation: fadeIn 400ms ease-out both;` 에서 `400ms`를 `2000ms`(2초)로 바꿔보세요. 화면이 나타나는 속도가 어떻게 변하나요?
""")

    # 03. 로컬 스토리지
    with open(f"{docs_dir}/03_local_storage.md", "w", encoding="utf-8") as f:
        f.write("""# 3. 로컬 스토리지와 데이터 관리

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
""")

    # 04. 고급 기능
    with open(f"{docs_dir}/04_advanced.md", "w", encoding="utf-8") as f:
        f.write("""# 4. 고급 기능 및 기타 설정

## 4.1 다국어 처리 (i18n)
이 프로젝트는 `src/i18n/dictionaries/` 폴더에 언어별 사전 파일을 두고 있습니다.
사용자가 선택한 언어(한국어, 영어 등)에 따라 화면의 텍스트가 바뀝니다.

## 4.2 PWA (Progressive Web App) 오프라인 기능
사용자가 인터넷이 끊겨도 앱을 사용할 수 있게 해주는 마법입니다!
- `public/sw.js`: 서비스 워커 스크립트가 네트워크 요청을 가로채고, 캐시된(저장된) 파일을 보여줍니다.
- `scripts/generate-precache-manifest.mjs`: 빌드할 때 미리 저장해둘 파일 목록을 만드는 역할을 합니다. (`package.json`의 `"postbuild"` 스크립트를 보세요!)

## 4.3 빌드와 린팅
터미널에서 아래 명령어를 사용합니다:
- `npm run dev`: 개발용으로 실행합니다. 코드를 고치면 화면에 바로 반영됩니다.
- `npm run lint`: 코드에 문법적인 오류나 컨벤션(규칙)을 어긴 곳이 없는지 검사합니다.
- `npm run build`: 실제 서비스에 배포하기 위해 코드를 압축하고 최적화합니다. (`next.config.ts`의 `output: "export"` 설정에 따라 순수 HTML/CSS/JS로 만들어집니다.)
""")

if __name__ == "__main__":
    create_study_docs()
    print("Documentation generated successfully.")
