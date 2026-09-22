# AGENTS.md (server/)

## Module Context

Bun 런타임으로 동작하는 단일 프로세스 API 프록시 서버. 프론트엔드 대신 Anthropic/Google API 키를 다루고, AI 응답을 `react-live`가 실행 가능한 형태로 정규화한다. `src/`와 같은 `package.json`을 공유하며 별도 의존성 경계는 없다.

## Tech Stack & Constraints

- `Bun.serve`만 사용한다 (Express/Fastify 등 도입 금지). 포트는 3002로 고정되어 있고 (`server/index.ts:139`), 이 값을 바꾸면 `vite.config.ts:9-14`의 프록시 target도 함께 바꿔야 한다.
- 외부 API 호출은 `fetch`로 직접 한다 (Anthropic/Google 공식 SDK 미사용). 새 프로바이더를 추가할 때도 이 패턴(`fetch` + 수동 응답 파싱)을 유지하라.

## Implementation Patterns

- 부수효과 없는 로직(텍스트 변환, 폴백 순서 결정 등)은 `generator.ts` / `fallback.ts`처럼 별도 파일의 순수 함수로 뽑아라. `index.ts`는 라우팅과 fetch 호출만 담당한다.
- 새 프로바이더 추가 시 `callAnthropic`/`callGoogle`과 동일한 시그니처(`(prompt, apiKey) => Promise<string>`)를 따르고 `ENV_KEYS`, 프론트엔드 `PROVIDER_CONFIG`에도 등록하라.

## Testing Strategy

- 테스트 명령: `bun run test` 또는 `bun run test:watch` (vitest, `server/**/*.test.ts` 포함, `vite.config.ts:20`).
- 순수 함수(`generator.ts`, `fallback.ts`)는 반드시 대응하는 `*.test.ts`를 작성한다. `index.ts`는 Bun.serve 부수효과 때문에 테스트하지 않는 기존 관례를 따른다 — 새 로직은 `index.ts`에 직접 넣지 말고 테스트 가능한 파일로 분리하라.

## Local Golden Rules

- **비대칭 (Asymmetry)**: `GOOGLE_MODELS`(`index.ts:5`)는 2개 모델 폴백 배열이지만 Anthropic은 단일 모델(`claude-haiku-4-5-20251001`, `index.ts:77`) 하드코딩이다. Anthropic 모델명을 바꿀 때 폴백을 기대하지 마라 — 실패 시 바로 에러가 던져진다.
- **하드 제약 (Hard Constraint)**: SYSTEM_PROMPT(`index.ts:7-49`)를 수정할 때 "import 금지 / TypeScript 문법 금지 / render() 호출 필수" 세 규칙은 제거하지 마라. `src/components/LivePreview.tsx`가 `noInline` 모드이므로 어기면 모든 생성 결과가 깨진다.
- **이중 방어 (Double Defense)**: `stripCodeFences`와 `ensureRenderCall`(`generator.ts`)은 각각 다른 AI 실패 모드를 막는다. `index.ts:188`처럼 항상 두 함수를 함께, 이 순서로 호출하라.
- **보안 경계 (Security Boundary)**: `resolveApiKey`(`index.ts:64-66`)는 `clientKey || ENV_KEYS[provider]` 순서다. 클라이언트가 보낸 키가 서버 `.env` 키보다 우선한다. 현재는 키 존재 여부(`!!ENV_KEYS.anthropic`)만 `/api/config`로 노출한다(`index.ts:150-153`) — 실제 키 값을 응답에 포함시키지 마라.
