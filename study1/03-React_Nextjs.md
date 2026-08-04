# ⚛️ 3. React와 Next.js로 화면에 생명 불어넣기

이 프로젝트는 **React**라는 기술을 기반으로, 더 쉽고 빠르게 웹을 만들 수 있게 도와주는 **Next.js**라는 프레임워크를 사용했습니다. 코드를 보며 핵심 개념 3가지를 배워봅시다.

---

## 📌 1. Next.js App Router와 `layout.tsx`

Next.js 최신 버전(App Router)에서는 `src/app` 폴더 안에 있는 파일들이 실제 웹사이트의 주소가 됩니다.
예를 들어 `src/app/page.tsx`는 첫 화면(홈)이고, `src/app/settings/page.tsx`는 `/settings` 주소로 들어갔을 때 보이는 화면입니다.

그런데 모든 페이지마다 공통으로 들어가는 뼈대가 있겠죠? (글꼴, 기본 테마 등) 그걸 담당하는 것이 `src/app/layout.tsx` 입니다.

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 모든 페이지의 내용은 이 children 자리로 들어오게 됩니다! */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 📌 2. `"use client"`는 언제 붙일까?

파일들을 보다 보면 맨 위에 `"use client";` 라고 적힌 것들이 있습니다. (`src/components/LanguageToggle.tsx` 등)
Next.js는 기본적으로 컴퓨터(서버)가 미리 HTML 화면을 다 그려서(렌더링) 사용자에게 보내줍니다. 엄청 빠르죠!

하지만 사용자가 **버튼을 클릭**하거나, **글자를 입력**하거나, **브라우저의 기능(로컬 스토리지 등)**을 써야 한다면? 이것은 사용자의 휴대폰이나 컴퓨터(클라이언트)에서 직접 실행되어야 합니다.
그럴 때 "이 컴포넌트는 사용자의 브라우저에서 동작하게 해줘!" 라고 Next.js에게 알려주는 주문이 바로 `"use client"` 입니다.

---

## 📌 3. React의 핵심: 상태(State)와 변화(Effect)

버튼을 눌렀을 때 숫자가 올라가거나, 화면이 바뀌는 것은 어떻게 만들까요?
React의 마법 지팡이 두 개, `useState`와 `useEffect`를 사용합니다.

`src/hooks/useLocalStorageReady.ts` 파일과 `src/components/LanguageToggle.tsx`를 단순화해서 설명해 드릴게요.

### 🪄 1) `useState`: 변하는 값을 기억하는 마법
일반 변수(`let a = 1`)는 값이 바뀌어도 화면이 다시 그려지지 않습니다. 하지만 `useState`를 쓰면, 값이 바뀔 때마다 React가 화면을 **자동으로 새로 그려줍니다.**

```tsx
import { useState } from 'react';

function Counter() {
  // count는 현재 값(처음엔 0), setCount는 값을 바꿀 때 쓰는 스위치입니다.
  const [count, setCount] = useState(0);

  return (
    // 버튼을 누를 때마다 setCount를 사용해 count를 1씩 올립니다. 화면도 바뀝니다!
    <button onClick={() => setCount(count + 1)}>
      현재 숫자: {count}
    </button>
  );
}
```

### 🪄 2) `useEffect`: 무언가 변했을 때(또는 처음 켜졌을 때) 행동하는 마법
어떤 화면이 처음 켜졌을 때 딱 한 번만 데이터를 불러오거나, 특정 값이 변할 때마다 무언가 하고 싶을 때 씁니다.

```tsx
import { useState, useEffect } from 'react';

export function useLocalStorageReady() {
  const [ready, setReady] = useState(false);

  // useEffect 안에 있는 코드는 화면이 맨 처음 그려진 직후에 실행됩니다.
  useEffect(() => {
    // 처음에 false였던 ready 값을 true로 바꿉니다!
    setReady(true);
  }, []); // 💡 끝에 있는 빈 배열 []은 "처음 켜질 때 딱 한 번만 실행해!" 라는 뜻입니다.

  return ready;
}
```

**🤔 왜 저렇게 할까요?**
앞서 설명했듯 Next.js는 화면을 미리 그려옵니다(서버). 하지만 로컬 스토리지는 브라우저(클라이언트)에만 있죠.
서버에서 그린 화면과 브라우저에 있는 데이터가 다르면 에러가 납니다!
그래서 `useEffect`를 이용해 "브라우저에 화면이 잘 켜졌어?(ready = true)"를 확인한 다음, 그때부터 진짜 데이터를 보여주도록 안전장치를 건 것입니다.

---

수고하셨습니다! 이제 HTML/CSS로 꾸미고, JS로 데이터를 다루고, React/Next.js로 화면을 움직이는 기본 원리를 모두 살펴보았습니다.
이제 배운 내용을 바탕으로 직접 코드를 조금씩 수정해 보면서 여러분만의 기능을 만들어보세요! 🎉
