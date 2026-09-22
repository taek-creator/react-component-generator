# AGENTS.md

## Operational Commands

- 패키지 매니저: `bun` 고정. npm/yarn/pnpm 사용 금지 (`bun.lock` 존재, 다른 lockfile 없음).
- 개발 서버 (프론트 + API 동시 실행): `bun run dev`
- API 서버만 실행: `bun run server`
- 빌드: `bun run build` (`tsc -b && vite build`)
- 린트: `bun run lint`
- 테스트 전체 실행: `bun run test` (vitest run)
- 테스트 watch: `bun run test:watch`
- 프론트엔드는 5173, API 서버는 3002 포트로 고정되어 있다. Vite가 `/api` 요청을 3002로 프록시한다 (vite.config.ts:9-14).

## Golden Rules

### Immutable

- API 키를 코드나 커밋에 하드코딩하지 마라. `.env`는 `.gitignore`에 등록되어 있다. 서버는 `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` 환경변수 또는 클라이언트가 요청 body로 보낸 키만 사용한다 (server/index.ts:59-66).
- 클라이언트가 보낸 `apiKey`는 서버 환경변수보다 우선 적용된다 (`server/index.ts:65`, `clientKey || ENV_KEYS[provider]`). 이 값을 로그로 남기거나 다른 응답에 반사(echo)하지 마라.

### Team-specific rules (근거 기반)

- **AI 생성 코드 계약 위반 금지**: `server/index.ts:7-49`의 SYSTEM_PROMPT는 AI에게 "import 금지, TypeScript 문법 금지, `render(<Component />)` 호출 필수"를 강제한다. 이는 `src/components/LivePreview.tsx:14`가 `react-live`를 `noInline` 모드로 쓰기 때문이다 — noInline은 `render()` 호출이 있어야 렌더링되고, import 문이 있으면 스코프 에러가 난다. SYSTEM_PROMPT를 수정할 때 이 제약을 깨면 미리보기 전체가 동작을 멈춘다.
- **AI 응답 정규화는 이중 방어 구조**: `server/generator.ts`의 `stripCodeFences`와 `ensureRenderCall`은 각각 별도 실패 모드를 막는다 (마크다운 펜스 혼입 / render 호출 누락). `server/index.ts:188`에서 반드시 `ensureRenderCall(stripCodeFences(text))` 순서로 함께 호출한다. 하나를 제거하면 해당 실패 모드가 프로덕션에서 재발한다.
- **프로바이더 간 폴백 비대칭**: Google 경로는 `GOOGLE_MODELS` 배열(`gemini-3.1-flash-lite` → `gemini-3.5-flash`)로 `withModelFallback`을 거쳐 순차 재시도하지만 (`server/index.ts:5, 134-136`), Anthropic 경로(`callAnthropic`, `server/index.ts:68-96`)는 단일 모델만 호출하고 폴백이 없다. 두 경로를 대칭이라고 가정하지 마라.
- **순수 함수와 부수효과 함수의 테스트 경계**: `server/generator.ts`, `server/fallback.ts`는 부수효과가 없는 순수 함수라 유닛 테스트가 존재한다 (주석: "부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다", `server/generator.ts:1-2`). `server/index.ts`(Bun.serve 진입점)는 테스트가 없다. 새 로직을 추가할 때 가능하면 순수 함수로 분리해 이 패턴을 따르고, `index.ts`에는 라우팅/부수효과만 남겨라.

## Project Context

React 프롬프트 → AI 컴포넌트 생성 도구. 프론트엔드가 Bun 프록시 서버를 거쳐 Anthropic Claude 또는 Google Gemini를 호출하고, 결과를 `react-live`로 즉시 렌더링한다.

Tech Stack: React 19, TypeScript, Vite, Bun, react-live, Vitest, ESLint.

## Standards & References

- 프로젝트 소개, 실행 방법, 주요 기능은 `README.md` 참고.
- Git 커밋/브랜치 컨벤션은 별도 문서가 없으면 `git log` 기존 스타일을 따른다.
- **Maintenance Policy**: 이 문서의 규칙과 실제 코드가 어긋나면 (예: Anthropic 폴백 추가, SYSTEM_PROMPT 제약 변경) 이 파일 업데이트를 제안하라.

## Context Map

- **[API 서버 / AI 프록시 로직 수정](./server/AGENTS.md)** — Bun 서버, 프로바이더 호출, 응답 정규화 작업 시.
- **[프론트엔드 UI / react-live 미리보기 작업](./src/AGENTS.md)** — 컴포넌트, 훅, 미리보기 렌더링 작업 시.
