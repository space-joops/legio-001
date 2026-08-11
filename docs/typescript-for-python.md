# 파이썬 개발자를 위한 TypeScript / React 안내서

파이썬은 익숙한데 JavaScript·TypeScript 는 처음이라면 이 문서부터 읽으세요.
문법을 전부 가르치려는 게 아니라, **이 저장소를 읽는 데 실제로 필요한 것만** 파이썬과 나란히 놓고 설명합니다.

예제는 전부 이 프로젝트의 진짜 코드입니다. 궁금하면 해당 파일을 바로 열어 보세요.

코드 안에서 `// [TS]` 로 시작하는 주석을 만나면, 그건 이 문서의 어느 절을 보라는 표시입니다.

---

## 목차

| 절 | 내용 | 파이썬에서 가장 헷갈리는 것 |
|---|---|---|
| [1. 변수와 상수](#1-변수와-상수) | `const` / `let` | `const` 인데 왜 내용이 바뀌지? |
| [2. 함수와 화살표](#2-함수와-화살표) | `function` / `=>` | 괄호가 왜 이렇게 많지? |
| [3. 객체](#3-객체) | `{...}`, 스프레드, 구조 분해 | `{**a, **b}` 는 어떻게 쓰지? |
| [4. 배열](#4-배열) | `.map` / `.filter` | 리스트 컴프리헨션은 어디에? |
| [5. 널 다루기](#5-널-다루기) | `null` / `undefined` / `??` / `?.` | `or` 처럼 쓰면 왜 안 되지? |
| [6. 타입](#6-타입) | 유니온, 제네릭, `as`, `satisfies` | 런타임에 검사되나? |
| [7. 비동기](#7-비동기) | `Promise` / `async` | `await` 는 파이썬과 같나? |
| [8. JSX 읽는 법](#8-jsx-읽는-법) | 코드 안의 HTML | 중괄호가 대체 몇 겹이지? |
| [9. React 훅](#9-react-훅) | `useState` / `useEffect` | 함수가 왜 계속 다시 실행되지? |
| [10. 이 저장소를 읽는 순서](#10-이-저장소를-읽는-순서) | 추천 학습 경로 | 어디부터 봐야 하지? |

---

## 1. 변수와 상수

```python
# 파이썬
name = "베드로"
name = "바오로"        # 그냥 다시 대입
```

```ts
// TypeScript
const name = "베드로";  // 다시 대입 못 함
let count = 0;          // 다시 대입 가능
count = 1;
```

**이 저장소는 거의 전부 `const` 입니다.** `let` 은 값을 갈아 끼워야 할 때만 씁니다
(예: `src/hooks/useCurrentReport.ts` 의 `removeRosaryBead`, `src/lib/treasury.ts` 의 잔액 누적).

### ⚠️ `const` 는 "내용이 안 바뀐다"가 아닙니다

파이썬의 `Final` 이나 불변 객체를 떠올리면 틀립니다. `const` 는 **이름표를 다시 붙이지 못한다**는 뜻일 뿐, 그 안을 고치는 건 막지 않습니다.

```ts
const counts = { weekdayMass: 0 };
counts.weekdayMass = 5;   // ✅ 됩니다
counts = {};              // ❌ 이건 에러
```

그래서 아래 같은 코드가 성립합니다 (`src/lib/monthlyReportUtils.ts`).

```ts
// d 는 const 인데도 루프를 돌며 날짜가 하루씩 앞으로 갑니다.
// 다른 Date 객체로 "바꾸는" 게 아니라 같은 객체의 내부를 고치기 때문입니다.
for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) { ... }
```

---

## 2. 함수와 화살표

같은 함수를 쓰는 방법이 여러 가지입니다.

```python
# 파이썬
def add(a, b):
    return a + b

add = lambda a, b: a + b
```

```ts
// TypeScript — 셋 다 같은 뜻
function add(a: number, b: number) { return a + b; }

const add = (a: number, b: number) => { return a + b; };

const add = (a: number, b: number) => a + b;   // 중괄호를 빼면 return 이 생략됨
```

마지막 형태가 **화살표 함수**이고, 이 저장소에서 가장 많이 보게 됩니다.
파이썬 `lambda` 와 달리 **몸통에 여러 줄을 쓸 수 있어서** 사실상 이름 없는 함수 전부에 쓰입니다.

### 괄호가 겹쳐 보이는 이유

```ts
onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
```

화살표가 세 개 겹쳐 있어 복잡해 보이지만, 안쪽부터 하나씩 읽으면 됩니다.

```python
# 파이썬으로 옮기면
def on_click():
    set_rows(lambda prev: [r for r in prev if r.id != row.id])
```

- `() =>` — "버튼을 누르면 실행할 일"
- `(prev) =>` — "지금 값을 받아서 새 값을 돌려주는 함수"
- `(r) =>` — "각 항목마다 참/거짓을 판단하는 함수"

### ⚠️ 객체를 돌려줄 때는 괄호로 한 번 더 감쌉니다

```ts
const f = () => { name: "베드로" };     // ❌ {} 를 "코드 블록"으로 읽어서 undefined 를 돌려줌
const f = () => ({ name: "베드로" });   // ✅ 소괄호로 감싸야 "객체"가 됨
```

이 저장소에서 `setState((prev) => ({ ...prev, ... }))` 처럼 `({` 로 시작하는 건 전부 이 이유입니다.

---

## 3. 객체

JavaScript 의 객체 `{}` 는 파이썬의 `dict` 와 거의 같습니다. 다만 키를 쓸 때 따옴표를 생략합니다.

```python
person = {"name": "베드로", "age": 60}
person["name"]
```

```ts
const person = { name: "베드로", age: 60 };
person.name;        // 점으로 꺼내는 게 기본
person["name"];     // 대괄호도 됨
```

### 스프레드 `...` = `{**a, **b}`

```python
merged = {**defaults, **stored}   # 뒤에 오는 stored 가 이김
```

```ts
const merged = { ...defaults, ...stored };   // 똑같이 뒤가 이김
```

**이 저장소에서 가장 중요한 문법입니다.** 두 군데에서 핵심 로직으로 쓰입니다.

1. **옛 데이터 보정** — `src/lib/storage.ts`
   ```ts
   // 예전 버전에 없던 필드를 기본값으로 메우고, 저장된 값이 있으면 그게 이깁니다.
   return { ...DEFAULT_PROFILE, ...readJson<Partial<Profile>>(KEYS.profile, {}) };
   ```
   순서를 뒤집으면 사용자의 데이터가 기본값에 밀려 **날아갑니다.**

2. **불변 갱신** — `src/hooks/useCurrentReport.ts`
   ```ts
   // 원본을 고치지 않고, 몇 개만 바꾼 새 객체를 만듭니다. (React 가 변화를 알아채는 방식)
   persist({ ...report, ...changes, updatedAt: new Date().toISOString() });
   ```

### 계산된 키 `[key]:`

```python
counts = {key: value}       # key 변수에 담긴 값이 키가 됨
```

```ts
const counts = { [key]: value };   // 대괄호가 있어야 변수 값이 키가 됨
const counts = { key: value };     // 대괄호가 없으면 "key" 라는 글자가 키
```

### 구조 분해

파이썬에는 딱 맞는 문법이 없습니다. "객체에서 필요한 키만 꺼내 같은 이름의 변수로 만들기"입니다.

```ts
const { ready, report, submit } = useCurrentReport();
// 위 한 줄은 아래 세 줄과 같습니다
const result = useCurrentReport();
const ready = result.ready;
const report = result.report;
```

기본값도 줄 수 있습니다 (`src/components/CounterButton.tsx`).

```ts
function CounterButton({ label, setProgress = 0 }: CounterButtonProps) { ... }
//                              ↑ 파이썬의 def f(set_progress=0) 과 같음
```

---

## 4. 배열

리스트 컴프리헨션 대신 메서드를 이어 붙입니다.

| 파이썬 | JavaScript | 뜻 |
|---|---|---|
| `[f(x) for x in xs]` | `xs.map(f)` | 각각 변환 |
| `[x for x in xs if p(x)]` | `xs.filter(p)` | 걸러내기 |
| `next((x for x in xs if p(x)), None)` | `xs.find(p)` | 첫 번째 찾기 (없으면 `undefined`) |
| `functools.reduce(f, xs, init)` | `xs.reduce(f, init)` | 접기 |
| `[f(i) for i in range(n)]` | `Array.from({ length: n }, (_, i) => f(i))` | 개수만큼 만들기 |
| `sorted(xs, key=...)` | `[...xs].sort((a, b) => ...)` | 정렬 |
| `[*a, *b]` | `[...a, ...b]` | 이어 붙이기 |

실제 예 (`src/components/CounterButton.tsx` — 묵주 구슬 5개 그리기):

```ts
{Array.from({ length: setSize }, (_, i) => (
  <span key={i} className={i < setProgress ? styles.beadFilled : styles.bead} />
))}
```

`_` 는 "안 쓰는 값"이라는 관례적 이름입니다(파이썬과 같습니다).

### ⚠️ `.sort()` 는 원본을 뒤섞습니다

파이썬 `list.sort()` 와 같습니다. 그래서 이 저장소는 항상 복사한 뒤 정렬합니다 (`src/lib/reportUtils.ts`).

```ts
return [...history].sort((a, b) => b.sessionNumber - a.sessionNumber);
//     ↑ 복사가 없으면 React 가 변화를 알아채지 못합니다
```

### `Map` 과 dict comprehension

```python
present = {n: False for n in numbers}
```

```ts
const present = Object.fromEntries(numbers.map((n) => [n, false]));
```

`src/lib/monthlyReportUtils.ts` 에 여러 번 나옵니다.

---

## 5. 널 다루기

파이썬은 `None` 하나지만 JavaScript 는 **둘**입니다.

| | 뜻 |
|---|---|
| `undefined` | 값을 넣은 적이 없음 (없는 키, 안 넘긴 인자) |
| `null` | 일부러 "없음"을 넣음 |

이 저장소는 "없음"을 `null` 로 통일하려 하고, `undefined` 가 나오면 `?? null` 로 바꾸기도 합니다 (`src/hooks/useHistory.ts`).

### `??` (널 병합) — `or` 대신 이것을 쓰세요

```python
value = maybe if maybe is not None else 0
value = maybe or 0        # ⚠️ 0, "", [] 도 걸러져 버림
```

```ts
const value = maybe ?? 0;   // null/undefined 일 때만 0
const value = maybe || 0;   // ⚠️ 0, "", NaN 도 0 으로 바뀜
```

이 저장소에서 `?? 0` 이 자주 보이는 이유:

```ts
// 이 필드가 생기기 전에 저장된 보고서에는 rosarySetProgress 가 아예 없습니다.
const progress = report.rosarySetProgress ?? 0;
```

`||` 를 일부러 쓰는 자리도 있습니다 — 빈 문자열까지 걸러야 할 때입니다.

```ts
// 이름이 "" 이면 "-" 를 보여야 하므로 여기서는 || 가 맞습니다.
const nameLine = `${dict.report.memberLabel}: ${report.memberName || "-"}`;
```

### `?.` (옵셔널 체이닝) — 없으면 거기서 멈춤

```python
value = obj.a.b if obj and obj.a else None
```

```ts
const value = obj?.a?.b;          // 중간이 없으면 통째로 undefined
const value = arr[0]?.name;       // 배열이 비어 있어도 안 터짐
const value = map[key]?.[lang];   // 대괄호 앞에는 ?. 뒤에 점을 찍습니다
```

두 개를 이어 쓰는 게 이 저장소의 관용구입니다.

```ts
const nextSession = (history[0]?.sessionNumber ?? 0) + 1;
// 기록이 없으면 → undefined → 0 → 1회차부터 시작
```

### `!` (non-null 단언)

```ts
src: step.image!    // "여기 image 는 절대 없지 않다"고 컴파일러에게 우기는 것
```

**실제로 검사하지 않습니다.** 파이썬의 `typing.cast` 처럼 "믿어 달라"는 선언일 뿐이라, 틀리면 런타임에 터집니다. 되도록 쓰지 마세요.

---

## 6. 타입

### 가장 중요한 사실: **타입은 실행되지 않습니다**

```ts
interface Profile { name: string; }
```

이건 빌드 결과물에서 **통째로 사라집니다.** 파이썬의 타입 힌트가 `__annotations__` 로 런타임에 남는 것과 다릅니다.
즉 **타입은 사람과 편집기를 위한 것이지, 실행 중 검증 수단이 아닙니다.**

그래서 `localStorage` 에서 읽은 JSON 이 실제로 그 타입인지는 아무도 보장해 주지 않고, `src/lib/storage.ts` 의 getter 들이 기본값과 병합해 손으로 메워 줍니다.

### 유니온 = `Literal`

```python
Language = Literal["ko", "en"]
```

```ts
type Language = "ko" | "en";
```

### `Record<K, V>` = `dict[K, V]`

```python
PrayerCounts = dict[PrayerItemKey, int]
```

```ts
type PrayerCounts = Record<PrayerItemKey, number>;
```

K 가 유니온이면 "그 키들이 **전부 반드시** 있어야 한다"는 뜻이 됩니다. 하나라도 빠지면 컴파일 에러입니다.

### 제네릭 `<T>` = `TypeVar`

```python
T = TypeVar("T")
def read_json(key: str, fallback: T) -> T: ...
```

```ts
function readJson<T>(key: string, fallback: T): T { ... }
```

"돌려주는 타입은 넘긴 값의 타입과 같다"는 약속입니다. 그래서 이렇게 부르면

```ts
const history = readJson<WeeklyReport[]>(KEYS.history, []);
```

`history` 가 곧바로 `WeeklyReport[]` 로 취급됩니다.

### 자주 보는 유틸리티 타입

| 문법 | 뜻 |
|---|---|
| `Partial<T>` | T 의 모든 필드를 "있어도 되고 없어도 됨"으로 |
| `Pick<T, "a" \| "b">` | T 에서 a, b 만 골라낸 타입 |
| `keyof T` | T 가 가진 키 이름들의 유니온 |
| `typeof x` | 값 `x` 로부터 타입을 뽑아냄 |
| `T["a"]` | T 의 a 필드의 타입 |
| `readonly` / `?` | 읽기 전용 / 선택 사항 |

### `as const`

```ts
const KEYS = { profile: "legioMariae.profile" };            // 타입: { profile: string }
const KEYS = { profile: "legioMariae.profile" } as const;   // 타입: { profile: "legioMariae.profile" }
```

"이건 앞으로 안 바뀐다"고 못 박아, 값 자체를 타입으로 굳힙니다.

### `as` vs `satisfies` — 헷갈리기 쉬운 한 쌍

```ts
const x = value as Profile;        // "Profile 이라고 치자" — 검사 안 함 (파이썬 cast)
const x = value satisfies Profile; // "Profile 과 맞는지 검사해라" — 타입은 그대로 둠
```

`as` 는 위험하고 `satisfies` 는 안전합니다. `src/lib/storage.ts` 의 `EMPTY_MONTHLY_REPORT_DEFAULTS` 가 `satisfies` 를 쓰는 이유가 이것입니다 — 필드 이름을 잘못 적으면 바로 잡히면서도, 각 값의 구체적 타입은 남습니다.

`src/app/secretary/report/page.tsx` 의 `MEMBER_COUNT_BUCKETS` 도 같은 장치를 씁니다.

```ts
] as const satisfies readonly { key: keyof MonthlyReport; label: string }[];
```

`as const` 로 각 `key` 의 구체적 문자열 타입을 남기면서, 동시에 그 값이 정말
`MonthlyReport` 의 필드 이름인지 검사받습니다. 오타를 내면 바로 잡힙니다.

---

## 7. 비동기

파이썬의 `async`/`await` 와 거의 같습니다. `Promise` 가 파이썬의 `Awaitable` 에 해당합니다.

```python
async def save():
    await write_file()
```

```ts
async function save() {
  await writeFile();
}
```

다만 `await` 없이 `.then()` 으로 이어 붙이는 옛 방식도 섞여 있습니다.

```ts
navigator.clipboard.write(...).then(onOk).catch(onFail);
// = try: await ...; on_ok() / except: on_fail()
```

### `void` 연산자

```ts
void navigator.storage?.persist?.().catch(() => {});
```

앞의 `void` 는 "이 결과를 안 쓸 거야"라는 표시입니다. 파이썬에는 없고, 린터에게 "await 안 한 게 실수가 아니다"라고 알려 주는 용도입니다.

---

## 8. JSX 읽는 법

TypeScript 코드 안에 HTML 같은 게 섞여 있는 게 JSX 입니다. 파이썬에는 대응 개념이 없어서 가장 낯선 부분입니다.

### 규칙 하나면 됩니다: `{` 는 "여기부터 다시 코드"

```tsx
<span className={styles.count}>{count}</span>
//               ↑ 코드            ↑ 코드
//     나머지는 전부 그냥 화면에 그려질 태그
```

### 조건부 렌더링 3종

```tsx
// ① 있으면 그리고 없으면 안 그린다
{unitLabel && <span>({unitLabel})</span>}

// ② 둘 중 하나
{numericMode ? <NumericEntry /> : <TapFace />}

// ③ 아예 안 그린다
{setSize ? <BeadRow /> : null}
```

`&&` 는 파이썬의 `and` 가 값을 돌려주는 성질을 이용한 관용구입니다.

> ⚠️ **`&&` 의 함정**: 왼쪽이 숫자 `0` 이면 화면에 **`0` 이라는 글자가 그대로 찍힙니다.**
> `{items.length && <List/>}` 는 목록이 비었을 때 `0` 을 보여 줍니다.
> 개수를 조건으로 쓸 때는 `{items.length > 0 && ...}` 나 삼항을 쓰세요.

### 목록 만들기와 `key`

```tsx
{PRAYER_ITEMS.map((item) => (
  <CounterButton key={item.key} label={t(item.labelKey)} />
))}
```

`key` 는 화면에 보이지 않습니다. React 가 "어느 줄이 어느 줄인지" 추적하는 데 쓰는 표시로, 목록을 만들 때는 **필수**입니다.

### Fragment `<>...</>`

컴포넌트는 한 덩어리만 돌려줄 수 있습니다. 쓸데없는 `<div>` 를 만들지 않고 여러 개를 묶고 싶을 때 씁니다.

```tsx
return (
  <>
    <button>…</button>
    <div>…</div>
  </>
);
```

### 괄호가 깊어지면 이름을 붙이세요

이 저장소가 실제로 쓰는 방법입니다. 예전 `src/app/page.tsx` 는 삼항이 세 겹 중첩돼 있었는데, 지금은 **조기 반환**으로 갈라 놓았습니다.

```tsx
// ❌ 예전
return <PageShell>{!report ? (<>…</>) : (<>{editing ? (<Form/>) : (<button/>)}…</>)}</PageShell>;

// ✅ 지금
if (!report) {
  return <PageShell>…시작 폼…</PageShell>;
}
return <PageShell>…카운터 화면…</PageShell>;
```

---

## 9. React 훅

React 컴포넌트는 **화면을 그릴 때마다 함수 전체가 처음부터 다시 실행됩니다.** 이 한 문장이 훅을 이해하는 열쇠입니다.
그러면 지역 변수는 매번 초기화될 텐데, "값을 기억하게" 해 주는 게 훅입니다.

| 훅 | 하는 일 | 언제 쓰나 |
|---|---|---|
| `useState` | 값을 기억하고, 바뀌면 화면을 다시 그린다 | 거의 모든 곳 |
| `useEffect` | 그린 뒤에 부수 효과를 실행한다 | localStorage 읽기, 이벤트 등록 |
| `useCallback` | 함수를 매번 새로 만들지 않고 재사용한다 | 훅이 돌려주는 함수들 |
| `useMemo` | 계산 결과를 재사용한다 | 비싼 계산 (이 저장소엔 2곳뿐) |
| `useRef` | 화면을 다시 그리지 *않으면서* 값을 기억한다 | DOM 손잡이, 타이머 |
| `useContext` | 멀리 있는 값을 직접 꺼낸다 | 언어, 토스트, 글자 설정 |

### `useState`

```tsx
const [count, setCount] = useState(0);
//     ↑값     ↑바꾸는 함수      ↑초기값
setCount(5);              // 이걸 부르면 화면이 다시 그려집니다
setCount((prev) => prev + 1);   // 최신 값에서 출발하고 싶으면 함수를 넘깁니다
```

### `useEffect` 와 의존성 배열 — 가장 헷갈리는 부분

```tsx
useEffect(() => { ... });               // 매번 실행 (거의 안 씀)
useEffect(() => { ... }, []);           // 처음 한 번만
useEffect(() => { ... }, [ready]);      // ready 가 바뀔 때마다
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer);    // 정리 함수 — 사라질 때 실행됨
}, []);
```

가장 작은 예제가 `src/hooks/useLocalStorageReady.ts` (19줄)입니다. 여기서 시작하세요.

> ⚠️ 의존성 배열을 잘못 쓰면 **무한 루프**가 납니다. effect 안에서 값을 바꾸는데 그 값이 의존성에 들어 있으면, 바꿈 → 다시 실행 → 또 바꿈 …이 됩니다.
> `src/app/page.tsx` 의 첫 번째 effect 가 `[report]` 가 아니라 `[report?.id]` 를 보는 것도 같은 이유입니다 — 카운터를 누를 때마다 `report` 는 새 객체가 되므로, 그대로 두면 타이핑 중인 메모가 매번 지워집니다.

### 커스텀 훅

`use` 로 시작하는 그냥 함수입니다. 훅을 모아 이름을 붙인 것뿐입니다.

```tsx
export function useCurrentReport() {
  const ready = useLocalStorageReady();
  const [report, setReport] = useState(null);
  ...
  return { ready, report, submit, ... };   // 객체 하나로 돌려주는 게 이 저장소의 관례
}
```

### `"use client"`

파일 맨 위의 이 한 줄은 **"이 파일은 브라우저에서 실행된다"** 는 선언입니다.
Next.js 는 기본적으로 빌드할 때(서버에서) 컴포넌트를 실행하는데, 거기엔 `window` 도 `localStorage` 도 없습니다.

이 저장소에서 이 줄이 **없는** 화면 파일은 `src/app/layout.tsx` 하나뿐입니다.

---

## 10. 이 저장소를 읽는 순서

한 번에 다 보려 하지 말고 아래 순서로 따라가면, 위에서 설명한 문법이 자연스러운 순서로 한 번씩 등장합니다.

| 순서 | 파일 | 줄 | 배우는 것 |
|---|---|---|---|
| 1 | `src/lib/types.ts` | 273 | 이 앱이 다루는 데이터 전부. 유니온, `Record`, 선택 필드 |
| 2 | `src/lib/constants.ts` | 60 | 카운터 5종 정의, `as const` |
| 3 | `src/lib/storage.ts` | 300 | 저장 규칙 전부. 제네릭, 스프레드 병합, `satisfies` |
| 4 | `src/hooks/useLocalStorageReady.ts` | 35 | 가장 작은 훅. `useEffect` + `[]` |
| 5 | `src/hooks/useCurrentReport.ts` | 200 | 불변 갱신, `useCallback`, 묵주 구슬 로직 |
| 6 | `src/app/page.tsx` | 240 | 화면 조립, 조기 반환, JSX |
| 7 | `src/components/CounterButton.tsx` | 240 | 조건부 렌더, `Array.from`, 하위 컴포넌트 분리 |
| 8 | `src/components/ToastProvider.tsx` | 80 | Context 4단 구조 |
| 9 | `src/lib/monthlyReportUtils.ts` | 800 | JSX 없이 TypeScript 만. 서기 도메인 로직 |
| 10 | `src/app/secretary/report/page.tsx` | 1,230 | 위의 전부가 한꺼번에 나오는 종합편 |

### 직접 만져 보기

읽기만 해서는 잘 안 붙습니다. 아래는 안전하게 실험해 볼 수 있는 것들입니다.

```bash
npm install
npm run dev      # http://localhost:3000
```

- `src/components/BottomNav.tsx` 에서 탭 이름을 바꿔 보세요 → 저장하면 화면이 즉시 바뀝니다. (화면 문구는 전부 이렇게 코드에 직접 적혀 있습니다.)
- `src/lib/constants.ts` 의 `PRAYER_ITEMS` 순서를 바꿔 보세요 → 홈 화면 카운터 순서가 따라 바뀝니다.
- 크롬 개발자 도구(F12) → **Application → Local Storage** 에서 `legioMariae.*` 값을 직접 들여다보세요. 이 앱의 데이터베이스가 통째로 거기 있습니다.
- `console.log()` 를 아무 데나 넣고 Console 탭에서 확인해 보세요.

### 무언가 고치기 전에

```bash
npx tsc --noEmit   # 타입 검사
npm run lint       # 코드 검사
npm test           # 테스트
npm run build      # 실제 빌드
```

더 자세한 개발 환경·디버깅 안내는 [CONTRIBUTING.md](../CONTRIBUTING.md) 를 보세요.

### 다음 단계 — 기능 하나를 끝까지 파 보기

문법이 어느 정도 눈에 들어왔다면 [**docs/rosary/**](rosary/00-개요.md) 로 가 보세요.
묵주기도 기능 하나를 데이터부터 화면·스와이프·기록까지 전부 뜯어보고, **정답과 해설이 딸린 연습문제 16개**로 직접 고쳐 보는 심화 자료입니다.
여기서 배운 문법이 실제 코드에서 어떻게 쓰이는지 한 번에 확인할 수 있습니다.
