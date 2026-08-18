# 3. React & Next.js: 컴포넌트와 화면 그리기

자, 마지막 챕터입니다! 우리가 지금까지 배운 CSS와 JS를 묶어서 레고 블록처럼 조립할 수 있게 해주는 기술이 바로 React입니다. 우리 프로젝트는 React를 기반으로 만들어진 **Next.js** 프레임워크를 사용하고 있어요.

## 3-1. React 컴포넌트 만들기

React에서는 화면의 일부분(버튼, 헤더, 리스트 등)을 하나의 '함수'로 만들어요. 이것을 **컴포넌트(Component)** 라고 부릅니다. 우리 코드의 `Header.tsx` 파일을 살펴볼까요?

```tsx
// src/components/Header.tsx
import styles from "./Header.module.css";

// Header라는 이름의 컴포넌트 함수입니다.
// title(제목), wide(넓게 볼건지 여부)를 외부에서 받아옵니다 (이것을 Props라고 불러요!)
export function Header({ title, wide }: { title: string; wide?: boolean }) {
  return (
    // HTML과 비슷하게 생겼죠? JSX 문법이라고 부릅니다.
    // CSS Module로 가져온 스타일은 styles.클래스명 형태로 사용해요.
    <header className={styles.header} data-app-chrome>
      <div className={`${styles.inner} ${wide ? styles.wide : ""}`}>
        <h1 className={styles.title}>{title}</h1>
      </div>
    </header>
  );
}
```

## 3-2. CSS Modules 란?

코드 첫 줄에 `import styles from "./Header.module.css";` 가 있죠?
이게 바로 CSS Module이라는 건데, 각 컴포넌트마다 독립적인 CSS 이름을 만들어주는 마법사예요. 다른 컴포넌트에서 똑같이 `.title` 이라는 클래스를 써도 절대 서로 엉키지 않는답니다. 아주 편하죠?

## 3-3. Next.js App Router (간단한 맛보기)

우리 프로젝트 폴더를 보면 `src/app` 이라는 폴더가 있어요.
Next.js는 이 폴더 안의 `page.tsx` 파일들을 기준으로 자동으로 웹 주소(URL 라우팅)를 만들어줍니다. 정말 똑똑하죠!

- `src/app/page.tsx` -> 내 사이트의 메인 화면 (`/`)
- `src/app/settings/page.tsx` -> 설정 화면 (`/settings`)

---

### 💻 직접 해보는 실습 문제!

**문제 1:** 여러분만의 멋진 버튼 컴포넌트를 만들어보세요. 버튼 안에 들어갈 글씨를 `text`라는 이름으로 받아오게 작성해봅시다.

```tsx
// 1. MyButton 컴포넌트 만들기
export function MyButton({ ______ }: { text: string }) {
  return (
    // 2. 받아온 text 변수를 화면에 보여주기 (중괄호 사용!)
    <button className="my-btn">
      {______}
    </button>
  );
}

// 3. 사용하기 (상상해보세요)
// <MyButton text="클릭하세요!" />
```

**정답 (드래그해서 확인하세요):**
text, text

---
수고하셨습니다! 여기까지 잘 따라오셨다면 여러분은 이미 훌륭한 초급 웹 개발자입니다. 코드는 직접 수정해보고 망가뜨려보면서 가장 빨리 배운답니다. 우리 프로젝트의 코드들을 마음껏 가지고 놀아보세요! 화이팅! 🚀
