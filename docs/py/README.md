# Python 스크립트 모음 (`docs/py/`)

이 폴더에는 프로젝트 개발 및 문서화 과정에서 편의를 위해 작성된 자동화 및 패치 용도의 파이썬(`*.py`) 스크립트들이 모여 있습니다.
주로 이전 개발 과정(Playwright 테스트, 코드 일괄 수정, 문서 생성 등)에서 사용된 유틸리티 파일들입니다.

## 파일별 기능 설명

### 1. 테스트 및 검증 스크립트 (Playwright)
- `verify_rosary.py`
- `verify_rosary2.py`
  - Playwright(웹 브라우저 자동화 도구)를 활용하여 `localhost:3000`에 접속한 뒤, 묵주기도 화면이 제대로 동작하는지 UI 요소를 클릭하고 스크린샷을 찍어 확인하는 E2E(End-to-End) 테스트 스크립트입니다.

### 2. 소스 코드 자동 수정 (패치) 스크립트
아래 스크립트들은 특정 개발 시점에 TypeScript/React 코드(`RosaryGuide.tsx`, `rosaryMysteries.ts` 등)를 프로그래밍 방식으로 일괄 수정하기 위해 사용되었습니다.
- `patch_dialog.py` / `patch_rosary_guide.py` / `patch_rosary_guide2.py`
  - 묵주기도 안내 화면(`RosaryGuide.tsx`)에 성화를 전체 화면으로 볼 수 있는 팝업(Dialog) 다이얼로그 기능과 상태를 자동으로 주입하는 스크립트입니다.
- `patch_rosary.py` / `update_rosary.py` / `patch_rosary_mysteries2.py`
  - `meditations.json`에 저장된 묵주기도 묵상 데이터(텍스트)를 읽어와, `rosaryMysteries.ts` 코드 내부의 `MYSTERY_MEDITATIONS` 상수로 자동 변환하여 삽입하거나 인터페이스를 수정하는 스크립트입니다.

### 3. 문서 및 기타 유틸리티
- `generate_docs.py`
  - 학습 가이드라인용 마크다운 파일(예: `study3/00_cover.md` 등)을 자동으로 생성하고 구성하는 스크립트입니다.
- `code_review.py`
  - 에이전트/자동화 파이프라인에서 단순 확인 메시지를 출력하기 위해 사용된 임시 스크립트입니다.
