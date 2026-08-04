# 1. CSS 기초: 여백, 위치 지정, 그리고 애니메이션

안녕하세요! 첫 번째 시간입니다. 화면을 예쁘게 꾸미는 CSS에 대해 알아볼게요. 실제 우리 프로젝트에 쓰인 코드를 보면서 설명해드릴 테니 천천히 따라와 주세요.

## 1-1. 요소 아래로 딱! 붙이기 (`position: fixed`)

모바일 앱을 보면 화면 맨 아래에 홈, 설정 같은 메뉴가 항상 떠 있죠? 우리 프로젝트의 `BottomNav.module.css` 파일을 보면 그 비밀을 알 수 있어요.

```css
/* src/components/BottomNav.module.css */
.nav {
  position: fixed;   /* 화면의 특정 위치에 고정할 거야! */
  left: 0;           /* 왼쪽 끝에서 0만큼 떨어져서 (즉, 왼쪽 끝에 딱 붙어서) */
  right: 0;          /* 오른쪽 끝에서 0만큼 떨어져서 */
  bottom: 0;         /* 바닥에서 0만큼 떨어져서 (바닥에 딱 붙어서!) */

  display: flex;     /* 안의 내용물들을 나란히 배치할게 */
  background: var(--color-surface); /* 배경색 지정 */
  z-index: 20;       /* 다른 요소들보다 위에 나타나게 할게 */
}
```

**강사의 친절한 팁 💡**
`position: fixed`를 사용하면 스크롤을 내려도 항상 그 자리에 남아있어요. `top`, `bottom`, `left`, `right` 속성과 함께 짝꿍처럼 쓰인답니다. 만약 화면 맨 위에 고정하고 싶다면 `bottom: 0;` 대신 `top: 0;`을 쓰면 되겠죠?

## 1-2. 여백 조정하기 (Padding & Min-height)

여백을 주는 건 아주 중요해요. 글씨가 화면 끝에 딱 붙어있으면 답답해 보이거든요.

```css
.nav {
  /* 아이폰 하단 홈 인디케이터(안전 영역)를 고려한 최소 높이 설정 */
  min-height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  /* 안쪽 아래 여백 주기 */
  padding-bottom: env(safe-area-inset-bottom);
}

.item {
  /* 위아래 8px(var(--space-1)), 양옆 4px 여백 */
  padding: var(--space-1) 4px;
}
```

**강사의 친절한 팁 💡**
- `margin`은 바깥쪽 여백 (나와 옆사람 사이의 거리)
- `padding`은 안쪽 여백 (내 옷의 두께)
기억하세요!

## 1-3. 마법 같은 애니메이션 효과 주기 (`@keyframes`)

화면이 짠! 하고 나타나게 하려면 애니메이션이 필요해요. `SplashOverlay.module.css` 파일을 볼까요?

```css
/* src/components/SplashOverlay.module.css */
@keyframes fadeIn {
  from { opacity: 0; } /* 처음엔 투명도 0 (안 보임) */
  to   { opacity: 1; } /* 끝날 땐 투명도 1 (완전 잘 보임) */
}

.dialog {
  /* fadeIn 애니메이션을 0.4초(400ms) 동안 부드럽게(ease-out) 실행해! */
  animation: fadeIn 400ms ease-out both;
}
```

`@keyframes` 이름(여기선 `fadeIn`)을 정해주고, `from`에서 `to`로 어떻게 변할지 적어줍니다. 그리고 이걸 적용하고 싶은 곳에 `animation: 이름 시간 옵션` 형태로 써주면 끝이에요!

---

### 💻 직접 해보는 실습 문제!

**문제 1:** 화면 맨 위에 고정되는 "공지사항 바"를 만들고 싶어요. CSS를 어떻게 작성해야 할까요?
```css
.topBar {
  position: ________;
  top: ____;
  left: 0;
  right: 0;
  background-color: yellow;
}
```

**문제 2:** 글자가 파란색에서 빨간색으로 1초 동안 변하는 애니메이션을 만들어보세요.
```css
@keyframes colorChange {
  from { color: blue; }
  to { color: ________; }
}

.myText {
  animation: ________ 1s ease-in;
}
```

**정답 (드래그해서 확인하세요):**
문제1: fixed, 0
문제2: red, colorChange
