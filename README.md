# 제1회 고성 AI 뮤직 페스티벌 설문앱

Cloudflare Pages + Pages Functions + D1 기반으로 구성된 행사 참가 설문 및 운영진 관리용 MVP입니다.

## 포함 기능

- QR 접속용 모바일 설문
- 참가자 정보 입력
- 나의 이야기 / 노래 주제 입력
- 음악 장르 / 분위기 / 보컬 선택
- 에이미온 인기 이벤트 참여 의사
- 개인정보 필수 동의 / 음원 활용 선택 동의
- D1 데이터베이스 저장
- 접수번호 자동 발급
- 운영진 관리자 페이지
- 접수 목록 검색
- 처리상태 변경
- CSV 다운로드

---

## 폴더 구조

goseong-ai-music-festival/
├─ public/
│  ├─ index.html
│  ├─ admin.html
│  └─ assets/
│     ├─ style.css
│     ├─ app.js
│     └─ admin.js
│
├─ src/
│  └─ index.js
│
├─ sql/
│  └─ schema.sql
│
└─ wrangler.jsonc

## 1. GitHub 업로드

새 GitHub 저장소를 만든 뒤 이 폴더 안의 파일을 그대로 업로드합니다.

권장 저장소명:

`goseong-ai-music-festival`

---

## 2. Cloudflare Pages 연결

Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git

GitHub 저장소를 선택합니다.

정적 HTML 기반이므로:

- Framework preset: None
- Build command: 비워두기
- Build output directory: 루트(`.`) 사용

배포가 완료되면 예를 들어 아래 주소가 생깁니다.

`https://goseong-ai-music-festival.pages.dev`

이 주소가 최종 QR의 대상 주소가 됩니다.

---

## 3. D1 데이터베이스 생성

Cloudflare Dashboard → Storage & Databases → D1 → Create database

권장 이름:

`goseong_music_db`

생성한 뒤 D1 Console 또는 SQL 실행 화면에서:

`sql/schema.sql`

파일 내용을 실행합니다.

---

## 4. Pages와 D1 연결

Pages 프로젝트 → Settings → Bindings → D1 database binding

설정값:

- Variable name: `DB`
- D1 database: `goseong_music_db`

연결 후 프로젝트를 다시 배포합니다.

---

## 5. 운영진 관리자 보안

중요: `/admin.html` 과 `/api/admin/*` 는 외부에 공개하면 안 됩니다.

Cloudflare Zero Trust → Access → Applications 에서 관리자 전용 보호를 설정하세요.

권장 보호 경로:

- `/admin.html`
- `/api/admin/*`

운영진 이메일만 허용하는 정책을 권장합니다.

---

## 6. 개인정보 처리 문구

현재 화면은 행사 기획용 기본 문구입니다.

실제 행사 오픈 전 반드시 아래를 확정하세요.

- 개인정보 수집 주체
- 수집 항목
- 이용 목적
- 보유 및 파기 기간
- 문의처
- 제3자 제공 여부
- 필수/선택 동의 구분

---

## 7. 실제 QR 생성 순서

1. Cloudflare Pages 배포 완료
2. 실제 공개 URL 확인
3. 휴대폰으로 URL 접속 및 설문 제출 테스트
4. D1에 데이터가 정상 저장되는지 확인
5. 관리자 페이지에서 데이터 확인
6. 최종 URL로 QR 생성
7. QR 스캔 재검증
8. 포스터의 임시 QR을 실제 QR로 교체

---

## 8. 기본 처리상태

운영진 페이지에서 아래 상태를 관리할 수 있습니다.

`접수 → 가사제작 → 음원제작 → 에이미온업로드 → 전달완료`

필요 시 `취소`.

---

## 9. 이후 확장 가능 기능

- OpenAI API 연결: 참가자 사연 → AI 가사 초안 생성
- AI 음악 생성 API 연결
- R2에 음원 / 가사 / 이미지 저장
- 에이미온 업로드 URL 관리
- 좋아요 / 조회수 집계
- 실시간 인기 TOP 10
- 10월 16일 최종 순위 확정
- 1~5등 수상자 공개
- 특산품 발송 상태 관리
