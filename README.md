# 레지오 마리애 주간 활동 보고

레지오 마리애 단원이 한 주간(주회~주회) 동안의 개인 기도 활동(평일미사참례, 사제를 위한 기도, 주모경, 묵주기도, 화살기도)을 큰 버튼으로 기록하고, 회차 단위로 주간 활동 보고를 만들어 공유할 수 있는 PWA입니다. 한국어 전용이며, 데이터는 기기의 로컬 스토리지에만 저장됩니다.

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 빌드

```bash
npm run build
```

`output: 'export'` 설정에 따라 `out/` 디렉터리에 정적 사이트가 생성됩니다. 아무 정적 파일 서버로 배포하면 됩니다.

```bash
npx serve out
```

배포 도메인이 정해지면 소셜 공유 미리보기(OG 이미지) 절대경로가 올바르게 계산되도록 `NEXT_PUBLIC_SITE_URL` 환경변수를 배포 도메인으로 설정해 주세요 (예: `https://legio.example.com`).

## 주요 기능

- 회차/주회 일시 기반 주간 활동 기록, 탭 카운터 + 직접 숫자 입력
- 지난 주간 보고 기록 열람 및 공유(Web Share API, 미지원 브라우저는 클립보드 복사)
- PWA 설치(홈 화면 추가) 및 오프라인 앱 셸 지원
- 설정에서 데이터 내보내기(JSON) / 초기화


## 프로젝트 기여하기

웹 개발에 익숙하지 않은 분들도 쉽게 프로젝트 구조를 이해하고 유지보수할 수 있도록 친절한 **기여 가이드**를 준비했습니다.
어떤 기술이 쓰였는지, 디버깅은 어떻게 하는지 등에 대한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md) 파일을 참고해 주세요.

**파이썬 등 다른 언어는 익숙한데 JavaScript/TypeScript 가 처음이라면** [docs/typescript-for-python.md](docs/typescript-for-python.md) 부터 읽어 보세요.
`?? / ?. / 스프레드 / 제네릭 / JSX / React 훅` 을 파이썬 문법과 나란히 놓고 설명하고, 이 저장소를 어떤 순서로 읽으면 좋은지도 정리해 두었습니다.

**묵주기도 기능을 깊이 파고들고 싶다면** [docs/rosary/](docs/rosary/00-개요.md) 에 전용 심화 문서가 있습니다.
77단계가 만들어지는 과정, 스와이프 판정, 성화 팝업, 구슬 계산부터 **정답과 해설이 딸린 연습문제 16개**까지 담았습니다.

## 향후 계획

- 여러 단원의 제출본을 PR 단위로 취합하는 관리자 기능(현재는 로컬 스토리지 기반 개인용 앱). 내보내기 JSON 형식이 이 작업을 염두에 두고 설계되어 있습니다.

## 코드 지도 (Code Map)

프로젝트의 `src/` 디렉터리 내 주요 컴포넌트 및 모든 파일의 상세 설명은 다음과 같습니다.

### `src/app/`

- **`src/app/apple-icon.png`**: Apple 기기 홈 화면용 앱 아이콘입니다.
- **`src/app/favicon.ico`**: 브라우저 탭에 표시되는 파비콘입니다.
- **`src/app/global-error.tsx`**: 애플리케이션 전역에서 발생하는 오류를 처리하는 에러 바운더리 컴포넌트입니다.
- **`src/app/globals.css`**: 애플리케이션 전체에 적용되는 글로벌 스타일(Reset CSS, 변수, 공통 애니메이션 등)이 정의된 파일입니다.
- **`src/app/history/page.tsx`**: 과거 활동 보고 기록을 리스트 형태로 보여주는 페이지 컴포넌트입니다.
- **`src/app/icon.png`**: 기본 앱 아이콘 이미지입니다.
- **`src/app/lab/rosary/page.module.css`**: 실험실 "디지털 묵주" 페이지의 스타일링 파일입니다.
- **`src/app/lab/rosary/page.tsx`**: 실험실의 "디지털 묵주" — 누르면 숫자가 오르는 단순 카운터입니다. 묵주기도 안내 화면(`RosaryGuide`)과는 별개이며, 여기서 센 숫자는 저장되지 않습니다.
- **`src/app/layout.tsx`**: 애플리케이션의 최상위 레이아웃을 정의하며, 전역 프로바이더와 HTML 구조를 포함합니다.
- **`src/app/page.module.css`**: 메인 페이지(활동 기록)의 컴포넌트 스타일링 파일입니다.
- **`src/app/page.tsx`**: 주요 개인 기도 활동을 기록하는 메인 페이지(홈 화면) 컴포넌트입니다.
- **`src/app/providers.module.css`**: 전역 프로바이더 컴포넌트의 스타일링 파일입니다.
- **`src/app/providers.tsx`**: 테마, 언어, 알림 등 앱 전반에 걸쳐 필요한 Context Provider들을 하나로 묶는 컴포넌트입니다.
- **`src/app/report/page.module.css`**: 주간 보고서 생성 페이지의 스타일링 파일입니다.
- **`src/app/report/page.tsx`**: 한 주간의 기도 활동 기록을 종합하여 보고서 형태로 보여주고 공유할 수 있는 페이지입니다.
- **`src/app/schedule/page.module.css`**: 일정 관리 페이지의 스타일링 파일입니다.
- **`src/app/schedule/page.tsx`**: 주회 및 회합 일정을 설정하고 관리하는 페이지입니다.
- **`src/app/secretary/activity-items/page.module.css`**: 서기용 활동 항목 관리 페이지의 스타일링 파일입니다.
- **`src/app/secretary/activity-items/page.tsx`**: 서기가 단원들의 활동 항목을 관리(추가/수정/삭제)할 수 있는 페이지입니다.
- **`src/app/secretary/expense-items/page.module.css`**: 서기용 회계 지출 항목 관리 페이지의 스타일링 파일입니다.
- **`src/app/secretary/expense-items/page.tsx`**: 서기가 회계 지출 내역 항목을 관리할 수 있는 페이지입니다.
- **`src/app/secretary/layout.module.css`**: 서기 기능 전용 레이아웃의 스타일링 파일입니다.
- **`src/app/secretary/layout.tsx`**: 서기 권한이 필요한 페이지들을 감싸는 공통 레이아웃 컴포넌트입니다.
- **`src/app/secretary/page.module.css`**: 서기 메인 페이지의 스타일링 파일입니다.
- **`src/app/secretary/page.tsx`**: 서기용 기능(단원 관리, 보고서 취합 등)에 접근하는 대시보드 페이지입니다.
- **`src/app/secretary/report/page.module.css`**: 서기용 종합 보고서 페이지의 스타일링 파일입니다.
- **`src/app/secretary/report/page.tsx`**: 서기가 단원들의 활동을 취합하여 종합 보고서를 생성하고 조회하는 페이지입니다.
- **`src/app/secretary/roster/page.module.css`**: 서기용 단원 명부 관리 페이지의 스타일링 파일입니다.
- **`src/app/secretary/roster/page.tsx`**: 서기가 쁘레시디움 소속 단원 명부(로스터)를 관리하는 페이지입니다.
- **`src/app/settings/page.module.css`**: 설정 페이지의 스타일링 파일입니다.
- **`src/app/settings/page.tsx`**: 언어 변경, 데이터 초기화 및 내보내기, 앱 정보 등을 관리하는 설정 페이지입니다.
- **`src/app/tessera/page.module.css`**: 뗏세라 기도문 페이지의 스타일링 파일입니다.
- **`src/app/tessera/page.tsx`**: 레지오 마리애의 기본 기도문인 뗏세라(Tessera)를 보여주는 페이지입니다.

### `src/components/`

- **`src/components/ActivityEntryDialog.module.css`**: 활동 내역 입력 다이얼로그의 스타일 파일입니다.
- **`src/components/ActivityEntryDialog.tsx`**: 특정 활동의 상세 내역이나 숫자를 직접 입력할 수 있는 팝업(다이얼로그) 컴포넌트입니다.
- **`src/components/BottomNav.module.css`**: 하단 네비게이션 바의 스타일 파일입니다.
- **`src/components/BottomNav.tsx`**: 앱 하단에 고정되어 주요 페이지(홈, 일정, 설정 등)로 이동하는 네비게이션 메뉴 컴포넌트입니다.
- **`src/components/ConfirmDialog.module.css`**: 확인 다이얼로그의 스타일 파일입니다.
- **`src/components/ConfirmDialog.tsx`**: 삭제나 초기화 같은 중요 작업 전 사용자의 확인을 받는 팝업 컴포넌트입니다.
- **`src/components/CounterButton.module.css`**: 카운터 버튼의 스타일 파일입니다.
- **`src/components/CounterButton.tsx`**: 탭할 때마다 숫자가 증가하는 큰 버튼 형태로, 기도 횟수 기록에 사용되는 핵심 UI 컴포넌트입니다.
- **`src/components/CounterGrid.tsx`**: 여러 개의 카운터 버튼을 그리드(격자) 형태로 배치하는 레이아웃 컴포넌트입니다.
- **`src/components/DisplayPreferencesProvider.tsx`**: 글꼴 크기, 폰트 종류 등 화면 표시 설정 상태를 전역으로 관리하는 Context Provider입니다.
- **`src/components/FontFamilyToggle.module.css`**: 글꼴 변경 토글 버튼의 스타일 파일입니다.
- **`src/components/FontFamilyToggle.tsx`**: 고딕/명조 등 앱의 기본 글꼴을 변경하는 토글 버튼 컴포넌트입니다.
- **`src/components/FontScaleToggle.module.css`**: 글꼴 크기 토글 버튼의 스타일 파일입니다.
- **`src/components/FontScaleToggle.tsx`**: 텍스트의 크기를 확대/축소할 수 있는 토글 버튼 컴포넌트입니다.
- **`src/components/Header.module.css`**: 상단 헤더의 스타일 파일입니다.
- **`src/components/Header.tsx`**: 각 페이지 상단에 위치하며 제목과 부가 메뉴를 포함하는 헤더 컴포넌트입니다.
- **`src/components/HistoryList.module.css`**: 기록 목록 컴포넌트의 스타일 파일입니다.
- **`src/components/HistoryList.tsx`**: 과거 주간 보고서 목록을 렌더링하는 컨테이너 컴포넌트입니다.
- **`src/components/HistoryListItem.module.css`**: 기록 목록 아이템 컴포넌트의 스타일 파일입니다.
- **`src/components/HistoryListItem.tsx`**: 과거 주간 보고서 목록 중 개별 항목을 표시하는 컴포넌트입니다.
- **`src/components/InAppBrowserNotice.module.css`**: 인앱 브라우저 알림 컴포넌트의 스타일 파일입니다.
- **`src/components/InAppBrowserNotice.tsx`**: 카카오톡 등 인앱 브라우저에서 실행될 때 외부 브라우저 사용을 권장하는 알림 배너입니다.
- **`src/components/InstallPromptButton.module.css`**: PWA 설치 유도 버튼의 스타일 파일입니다.
- **`src/components/InstallPromptButton.tsx`**: 사용자가 PWA 앱을 기기의 홈 화면에 추가하도록 유도하는 버튼 컴포넌트입니다.
- **`src/components/OnboardingGate.module.css`**: 초기 온보딩 화면의 스타일 파일입니다.
- **`src/components/OnboardingGate.tsx`**: 앱을 처음 실행하는 사용자에게 초기 설정(프로필 등)을 안내하는 게이트 컴포넌트입니다.
- **`src/components/PageShell.module.css`**: 기본 페이지 레이아웃 셸의 스타일 파일입니다.
- **`src/components/PageShell.tsx`**: 헤더와 콘텐츠 영역 등을 감싸는 기본적인 페이지 뼈대(레이아웃) 컴포넌트입니다.
- **`src/components/PlatformChoicePopup.module.css`**: 플랫폼 선택 팝업의 스타일 파일입니다.
- **`src/components/PlatformChoicePopup.tsx`**: 공유나 외부 연동 시 대상 플랫폼(카카오톡, 문자 등)을 선택하는 팝업입니다.
- **`src/components/PrayerSubmissionImportDialog.module.css`**: 기도 기록 가져오기 다이얼로그의 스타일 파일입니다.
- **`src/components/PrayerSubmissionImportDialog.tsx`**: 외부에서 전달받은 기도 기록 데이터를 앱으로 가져오는 팝업 컴포넌트입니다.
- **`src/components/PrayerTextDialog.module.css`**: 기도문 다이얼로그의 스타일 파일입니다.
- **`src/components/PrayerTextDialog.tsx`**: 상세한 기도문 텍스트를 화면에 보여주는 팝업 컴포넌트입니다.
- **`src/components/ReportSummary.module.css`**: 보고서 요약 컴포넌트의 스타일 파일입니다.
- **`src/components/ReportSummary.tsx`**: 작성된 주간 활동 보고서의 요약 정보를 표시하는 컴포넌트입니다.
- **`src/components/MysteryImageDialog.tsx`**: 묵주기도 성화를 전체화면으로 크게 보며 그 단의 묵상을 읽는 팝업입니다.
- **`src/components/RosaryGuide.module.css`**: 묵주기도 안내 화면의 스타일 파일입니다. `RosaryStepView`, `MysteryImageDialog` 도 이 파일을 함께 씁니다.
- **`src/components/RosaryGuide.tsx`**: 묵주기도 안내 화면의 상태를 들고 조각들을 조립하는 컴포넌트입니다. 77단계 중 지금 어디인지, 성화 팝업이 열렸는지 등을 관리합니다.
- **`src/components/RosaryStepView.tsx`**: 묵주기도 안내의 화면 한 장(위치·기도 이름·성화·기도문)을 그리는 컴포넌트입니다.
- **`src/components/ScheduleReminderChecker.tsx`**: 설정된 주회 일정이 다가오는지 확인하고 알림(또는 UI 표시)을 트리거하는 컴포넌트입니다.
- **`src/components/SecretaryModeBanner.module.css`**: 서기 모드 배너의 스타일 파일입니다.
- **`src/components/SecretaryModeBanner.tsx`**: 서기 기능이 활성화되었음을 화면 상단 등에 알려주는 배너 컴포넌트입니다.
- **`src/components/SecretaryReportPrintView.module.css`**: 서기용 보고서 인쇄 뷰의 스타일 파일입니다.
- **`src/components/SecretaryReportPrintView.tsx`**: 서기가 취합한 종합 보고서를 인쇄하기 좋은 형태(Print-friendly)로 렌더링하는 컴포넌트입니다.
- **`src/components/ShareButton.module.css`**: 공유 버튼 컴포넌트의 스타일 파일입니다.
- **`src/components/ShareButton.tsx`**: Web Share API를 활용하여 작성된 보고서 등을 다른 앱으로 공유하는 버튼 컴포넌트입니다.
- **`src/components/SplashOverlay.module.css`**: 스플래시 화면 오버레이의 스타일 파일입니다.
- **`src/components/SplashOverlay.tsx`**: 앱 로딩 시나 특정 진입 시 표시되는 스플래시(로고) 화면 오버레이 컴포넌트입니다.
- **`src/components/SplashToggle.module.css`**: 스플래시 토글 설정 버튼의 스타일 파일입니다.
- **`src/components/SplashToggle.tsx`**: 앱 시작 시 스플래시 화면을 볼지 여부를 켜고 끄는 설정 버튼 컴포넌트입니다.
- **`src/components/StorageBootstrap.tsx`**: 앱 시작 시 로컬 스토리지의 데이터를 읽어와 초기 상태를 세팅하는 부트스트랩 컴포넌트입니다.
- **`src/components/StorageFailureNotice.tsx`**: 로컬 스토리지 접근이 차단되었거나 용량이 부족할 때 경고를 표시하는 컴포넌트입니다.
- **`src/components/SubmitReportButton.module.css`**: 보고서 제출 버튼의 스타일 파일입니다.
- **`src/components/SubmitReportButton.tsx`**: 작성된 활동 기록을 최종 보고서로 제출/확정하는 버튼 컴포넌트입니다.
- **`src/components/Toast.module.css`**: 토스트 알림 메시지의 스타일 파일입니다.
- **`src/components/ToastProvider.tsx`**: 잠깐 나타났다 사라지는 토스트 알림 메시지를 화면에 띄우고 상태를 관리하는 Provider입니다.
- **`src/components/TreasuryExpenseDialog.module.css`**: 회계 지출 다이얼로그의 스타일 파일입니다.
- **`src/components/TreasuryExpenseDialog.tsx`**: 회계 관련 지출 내역을 입력하거나 수정하는 팝업 컴포넌트입니다.
- **`src/components/UpdateAvailableNotice.module.css`**: 업데이트 알림 배너의 스타일 파일입니다.
- **`src/components/UpdateAvailableNotice.tsx`**: PWA 서비스 워커의 새 버전이 발견되었을 때 사용자에게 업데이트를 알리고 새로고침을 유도하는 배너입니다.
- **`src/components/WeekSessionForm.module.css`**: 주회/회차 입력 폼의 스타일 파일입니다.
- **`src/components/WeekSessionForm.tsx`**: 주간 보고서 작성 시 해당하는 주회수(회차)와 날짜를 입력받는 폼 컴포넌트입니다.
- **`src/components/icons/AspirationIcon.tsx`**: 화살기도를 나타내는 SVG 아이콘 컴포넌트입니다.
- **`src/components/icons/ChainPrayerIcon.tsx`**: 연도(사슬기도)를 나타내는 SVG 아이콘 컴포넌트입니다.
- **`src/components/icons/IconBase.tsx`**: 모든 아이콘 컴포넌트의 공통 속성(크기, 색상 등)을 정의하는 베이스 래퍼 컴포넌트입니다.
- **`src/components/icons/MassIcon.tsx`**: 미사 참례를 나타내는 SVG 아이콘 컴포넌트입니다.
- **`src/components/icons/NavIcons.tsx`**: 하단 네비게이션 등에 사용되는 아이콘들의 집합 파일입니다.
- **`src/components/icons/PriestIcon.tsx`**: 사제를 위한 기도를 나타내는 SVG 아이콘 컴포넌트입니다.
- **`src/components/icons/RosaryIcon.tsx`**: 묵주기도를 나타내는 SVG 아이콘 컴포넌트입니다.

### `src/hooks/`

- **`src/hooks/useCurrentReport.ts`**: 현재 주간의 활동 기록 상태를 로컬 스토리지와 연동하여 읽고 쓰는 커스텀 훅입니다.
- **`src/hooks/useHistory.ts`**: 과거 제출된 주간 보고서 목록(히스토리) 데이터를 불러오고 관리하는 커스텀 훅입니다.
- **`src/hooks/useInstallPrompt.ts`**: PWA 설치 프롬프트(beforeinstallprompt 이벤트) 상태를 감지하고 설치를 트리거하는 커스텀 훅입니다.
- **`src/hooks/useLocalStorageReady.ts`**: 로컬 스토리지가 브라우저 환경에서 사용 가능한 상태가 되었는지 확인하는 상태 훅입니다.
- **`src/hooks/useMonthlyReports.ts`**: 월별/기간별 활동 보고서 통계를 계산하고 데이터를 추출하는 커스텀 훅입니다.
- **`src/hooks/useRoster.ts`**: 서기가 관리하는 쁘레시디움 단원 명부(로스터) 데이터를 관리하는 커스텀 훅입니다.
- **`src/hooks/useSchedule.ts`**: 주회 일정 데이터를 로컬 스토리지에서 읽어오고 설정하는 커스텀 훅입니다.
- **`src/hooks/useSwipe.ts`**: 좌우 스와이프(손가락으로 쓸어 넘기기)를 감지하는 커스텀 훅입니다. 묵주기도 안내 화면에서 다음/이전으로 넘어가는 데 씁니다.

### `src/lib/`

- **`src/lib/activityItems.ts`**: 기록할 수 있는 각종 활동(기도, 미사 등) 항목들의 정의와 메타데이터를 관리하는 모듈입니다.
- **`src/lib/activityReport.ts`**: 단일 주간 활동 보고서 객체의 구조 정의 및 관련 헬퍼 함수들이 포함되어 있습니다.
- **`src/lib/constants.ts`**: 앱 전역에서 공통으로 사용되는 상수 값(로컬 스토리지 키 이름 등)이 정의된 파일입니다.
- **`src/lib/expenseItems.ts`**: 회계 지출 관련 카테고리나 항목들의 기본 정의를 담고 있는 파일입니다.
- **`src/lib/exportData.ts`**: 사용자의 로컬 스토리지 데이터를 JSON 파일 형태로 내보내는(export) 기능을 담당합니다.
- **`src/lib/id.ts`**: 고유 식별자(ID) 생성을 위한 유틸리티 함수(UUID 생성 등)가 포함된 파일입니다.
- **`src/lib/monthlyReportUtils.ts`**: 월간 보고서 생성을 위한 데이터 필터링, 그룹화, 통계 계산 유틸리티 함수 모음입니다.
- **`src/lib/prayerSubmission.ts`**: 외부(또는 타 단원)로부터 기도 기록 데이터를 받아 처리/병합하는 로직을 담고 있습니다.
- **`src/lib/prayerTexts.ts`**: 앱에서 제공되는 다양한 기도문들의 원문 텍스트 데이터가 하드코딩되어 있는 파일입니다.
- **`src/lib/reportCapture.ts`**: 화면에 렌더링된 보고서를 이미지나 파일 형태로 캡처/추출하는 기능과 관련된 로직입니다.
- **`src/lib/reportUtils.ts`**: 보고서 데이터를 가공, 포맷팅, 요약하는 데 필요한 공통 유틸리티 함수 모음입니다.
- **`src/lib/rosaryMeditations.ts`**: 신비 20개(4신비 × 5단) 각각에 붙는 묵상 문장 데이터입니다. 성화를 눌렀을 때 뜨는 팝업의 본문이 여기서 나옵니다.
- **`src/lib/rosaryMysteries.ts`**: 요일에 맞는 신비를 고르고, 묵주기도 한 바퀴를 화면 77장짜리 배열로 펼치는 순수 로직 모듈입니다.
- **`src/lib/selectOnFocus.ts`**: 입력창(input)이 포커스를 받을 때 텍스트를 자동으로 전체 선택하게 해주는 유틸리티 훅/함수입니다.
- **`src/lib/site.ts`**: 앱의 기본 URL, 메타데이터(SEO), 사이트 설정값 등을 정의하는 모듈입니다.
- **`src/lib/storage.ts`**: 브라우저 로컬 스토리지에 데이터를 읽고 쓰는 모든 인터페이스를 추상화하여 관리하는 핵심 모듈입니다.
- **`src/lib/tesseraTexts.ts`**: 뗏세라 기도문(시작, 까떼나, 마침 기도 등)의 텍스트 데이터가 정리된 파일입니다.
- **`src/lib/treasury.ts`**: 쁘레시디움 회계(헌금, 지출 등) 데이터 구조와 계산 로직을 정의하는 파일입니다.
- **`src/lib/types.ts`**: TypeScript에서 사용하는 애플리케이션 전반의 주요 타입(인터페이스) 정의가 모여 있는 파일입니다.
- **`src/lib/version.ts`**: 현재 앱의 버전 정보를 관리하고 마이그레이션 필요 여부를 판단하는 모듈입니다.

### 묵주기도 이미지 업로드 가이드 (Rosary Images Upload Guide)
본 프로젝트는 묵주기도 다이얼로그 안에서 각 신비와 단(decade)에 맞는 이미지를 표시하는 기능을 지원합니다.
새로운 묵주기도 이미지를 추가하거나 교체하고자 할 경우 다음 규칙에 따라주세요.

1. **파일 경로:**
   모든 묵주기도 이미지는 `public/images/rosary` 디렉토리 하위에 위치해야 합니다.
2. **파일명 규칙:**
   `[mysteryId]-[decade].jpeg` 형태의 이름을 사용합니다.
   * `mysteryId`의 종류: `joyful` (환희), `luminous` (빛), `sorrowful` (고통), `glorious` (영광)
   * `decade`: 1부터 5까지의 숫자
   * (예: 영광의 신비 1단 이미지는 `glorious-1.jpeg`)
3. **이미지 포맷:**
   `jpeg` 확장자를 사용하는 것을 권장하며, 용량 최적화를 위해 적절히 압축된 이미지를 사용하는 것이 좋습니다. 앱 화면에 맞는 해상도를 고려하여 업로드합니다.
