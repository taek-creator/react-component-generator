# AGENTS.md (src/)

## Module Context

React 19 + Vite 프론트엔드. 프롬프트 입력, 프로바이더/API 키 설정, 생성된 컴포넌트를 `react-live`로 즉시 렌더링하는 미리보기를 담당한다. API 호출은 전부 `/api/*` 경로를 통해 `server/`로 프록시된다 (`vite.config.ts:9-14`).

## Tech Stack & Constraints

- `react-live`의 `LiveProvider`는 반드시 `noInline` 모드로 사용한다 (`src/components/LivePreview.tsx:14`). 이 모드에서는 코드에 `render(<Component />)` 호출이 있어야 화면에 그려진다 — 서버가 이를 보장하지만(`server/AGENTS.md` 참고), 프론트엔드에서 `code`를 가공해 `LiveProvider`에 넘길 때도 이 계약을 유지하라.
- API 키는 `App.tsx`의 로컬 state로만 보관한다(`src/App.tsx:14`). localStorage/sessionStorage에 영구 저장하지 않는다 — 현재 코드에 저장 로직이 없으며, 새로 추가하려면 보안 영향을 먼저 검토하라.

## Implementation Patterns

- 서버 통신 로직은 컴포넌트가 아니라 `hooks/useComponentGenerator.ts` 같은 훅에 둔다. `generate()`는 `apiKey`가 없으면 body에 아예 포함시키지 않는다(`...(apiKey && { apiKey })`, `useComponentGenerator.ts:26`) — 빈 문자열을 보내 서버 `.env` 키를 덮어쓰지 않기 위함이다.
- 프로바이더별 라벨/placeholder는 `PROVIDER_CONFIG`(`App.tsx:8-11`)에 등록한다. `Provider` 타입(`src/types/index.ts:1`)에 새 값을 추가할 때 함께 갱신하라.

## Testing Strategy

- 테스트 명령: `bun run test` (vitest, jsdom 환경, `src/test/setup.ts` 로드, `vite.config.ts:16-20`).
- 현재 `src/components/PromptInput.test.tsx`만 테스트가 존재한다. `useComponentGenerator.ts`, `LivePreview.tsx`, `ComponentCard.tsx`, `App.tsx`는 테스트가 없다 — 이 파일들을 수정할 때는 회귀를 수동으로 확인하거나, 새 테스트를 추가할 가치가 있는지 판단하라.

## Local Golden Rules

- **테스트 경계**: 사용자 입력을 검증/파싱하는 `PromptInput`만 테스트되어 있다. 렌더링/네트워크 위주 코드(LivePreview, useComponentGenerator)는 테스트 커버리지가 없는 기존 상태를 그대로 두되, 새로 추가하는 순수 로직(예: 폼 검증)은 테스트를 갖춘 파일로 분리하는 것을 우선 고려하라.
- **보안 경계**: `apiKey` state(`App.tsx:14`)를 콘솔에 로그하거나 URL 쿼리 파라미터로 보내지 마라. 현재 전송 경로는 POST body 하나뿐이다(`useComponentGenerator.ts:23-27`).
