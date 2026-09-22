# AGENTS.md (src/)

## Module Context

React 19 + Vite 프론트엔드. 프롬프트 입력, 프로바이더/API 키 설정, 생성된 컴포넌트를 `react-live`로 즉시 렌더링하는 미리보기를 담당한다. API 호출은 전부 `/api/*` 경로를 통해 `server/`로 프록시된다 (`vite.config.ts:9-14`).

## Tech Stack & Constraints

- `react-live`의 `LiveProvider`는 반드시 `noInline` 모드로 사용한다 (`src/components/LivePreview.tsx:14`). 이 모드에서는 코드에 `render(<Component />)` 호출이 있어야 화면에 그려진다 — 서버가 이를 보장하지만(`server/AGENTS.md` 참고), 프론트엔드에서 `code`를 가공해 `LiveProvider`에 넘길 때도 이 계약을 유지하라.
- API 키·Provider 선택·프롬프트 히스토리·생성된 컴포넌트 목록은 새로고침 후에도 유지되도록 `localStorage`에 저장한다(사용자 명시적 요청에 따른 결정, `src/utils/storage.ts`). API 키를 평문으로 `localStorage`에 저장하는 것은 XSS 노출 위험이 있음을 인지하고, 새 저장 항목을 추가할 때도 이 트레이드오프를 감안하라.

## Implementation Patterns

- 서버 통신 로직은 컴포넌트가 아니라 `hooks/useComponentGenerator.ts` 같은 훅에 둔다. `generate()`는 `apiKey`가 없으면 body에 아예 포함시키지 않는다(`...(apiKey && { apiKey })`, `useComponentGenerator.ts:26`) — 빈 문자열을 보내 서버 `.env` 키를 덮어쓰지 않기 위함이다.
- 프로바이더별 라벨/placeholder는 `PROVIDER_CONFIG`(`App.tsx:8-11`)에 등록한다. `Provider` 타입(`src/types/index.ts:1`)에 새 값을 추가할 때 함께 갱신하라.
- `localStorage` 영속 상태는 `src/utils/storage.ts`의 `loadFromStorage`/`saveToStorage`(JSON 직렬화, 손상된 값·저장 공간 초과 시 fallback으로 안전하게 복구)만 사용한다. `localStorage`를 직접 호출하지 마라. 새 저장 키는 `STORAGE_KEYS`에 등록한다.
- Provider별 API 키는 `useProviderSettings.ts`에서 `Record<Provider, string>`으로 저장한다 — Provider를 전환해도 이전에 입력한 키가 사라지지 않는다. `Date` 필드(`GeneratedComponent.createdAt`)처럼 JSON 직렬화로 타입이 깨지는 값은 로드 시 반드시 원래 타입으로 복원한다(`useComponentGenerator.ts`의 `reviveComponents` 참고).

## Testing Strategy

- 테스트 명령: `bun run test` (vitest, jsdom 환경, `src/test/setup.ts` 로드, `vite.config.ts:16-20`).
- `PromptInput`, `useComponentGenerator`, `useProviderSettings`, `usePromptHistory`, `utils/storage`에 테스트가 있다. 훅 테스트는 `@testing-library/react`의 `renderHook`/`act`를 사용한다. `LivePreview.tsx`, `ComponentCard.tsx`, `App.tsx`는 여전히 테스트가 없다 — 이 파일들을 수정할 때는 회귀를 수동으로 확인하거나, 새 테스트를 추가할 가치가 있는지 판단하라.
- 각 테스트는 `beforeEach`에서 `localStorage.clear()`로 초기화한다. 새 `localStorage` 관련 테스트를 추가할 때 이를 빠뜨리면 테스트 간 상태가 새어 나간다.

## Local Golden Rules

- **테스트 경계**: 순수 로직(폼 검증, storage 유틸, persistence 훅)은 테스트되어 있다. 렌더링/네트워크 위주 코드(LivePreview, App.tsx)는 테스트 커버리지가 없는 기존 상태를 그대로 두되, 새로 추가하는 순수 로직은 테스트를 갖춘 파일로 분리하는 것을 우선 고려하라.
- **보안 경계**: `apiKey`(`useProviderSettings.ts`)를 콘솔에 로그하거나 URL 쿼리 파라미터로 보내지 마라. 현재 전송 경로는 POST body 하나뿐이다(`useComponentGenerator.ts:23-27`). `localStorage`에 저장된 API 키는 평문이므로, 공유 PC·XSS 환경에서의 노출 위험을 새 기능 설계 시 항상 고려하라.
