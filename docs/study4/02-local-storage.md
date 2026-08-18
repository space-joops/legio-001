# 2. JavaScript & LocalStorage: 데이터 저장소 접근과 관리

이번엔 자바스크립트(JS/TS)로 브라우저에 데이터를 어떻게 저장하는지 알아볼게요. 우리 프로젝트의 핵심 데이터 저장 방식이랍니다!

## 2-1. LocalStorage란 무엇일까요?

LocalStorage는 웹 브라우저 안에 있는 **'작은 창고'** 같은 거예요. 앱을 껐다 켜도 데이터가 사라지지 않고 그대로 남아있죠. 우리 앱(`legio-001`)에서 사용자의 프로필, 설정, 기록 등을 저장할 때 바로 이 창고를 씁니다.

## 2-2. 데이터를 다루는 3가지 마법 주문

브라우저가 기본적으로 제공하는 3가지 함수만 알면 됩니다.

1. **저장하기:** `localStorage.setItem('이름표', '넣을 물건')`
2. **꺼내오기:** `localStorage.getItem('이름표')`
3. **버리기:** `localStorage.removeItem('이름표')`

## 2-3. 실무에서는 어떻게 쓸까? (우리 코드 예제)

실제 우리 프로젝트의 `src/lib/storage.ts` 파일을 보면, 더 안전하게 사용하기 위해 코드를 잘 포장해 두었어요.

```typescript
// src/lib/storage.ts 일부

// 1. 창고에 붙일 이름표(키)들을 미리 정해둡니다. 오타 방지용!
const KEYS = {
  profile: "legioMariae.profile",
  settings: "legioMariae.settings",
  // ... 생략
};

// 2. 창고에 넣을 때 쓰는 함수
export function saveProfile(profile: Profile): void {
  // 객체(Object) 형태를 텍스트(String)로 변환해서 저장해야 해요!
  // JSON.stringify()가 그 역할을 해줍니다.
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// 3. 창고에서 꺼낼 때 쓰는 함수
export function loadProfile(): Profile | null {
  const data = localStorage.getItem(KEYS.profile);
  if (!data) return null; // 창고에 아무것도 없으면 null 반환

  // 텍스트를 다시 객체로 조립해줍니다!
  return JSON.parse(data);
}
```

**강사의 친절한 팁 💡 (매우 중요!)**
로컬 스토리지는 오직 **문자열(String)**만 저장할 수 있어요.
그래서 복잡한 데이터(배열이나 객체)를 넣을 때는 반드시 `JSON.stringify()`로 문자로 포장하고,
꺼낼 때는 `JSON.parse()`로 다시 원래 형태로 풀어줘야 한답니다.

---

### 💻 직접 해보는 실습 문제!

**문제 1:** 오늘 공부한 내용을 복습해볼까요? 사용자의 '테마(다크모드/라이트모드)' 설정을 저장하고 불러오는 함수를 완성해보세요.

```javascript
// 1. 다크모드 설정 저장하기
function saveTheme(themeName) {
  // 'myApp.theme' 라는 이름표로 저장해보세요.
  localStorage.________('myApp.theme', themeName);
}

// 2. 저장된 테마 불러오기
function getTheme() {
  // 'myApp.theme' 이름표의 값을 꺼내오세요.
  return localStorage.________('myApp.theme');
}

// 사용 예시
saveTheme('dark');
console.log(getTheme()); // 'dark' 출력
```

**정답 (드래그해서 확인하세요):**
setItem, getItem
