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

현재까지 PR #1~#24까지 순차 진행. `main`은 PR #23까지 머지된 상태이고, **PR #24(단원명 수정 + 공식 양식 정합성 + 한글 문서 내보내기)는 아직 리뷰/머지 대기 중**이다.

### 공식 양식 (실물 문서 분석 결과 — 중요)
사용자가 실제로 제출하는 문서는 **서울 무염시태 세나뚜스 양식 제6호(2024년 12월 개정) 쁘레시디움 월례 보고서**다. `/home/rhgw/down/hwp`에 실물 9건이 있고, HWP 5.0은 OLE 복합문서라 `python3 + olefile + zlib`로 `BodyText/Section0`의 `HWPTAG_PARA_TEXT`(0x10+51) 레코드를 파싱하면 본문을 읽을 수 있다(이 방법으로 분석했다).
- **미사영성체 = 평일미사참례 + 그달 주일미사(인원 × 주일 수)**. 단원이 별도 보고를 안 하면 주일은 전원 참석으로 본다. 실제 문서로 검산 완료(2026.06: 25+28=53, 2026.04: 37+28=65, 2025.12만 +1 — 성탄 대축일로 추정). 평일미사참례는 **본당** 지시사항 항목이라 교구 줄과 별개다.
- 기도 5종은 **교구 지시사항 줄 안에** 들어간다(별도 표가 아니다). 선교실적 누계는 4항목 × (실적/목표).
- 같은 폴더에 **연간 사업보고서(제7호)** 와 **간부 추천/임명서(제2호)** 도 있다 — 아직 미구현.

### 최근 라운드에서 다룬 내용 (최신순)
- **PR #24** (0.3.0): **단원명 수정 버그** — 이름이 명단 스냅샷·출석부·기도표 세 곳에 따로 저장되는데 기도표는 읽기 전용이었고 전역 명단 수정이 기존 보고서에 전파되지 않았다(`structuredClone`). `renamePersonInReport`로 세 곳 동시 갱신, `resyncNamesFromRoster`(행 추가/삭제 없이 라벨만 — 입력 숫자 보존), `addMemberToReport`(생성 후 입단자). **양식 정합성** — 미사영성체 파생 계산(`computeMassCommunion`, `sundayMassTotal`은 생성 시 자동 초기화 후 수정 가능), 기도 집계를 교구/본당 지시사항 줄로 이동, 선교실적 (실적/목표) 구조, 계 행·천단위·쁘레시디움명·단장 서명란·양식 번호·`break-inside`. **한글 문서** — `.hwp`는 백엔드 없이 생성 불가라 **RTF**로(`src/lib/monthlyReportRtf.ts`, 한글은 `\u` 이스케이프, 의존성 0). **`soffice --headless --convert-to txt`로 실제 검증 가능** — 이 검증 경로를 계속 쓸 것.
- **PR #23** (버전 0.2.0): 전면 조사 후 측정된 결함 정리. **성능** — 나눔고딕이 유니코드 276조각으로 쪼개져 preload 태그 185개(1.87MB)가 매 로드마다 나가던 것을 `preload: false`로 제거(기본값이 시스템 폰트라 대부분 낭비였음), 선캐시에서 폰트·og-image 제외해 설치 다운로드 5,446KB→1,664KB. **SW 치명 버그** — `CACHE_NAME`이 상수라 `/sw.js` 바이트가 매 빌드 동일 → 브라우저가 새 워커로 인식하지 않아 install/activate가 재실행된 적이 없었음(업데이트 배너 무작동, 캐시 정리 불가). `scripts/generate-precache-manifest.mjs`가 매니페스트 해시를 `out/sw.js`에 스탬프하도록 수정. RSC `.txt`를 network-first로. **안정성** — `writeJson` 예외 처리 + `global-error.tsx` + 저장 실패 토스트(용량 초과 시 흰 화면이던 문제), `beforeinstallprompt` 모듈 스코프 캡처(설정 페이지에서만 듣느라 홈→설정 동선에서 버튼이 항상 죽어 있었음), iPadOS 13+ 판별, maskable 아이콘 safe-zone 패딩본 교체. **데이터** — 가져오기 형식 검증 + 내용 요약 미리보기(단원 파일이 서기 명단·전체 월례보고서를 삭제하던 문제), `lastExportedAt` + 초기화 전 백업 유도, `storage.persist()`. **서기 자동 집계(신규)** — `src/lib/prayerSubmission.ts`의 `LEGIO1|...` 한 줄을 공유 텍스트에 덧붙이고 서기가 카톡 메시지를 붙여넣어 반영(`PrayerSubmissionImportDialog`). 이름은 **NFC 정규화 필수**(iOS NFD 대응), 동명이인·명단없음·회차범위밖·형식오류를 각각 표시하고 확인 후에만 반영, 멱등이라 중복 집계 없음. **편의** — 단원 증감 자동 계산, 명단 이름 인라인 수정(`updateMemberEntry`가 구현돼 있는데 UI가 없었음), 기록 목록 숫자 미리보기.
- **PR #22**: 머지된 #21에 대한 육안 피드백 반영. **스플래시 v2** — 크림 여백/버튼이 별로라는 피드백에 따라 [닫기]/[다시 보지 않기] 버튼 완전 제거(끄기는 설정 토글만), 같은 성화를 blur(24px)+scale(1.12)로 확대한 **흐림 배경 레이어**로 화면을 꽉 채우고 그 위에 원본 성화를 온전히 표시. 탭 닫기·5초 자동 닫힘·쿨다운은 유지. **기도문 검수/교체** — 사도신경 3곳(받으시고/묻히셨으며/부활하시고), 성모송·주님의 기도 느낌표, 파티마의 기도 직역문→공식 "구원을 비는 기도"(2011 주교회의 통일안), 성모찬송→가톨릭 기도서 현행 공식 문구(마침 계응 포함), 묵주기도 신비 명칭 20개 전부 공식 문구로(굿뉴스 catholic.or.kr 대조 확인). 영어 기도문은 표준 전통문이라 유지.
- **PR #21**: 사용자 관점 사용성 감사(Explore 3방향) 후 A~D 전면 수정. **A 스플래시**: 유지 2초→5초(페이드인 900→400ms), 아무 데나 탭 닫기, 이미지를 `aspect-ratio: 474/718` 래퍼+하단 그라디언트 스크림 구조로 바꿔 [닫기]/[다시 보지 않기] 버튼을 성화 위에 오버레이(체크박스 제거, 누르면 즉시 닫힘+토스트), 설정 재활성화 시 쿨다운 리셋, 입력 중 복귀 가드. **B 내비**: `/report`에서 기록 탭 활성 유지, 막다른 화면 3곳에 돌아가기 링크, 서기 모드 배너(`SecretaryModeBanner`)+일반 설정 복귀 링크, 탭 라벨 "보고서"/"명단 관리"로 정리, 설정의 서기 입구를 2번째 섹션으로. **C 저장·피드백**: 가짜 "저장" 버튼 2개 제거→자동저장 캡션, 거짓 제출 확인문구 수정, 토스트 2.5→4초, 리로드에 삼켜지던 토스트 지연 처리, 내보내기/일정추가/기록수정 토스트, 카운터 직접입력 blur 반영. **D 데이터 보호**: 회차 범위 축소 시 확인 다이얼로그+빈 입력 가드, 단원/주요사항 삭제 확인, 주간 기록 삭제 기능(`useHistory.removeReport`), 인쇄물 요일 숫자→한글(일요일 0 falsy 버그 포함), 미리보기 버튼 인쇄 숨김, 지난 일정 섹션. **핵심 버그 발견**: `UpdateAvailableNotice`가 첫 방문 SW `clients.claim()`의 `controllerchange`를 업데이트로 오인해 ~1초 만에 전체 리로드 → 최초 방문 스플래시가 사라지고 쿨다운만 남던 문제 수정(기존 컨트롤러가 있었을 때만 리로드).
- **PR #20**: 이전 PR들에서 "범위 제외"로 미뤄둔 접근성 항목 3종 정리 — 서기 월례 보고서의 접힘 섹션(`<summary>`)에 `<h2>`를 넣어 heading 개요 완성, 상단 배너 버튼(업데이트 알림·인앱 브라우저 안내)의 44px 하드코딩을 `--min-tap-target` 토큰으로 교체(큰 글자 설정에서 56→70px로 함께 커짐), placeholder만 있던 입력(명단 추가 성명/세례명, 출석부 이름)에 `aria-label` 추가. 검증은 시스템 크롬 + `playwright-core`(`executablePath: /usr/bin/google-chrome`)로 수행 — repo에 Playwright가 설치돼 있지 않으니 이 패턴 재사용. **주의: 헤드리스 검증에서 첫 로드 스플래시가 안 뜨는 건 `networkidle`이 SW 선캐시에 밀려 늦게 발동하는 탓 — `waitUntil: "load"` 사용, 스플래시 재등장은 `lastSplashShownAt=0` + `visibilitychange` 디스패치로 결정적으로 트리거.**
- **PR #19**: 서기 화면(`/secretary/*`)의 2단 그리드·wide 레이아웃 기준점을 960px→700px로 낮춰 가로로 돌린 폰도 넓은 레이아웃을 쓰게 함. `orientation: landscape` + 낮은 높이에서 헤더/하단탭 크롬을 축소. 스플래시가 최초 마운트 시에만 판단하던 것을 `visibilitychange`/`pageshow`에서도 재판단하도록 고쳐 다른 앱 갔다 복귀 시에도 (3시간 규칙 적용해서) 다시 뜨게 함.
- **PR #18**: 레지오 마리애 성화(Vexillum) 스플래시 신규 추가(`SplashOverlay.tsx`, 3시간 간격, 2초 유지 후 페이드, SKIP + 다시 보지 않기, 설정에서 재활성화 가능). 원본 1MB PNG를 헤드리스 크로미움 캔버스로 150KB JPEG로 재인코딩해 `public/splash.jpg`로 커밋(서비스워커가 `public/`을 전부 선캐시하므로 용량 관리가 중요했음). 함께 어르신 접근성 감사를 수행해 다수 결함 수정: 하단 탭 바가 큰 글자 설정에서 잘리던 버그(px→rem 토큰), 활성 탭 대비 부족(pill+인디케이터 추가), 본문 글자 크기 상향, PC에서 560px로 고정되던 레이아웃 확장, 전역 focus-visible 부재, 서기 화면 WCAG 미달 대비, 출석 체크박스가 사실상 안 보이던 문제.
- **PR #17**: 서기 보고서 화면(작성/미리보기)의 표들이 모바일에서 가로 스크롤 없이 잘려 보이지도 접근되지도 않던 버그 수정(`overflow-x: auto` 래퍼 + `min-width: 100%`).
- **PR #16**: 색상 대비 2차 보완(황금 강조색이 배경과 명도 차가 부족해 더 짙은 구리색으로, 청자색 포인트를 한 톤 어둡게, 하단 탭 활성색을 다시 청자색으로) + `SITE_URL`을 하드코딩에서 `NEXT_PUBLIC_SITE_URL` 환경변수로 전환(도메인 `legio.diginori.com` 연결 대응 — **Vercel 프로젝트에 해당 환경변수가 실제로 설정되어 있는지 아직 사용자 쪽에서 확인 필요할 수 있음**).
- **PR #15**: "전통 한옥 성당" 테마로 전면 색상 리디자인(크림/베이지/갈색 + 청자색 포인트), 다크모드 완전 제거(라이트모드 강제).
- 그 이전(PR #1~#13): 핵심 기능 전부 — 주간 카운터, 온보딩, 기록/공유, 기도문 전문, 글자크기·폰트 설정, 완전 오프라인 PWA, 일정+알림, 서기 전용 월례 보고서(명단 관리·출석/기도 자동집계·인쇄뷰), 데이터 가져오기/내보내기.

### 알아둘 것
- 사용자는 매번 실제로 배포된 화면을 보고 한국어로 아주 구체적인 시각적 피드백을 준다(예: "이 버튼 대비가 약하다", "가로 모드 지원해달라"). 다음 요청도 이런 식의 배포 후 육안 피드백일 가능성이 높다.
- 지금까지 애매한 지점(색상 팔레트 세부 결정, 다크모드 처리 방식 등)은 항상 `AskUserQuestion`으로 먼저 확인 후 진행했다. 시각적으로 되돌리기 어려운 변경은 계속 이 방식을 유지할 것.
- PR 본문에 "이번 범위에서 제외한 항목"을 항상 명시해왔다. PR #23 기준 남은 후보: 매칭 기억(`legioMariae.memberAliases` — 설계는 PR #23에서 확정, 붙여넣기가 실사용되는 걸 본 뒤 추가), 개인 보고 JSON 파일 + 부분 병합 가져오기, 구버전 앱 단원용 관대 파싱 폴백, 출석부 자동 반영, 회차 범위 자동 확장, 간부·단원 중복 등록 시 표에 두 줄 남는 구조, `src/app/secretary/report/page.tsx`(약 850줄) 분리, "제출하기" 용어 재검토, 회차 탭 `role=tablist` 시맨틱, `NEXT_PUBLIC_SITE_URL`의 Vercel 설정 확인(사용자 확인 필요).
- **성능 회귀 감시**: 폰트 preload와 선캐시 용량은 실측으로만 잡힌다. 빌드 후 `grep -c 'as="font"' out/index.html`(0이어야 함)과 선캐시 총량(1,700KB 내외)을 확인할 것. `public/sw.js`의 `const CACHE_NAME = "...";` 선언 형태를 바꾸면 빌드 스크립트의 스탬프가 실패하며 에러를 던진다(의도된 안전장치).
- Playwright 검증 시 로그인/온보딩을 매번 UI로 타이핑하는 대신 `context.addInitScript()`로 `legioMariae.profile`/`legioMariae.settings`를 미리 `localStorage`에 심어 온보딩을 건너뛰는 패턴을 반복 사용 중 — 새 검증 스크립트를 짤 때 이 패턴을 재사용하면 빠르다.
