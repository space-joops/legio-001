# 1. Next.js와 React 기초

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
