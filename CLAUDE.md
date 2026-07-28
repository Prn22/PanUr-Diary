# 파뉴땅 (PanUr) — 프로젝트 컨텍스트

> 이 파일은 Claude Code가 **세션마다 자동으로 읽습니다.** 파워셸을 껐다 켜도 아래 내용은 항상 컨텍스트에 들어옵니다.
> 진행 중인 작업 이력은 `.claude/WORKLOG.md` 에 있고, `/panur-resume` 로 불러옵니다.

## 구성 — 3개 컴포넌트

| # | 이름 | 로컬 경로 | 버전관리 | 역할 |
|---|---|---|---|---|
| 1 | **PanUr-Diary** (앱) | `E:\PanUr-Diary` | `Prn22/PanUr-Diary` · **공개** | 다이어리 PWA 본체. GitHub Pages로 배포 |
| 2 | **PanUr-DiaryData** | (미클론) | `Prn22/PanUr-DiaryData` · **비공개** | `data.json` 저장 + Web Push용 GitHub Actions |
| 3 | **PanUr-Worker** | `E:\PanUr-Diary\PanUr-Worker` | ❌ **git 없음** | 작업시간 자동측정 데스크톱 위젯 (Python/tkinter). **윈도우·맥 2대 운영 중** |

- 라이브 주소: **https://prn22.github.io/PanUr-Diary/**
- 데이터 흐름: 앱(브라우저) ↔ `data.json`(비공개 저장소) ↔ 워커(데스크톱) / Actions(푸시 발송)
  → **세 컴포넌트가 모두 같은 `data.json` 한 개를 씁니다.** 스키마를 바꾸면 세 곳을 함께 봐야 합니다.

## ⚠️ 반드시 지킬 것

1. **`PanUr-Worker/` 를 앱 저장소에 커밋하지 마세요.** 앱 저장소는 공개 + Pages 배포라서
   11MB `PanUrWorker.exe` 와 36MB 빌드 캐시가 그대로 라이브에 노출됩니다. `.gitignore`로 막아뒀습니다.
2. **`git add -A` 를 쓰지 마세요.** 바꾼 파일만 명시적으로 `git add <파일>` 하세요.
3. **토큰·API 키를 어느 저장소에도 커밋하지 마세요.** 토큰은 사용자가 직접 넣는 구조입니다
   (앱은 브라우저 `localStorage`, 워커는 `~/.panur_worker_config.json`).
4. **커밋/푸시는 사용자가 요청할 때만.** 앱 저장소는 푸시하면 즉시 라이브에 반영됩니다.
5. **워커(`panur_worker.py`)는 되도록 패치하지 마세요.** 아래 "워커 취급 방침" 참고.
6. 작업을 마칠 때 `.claude/WORKLOG.md` 를 갱신하세요.

## 이 프로젝트에서 Claude의 주 역할

사용자가 명시한 용도: **워커와 다이어리의 연동 확인.**
즉 기본 작업은 `data.json` 의 `focus.log` 를 매개로 한 워커↔앱 계약이 지켜지는지 검증하는 것입니다.
새 기능 개발이나 워커 개조는 사용자가 따로 요청할 때만 하세요.

### 워커 취급 방침

- 워커는 **윈도우와 맥 두 대에서 동시에 운영 중**입니다. 한 번 고치면 **양쪽을 다시 빌드**해야 하고,
  맥은 재빌드마다 손쉬운 사용 권한을 다시 등록해야 해서 비용이 큽니다.
  → **패치는 최후의 수단.** 절차와 함정은 `PanUr-Worker/패치_배포_절차.md` 에 정리돼 있습니다.
- 워커를 고치기로 했다면 `APP_VER` 을 반드시 올리세요. 두 기기의 버전 차이를 알아낼 유일한 단서입니다.
- **특히 `gh_append_focus_log()` 는 건드리지 마세요.** 동시쓰기 경쟁을 막는 핵심 로직입니다.
- "기록이 안 보인다"의 원인은 대개 워커가 아닙니다. 위젯에 `저장됨 ✓` 가 떴다면 워커는 제 일을 다 한 것이고,
  그 뒤의 유실은 앱 쪽 `push()` 문제입니다 (`.claude/WORKLOG.md` 미해결 이슈 참고).
  → **앱 쪽에서 고칠 수 있는 문제를 워커 패치로 해결하려 하지 마세요.**

### 연동 계약 (워커 ↔ 앱)

워커가 `data.json` 의 `focus.log` 에 append 하고, 앱이 **집중** 탭에서 읽습니다. 검증된 계약:

| 필드 | 워커 (`panur_worker.py:546`) | 앱 (`index.html:1595~1613`) |
|---|---|---|
| `date` | `date.today().strftime("%Y-%m-%d")` — **로컬시각** | `x.date` 문자열 일치 비교 |
| `sec` | `int` (초) | `fmtDurKo(x.sec)` |
| `label` | `friendly()` 로 정리한 앱 이름 | `esc(x.label\|\|"작업")` |
| `kind` | `"app"` 고정 | `icon(k)`: `pomo`→🍅, `app`→🖥, 그 외→⏱ |
| `ts` | `ms + i` (배치 내 중복 방지) | 정렬키 + **개별 삭제키** |

- 앱의 `ymd`(1357)도 로컬시각 기준이라 **날짜 형식은 일치**합니다(UTC 밀림 없음).
- 앱이 같은 로그에 쓰는 다른 `kind`: `"pomo"`(뽀모도로), `"timer"`(기본값) — `logFocus()` (1575).
- **이 표를 바꾸는 변경은 워커·앱 양쪽을 동시에 배포해야 합니다.** 되도록 피하세요.

---

## 1. 앱 — `index.html` 한 파일

HTML·CSS·JS가 **전부 인라인**. 약 4,900줄 / 417KB. 거의 모든 작업이 이 파일에서 일어납니다.
한 줄이 수천 자인 곳이 많으니 **`Grep`으로 위치를 먼저 찾고 `Edit`으로 좁게 수정**하세요. 전체 재작성 금지.

```
index.html            ← 앱 전체
sw.js                 ← 서비스워커. Web Push 수신 + 알림 클릭 처리
manifest.json         ← PWA 매니페스트
icon-192.png, icon-512.png, apple-touch-icon.png
heart-icon.png        ← sw.js가 푸시 알림 큰 아이콘으로 사용
heart_preview.png     ← 현재 코드에서 참조되지 않음
```

### 섹션 지도 (줄 번호는 대략값 — 편집하면 밀립니다)

| 줄 | 섹션 |
|---|---|
| 20~660 | `<style>` — 디자인 토큰(`:root` CSS 변수) + 전체 스타일 |
| 663 | 배경/헤더 |
| 1263 | Storage & State — `jload`/`jsave`, `DEFAULT_DATA`, `LS_DATA`/`LS_SYNC` |
| 1296 | `focus:{log:[], pomo:{...}}` — 집중 로그 스키마 정의 지점 |
| 1319 | 자동 백업 (최대 5개, 약 15분 간격 순환) |
| 1355 | Date helpers |
| 1532 | Render dispatch — `render()` |
| 1543 | **집중 (기록 · 뽀모도로)** — 워커가 올린 `kind:"app"` 기록이 여기 렌더됨(1611행 `icon(x.kind)`) |
| 2789 | Event modal |
| 2845 | Photo optimize |
| 2939 | Study (강의 + 커리큘럼) |
| 3113 | 학습 일정 만들기 (커리큘럼 → 달력 일정, 강의시간 기반 패킹) |
| 3553 | 학습 노트(포스트) 모달 |
| 3620 | 이미지 확대·저장 라이트박스 |
| 3640 | 여행 일정 탭 |
| 3758 | Memo |
| 3878 | Etc (운세 / 환율) |
| 4418 | Material modal |
| 4447 | Work (커미션) modal |
| 4475 | Appt/Todo edit modal |
| 4506 | Anniversary modal |
| 4547 | Nav |
| 4551 | 월간 열람 뷰어 (읽기 전용) |
| 4603 | 본문 좌우 스와이프 이동 |
| 4645 | Toast |
| 4657 | **GitHub Sync** — `ghGetFile`/`ghPutBlob`/`pull`/`push` |
| 4757 | **Notifications** — VAPID 공개키, 푸시 구독, `notify()` |
| 4909 | PWA (설치형 앱) |
| 4919 | Boot |

### 동기화 방식

- 사용자가 앱 설정 화면에서 직접 입력: `owner`/`repo`/`branch`/`path`(기본 `data.json`)/**PAT**/자동동기화 여부
  → 브라우저 `localStorage`(`LS_SYNC`)에만 저장.
- 읽기: `GET /repos/{owner}/{repo}/contents/{path}`, 1MB 초과 시 `git/blobs` 폴백.
- 쓰기: `ghPutBlob()` = **blob → tree → commit → ref PATCH** (1MB 초과 대응).
  `updateref`/`422`/`409` 충돌 시 저장소본을 로컬 백업 슬롯에 보존 후 1회 재시도.
- 자동 동기화: `scheduleAuto()` 가 2.5초 디바운스로 `push(false)`.
- **Gemini API 키는 의도적으로 `data.json`에 담아 기기 간 동기화합니다** — DiaryData가 비공개인 것을 전제로 한 설계 결정(코드 주석에 명시).

### 알림

- **포그라운드**: `notify()` — 인라인 base64 하트 아이콘. 데스크톱은 `new Notification` 우선, 모바일은 서비스워커 필수.
- **백그라운드(앱 닫힘)**: DiaryData의 GitHub Actions가 정해진 시각에 Web Push → `sw.js`의 `push` 리스너가 깨어남.
- VAPID **공개**키는 `index.html`에 하드코딩(노출돼도 안전). **개인**키는 저장소 Secrets에만.
- 구독 정보는 `data.pushSubs` 에 저장 → `data.json` 경유로 서버 스크립트가 읽음.

---

## 3. 워커 — `PanUr-Worker/panur_worker.py`

Python 3.8+ / **stdlib + tkinter만** (외부 패키지 없음). Windows·macOS 공용. `APP_VER = "worker-7"`.
활성 창을 감지해 작업시간을 재고, `data.json` 의 `focus.log` 에 `kind:"app"` 으로 append 합니다.

```
panur_worker.py            ← 워커 전체 (약 583줄). 여기만 편집하면 됨
PanUrWorker.spec           ← PyInstaller 스펙
build_worker_windows.bat   ← 윈도우 빌드 (pyinstaller 설치 → --onefile --windowed)
build_worker_mac.command   ← 맥 빌드
panur_worker.ico / .icns   ← 아이콘
PanUr_워커_사용법.md         ← 사용자용 문서
build/ dist/ PanUrWorker.exe  ← 빌드 산출물 (36MB, 커밋 대상 아님)
패치_배포_절차.md            ← 패치 시 윈도우·맥 양쪽 반영 절차 (맥 함정 정리)
```

**맥에 옮길 파일은 `panur_worker.py` 하나뿐입니다.** `.exe`/`build/`/`dist/`/`.spec` 은 옮기면 안 됩니다
(`.spec` 은 맥 빌드를 깨뜨림). 맥 빌드 스크립트는 윈도우 것과 달리 **빌드 캐시를 자동으로 지우지 않으므로**
`rm -rf build dist PanUrWorker.spec` 를 먼저 해야 합니다.

- 설정 파일: `~/.panur_worker_config.json` (첫 실행 시 자동 생성). 토큰은 여기에만 들어갑니다.
- 모드: **C**(전체 활성, 자리비움 시 정지) / **A**(지정) / **B**(목록) — A·B는 동작이 같음.
- `idle_timeout`(기본 60초) / `flush_min`(기본 5분마다 저장) / `min_save`(30초 미만 항목은 저장 생략).
- 저장 로직 `gh_append_focus_log()` 는 **동시쓰기 대비 5회 재시도**: 매 시도마다 ref를 먼저 고정 →
  그 커밋 시점의 파일을 읽어 병합 → 그 parent 기준으로만 커밋. Actions가 끼어들면 PATCH가
  non-fast-forward로 거부되고 처음부터 재시도합니다. **이 로직은 건드릴 때 특히 조심하세요.**
- 기록 형태: `{"date":"YYYY-MM-DD","sec":int,"label":앱이름,"kind":"app","ts":ms}`
- 빌드 스크립트/문서 주의: 문서(`사용법.md` 10번 줄)는 아이콘을 `panur.ico`/`panur.icns`로 적어놨지만
  실제 파일명과 `.bat`은 `panur_worker.ico` 입니다. 문서 쪽이 틀렸습니다.

---

## `index.html` 편집 후 반드시 확인할 것

이 저장소는 블롭이 **LF**, 작업트리가 **CRLF**(`core.autocrlf=true`)입니다. 정상 상태입니다.
편집 후 `git diff --stat` 이 **전체 파일 변경(수천 줄)** 으로 나오면 실제 변경이 큰 게 아니라
**파일에 NUL 바이트가 들어가 git이 바이너리로 판정한 것**입니다. 이러면 CRLF 정규화가 건너뛰어집니다.

```powershell
git -C E:\PanUr-Diary ls-files --eol index.html
#  w/crlf  → 정상
#  w/-text → 바이너리 판정 = NUL 바이트 있음. 찾아서 없애야 함
git -C E:\PanUr-Diary diff --stat        # 실제 변경 줄 수와 맞는지 확인
```

- **소스에 NUL(`\u0000`)을 넣지 마세요.** 문자열 합성 키가 필요하면 `JSON.stringify([...])` 를 쓰세요.
- `.gitattributes` 에 `* -text` 를 넣는 것은 **잘못된 처방**입니다(블롭이 LF라 오히려 전체 diff가 고정됨).
- 편집 후 문법 검사:

```powershell
$s='C:\Users\redbe\AppData\Local\Temp\claude\E--PanUr-Diary\9cf4bec9-6e20-4ce1-b757-92900dfaab26\scratchpad'
$t=[IO.File]::ReadAllText('E:\PanUr-Diary\index.html',[Text.Encoding]::UTF8)
$m=[regex]::Match($t,'(?s)<script(?:\s[^>]*)?>(.*?)</script>')
[IO.File]::WriteAllText("$s\chunk1.js",$m.Groups[1].Value,(New-Object Text.UTF8Encoding $false))
node --check "$s\chunk1.js"
```

## 로컬 환경

- Windows 11 / **PowerShell 5.1** — `&&`, `||`, 삼항연산자 **사용 불가**. `;` 와 `if ($?) { }` 를 쓰세요.
- `git` 있음 (`E:\Program Files\Git\cmd\git.exe`), **`gh` CLI 없음**
- git credential helper **미설정** → 비공개 저장소(DiaryData) 접근 시 인증 필요
- 앱 저장소 커밋 이력은 전부 `Add files via upload` (웹 UI 수동 업로드 흔적). 앞으로는 의미 있는 메시지를 쓰세요.
