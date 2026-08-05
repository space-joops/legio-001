# 1. 기본 설정 및 여백 조정 (CSS 여백과 배치)

웹 디자인에서 가장 중요한 것 중 하나는 화면을 어떻게 분할하고 여백을 조정하느냐입니다.
이 프로젝트에서는 `src/app/globals.css` 파일에서 공통 스타일과 변수를 정의합니다.

## CSS 변수(Variables) 사용하기

변수를 사용하면 색상, 크기, 여백 등을 한 곳에서 관리하여 일관성을 유지할 수 있습니다.

```css
:root {
  --color-background: #fafaf5;
  --color-text: #4a3a2a;

  /* 반응형 크기를 위해 rem 단위를 사용합니다. */
  --font-size-base: 1.1875rem;
  --space-1: 8px;
}
```
* **초보자 팁:** `:root`는 문서의 가장 상위 요소를 의미합니다. 여기에 변수(`--변수명`)를 선언하면 프로젝트 전체에서 재사용할 수 있습니다.

## 여백(Margin과 Padding)

* **Margin(마진):** 요소의 바깥쪽 여백입니다. 다른 요소와 거리를 둡니다.
* **Padding(패딩):** 요소의 안쪽 여백입니다. 요소의 테두리와 내부 컨텐츠 사이의 공간입니다.

실제 코드 예시 (`src/components/BottomNav.module.css`):
```css
.item {
  padding: var(--space-1) 4px; /* 위아래는 8px, 좌우는 4px 여백 */
  gap: 2px; /* Flexbox나 Grid 안에서 요소들 사이의 간격 */
}
```
* `gap` 속성은 Flexbox에서 요소 사이의 간격을 쉽게 조절할 때 매우 유용합니다.
