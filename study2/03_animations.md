# 3. 애니메이션 효과 주고 바꾸기 (CSS 애니메이션)

버튼을 누르거나 창이 뜰 때 부드럽게 움직이도록 애니메이션을 추가할 수 있습니다.

## @keyframes 로 애니메이션 정의하기

애니메이션의 시작(from)과 끝(to), 혹은 진행률(0% ~ 100%)에 따른 상태를 정의합니다.

실제 코드 예시 (`src/components/SplashOverlay.module.css`):
```css
@keyframes riseIn {
  from {
    opacity: 0; /* 처음에는 투명하게 */
    transform: scale(0.97); /* 약간 작게 시작 */
  }
  to {
    opacity: 1; /* 선명하게 */
    transform: scale(1); /* 원래 크기로 */
  }
}
```

## 애니메이션 적용하기

정의한 키프레임 이름을 사용해 요소에 효과를 줍니다.

```css
.image {
  /* riseIn 애니메이션을 0.4초 동안 부드럽게(ease-out) 실행 */
  animation: riseIn 400ms ease-out both;
}
```

## 사용자 환경 고려 (접근성)

움직임을 어지러워하는 사용자를 위해, 기기 설정에서 '움직임 줄이기'를 켰다면 애니메이션을 끄는 것이 좋은 웹 개발의 기본입니다.
```css
@media (prefers-reduced-motion: reduce) {
  .image {
    animation: none; /* 애니메이션 제거 */
  }
}
```
