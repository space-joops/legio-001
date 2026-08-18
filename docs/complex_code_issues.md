# 레지오 마리애 주간 활동 보고 프로젝트 - 복잡도 분석 및 개선을 위한 GitHub 이슈 목록

코드 복잡도가 높아서 사람이 읽고 해석하기 어렵거나, 유지보수 시 버그가 발생할 가능성이 높은 코드 영역 5곳을 선정하였습니다. 각각의 문제점을 분석하고, 구체적인 개선 방안을 제시하는 GitHub 이슈 형식의 제안서입니다.

---

## [Issue #1] `src/app/secretary/report/page.tsx`: 초대형 컴포넌트의 상태 및 비즈니스/렌더링 로직 결합 문제

### 📌 이슈 제목
`[Refactor] src/app/secretary/report/page.tsx 컴포넌트 비대화 해소 및 세부 컴포넌트 분리`

### 💻 대상 코드 영역
- `src/app/secretary/report/page.tsx` (전체 파일 약 1,200줄)

### ⚠️ 현 문제점
1. **단일 파일의 과도한 책임 (God Component)**:
   - 이 파일 하나에서 회합 정보 입력, 회차별 활동 보고 표(Session Table), 간부 명단, 단원 현황, 의안(주요 사항), 회계(비밀헌금 및 지출 관리), 기도 집계, 지시사항, 복음화 실적 등 월례 보고서 작성에 필요한 모든 UI와 데이터 조작 로직을 처리하고 있습니다.
2. **복잡한 인라인 핸들러 및 상태**:
   - `activeSession`, `activityTarget`, `expenseTarget`, `activityItems`, `pendingRange` 등 수많은 상태(`useState`)가 하나의 컴포넌트에 얽혀 있습니다. 이로 인해 한 곳의 사소한 상태 변경이 컴포넌트 전체를 리렌더링하게 만들고 성능 저하를 야기할 수 있습니다.
3. **가독성 저하**:
   - 편집 모드 UI(HTML/JSX)가 800줄 이상 연속되어 있어 특정 UI 섹션을 찾거나 수정할 때 스크롤 압박이 심하고, 비즈니스 로직과 복잡하게 얽혀 있어 구조 파악이 어렵습니다.

### 💡 개선 방안
1. **서브 컴포넌트 추출 (Component Decomposition)**:
   - 각 입력 섹션을 독립된 컴포넌트로 분리합니다.
     - `MeetingInfoSection.tsx` (회합 정보)
     - `SessionActivityReportSection.tsx` (활동보고 회차별 테이블)
     - `OfficerRosterSection.tsx` (간부 명단)
     - `MemberStatusSection.tsx` (단원 현황)
     - `AgendaItemsSection.tsx` (주요 사항 의안)
     - `TreasurySection.tsx` (회계 장부)
     - `PrayerCountSummarySection.tsx` (기도 집계)
2. **커스텀 훅 도입 (Separation of Concerns)**:
   - 보고서 데이터 패치 및 패치 핸들러 로직(예: `patch`, `patchActivityCell`, `patchLedger`, `patchMemberCountBucket` 등)을 `useMonthlyReportEditor.ts` 와 같은 커스텀 훅으로 추출하여 비즈니스 로직과 UI 표현부를 분리합니다.
3. **상태 관리 최적화**:
   - 각 서브 컴포넌트가 필요로 하는 최소한의 상태만 가지도록 상태 끌어올리기(State Lifting)를 제한하고, 성능 향상을 위해 필요한 경우 React Context 또는 세밀한 상태 관리 기법을 적용합니다.

---

## [Issue #2] `src/lib/monthlyReportUtils.ts`: 복잡한 명단-보고서 동기화 및 요일 기반 계산의 복잡성

### 📌 이슈 제목
`[Refactor] src/lib/monthlyReportUtils.ts 동기화 로직 가독성 개선 및 함수 단일 책임 원칙(SRP) 강화`

### 💻 대상 코드 영역
- `src/lib/monthlyReportUtils.ts` (특히 `syncReportWithRoster`, `markAttendanceFromPrayers`, `computeSundayMassBasis` 함수 등)

### ⚠️ 현 문제점
1. **다중 동기화 단계의 결합 (`syncReportWithRoster`)**:
   - `syncReportWithRoster` 함수는 보고서의 이름 변경 감지(`resyncNamesFromRoster`), 단원 추가 감지, 삭제 감지, 세션 범위 동기화 등을 동시에 수행합니다. 여러 도메인 엔티티(명단, 출석부, 기도부)를 한 번에 갱신하면서 깊은 객체 복사(`structuredClone`, 스프레드 연산자)를 반복 사용하여 흐름을 한눈에 이해하기 어렵습니다.
2. **복잡한 날짜 윈도우 계산 (`computeSundayMassBasis`)**:
   - 전월 마지막 회합일 다음날부터 금월 마지막 회합일까지의 일요일 개수를 구하는 윤년/윤달 계산 로직이 들어 있습니다. 날짜 연산에 순수 JavaScript `Date` 객체를 루프 돌며 증감시키고 있어, 조건 경계 버그나 버그 발생 시 디버깅이 어렵습니다.
3. **사이드 이펙트 예측의 어려움**:
   - 특정 단원의 기도 횟수가 변경될 때 출석 여부까지 자동으로 전환하는 로직(`markAttendanceFromPrayers`)이 외부 유틸리티에 흩어져 있어, 변경 시 데이터의 어느 부분까지 파급 효과가 미치는지 한눈에 예측하기 힘듭니다.

### 💡 개선 방안
1. **동기화 로직의 파이프라인화**:
   - `syncReportWithRoster` 내부의 이름 동기화, 신규 추가, 삭제 로직을 각각 명확한 단일 책임 함수(예: `applyNameChanges`, `applyMemberAdditions`, `applyMemberRemovals`)로 분할하고 이를 순차적으로 결합하는 파이프라인 방식으로 재작성합니다.
2. **날짜 라이브러리 도입 또는 유닛 테스트 보강**:
   - 날짜 연산의 안전성을 위해 가벼운 날짜 유틸리티 라이브러리(예: `date-fns`) 도입을 검토하거나, 경계 조건(예: 2월 29일 윤달, 연도 전환기 등)에 대한 테스트 케이스를 촘촘히 보강합니다.
3. **불변 객체 업데이트 헬퍼 도입**:
   - 깊은 중첩 객체(예: `report.prayerRoll.sessions[sessionNumber][itemKey]`)를 업데이트할 때 가독성이 떨어지는 스프레드 연산자 다중첩 대신, `immer` 라이브러리 등을 도입하여 변경 로직을 직관적이고 명령형 스타일로 읽을 수 있게 개선합니다.

---

## [Issue #3] `src/components/RosaryGuide.tsx` & `src/hooks/useSwipe.ts`: 스와이프 제스처와 React 렌더링 주기 간의 비동기적 충돌 문제

### 📌 이슈 제목
`[Architecture] 묵주기도 스와이프 제스처 핸들링과 React 컴포넌트 생명주기 및 애니메이션 동기화 개선`

### 💻 대상 코드 영역
- `src/components/RosaryGuide.tsx`
- `src/hooks/useSwipe.ts`

### ⚠️ 현 문제점
1. **React State와 직접 DOM 조작의 혼재**:
   - `useSwipe` 훅 내에서 `contentRef.current.style.transform` 및 `style.transition`을 직접 조작(Imperative Style)하여 손가락 움직임을 렌더링하고 있습니다. 동시에 React는 페이지 인덱스(`index`) 상태 변경에 따라 컴포넌트를 다시 그리고 있어, 직접 조작한 인라인 스타일과 React 가상 DOM의 렌더링 결과가 일시적으로 불일치하거나 예기치 못한 레이아웃 흔들림이 발생할 수 있습니다.
2. **상태 흐름 추적의 어려움**:
   - "이미 바친 단 건너뛰기"(`initRef`), "확인창 노출 시 스와이프 차단"(`enabled: !asking`), "애니메이션 방향 지정"(`slideDirection`) 등 여러 조건부 제어 플래그가 훅과 컴포넌트 양쪽에 흩어져 있어 제스처 흐름을 파악하기 매우 어렵습니다.
3. **훅의 의존성 및 호출 제약**:
   - `useSwipe` 내에 스크롤 차단, 물리 계산(거리 판정), DOM 스타일 갱신이 한데 묶여 있어, 다른 화면 제스처가 필요한 경우 재사용하기 어렵습니다.

### 💡 개선 방안
1. **제스처/애니메이션 전문 라이브러리 도입 검토**:
   - 직접 DOM `style`을 변형하는 대신, React 생태계에서 검증된 `Framer Motion` 또는 `use-gesture` 라이브러리를 도입합니다. 이를 통해 선언적(Declarative)으로 애니메이션과 제스처를 정의하고 코드 복잡도를 획기적으로 낮출 수 있습니다.
2. **제스처 제어 상태의 캡슐화**:
   - 스와이프 동작 중인지, 복귀 중인지 등의 드래그 상태를 훅 내부로 완벽히 캡슐화하고 UI 컴포넌트에는 오직 `onNext`, `onPrev` 콜백 및 `currentOffset` 값만 노출하도록 인터페이스를 정제합니다.

---

## [Issue #4] `src/lib/treasury.ts`: 정규식 파싱 기반 이기종(Legacy) 데이터 마이그레이션 및 상태 파생 로직 복잡성

### 📌 이슈 제목
`[Refactor] src/lib/treasury.ts의 레거시 데이터 정규식 파싱 로직 개선 및 안전한 마이그레이션 설계`

### 💻 대상 코드 영역
- `src/lib/treasury.ts` (`parseExpenseBreakdown`, `migrateLegacyTreasury` 함수 등)

### ⚠️ 현 문제점
1. **정규식 기반 문자열 파싱의 취약성 (`parseExpenseBreakdown`)**:
   - 레거시 텍스트 포맷 `(의연금) 70,000원  (꽃값) 20,000원`을 파싱하기 위해 `/\(([^)]+)\)\s*([\d,]+)\s*원?/g` 라는 정규식을 사용하고 있습니다.
   - 사용자가 한글 공백이나 콤마, 혹은 다른 문자(예: "원화", "₩", 누락된 괄호 등)를 조금이라도 다르게 입력할 경우 파싱 실패 및 데이터 손실(0원으로 대체 또는 누락)이 발생하기 쉬운 취약한 구조입니다.
2. **마이그레이션 로직의 전역 산재**:
   - 앱 구동 시 구버전의 스키마를 보정해주는 핵심 로직(`migrateLegacyTreasury`)이 데이터 파생 라이브러리(`treasury.ts`) 내부에 섞여 있습니다. 이로 인해 순수 계산 함수를 호출할 때마다 매번 마이그레이션 필요 여부를 검사해야 하므로 유지보수가 어렵습니다.

### 💡 개선 방안
1. **강건한 파서(Parser) 구현 및 예외 처리**:
   - 단순 정규식에만 의존하기보다는 문자열 토큰 단위 파싱 구조를 도입하거나, 파싱 에러 발생 시 원래 텍스트를 `기타` 지출 항목으로 안전하게 수용하는 대비책(Fallback)을 확실히 보강합니다.
2. **진입점 마이그레이션(Data Migration Layer) 단일화**:
   - 비즈니스 로직 연산부인 `computeTreasuryLedger` 등에서 매번 임시 마이그레이션을 돌리는 대신, 앱 실행 직후 로컬 스토리지에서 데이터를 읽어오는 최초 진입점(`StorageBootstrap` 또는 `storage.ts`)에서 단 한 번만 최신 스키마로 변환(Migration)하여 저장하도록 데이터 파이프라인을 개선합니다.

---

## [Issue #5] `src/hooks/useCurrentReport.ts`: 묵주기도 구슬/세트 연동 및 보고서 변형 로직의 과도한 예외 상태 처리

### 📌 이슈 제목
`[Refactor] src/hooks/useCurrentReport.ts 묵주기도 가감 비즈니스 규칙 리팩토링 및 테스트 가독성 강화`

### 💻 대상 코드 영역
- `src/hooks/useCurrentReport.ts` (특히 `addRosaryBead`, `removeRosaryBead`, `addRosarySet`, `submit` 등)

### ⚠️ 현 문제점
1. **구슬 및 세트 단위의 불연속적 상태 전이 로직**:
   - `addRosaryBead`는 구슬 5개를 채우면 구슬 카운트를 0으로 초기화하고 5단을 증가시킵니다.
   - 반대로 `removeRosaryBead`는 구슬이 0일 때 5단을 차감하고 구슬 4개를 채우는 등 복잡한 조건문(`if-else`) 분기를 가집니다.
   - 직접 입력으로 5의 배수가 아닌 숫자가 남은 특이 케이스는 강제로 0으로 변경하는 등 비직관적인 예외 처리가 가득하여 주석이 없으면 코드만으로 정확한 동작 원리를 유추하기 힘듭니다.
2. **묵주기도 가이드와 일반 탭 카운터 간의 동기화 불일치**:
   - 묵주기도 가이드 완주 시 사용되는 `addRosarySet`은 구슬 진행 상태(`rosarySetProgress`)를 변경하지 않아, 앞서 쌓인 구슬과의 싱크 버그를 잠재적으로 내포하고 있습니다. (이미 알려진 문제 중 하나)

### 💡 개선 방안
1. **묵주기도 도메인 상태 기계(State Machine) 분리**:
   - 구슬 가감 및 세트 갱신 조건 로직을 순수한 수학적/비즈니스 유틸리티 함수(예: `calculateNextRosaryState(currentCount, currentProgress, actionType)`)로 분리 추출합니다.
   - 이를 통해 상태 전이 로직의 결합도를 낮추고 완벽히 격리된 단위 테스트(Unit Test)를 작성할 수 있게 만듭니다.
2. **동기화 버그 예방을 위한 단일 진입점 구현**:
   - `addRosarySet`과 `addRosaryBead`의 중복 상태 변경 코드를 통합하여, 구슬 진행률과 단 수가 항상 일관된 관계를 유지할 수 있도록 도메인 규칙을 명확히 재정립합니다.

---
*본 이슈 목록은 프로젝트 구성원들의 원활한 가독성 확보와 유지보수성 향상을 목적으로 작성되었습니다.*
