# 4. 고급 기능 및 기타 설정

## 4.1 다국어 처리 (i18n)
이 프로젝트는 `src/i18n/dictionaries/` 폴더에 언어별 사전 파일을 두고 있습니다.
사용자가 선택한 언어(한국어, 영어 등)에 따라 화면의 텍스트가 바뀝니다.

## 4.2 PWA (Progressive Web App) 오프라인 기능
사용자가 인터넷이 끊겨도 앱을 사용할 수 있게 해주는 마법입니다!
- `public/sw.js`: 서비스 워커 스크립트가 네트워크 요청을 가로채고, 캐시된(저장된) 파일을 보여줍니다.
- `scripts/generate-precache-manifest.mjs`: 빌드할 때 미리 저장해둘 파일 목록을 만드는 역할을 합니다. (`package.json`의 `"postbuild"` 스크립트를 보세요!)

## 4.3 빌드와 린팅
터미널에서 아래 명령어를 사용합니다:
- `npm run dev`: 개발용으로 실행합니다. 코드를 고치면 화면에 바로 반영됩니다.
- `npm run lint`: 코드에 문법적인 오류나 컨벤션(규칙)을 어긴 곳이 없는지 검사합니다.
- `npm run build`: 실제 서비스에 배포하기 위해 코드를 압축하고 최적화합니다. (`next.config.ts`의 `output: "export"` 설정에 따라 순수 HTML/CSS/JS로 만들어집니다.)
