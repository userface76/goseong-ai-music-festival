# 고성 AI 뮤직 페스티벌 - Cloudflare Worker 버전

현재 Cloudflare 프로젝트가 `npx wrangler deploy` 방식의 Worker로 배포되므로,
Pages Functions 구조 대신 Worker + Static Assets + D1 구조로 정리한 버전입니다.

## 핵심 구조
- `public/` : 참가자 페이지와 관리자 페이지, CSS/JS
- `src/index.js` : API 라우팅 및 D1 처리
- `sql/schema.sql` : D1 테이블
- `wrangler.jsonc` : Worker / Assets / D1 설정

## GitHub 반영 방법
기존 저장소의 루트 파일/폴더를 이 패키지 내용으로 교체하세요.
특히 아래가 반드시 있어야 합니다.

- `src/index.js`
- `public/index.html`
- `public/admin.html`
- `public/assets/...`
- `wrangler.jsonc`

기존 `functions/` 폴더는 Worker 버전에서는 사용하지 않으므로 삭제해도 됩니다.

## 배포 후 확인
1. Cloudflare Deployments에서 초록 체크 확인
2. `Visit`로 메인 설문 페이지 확인
3. 테스트 설문 제출
4. D1 `submissions` 테이블 확인
5. `/admin.html`에서 관리자 목록 확인

## 보안
배포 성공 후 `/admin.html` 과 `/api/admin/*` 는 Cloudflare Access로 운영진만 접근하도록 보호하세요.
