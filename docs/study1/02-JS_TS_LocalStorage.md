# 💾 2. JS/TS로 로컬 스토리지 안전하게 다루기

앱을 새로고침하거나 껐다 켜도 내가 올린 기도 횟수가 그대로 남아있죠? 이 앱은 별도의 서버(데이터베이스) 없이 여러분의 휴대폰(브라우저) 안에 있는 **'로컬 스토리지(Local Storage)'**라는 작은 창고에 데이터를 저장하기 때문입니다.

`src/lib/storage.ts` 파일을 보면서 어떻게 데이터를 저장하고 꺼내오는지 알아봅시다.

---

## 📌 1. 로컬 스토리지란?

로컬 스토리지는 인터넷 브라우저가 제공하는 기능입니다. 무조건 **글자(문자열, String)** 형태로만 저장할 수 있습니다.
그래서 객체나 배열 같은 복잡한 데이터를 저장할 때는 글자로 변환(포장)하고, 꺼낼 때는 다시 객체로 변환(포장 풀기)해야 합니다.

- `JSON.stringify(데이터)`: 데이터를 문자열(글자)로 포장합니다. (저장할 때)
- `JSON.parse(문자열)`: 문자열을 다시 원래 데이터(객체/배열)로 풀어줍니다. (꺼낼 때)

---

## 📌 2. 안전하게 데이터 읽어오기 (`readJson`)

`src/lib/storage.ts` 안에 있는 `readJson` 함수를 봅니다.

```typescript
function readJson<T>(key: string, fallback: T): T {
  // 1. 브라우저 환경인지 확인! (Next.js는 서버에서 먼저 코드를 실행하기 때문에 꼭 필요해요)
  if (!isBrowser()) return fallback;

  try {
    // 2. 창고(localStorage)에서 'key'라는 이름표를 가진 물건을 꺼냅니다.
    const raw = window.localStorage.getItem(key);

    // 3. 만약 그런 이름표가 없으면, 기본값(fallback)을 돌려줍니다.
    if (raw === null) return fallback;

    // 4. 문자열(raw)을 원래의 데이터 형태로 풀어서(parse) 돌려줍니다.
    return JSON.parse(raw) as T;
  } catch {
    // 5. 만약 풀다가 에러가 나면(데이터가 망가졌다면) 프로그램이 멈추지 않게 기본값을 줍니다.
    return fallback;
  }
}
```

**💡 포인트:** 초보자는 그냥 `localStorage.getItem()`만 쓰고 끝내는 경우가 많은데, 이렇게 `try...catch`를 사용하고 예외 상황(데이터가 없을 때 등)을 처리해야 진짜 튼튼한 앱이 됩니다!

---

## 📌 3. 안전하게 데이터 저장하기 (`writeJson`)

이번엔 데이터를 저장하는 함수를 볼까요?

```typescript
function writeJson<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    // 저장할 데이터(value)를 문자열로 포장(stringify)해서 창고에 넣습니다(setItem).
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // 휴대폰 용량이 꽉 찼거나, 아이폰 사파리의 '개인정보 보호 브라우징' 상태일 경우
    // 저장이 실패할 수 있습니다! 이때 에러를 던져서 앱을 끄지 않고, 실패했다고 알려만 줍니다.
    writeFailureListeners.forEach((listener) => listener());
    return false;
  }
}
```

---

## 📌 4. TypeScript(타입스크립트)는 왜 쓸까?

위 코드에서 `<T>` 나 `: string`, `: boolean` 같은 이상한 기호들이 보이나요? 이게 바로 **TypeScript**입니다!
자바스크립트(JS)에 '자료의 종류(타입)'를 강제로 지정해준 겁니다.

```typescript
// JS: "저장할 이름표(key) 줘!" (숫자를 주든, 배열을 주든 일단 받음 -> 나중에 에러 터짐)
function writeJson(key, value) { ... }

// TS: "저장할 이름표(key)는 무조건 '글자(string)'로만 줘! 다른 거 주면 실행 안 해줄 거야!"
function writeJson<T>(key: string, value: T): boolean { ... }
```

타입스크립트는 코드를 작성하는 도중에 "너 이거 잘못 넣었어!"라고 빨간 줄로 미리 알려주기 때문에, 초보자가 치명적인 버그를 만드는 것을 막아주는 아주 고마운 친구입니다.

```typescript
// 사용 예시
export const storage = {
  getSettings(): Settings {
    // 'legioMariae.settings' 라는 이름표로 데이터를 꺼내오고,
    // 만약 없으면 {} (빈 객체)를 바탕으로 DEFAULT_SETTINGS와 합칩니다.
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(KEYS.settings, {}) };
  }
}
```

이제 브라우저의 저장소를 다루는 원리를 알았으니, 다음에는 이 데이터를 눈에 보이는 화면(React)과 어떻게 연결하는지 알아보겠습니다!
👉 [03-React_Nextjs.md로 이동](./03-React_Nextjs.md)
