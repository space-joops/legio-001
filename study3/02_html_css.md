# 2. HTML과 CSS 마스터하기

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
