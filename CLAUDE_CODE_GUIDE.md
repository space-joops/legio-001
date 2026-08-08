# Claude Code 플러그인·스킬 가이드

이 프로젝트에서 Claude Code(AI 코딩 도구)를 쓸 때 도움이 되는 **플러그인과 스킬**을 조사해 정리한 문서입니다. 무엇이 이미 설치되어 있고, 무엇을 추가로 설치하면 좋은지, 어떻게 사용하는지를 다룹니다. (조사 시점: 2026-08, 설치 수는 skills.sh 기준)

> **용어 정리**
> - **플러그인(Plugin)**: 스킬·에이전트·훅·MCP 서버를 묶어 배포하는 패키지. 마켓플레이스에서 설치합니다. 플러그인 안의 스킬은 `/플러그인명:스킬명` 형태로 네임스페이스가 붙습니다.
> - **스킬(Skill)**: YAML 프런트매터가 붙은 마크다운 파일 하나로 된 "작업 매뉴얼". Claude가 작업 내용을 보고 자동으로 참조하거나, 사용자가 `/스킬명`으로 직접 호출합니다.
> - **서브에이전트(Subagent)**: 독립된 컨텍스트·시스템 프롬프트를 가진 보조 AI. Claude가 작업을 위임하고 요약만 돌려받습니다 (`.claude/agents/*.md`).
> - **훅(Hook)**: 도구 실행 전후에 끼어드는 이벤트 핸들러 (`settings.json`에 설정).

## 1. 이 프로젝트에서 "알맞다"의 기준

이 프로젝트의 특성상 도구 선택 기준이 일반 웹 프로젝트와 다릅니다.

- **정적 export Next.js PWA** — 서버 없음, `localStorage`만 사용. 백엔드/DB/인증 계열 플러그인은 전부 불필요.
- **노년층 사용자 접근성이 최우선** — 접근성(a11y) 감사 도구의 가치가 가장 높음.
- **배포 후 육안 검증 문화** — Playwright/브라우저 자동화로 실제 화면(모바일 + PC 뷰포트)을 확인하는 작업이 반복됨.
- **성능 회귀 감시 항목이 명문화됨** — 폰트 preload 0개, 선캐시 총량 약 1,700KB 유지 (CLAUDE.md 참고). 성능 측정 도구가 유용.
- **Vercel 배포** (`legio.diginori.com`) — Vercel 플러그인이 직접적으로 쓸모 있음.

## 2. 이미 설치되어 있는 것

### Vercel 플러그인 (공식 마켓플레이스, 설치됨)

Anthropic 공식 마켓플레이스(`anthropics/claude-plugins-official`)의 `vercel` 플러그인이 사용자 레벨로 설치되어 있습니다. 이 프로젝트에서 특히 유용한 명령:

| 명령/스킬 | 용도 |
| --- | --- |
| `/vercel:status` | 최근 배포 상태·프로젝트 연결 정보 확인 |
| `/vercel:deploy` | 프리뷰 배포 (`prod` 인자를 주면 프로덕션) |
| `/vercel:env` | 환경변수 목록/추가/동기화 — **`NEXT_PUBLIC_SITE_URL`이 Vercel에 설정돼 있는지 확인할 때 바로 이걸 쓰면 됩니다** |
| `vercel:nextjs`, `vercel:react-best-practices` | Next.js/React 작업 시 Claude가 자동 참조 (직접 호출 불필요) |

아직 설치 전인 환경이라면:

```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install vercel@claude-plugins-official
```

### Claude Code 내장 스킬 (설치 불필요)

| 명령 | 용도 |
| --- | --- |
| `/code-review` | 현재 브랜치 diff의 버그·개선점 리뷰. `/code-review ultra`는 클라우드 다중 에이전트 심층 리뷰 |
| `/security-review` | 브랜치 변경사항 보안 리뷰 |
| `/simplify` | 변경 코드의 중복·단순화 정리 (버그 탐지는 안 함) |
| `/init` | CLAUDE.md 초기화 (이미 있으므로 사용할 일 거의 없음) |

### 사용자 레벨 스킬 (일부 개발 환경에 설치됨)

- **web-design-guidelines** — UI 코드를 Web Interface Guidelines 기준으로 검토. "UI 리뷰해줘", "접근성 확인해줘" 같은 요청에 자동 트리거. **접근성이 핵심인 이 프로젝트와 가장 궁합이 좋은 스킬**입니다. 없는 환경에서는:

  ```bash
  npx skills add vercel-labs/agent-skills@web-design-guidelines -g
  ```

## 3. 추가 설치를 추천하는 플러그인

공식 마켓플레이스(`claude-plugins-official`)에서 설치합니다. 대화형으로는 `/plugin install 이름@claude-plugins-official`, 터미널에서는:

```bash
claude plugin install 이름@claude-plugins-official --scope user     # 내 계정 전체
claude plugin install 이름@claude-plugins-official --scope project  # 이 저장소에서 팀 공유
```

### 3-1. playwright — 브라우저 자동화 MCP (강력 추천)

Microsoft의 Playwright MCP 서버. Claude가 실제 브라우저를 열어 페이지 조작·스크린샷·요소 확인을 할 수 있게 됩니다.

- **왜 이 프로젝트에?** PR 전 "모바일 뷰포트 + PC 뷰포트 스크린샷 확인"이 관례입니다. 지금은 매번 `playwright-core` 스크립트를 손으로 짜는데, 이 플러그인이 있으면 "빌드 결과물 열어서 모바일 화면 스크린샷 찍어줘"로 끝납니다.
- **주의**: 스플래시 화면이 첫 로드에서 클릭을 가로채므로, 자동화 시 스플래시가 사라진 뒤 상호작용해야 합니다 (CONTRIBUTING.md 5장 참고).

```bash
claude plugin install playwright@claude-plugins-official --scope user
```

### 3-2. chrome-devtools-mcp — 성능·네트워크 분석 (추천)

크롬 DevTools를 Claude가 직접 조작 — 성능 트레이스 기록, 네트워크 요청 분석, 콘솔 확인.

- **왜 이 프로젝트에?** CLAUDE.md의 성능 회귀 감시 항목(폰트 preload 개수, 선캐시 다운로드 총량, 서비스워커 갱신 동작)은 실측으로만 잡힙니다. "첫 로드에서 폰트 요청 나가는지 확인해줘" 같은 검증을 도구가 직접 수행할 수 있습니다.

```bash
claude plugin install chrome-devtools-mcp@claude-plugins-official --scope user
```

### 3-3. frontend-design — UI 품질 (선택)

Anthropic 공식. 일반적인 AI 티가 나는 UI를 피하고 완성도 높은 프런트엔드를 만들도록 돕는 스킬 모음.

- **주의**: 이 프로젝트는 색·크기·간격이 전부 `src/app/globals.css`의 CSS 커스텀 프로퍼티 토큰으로 관리되고, 다크모드 없음(라이트 강제)이 명시적 결정입니다. 이 플러그인을 쓰더라도 새 팔레트 도입이 아니라 **기존 토큰 체계 안에서** 작업하도록 요청에 명시하세요.

```bash
claude plugin install frontend-design@claude-plugins-official --scope user
```

### 3-4. pr-review-toolkit — PR 리뷰 에이전트 (선택)

댓글·테스트·오류 처리·타입 설계·코드 품질을 각각 전담하는 리뷰 에이전트 모음. 내장 `/code-review`보다 관점별로 세분화된 리뷰가 필요할 때.

```bash
claude plugin install pr-review-toolkit@claude-plugins-official --scope user
```

### 3-5. context7 — 최신 라이브러리 문서 조회 (선택)

Upstash Context7 MCP. 라이브러리 최신 문서를 실시간으로 가져옵니다.

- **주의**: 이 저장소의 AGENTS.md는 Next.js 관련해서 **`node_modules/next/dist/docs/`의 로컬 문서를 우선** 읽도록 규정합니다. context7은 그 외 라이브러리나 웹 표준 API를 확인할 때 보조로 쓰세요.

```bash
claude plugin install context7@claude-plugins-official --scope user
```

## 4. 추가 설치를 추천하는 스킬 (skills.sh 생태계)

`npx skills add <owner/repo@skill>` 로 설치합니다. 기본은 프로젝트 레벨(`.claude/skills/`), `-g`를 붙이면 사용자 레벨(`~/.claude/skills/`)입니다. 프로젝트 레벨로 설치해 커밋하면 팀원 모두가 자동으로 사용하게 됩니다.

| 스킬 | 설치 수 | 이 프로젝트에서의 용도 |
| --- | --- | --- |
| `addyosmani/web-quality-skills@accessibility` | 42.7K | WCAG 기준 접근성 감사. 노년층 접근성 기준선(탭 영역 3.5rem, 본문 1.1875rem 이상, 명도 대비)을 점검할 때 |
| `addyosmani/web-quality-skills@performance` | 27.7K | 웹 성능 최적화 점검. 선캐시 용량·폰트 로딩 회귀 감시와 병행 |
| `addyosmani/web-quality-skills@core-web-vitals` | 19.5K | Core Web Vitals(LCP/CLS/INP) 관점 진단 |
| `microsoft/playwright-cli@playwright-cli` | 112.4K | Playwright CLI 사용법 스킬. 3-1 플러그인 대신 가볍게 쓰고 싶을 때 |

설치 예 (프로젝트 레벨, 확인 생략):

```bash
npx skills add addyosmani/web-quality-skills@accessibility -y
npx skills add addyosmani/web-quality-skills@performance -y
```

관리 명령: `npx skills list`(목록), `npx skills update`(업데이트), `npx skills find <검색어>`(탐색).

## 5. 검토했지만 제외한 것들 (이유 포함)

- **PWA 전용 스킬들** (`pwa-development` 등) — 설치 수가 적고(최대 2.7K), 이 프로젝트의 서비스워커는 손으로 작성한 커스텀 구현(`public/sw.js` + 선캐시 스탬프 스크립트)이라 일반론 스킬이 오히려 어긋난 제안을 할 위험이 있습니다.
- **i18n 스킬들** — 이 프로젝트의 i18n은 `ko.ts`/`en.ts` 사전 두 개 + `satisfies typeof ko` 타입 강제로 이미 단순·완결적입니다. 외부 스킬이 보탤 것이 없습니다.
- **인증/DB/백엔드/CMS 계열 플러그인** (auth0, firebase, supabase 등) — 백엔드 없는 앱이므로 전부 해당 없음.
- **Tailwind/디자인 시스템 계열** — CSS Modules + 자체 토큰 체계가 확립되어 있어 충돌만 생깁니다.

## 6. 프로젝트 전용 스킬 만들기 (권장)

외부 스킬보다 더 가치 있는 것은 **이 저장소의 반복 작업을 스킬로 굳히는 것**입니다. `.claude/skills/<스킬명>/SKILL.md` 파일을 만들어 커밋하면 팀원 모두가 공유합니다.

예: PR 전 검증 루틴을 스킬로 만들기 — `.claude/skills/release-check/SKILL.md`:

```markdown
---
name: release-check
description: PR 전 필수 검증 루틴 — 타입체크, 린트, 빌드, 성능 회귀(폰트 preload·선캐시 용량) 확인. "PR 준비", "릴리스 체크", "배포 전 확인" 요청 시 사용.
---

다음을 순서대로 실행하고 결과를 요약할 것:

1. `npx tsc --noEmit && npm run lint && npm run build` — 모두 클린이어야 함
2. `grep -c 'as="font"' out/index.html` — 결과가 0이어야 함 (폰트 preload 회귀 감시)
3. 선캐시 매니페스트 총량이 약 1,700KB 수준인지 확인
4. `package.json`의 `version`이 patch 1단계 올라갔는지 확인 (PR당 1회)
5. 가능하면 모바일(390×844)·PC(1280×800) 뷰포트 스크린샷 확인
```

프런트매터 규칙: `name`(호출명, `/release-check`), `description`(**Claude가 자동 호출 여부를 판단하는 기준이므로 언제 쓰는지까지 구체적으로**). `disable-model-invocation: true`를 넣으면 자동 호출 없이 `/스킬명`으로만 실행됩니다.

이 밖에 스킬로 만들 만한 반복 패턴:

- **verify-ui**: `playwright-core` + 시스템 크롬(`executablePath: /usr/bin/google-chrome`) + `context.addInitScript()`로 `legioMariae.profile`/`legioMariae.settings`를 미리 심어 온보딩을 건너뛰는 검증 스크립트 패턴 (CLAUDE.md에 정리된 관례)
- **hwp-verify**: 월례 보고서 RTF 내보내기를 `soffice --headless --convert-to txt`로 변환해 내용을 검증하는 절차

새 스킬 작성을 도와주는 공식 플러그인도 있습니다: `claude plugin install skill-creator@claude-plugins-official`

## 7. 팀 전체에 플러그인 자동 배포하기

`.claude/settings.json`을 저장소에 커밋하면, 팀원이 저장소를 신뢰(trust)할 때 Claude Code가 해당 플러그인 설치를 자동으로 안내합니다:

```json
{
  "enabledPlugins": [
    "playwright@claude-plugins-official",
    "chrome-devtools-mcp@claude-plugins-official"
  ]
}
```

- 개인용 오버라이드는 `.claude/settings.local.json`(gitignore 대상)에 둡니다.
- 프로젝트 레벨 스킬(`.claude/skills/`)은 커밋만 하면 별도 설치 없이 즉시 공유됩니다.

## 8. 요약 — 우선순위

1. **지금 바로 활용**: 설치돼 있는 Vercel 플러그인(`/vercel:env`로 `NEXT_PUBLIC_SITE_URL` 확인), 내장 `/code-review`, web-design-guidelines 스킬.
2. **먼저 설치 추천**: `playwright` 플러그인(육안 검증 자동화), `addyosmani/web-quality-skills@accessibility` 스킬(접근성 감사).
3. **그다음**: `chrome-devtools-mcp`(성능 회귀 실측), `web-quality-skills@performance`.
4. **가장 큰 효과**: 6장의 프로젝트 전용 스킬(`release-check`, `verify-ui`)을 직접 만들어 커밋하는 것.

---

참고 문서: [Claude Code 플러그인](https://code.claude.com/docs/en/plugins.md) · [스킬](https://code.claude.com/docs/en/skills.md) · [마켓플레이스](https://code.claude.com/docs/en/plugin-marketplaces.md) · [skills.sh 스킬 검색](https://skills.sh/)
