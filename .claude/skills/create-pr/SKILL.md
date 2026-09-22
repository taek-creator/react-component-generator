---
name: create-pr
description: |
  현재 브랜치의 커밋과 diff를 분석해 GitHub PR을 생성한다. 기본은 한국어 PR 템플릿(references/pr_template_ko.md)을 사용하고,
  오픈소스·영어 기반 프로젝트로 판단되면 영어 템플릿(references/pr_template_en.md)을 사용한다.
  "PR 만들어줘", "PR 생성해줘", "풀리퀘스트 올려줘", "create a PR", "open a pull request", "PR 열어줘" 같은 요청에 활성화한다.
  PR 생성 전 반드시 제목·본문을 사용자에게 보여주고 승인받은 뒤 gh pr create를 실행한다.
context: fork
---

# create-pr: GitHub PR 생성

현재 브랜치의 변경사항을 분석해 제목과 본문을 작성하고, 사용자 승인을 받은 뒤 `gh pr create`로 GitHub PR을 생성한다.

## 워크플로우

### Step 0: 사전 확인

- `gh auth status`로 GitHub CLI 인증 여부를 확인한다. 인증돼 있지 않으면 사용자에게 알리고 중단한다.
- 저장소 루트의 `AGENTS.md`(없으면 `CLAUDE.md`)를 확인한다. PR 컨벤션(제목 형식, 라벨, 리뷰어 지정 규칙 등)이 명시돼 있으면 이 스킬보다 우선 따른다.
- `.github/PULL_REQUEST_TEMPLATE.md` 또는 `.github/pull_request_template.md`가 저장소에 이미 있으면, 이 스킬의 템플릿(Step 2) 대신 그 파일을 사용한다.

### Step 1: 브랜치·변경사항 확인

- `git branch --show-current`로 현재 브랜치를 확인한다. `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`으로 기본 브랜치를 확인하고, 현재 브랜치가 기본 브랜치와 같으면 PR을 만들 수 없으므로 사용자에게 알리고 새 브랜치로 옮길지 물어본다.
- `git status`로 미커밋 변경사항이 있는지 확인한다. 있으면 사용자에게 알리고, 먼저 커밋할지 이 상태로 PR을 만들지 확인한다(미커밋 변경은 PR에 포함되지 않는다).
- 기본 브랜치 대비 커밋 로그(`git log <base>..HEAD --oneline`)와 전체 diff(`git diff <base>...HEAD`)를 확인해 PR에 포함될 모든 커밋을 파악한다. 최신 커밋 하나만 보고 판단하지 않는다.
- 현재 브랜치가 원격에 없거나 로컬이 앞서 있으면 push가 필요함을 기록해 둔다(Step 5에서 처리).
- `gh pr list --head <branch>`로 같은 브랜치의 열린 PR이 이미 있는지 확인한다. 있으면 그 PR 정보를 보여주고 새로 만들지, 중단할지 물어본다.

### Step 2: 템플릿 언어 결정

기본값은 **한국어 템플릿**(`references/pr_template_ko.md`)이다. 다음 신호를 근거로 프로젝트가 **오픈소스 + 영어 기반**이라고 판단되면 **영어 템플릿**(`references/pr_template_en.md`)으로 전환한다.

- `README.md`(또는 최상위 대표 문서)의 본문이 주로 영어로 작성되어 있다.
- `LICENSE` / `LICENSE.md` 등 오픈소스 라이선스 파일이 존재한다.
- 최근 커밋 메시지(`git log --oneline -20`)가 대부분 영어다.
- `CONTRIBUTING.md`나 기존 이슈/PR 템플릿이 영어로 작성되어 있다.

이 신호들 중 다수가 동시에 성립할 때만 영어로 전환한다. 판단이 애매하면 기본값인 한국어를 유지한다. Step 0에서 저장소 자체 PR 템플릿을 찾았다면 이 언어 판단보다 그 템플릿이 우선한다.

### Step 3: PR 본문 작성

선택된 템플릿 파일을 읽고, Step 1에서 파악한 커밋·diff 내용을 근거로 각 섹션을 채운다.

- 제목은 저장소의 커밋 메시지 컨벤션(있으면 그것, 없으면 `<type>: <요약>`)을 따르고 70자 이내로 간결하게 작성한다.
- 각 섹션은 diff에서 실제로 확인되는 내용만 채운다. 확인할 수 없는 내용(스크린샷, 수동 테스트 결과 등)은 지어내지 말고 빈 체크리스트나 플레이스홀더로 남긴다.
- 현재 세션에 PR 설명 attribution 지시(예: "🤖 Generated with ...")가 주어져 있으면 본문 맨 끝에 그대로 포함한다. 지시가 없으면 attribution 줄을 추가하지 않는다.

### Step 4: 사용자 승인

PR 생성은 되돌리기 번거로운 공개 행위이므로, 실행 전 반드시 다음을 사용자에게 보여주고 승인을 받는다.

- 대상 브랜치 → base 브랜치
- 작성된 제목
- 작성된 본문 전체
- draft 여부(기본은 일반 PR이며, 사용자가 draft를 원하면 `--draft`를 사용한다)

사용자가 수정을 요청하면 반영한 뒤 다시 확인받는다. 승인 없이 다음 단계로 진행하지 않는다.

### Step 5: 생성

1. 현재 브랜치가 원격에 없거나 로컬 커밋이 앞서 있으면 `git push -u origin <branch>`로 push한다. force push는 하지 않는다.
2. `gh pr create --title "<제목>" --base <base> --body "$(cat <<'EOF' ... EOF)"` 형태로 실행한다. 본문은 반드시 HEREDOC으로 전달해 따옴표·개행이 깨지지 않게 한다.
3. 생성된 PR URL을 사용자에게 보고한다.

## 참고 파일

- `references/pr_template_ko.md` — 기본 한국어 PR 템플릿
- `references/pr_template_en.md` — 오픈소스/영어 프로젝트용 영어 PR 템플릿
