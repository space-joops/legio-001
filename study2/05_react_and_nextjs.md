# 5. React 컴포넌트와 상태 관리 (Next.js & React)

React는 UI를 독립적이고 재사용 가능한 조각(컴포넌트)으로 나누어 만듭니다.

## 기본 컴포넌트 구조

실제 코드 예시 (`src/components/BottomNav.tsx`):
```tsx
"use client"; // Next.js에게 이 컴포넌트가 브라우저(클라이언트)에서 실행된다고 알려줍니다.

import Link from "next/link";
import styles from "./BottomNav.module.css";

// 함수형 컴포넌트 선언
export function BottomNav() {
  return (
    // className에 CSS 모듈에서 가져온 스타일을 적용합니다.
    <nav className={styles.nav}>
      <Link href="/" className={styles.item}>
        <span>홈</span>
      </Link>
      <Link href="/history" className={styles.item}>
        <span>기록</span>
      </Link>
    </nav>
  );
}
```

## 동적 클래스 변경 (상태에 따른 스타일 변화)

현재 페이지의 주소(URL)에 따라 메뉴가 '활성화' 된 것처럼 보이게 색을 바꾸는 방법입니다.

```tsx
import { usePathname } from "next/navigation"; // 현재 경로를 가져오는 훅

export function BottomNav() {
  const pathname = usePathname(); // 예: "/history"

  return (
    <nav className={styles.nav}>
      {/* 조건부 클래스 이름 부여: 현재 경로가 "/" 이면 itemActive 클래스를 추가합니다. */}
      <Link href="/" className={`${styles.item} ${pathname === "/" ? styles.itemActive : ""}`}>
        <span>홈</span>
      </Link>
    </nav>
  );
}
```
* **초보자 팁:** `${}` 문법(템플릿 리터럴)을 사용하면 문자열 안에 자바스크립트 변수나 식을 쉽게 넣을 수 있습니다.

## 상태 관리 (React Hooks)

데이터가 바뀌었을 때 화면을 다시 그리게 하려면 `useState` 훅을 사용합니다.
(이 프로젝트에서는 `useHistory` 등의 커스텀 훅이 내부적으로 `useState`와 로컬 스토리지를 연결해 사용하고 있습니다.)
