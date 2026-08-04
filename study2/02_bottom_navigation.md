# 2. 하단 고정 및 배치 (Bottom Navigation 만들기)

웹 앱이나 모바일 앱에서 메뉴를 화면 하단에 고정하는 방법입니다.

## CSS로 요소 하단에 고정하기

`position: fixed;` 속성을 사용하면 스크롤을 해도 항상 같은 위치에 남아있게 됩니다.

실제 코드 예시 (`src/components/BottomNav.module.css`):
```css
.nav {
  position: fixed; /* 요소를 화면에 고정합니다 */
  left: 0;
  right: 0;
  bottom: 0; /* 화면의 맨 아래에 붙입니다 */

  display: flex; /* 내부 요소(버튼들)를 가로로 나열하기 위해 Flexbox를 사용합니다 */
  background: var(--color-surface);

  /* 아이폰 등에서 화면 하단 안전 영역을 피하기 위해 환경 변수 사용 */
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Flexbox를 활용한 버튼 배치

각 버튼들이 똑같은 공간을 나눠 갖게 하려면 `flex: 1;`을 사용합니다.

```css
.item {
  flex: 1; /* 남은 공간을 공평하게 1 비율로 나눠 가집니다 */
  display: flex;
  flex-direction: column; /* 아이콘과 글자를 세로로 배치합니다 */
  align-items: center; /* 가로 기준 중앙 정렬 */
  justify-content: center; /* 세로 기준 중앙 정렬 */
}
```
* **아래로 붙을 땐 어떻게 하는지:** `bottom: 0;`과 `position: fixed;` (또는 `absolute;`)를 조합하면 요소가 항상 부모나 화면의 하단에 착 달라붙게 됩니다.
