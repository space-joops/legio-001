# 레지오 마리애 PWA 기여 가이드 (초심자/웹 개발 입문자를 위한 가이드)

웹 개발(특히 React, Next.js)에 익숙하지 않은 분들(예: 파이썬 등 다른 언어 개발자)도 이 프로젝트에 쉽게 기여하고 유지보수할 수 있도록 작성된 친절한 가이드입니다.

> 💡 **파이썬은 익숙한데 JavaScript/TypeScript 가 처음이라면** → [docs/typescript-for-python.md](docs/typescript-for-python.md) 를 먼저 읽어 보세요.
> `?? / ?. / 스프레드 / 제네릭 / JSX / React 훅` 을 파이썬 문법과 나란히 놓고 설명하고, 이 저장소를 읽는 순서도 정리해 두었습니다.
>
> 🔍 **기능 하나를 깊이 파고들며 연습하고 싶다면** → [docs/rosary/](docs/rosary/00-개요.md) 를 보세요.
> 묵주기도 기능을 데이터·화면·스와이프·기록까지 전부 뜯어보고, **정답과 해설이 딸린 연습문제 16개**로 직접 고쳐 보는 심화 자료입니다.

## 1. 주요 기반 기술 이해하기
- **React**: 컴포넌트(Component) 기반으로 UI를 구성하는 자바스크립트 라이브러리입니다. 상태(State)가 변경되면 화면이 자동으로 업데이트됩니다.
- **Next.js (App Router)**: React 기반의 프레임워크로, `src/app` 폴더 구조를 통해 라우팅(페이지 이동)을 처리합니다. 새로운 페이지를 만들려면 폴더를 만들고 그 안에 `page.tsx` 파일을 추가하면 됩니다. (참고: 이 프로젝트는 정적 내보내기인 `output: "export"`를 사용하므로 서버 기능은 제한됩니다.)
- **TypeScript**: 자바스크립트에 타입(자료형)을 추가한 언어입니다. 코드를 작성할 때 오류를 미리 잡아주고 자동완성을 지원해 줍니다.
- **CSS Modules**: 스타일 충돌을 막기 위해 각 컴포넌트별로 고유한 클래스 이름을 자동 생성해 주는 CSS 방식입니다. `.module.css` 확장자를 사용합니다.
- **로컬 스토리지 (Local Storage)**: 브라우저에 데이터를 저장하는 공간입니다. 이 앱은 백엔드 서버 없이 모든 사용자 데이터를 기기의 로컬 스토리지에 저장합니다. 관련 로직은 `src/lib/storage.ts`와 커스텀 훅(`useLocalStorageReady.ts` 등)에서 중앙 관리합니다.
- **PWA (Progressive Web App)**: 웹사이트를 모바일 앱처럼 설치하고 오프라인에서도 사용할 수 있게 해주는 기술입니다. 외부 플러그인 대신 자체적인 서비스 워커(`public/sw.js`)와 프리캐시 매니페스트 생성 스크립트(`scripts/generate-precache-manifest.mjs`)를 사용합니다.

## 2. 권장 개발 환경 및 VSCode 플러그인
코드 편집은 **Visual Studio Code (VSCode)** 를 추천합니다.
저장소에 `.vscode/extensions.json` 파일이 세팅되어 있어, 프로젝트를 열면 우측 하단에 확장 프로그램 설치 권장 팝업이 나타납니다.
다음 확장(Extensions) 프로그램들을 설치하면 개발이 훨씬 수월해집니다:

- **ESLint** (`dbaeumer.vscode-eslint`): 코드의 스타일을 검사하고 오류를 밑줄로 표시해 줍니다.
- **Prettier** (`esbenp.prettier-vscode`): 코드를 저장할 때 들여쓰기 등을 깔끔하게 자동 정렬해 줍니다.
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`): React 컴포넌트 기본 구조를 빠르게 작성할 수 있는 단축키(Snippet)를 제공합니다.
- **Vitest** (`vitest.explorer`): VSCode 테스트 패널에서 개별 테스트(`*.test.ts`)를 바로 실행하고 쉽게 디버깅할 수 있게 해줍니다.
- **Error Lens** (`usernamehw.errorlens`): TypeScript 오류나 ESLint 경고를 마우스 오버 없이 코드 줄 옆에 바로 보여주어 직관적입니다.
- **Pretty TypeScript Errors** (`yoavbls.pretty-ts-errors`): 복잡하고 읽기 힘든 TypeScript 에러 메시지를 보기 좋게 정리해서 보여줍니다.
- **CSS Modules** (`clinyong.vscode-css-modules`): `.module.css` 파일의 클래스 이름을 자동 완성해주고 해당 클래스의 정의로 바로 이동할 수 있게 해줍니다.
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`): 여는 HTML/JSX 태그의 이름을 수정하면 닫는 태그도 자동으로 수정해 주어 생산성을 높입니다.
- **Console Ninja** (`wallabyjs.console-ninja`): 브라우저 개발자 도구를 열지 않아도 `console.log()`의 결과값이나 에러를 코드 라인 바로 옆에 출력해 줍니다.
- **Import Cost** (`wix.vscode-import-cost`): `import`로 외부 패키지를 불러올 때, 해당 패키지의 번들 용량을 코드 옆에 즉시 보여줍니다.
- **Indent Rainbow** (`oderwat.indent-rainbow`): 들여쓰기 깊이마다 색상을 다르게 칠해주어 복잡한 코드 블록 구조를 한눈에 파악하게 도와줍니다.


## 2-1. 권장 개발 환경: WebStorm (JetBrains)
VSCode 외에 **WebStorm**이나 IntelliJ IDEA Ultimate을 사용하시는 분들을 위한 팁입니다. JetBrains IDE는 React와 TypeScript 환경에서 강력한 기본 기능을 제공합니다.

- **코드 검사 (Inspections)**: WebStorm은 기본적으로 프로젝트의 `package.json`과 `tsconfig.json`을 분석하여 타입 오류와 코드 스타일 문제를 실시간으로 에디터에 표시해 줍니다. 별도의 설정 없이도 대부분의 검사가 자동으로 이루어집니다.
- **ESLint & Prettier 자동 연동**: `Settings(Preferences) > Languages & Frameworks > JavaScript > Code Quality Tools`에서 ESLint와 Prettier를 활성화하면, 파일을 저장할 때나 코드를 작성할 때 즉시 포맷팅과 린팅이 적용됩니다. "On Save" 옵션을 켜두면 매우 편리합니다.
- **테스트 실행 및 디버깅**: 테스트 파일(`*.test.ts`)을 열면 테스트 구문(예: `test(...)`) 옆에 **녹색 재생 버튼(Run/Debug)**이 생깁니다. 이를 클릭하여 개별 테스트를 실행하거나, `Debug` 모드로 실행하여 손쉽게 중단점(Breakpoint)을 잡고 변수 값을 확인할 수 있습니다.
- **브라우저 디버깅**: 코드 내에 `debugger;`를 작성하거나 IDE 에디터 좌측을 클릭해 빨간색 중단점(Breakpoint)을 설정한 뒤, npm script 패널(보통 좌측 하단에 위치)에서 `dev` 스크립트를 우클릭하고 **Debug**를 선택하면, 브라우저와 연동되어 실행 중인 앱을 WebStorm 내에서 단계별로 디버깅할 수 있습니다.
- **유용한 플러그인**:
  - **Key Promoter X**: 마우스로 클릭하는 기능들의 단축키를 알려주어 IDE 숙련도를 높여줍니다.
  - **EnvFile**: `.env` 환경 변수 파일을 쉽게 관리하고 실행 환경에 주입할 수 있게 돕습니다.

## 3. 크롬 개발자 도구 및 확장 프로그램
웹 프론트엔드 개발 시 크롬(Chrome) 브라우저의 **개발자 도구 (F12 또는 Cmd+Option+I)**는 필수입니다.
- **Elements 탭**: HTML과 CSS 구조를 확인하고 실시간으로 스타일을 수정해 볼 수 있습니다.
- **Console 탭**: `console.log()`로 출력한 값이나 코드에서 발생한 오류 메시지를 확인합니다.
- **Application 탭 (매우 중요!)**:
  - 왼쪽 메뉴의 `Local Storage`를 선택하면 앱에 저장된 사용자 데이터를 확인하고 직접 수정하거나 삭제할 수 있습니다.
  - `Service Workers` 탭에서는 오프라인 캐시 및 앱 업데이트 상태를 확인하고 디버깅할 수 있습니다.

추가로 다음 크롬 확장 프로그램을 설치하는 것을 강력히 권장합니다:
- **React Developer Tools**: 컴포넌트 트리를 확인하고 각 컴포넌트가 가진 상태(State)와 전달받은 속성(Props)을 실시간으로 추적할 수 있습니다.

## 4. 디버깅(오류 수정)은 어떻게 하나요?
- **console.log 활용**: 코드 중간에 `console.log("변수값:", myVar)`를 넣어 데이터가 의도한 대로 들어오는지 크롬 Console 탭에서 확인합니다.
- **크롬 디버거(Sources 탭)**: 코드 흐름을 파악하고 싶을 때 코드 안에 `debugger;` 라고 적어두고 크롬 개발자 도구를 연 상태에서 실행해 보세요. 해당 줄에서 실행이 멈추고 변수 상태를 한 단계씩 확인할 수 있습니다.
- **VSCode 디버거**: VSCode 왼쪽 패널의 벌레 모양 아이콘(Run and Debug)을 활용해 브라우저와 연동하여 편리하게 중단점(Breakpoint)을 잡고 디버깅할 수 있습니다.

## 5. 테스트 코드 작성 및 실행 팁
이 프로젝트는 Node.js 내장 테스트 러너(`node:test`)와 `tsx`를 사용하여 TypeScript 테스트 코드를 실행합니다.
테스트 파일은 원본 파일과 동일한 위치에 `파일명.test.ts` 규칙으로 작성해 주세요. (예: `id.ts`의 테스트는 `id.test.ts`)

테스트는 다음 명령어로 간단히 실행할 수 있습니다:
```bash
npm test
```

### 테스트 작성 예시 (난이도별)

**1. 낮은 난이도 (단순 유틸리티 함수 검증)**
단순한 값을 반환하는 함수의 테스트는 아래와 같이 직관적으로 작성합니다.
```typescript
import assert from "node:assert";
import test from "node:test";
import { generateId } from "./id";

test("generateId (낮은 난이도)", async (t) => {
  await t.test("문자열을 반환해야 한다", () => {
    assert.strictEqual(typeof generateId(), "string");
  });
});
```

**2. 중간 난이도 (데이터 가공 로직 검증)**
배열이나 객체를 변환하는 로직은 여러 가지 엣지 케이스(예: 빈 데이터 등)를 함께 테스트합니다.
```typescript
import assert from "node:assert";
import test from "node:test";
import { formatTallies } from "./activityReport";

test("formatTallies (중간 난이도)", async (t) => {
  await t.test("count가 0인 항목은 제외하고 문자열을 만들어야 한다", () => {
    const input = [
      { label: "장례미사", count: 2 },
      { label: "기타", count: 0 },
    ];
    assert.strictEqual(formatTallies(input), "장례미사(2)");
  });
});
```

**3. 높은 난이도 (복잡한 날짜/업무 로직 검증)**
달력, 윤년, 날짜 경계선 등 경우의 수가 많은 핵심 비즈니스 로직은 상세한 주석과 함께 다양한 시나리오를 테스트합니다.
```typescript
import assert from "node:assert";
import test from "node:test";
import { computeSundayMassBasis } from "./monthlyReportUtils";

test("computeSundayMassBasis (높은 난이도)", async (t) => {
  await t.test("연도가 바뀌는 경계(1월)에서도 정상 동작해야 한다", () => {
    // 2023년 12월 마지막 화요일부터 2024년 1월 마지막 화요일까지의 주일 횟수 계산
    const result = computeSundayMassBasis("2024-01", 2, 10);
    assert.strictEqual(result?.sundayCount, 5);
  });
});
```

**UI (Playwright) 테스트 주의점**
차후 UI 테스트를 작성할 경우: 앱이 처음 로드될 때 스플래시 화면(로고 화면)이 나타나며 클릭(포인터 이벤트)을 가로챕니다. 자동화 테스트를 작성할 때는, 이 스플래시 화면이 사라질 때까지 기다리거나 닫은 뒤에 실제 화면 요소와 상호작용해야 합니다.

## 6. 깃허브 푸시(Push) 전 로컬 정적 분석(Lint & Type Check)하기
이 프로젝트는 GitHub Actions를 통해 코드가 올라갈 때 자동으로 코드 스타일과 타입을 엄격하게 검사합니다. CI 파이프라인에서 에러가 발생해 다시 커밋해야 하는 번거로움을 피하려면, 코드를 푸시하기 전에 내 컴퓨터(로컬)에서 먼저 아래 명령어들을 실행해 보는 것을 권장합니다.

```bash
# 1. 코드 스타일 및 오타 검사 (파이썬의 flake8/pylint 역할)
npm run lint

# 2. 엄격한 타입 검사 (파이썬의 mypy 역할)
npx tsc --noEmit
```
위 두 명령어가 아무런 에러 메시지 없이 종료된다면, CI의 정적 분석 단계도 무사히 통과하게 됩니다!

## 7. 알아두면 좋은 기타 개발 팁
- **이미지 태그 린트 에러 무시**: Next.js는 기본적으로 최적화를 위해 `<Image>` 컴포넌트 사용을 강제합니다. 하지만 이 프로젝트는 정적 내보내기(Static Export) 환경이므로 일반 `<img>` 태그를 사용해야 할 때가 있습니다. 이 경우 `<img>` 태그 바로 윗줄에 `/* eslint-disable-next-line @next/next/no-img-element */` 주석을 추가하면 `npm run lint` 시 발생하는 경고를 통과시킬 수 있습니다.
- **친절한 한국어 주석**: React나 TypeScript에 익숙하지 않은 다른 유지보수 개발자(예: 본인 포함)를 위해, 복잡한 로직이나 새로운 개념을 구현할 때는 그 개념과 동작 원리를 설명하는 상세한 한국어 주석을 남겨주시면 큰 도움이 됩니다. 구체적인 규칙은 아래 **8. 주석 작성 규칙**을 참고하세요.
- **화면 문구는 코드에 직접 적습니다**: 이 앱은 한국어 전용입니다. 예전에는 `src/i18n/dictionaries/`에 키-값으로 두고 `t("a.b.c")`로 꺼내 썼지만, 문구 하나를 고치려고 두 파일(`ko.ts`/`en.ts`)을 오가야 하고 화면 코드만 봐서는 무슨 글자가 나오는지 알 수 없어서 없앴습니다. JSX 안에 한국어를 그대로 적으면 됩니다. 값을 끼워 넣을 때는 백틱 템플릿을 쓰세요: `` `묵주기도 ${n}단` ``. 여러 화면이 함께 쓰는 라벨만 `src/lib/`의 상수(`PRAYER_ITEMS`, `OFFICER_ROLE_LABEL`, `WEEKDAY_LABELS` 등)에 두고 가져다 씁니다.

## 8. 주석 작성 규칙

이 저장소의 주석은 **세 종류**이고, 성격이 서로 다릅니다. 새로 주석을 쓸 때는 어느 쪽인지 먼저 정하세요.

### ① 모듈 설명 — `/** ... */`

파일이 무슨 일을 하는지 한눈에 알려 줍니다. **import 아래, 첫 선언 바로 위**에 둡니다(파일 맨 위가 아닙니다).

```ts
import { storage } from "@/lib/storage";

/**
 * 지금 작성 중인 주간 보고 하나를 다루는 훅. 홈 화면의 심장이다.
 *
 * 규칙이 두 개 있다.
 *   1. 보고서를 직접 고치지 않는다. 항상 새 객체로 통째로 교체한다.
 *   2. 화면 state 와 localStorage 에 동시에 쓴다.
 */
export function useCurrentReport() { ... }
```

새 파일을 만들면 **반드시** 하나 붙여 주세요. 한 줄짜리여도 없는 것보다 훨씬 낫습니다.

### ② 설계 근거 — `// ...`

**"무엇을" 하는지가 아니라 "왜" 그렇게 했는지**를 씁니다. 코드를 읽으면 알 수 있는 내용은 적지 않습니다.

```ts
// ❌ 나쁨 — 코드를 그대로 옮겨 적은 것
// count 를 1 증가시킨다
count += 1;

// ✅ 좋음 — 코드만 봐서는 알 수 없는 이유
// 여기서 예외를 던지면 앱 전체가 죽는다. 이 setter 들은 카운터 탭이나 키 입력 같은
// "렌더 바로 옆"에서 불리는데, 거기서 루트까지 예외를 받아 줄 에러 경계가 없기 때문이다.
writeFailureListeners.forEach((listener) => listener());
```

과거에 났던 버그, 다른 방법을 고르지 않은 이유, 순서가 중요한 이유가 여기 들어갑니다. 이런 주석은 **지우지 마세요.** 지금 코드에 드러나지 않는 정보라서, 사라지면 같은 실수가 반복됩니다.

### ③ 문법 학습 — `// [TS] ...`

TypeScript 문법 자체를 설명하는 주석입니다. **반드시 `[TS]` 로 시작**하고, 필요하면 [치트시트](docs/typescript-for-python.md)의 해당 절을 가리킵니다.

```ts
// [TS] `?? 0` 은 왼쪽이 null/undefined 일 때만 0. 파이썬 `or` 와 달리 0·"" 는 통과.
//      → docs/typescript-for-python.md#5-널-다루기
const progress = report.rosarySetProgress ?? 0;
```

`[TS]` 라는 표시를 붙이는 이유는 **나중에 통째로 걷어낼 수 있게** 하려는 것입니다. 팀이 TypeScript에 익숙해지면 아래 한 줄로 어디에 있는지 전부 찾을 수 있습니다.

```bash
grep -rn "\[TS\]" src/
```

규칙 두 가지:
- **같은 문법을 파일마다 반복 설명하지 마세요.** 처음 등장하는 곳에서만 설명하고, 나머지는 치트시트를 가리킵니다.
- 문법 설명이 필요 없어졌다고 판단되면 `[TS]` 주석만 지우세요. ①·②는 남겨 둡니다.

### 그 밖의 규칙

- **언어는 한국어**로 씁니다. 다만 기존 영어 주석을 굳이 번역하려고 파일 전체를 건드리지는 마세요. 그 파일을 손볼 일이 생겼을 때 함께 정리하면 됩니다.
- **`eslint-disable` 에는 반드시 이유를 붙입니다.** `--` 뒤에 왜 껐는지 한국어로 적어 주세요.
  ```ts
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션이 끝난 뒤 localStorage 에서 한 번만 읽어 오는 초기 적재
  ```
- **타입 자체가 설명이 되게** 쓰세요. 주석으로 "이 값은 0~4 입니다"라고 적는 것보다, 타입과 이름이 그걸 말해 주는 편이 낫습니다.

---

궁금한 점이 있다면 언제든 코드를 둘러보시고, 각 컴포넌트와 모듈에 남겨진 주석들을 참고하며 자유롭게 기여해 주세요. 여러분의 기여를 환영합니다!
