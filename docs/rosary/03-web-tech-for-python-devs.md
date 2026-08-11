# 파이썬 개발자를 위한 묵주기도 웹 기술 가이드

이 문서는 파이썬에 익숙한 개발자가 묵주기도 기능(`src/components/RosaryGuide.tsx`, `src/lib/rosaryMysteries.ts` 등)의 코드를 쉽게 읽고, 유지보수할 수 있도록 돕기 위해 작성되었습니다.

최근 다국어(i18n) 지원 코드가 제거되면서 코드가 훨씬 단순해졌습니다. 이 가이드에서는 묵주기도 기능에 사용된 핵심 React/Next.js 개념들을 파이썬의 익숙한 개념들과 비교하며 설명합니다.

---

## 1. `"use client"`: 클라이언트 렌더링 (브라우저 전용 코드)

`RosaryGuide.tsx` 파일 맨 위를 보면 `"use client";` 라는 선언이 있습니다.

- **Next.js의 특징**: Next.js는 기본적으로 서버에서 HTML을 미리 만들어 내려줍니다(Server Component). 하지만 버튼 클릭, 스와이프 같은 사용자 상호작용이 필요하거나, 브라우저의 API(예: 오늘 날짜)를 확인해야 할 때는 브라우저에서 실행되는 컴포넌트가 필요합니다.
- **파이썬으로 비유하자면**: 서버 컴포넌트는 Jinja2나 Django 템플릿처럼 백엔드에서 렌더링되어 완성된 HTML 텍스트를 던져주는 역할입니다. 반면 `"use client"`는 이 코드가 사용자의 브라우저(프론트엔드) 메모리에 상주하며 상태(state)를 가지고 실행되는 객체임을 의미합니다.

## 2. 상태 관리: `useState` 와 `useRef`

React는 컴포넌트 내부에서 데이터를 보관하기 위해 두 가지 주요 훅(Hook)을 사용합니다.

### `useState` (화면을 다시 그리게 하는 상태)
```tsx
const [index, setIndex] = useState(0);
```
- **파이썬 비유**: 클래스의 인스턴스 변수(`self.index`)와 유사합니다. 하지만 중요한 차이점은, `setIndex()`를 호출하여 값을 변경하면 React가 **자동으로 화면(UI)을 다시 그린다(Render)**는 것입니다.
- 파이썬에서 `self.index = 1`을 한다고 터미널에 프린트된 내용이 바뀌지 않지만, React에서는 `setIndex(1)`을 호출하면 브라우저 화면이 `1`에 맞게 업데이트됩니다.

### `useRef` (화면 렌더링에 영향 없는 변수)
```tsx
const initRef = useRef(false);
initRef.current = true;
```
- **파이썬 비유**: 이것이야말로 완벽하게 파이썬 클래스의 일반 인스턴스 변수(`self.is_initialized = True`)와 같습니다.
- 값이 바뀌어도 화면을 다시 그리지 않습니다. "한 번만 실행됨", "타이머 ID 저장" 같은 내부 로직 제어용으로 사용합니다.

## 3. 사이드 이펙트: `useEffect`

```tsx
useEffect(() => {
  setMysteryId(getMysteryIdForDate(new Date()));
}, []);
```
- **파이썬 비유**: 클래스의 `__init__` 메서드(초기화) 또는 특정 값이 변할 때 자동으로 실행되는 콜백 함수와 유사합니다.
- 함수 끝에 있는 `[]` (의존성 배열)이 중요합니다.
  - `[]`: 처음 화면에 나타날 때(Mount) **딱 한 번만** 실행됩니다 (`__init__`).
  - `[mysteryId]`: `mysteryId` 값이 변경될 때마다 실행됩니다 (옵저버 패턴).
- **주의점**: 서버에서는 브라우저의 "오늘 날짜"를 알 수 없기 때문에, 화면이 브라우저에 마운트된 직후(`useEffect` 내부)에 날짜를 가져오도록 설계되었습니다.

## 4. 캐싱(메모이제이션): `useMemo`

```tsx
const steps = useMemo(() => {
  return buildRosarySteps(mysteryId);
}, [mysteryId]);
```
- **파이썬 비유**: `@functools.lru_cache`와 매우 비슷합니다!
- 묵주기도 화면 77장을 매번 계산하면 느려질 수 있습니다. `useMemo`는 의존성 배열(`[mysteryId]`)의 값이 바뀌지 않는 한, **이전에 계산해 둔 결과(캐시)를 그대로 재사용**합니다.
- 다국어가 제거되었으므로, 오직 `mysteryId`(오늘의 신비)가 바뀔 때만 배열을 다시 만듭니다.

## 5. CSS 모듈: `styles.guide`

```tsx
import styles from "./RosaryGuide.module.css";
// ...
<section className={styles.guide}>
```
- **파이썬 비유**: 네임스페이스(Namespace) 기능과 비슷합니다. 파이썬에서 패키지를 분리해 같은 이름의 함수 충돌을 막듯, CSS 모듈은 클래스 이름 뒤에 무작위 문자열을 붙여 다른 파일의 CSS와 이름이 겹치지 않게 해줍니다.
- 마음 놓고 파일 안에서 `.guide` 같은 흔한 이름을 사용해도 앱 전체가 깨지지 않습니다.

---

## 🛠 코드 수정 가이드

이제 다국어(`useTranslation`) 코드가 걷혔으므로, 텍스트나 로직을 변경하는 것이 매우 직관적입니다.

1. **기도문 내용 수정**:
   - `src/lib/prayerTexts.ts` 또는 `src/lib/rosaryMeditations.ts` 파일을 열어 한국어 문자열을 직접 수정하면 됩니다.
2. **화면 표시 로직 (UI) 수정**:
   - `src/components/RosaryGuide.tsx`에서 전체 뼈대와 네비게이션(이전/다음) 버튼을 수정합니다.
   - 개별 기도 화면 하나의 디자인은 `src/components/RosaryStepView.tsx`에서 수정합니다.
3. **신비 순서 수정**:
   - `src/lib/rosaryMysteries.ts` 안의 `buildRosarySteps` 함수를 확인하세요. 77개의 배열(리스트)이 어떻게 조립되는지 파이썬의 리스트를 합치는 과정(`.extend()` 또는 `+` 연산자)처럼 살펴볼 수 있습니다.
