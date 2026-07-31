@AGENTS.md

# 레지오 마리애 주간 활동 보고 — 프로젝트 가이드

한국 레지오 마리애 단원용 주간 기도 활동 기록 PWA. 백엔드 없이 전부 클라이언트에서 동작하며, 데이터는 기기의 `localStorage`에만 저장된다. 한국어가 기본 언어이고 사용자층은 50대 이상·노년층 비중이 높아 가독성·터치 영역·명도 대비가 다른 프로젝트보다 훨씬 중요하다.

## 기술 스택

- Next.js (App Router), **정적 export** (`output: "export"`, `trailingSlash: true`, `next.config.ts`) — 서버 컴포넌트 없음, 동적 라우트 세그먼트 없음. `useSearchParams()`는 항상 `<Suspense>`로 감싼다.
- TypeScript, React. **CSS Modules만 사용, Tailwind 없음.**
- 상태/영속성: React state + `window.localStorage`. 백엔드도 DB도 없다.
- PWA: 손으로 작성한 `public/sw.js` + 빌드 후 `scripts/generate-precache-manifest.mjs`가 `out/`를 훑어 전체 파일을 선캐시 목록으로 만든다. `public/`에 넣는 자산은 자동으로 선캐시되므로 **용량에 유의** (이미지 등 큰 파일은 빌드 전에 압축).

## 아키텍처 핵심

- **데이터 계층**: `src/lib/storage.ts`가 유일한 진입점. `KEYS` 상수(`legioMariae.*` 접두사) + `readJson`/`writeJson` 헬퍼 + 타입별 getter/setter 쌍. **새 영속 값을 추가할 때 이 파일의 패턴을 그대로 따를 것** (기본값 병합, `resetAll()`에 자동 포함).
- **타입**: `src/lib/types.ts`에 전부 정의. `Settings`, `Profile`, `WeeklyReport`(개인 주간 보고), `PraesidiumRoster`/`MonthlyReport`(서기 전용 월례 보고서) 등.
- **정적 export + 하이드레이션**: 서버 렌더 시 `localStorage`가 없으므로, 클라이언트 상태를 읽는 훅/컴포넌트는 `useLocalStorageReady()`(`src/hooks/useLocalStorageReady.ts`)로 하이드레이션 완료를 기다리거나, `useEffect` 안에서만 읽고 그 전엔 `null`/기본값을 렌더링해야 한다. `setState`를 `useEffect` 안에서 호출할 때는 `// eslint-disable-next-line react-hooks/set-state-in-effect -- <이유>` 주석을 다는 게 이 repo의 관례.
- **i18n**: `src/i18n/dictionaries/ko.ts`가 원본, `en.ts`는 `satisfies typeof ko`로 키 일치를 강제한다. **키를 추가할 때는 반드시 두 파일 모두 수정** — 안 하면 `tsc`가 실패한다. 조회는 `useTranslation()`의 `t("a.b.c")` 점표기 문자열(런타임에만 검증, 오타 시 조용히 경로 문자열을 그대로 반환).
- **테마**: `src/app/globals.css`의 `:root`에 전부 CSS 커스텀 프로퍼티로 정의(`--color-*`, `--font-size-*`, `--space-*`, `--min-tap-target`, `--bottom-nav-height` 등). **다크모드 없음 — 라이트모드 강제**가 명시적 결정 사항. 색을 바꿀 땐 컴포넌트 CSS가 아니라 이 토큰을 바꾸는 것으로 전파되도록 설계돼 있다. 서기 섹션(`src/app/secretary/layout.module.css`의 `.themed`)만 별도 오렌지 톤으로 일부 토큰을 오버라이드.
- **다이얼로그 패턴**: 전체화면/모달 오버레이는 `<dialog>` + `useRef<HTMLDialogElement>` + `useEffect`로 `showModal()`/`close()` 동기화, `onCancel`에서 `preventDefault()` 후 React 상태로 닫기. `PrayerTextDialog.tsx`, `ConfirmDialog.tsx`, `SplashOverlay.tsx`가 이 패턴. `showModal()`은 top layer라 z-index 경쟁·수동 스크롤 잠금이 필요 없다.
- **접근성 기준선**: 탭 영역 `--min-tap-target`(3.5rem) 이상, 본문 글자는 `--font-size-sm`(1rem)이 아니라 `--font-size-base`(1.1875rem) 이상 사용(잔글씨는 정말 부가정보일 때만), 전역 `:focus-visible` 링 있음, 색만으로 상태를 구분하지 않기(배경/굵기/아이콘 등 병행).
- **레이아웃**: `PageShell`이 `Header` + `<main>` + `BottomNav`를 감싼다. `wide` prop을 넘기면(서기 화면들) 넓은 화면에서 더 넓게 확장. 브레이크포인트는 `700px`(가로로 돌린 폰), `960px`(PC), 그리고 `orientation: landscape and max-height: 520px`(가로 모드에서 세로 공간 부족)까지 세 종류가 존재 — 새 반응형 규칙을 추가할 땐 이 세 기준과 일관되게.
- **서기(비서) 전용 기능**: `/secretary/*` 라우트, `src/app/secretary/layout.tsx`가 오렌지 테마 + 하단 탭 스왑(`data-secretary="true"`)을 적용. 개인용 주간 보고(`WeeklyReport`)와는 별개의 월례 보고서(`MonthlyReport`) 데이터 모델을 쓴다.

## 개발 워크플로

- 스크립트: `npm run dev`, `npm run build`(빌드 후 자동으로 `postbuild`가 precache manifest 생성), `npm run lint`, `npx tsc --noEmit`.
- 로컬에서 정적 산출물 확인: `npx serve out` (**`serve -s`는 쓰지 않는다** — SPA 폴백이 정적 export의 `trailingSlash` 라우팅과 안 맞음).
- PR 전 항상 `npx tsc --noEmit && npm run lint && npm run build` 클린 확인, 가능하면 Playwright로 실제 화면(모바일 뷰포트 + PC 뷰포트) 스크린샷까지 확인.
- 매 PR마다 `package.json`의 `version`을 patch 1단계 올리는 관례 (0.1.x). 화면에는 `src/lib/version.ts`가 빌드 타임에 인라인해서 설정 화면 하단에 노출.
- **브랜치**: 항상 `claude/korean-legionella-activity-app-78ztzd`에서 작업. 이전 PR이 머지된 게 확인되면(`git fetch origin main` 후 머지 커밋 존재) 다음 작업 전에 `git checkout -B claude/korean-legionella-activity-app-78ztzd origin/main`으로 브랜치를 리셋한다. 머지 안 된 PR이 아직 열려 있으면 같은 브랜치에 계속 커밋 — 별도 PR을 새로 만들지 않는다.

## 핸드오프 (2026-07-31 기준)

현재까지 PR #1~#19까지 순차 진행. `main`은 PR #18까지 머지된 상태이고, **PR #19("서기 화면 가로 모드 대응 + 앱 복귀 시 스플래시 재표시")는 아직 리뷰/머지 대기 중**이다. 로컬 `claude/korean-legionella-activity-app-78ztzd` 브랜치는 PR #19의 커밋(`8550785`)까지 포함하고 원격과 동기화되어 있다.

### 최근 라운드에서 다룬 내용 (최신순)
- **PR #19**: 서기 화면(`/secretary/*`)의 2단 그리드·wide 레이아웃 기준점을 960px→700px로 낮춰 가로로 돌린 폰도 넓은 레이아웃을 쓰게 함. `orientation: landscape` + 낮은 높이에서 헤더/하단탭 크롬을 축소. 스플래시가 최초 마운트 시에만 판단하던 것을 `visibilitychange`/`pageshow`에서도 재판단하도록 고쳐 다른 앱 갔다 복귀 시에도 (3시간 규칙 적용해서) 다시 뜨게 함.
- **PR #18**: 레지오 마리애 성화(Vexillum) 스플래시 신규 추가(`SplashOverlay.tsx`, 3시간 간격, 2초 유지 후 페이드, SKIP + 다시 보지 않기, 설정에서 재활성화 가능). 원본 1MB PNG를 헤드리스 크로미움 캔버스로 150KB JPEG로 재인코딩해 `public/splash.jpg`로 커밋(서비스워커가 `public/`을 전부 선캐시하므로 용량 관리가 중요했음). 함께 어르신 접근성 감사를 수행해 다수 결함 수정: 하단 탭 바가 큰 글자 설정에서 잘리던 버그(px→rem 토큰), 활성 탭 대비 부족(pill+인디케이터 추가), 본문 글자 크기 상향, PC에서 560px로 고정되던 레이아웃 확장, 전역 focus-visible 부재, 서기 화면 WCAG 미달 대비, 출석 체크박스가 사실상 안 보이던 문제.
- **PR #17**: 서기 보고서 화면(작성/미리보기)의 표들이 모바일에서 가로 스크롤 없이 잘려 보이지도 접근되지도 않던 버그 수정(`overflow-x: auto` 래퍼 + `min-width: 100%`).
- **PR #16**: 색상 대비 2차 보완(황금 강조색이 배경과 명도 차가 부족해 더 짙은 구리색으로, 청자색 포인트를 한 톤 어둡게, 하단 탭 활성색을 다시 청자색으로) + `SITE_URL`을 하드코딩에서 `NEXT_PUBLIC_SITE_URL` 환경변수로 전환(도메인 `legio.diginori.com` 연결 대응 — **Vercel 프로젝트에 해당 환경변수가 실제로 설정되어 있는지 아직 사용자 쪽에서 확인 필요할 수 있음**).
- **PR #15**: "전통 한옥 성당" 테마로 전면 색상 리디자인(크림/베이지/갈색 + 청자색 포인트), 다크모드 완전 제거(라이트모드 강제).
- 그 이전(PR #1~#13): 핵심 기능 전부 — 주간 카운터, 온보딩, 기록/공유, 기도문 전문, 글자크기·폰트 설정, 완전 오프라인 PWA, 일정+알림, 서기 전용 월례 보고서(명단 관리·출석/기도 자동집계·인쇄뷰), 데이터 가져오기/내보내기.

### 알아둘 것
- 사용자는 매번 실제로 배포된 화면을 보고 한국어로 아주 구체적인 시각적 피드백을 준다(예: "이 버튼 대비가 약하다", "가로 모드 지원해달라"). 다음 요청도 이런 식의 배포 후 육안 피드백일 가능성이 높다.
- 지금까지 애매한 지점(색상 팔레트 세부 결정, 다크모드 처리 방식 등)은 항상 `AskUserQuestion`으로 먼저 확인 후 진행했다. 시각적으로 되돌리기 어려운 변경은 계속 이 방식을 유지할 것.
- PR 본문에 "이번 범위에서 제외한 항목"을 항상 명시해왔다(예: `<summary>` 요소의 heading 시맨틱, 일부 배너의 44px 타깃, placeholder-as-label 문제). 다음 라운드에서 먼저 확인해볼 후보들.
- Playwright 검증 시 로그인/온보딩을 매번 UI로 타이핑하는 대신 `context.addInitScript()`로 `legioMariae.profile`/`legioMariae.settings`를 미리 `localStorage`에 심어 온보딩을 건너뛰는 패턴을 반복 사용 중 — 새 검증 스크립트를 짤 때 이 패턴을 재사용하면 빠르다.
