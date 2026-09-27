# MyCalendar 협업 캘린더 플랫폼

구글 캘린더 양방향 실시간 연동, 다대다(M:N) 계층형 분류 체계, 팀 협업 기능을 제공하는 통합 캘린더 플랫폼입니다.

---

## 🏗️ 시스템 아키텍처 및 인프라 구성

* **운영 인프라 (Production)**:
  - **오라클 클라우드 (OCI)** Always Free Ampere A1 Compute 인스턴스 (ARM64, 4 OCPU, 24GB RAM)
  - **Ingress / Edge**: 호스트 레벨 Caddy 리버스 프록시 (SSL 자동 발급 및 HTTPS 443 / 6690 포트)
  - **애플리케이션 스택**: Portainer Git Stack + Docker Compose
    - `mycalendar-api`: NestJS (TypeScript, Node.js 20 Alpine, KST 타임존, Prisma 7 ORM)
    - `mycalendar-postgres`: PostgreSQL 16 Alpine (ACID 트랜잭션, 13개 도메인 모델)
    - `mycalendar-redis`: Redis 7 Alpine (세션 브로커 & 비동기 작업 큐)
* **개발 인프라 (Local Development)**:
  - Windows WSL2 / Docker Desktop (x86_64)

---

## 🌿 브랜치 전략 및 배포 파이프라인 (GitOps CI/CD)

본 프로젝트는 개발 환경과 운영 환경을 완벽하게 분리하여 운영합니다:

```text
[로컬 PC 개발 (develop 브랜치)]
  코드 수정 ➔ 로컬 WSL2 Portainer 배포 (로컬 소스코드 자체 빌드) ➔ 기능 테스트
                         │
                         ▼ (테스트 완료 후 PR 및 Merge)
[운영 OCI 배포 (main 브랜치)]
  main 브랜치 머지 ➔ GitHub Actions (ARM64/AMD64 멀티아키텍처 자동 빌드)
                         │
                         ▼ 푸시
  GitHub Container Registry (ghcr.io/taeho9/mycalendar-api:latest)
                         │
                         ▼ 배포 (1초 완료, BuildKit 에러 원천 차단)
  OCI 서버 Portainer에서 "Update the stack" 클릭 ➔ 즉시 가동 & DB 자동 마이그레이션
```

| 구분 | **develop 브랜치** (개발용) | **main 브랜치** (운영 Prod용) |
| :--- | :--- | :--- |
| **타깃 서버** | 로컬 PC (WSL2 / Docker Desktop) | 오라클 클라우드 (OCI ARM64 VM) |
| **빌드 주체** | 로컬 포테이너 (`build: ./backend`) | **GitHub Actions** (`ghcr.io` 푸시) |
| **도커 이미지** | `mycalendar-api:dev` | `ghcr.io/taeho9/mycalendar-api:latest` |
| **배포 방식** | 로컬 포테이너에서 스택 Deploy | OCI 포테이너에서 사전 빌드된 이미지 배포 |

---

## 🚀 오라클 클라우드(OCI) 운영 배포 가이드 (Portainer)

### 1. Portainer 스택 설정
1. **Portainer 웹 콘솔 접속**: `https://<OCI서버IP>:9443`
2. **Stacks** 메뉴 > **Add stack** (또는 기존 스택 진입)
3. **Build method**: **Repository** 선택
4. **설정값 입력**:
   - **Name**: `mycalendar`
   - **Repository URL**: `https://github.com/taeho9/mycalendar.git`
   - **Repository reference**: `refs/heads/main` (운영 배포)
   - **Compose path**: `docker-compose.yml`

### 2. Environment variables (스택 환경변수 필수 설정)
Public 저장소 보안을 위해 아래 민감한 운영 변수를 Portainer 콘솔에 직접 등록합니다:

| 환경변수 키 | 권장 설정값 예시 | 설명 및 주의사항 |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | 상용 최적화 모드 |
| `TZ` | `Asia/Seoul` | 컨테이너 타임존 (한국 표준시 KST) |
| `DB_USER` | `postgres` | PostgreSQL 접속 계정명 |
| `DB_PASSWORD` | `your_secure_password` | PostgreSQL 실제 비밀번호 (필수) |
| `DB_NAME` | `mycalendar` | 기본 데이터베이스명 |
| `DB_PORT` | `5432` | 호스트 루프백 포트 번호 (127.0.0.1 바인딩) |
| `DATABASE_URL` | `postgresql://postgres:<인코딩비밀번호>@postgres:5432/mycalendar?schema=public` | **★ 주의사항 1, 2 필독** |
| `JWT_SECRET` | `openssl rand -base64 32` 로 생성한 32자 이상 키 | 인증 토큰 위조 방지 서명키 (필수) |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Google Cloud Console 백엔드 OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | Google Cloud Console OAuth 클라이언트 시크릿 |
| `GOOGLE_REDIRECT_URI` | `https://calendar.godlife.io:6690/api/v1/auth/google/callback` | OAuth 승인 리다이렉트 URI |

> **⚠️ DATABASE_URL 설정 시 필수 주의사항**:
> 1. **도커 내부 호스트명(`@postgres`) 사용**: 컨테이너 간 통신이므로 호스트는 `localhost`가 아닌 서비스명인 **`@postgres:5432`** 를 지정해야 합니다.
> 2. **특수문자 URL 인코딩(Percent-Encoding)**: 비밀번호에 특수문자(`@`, `#`, `%` 등)가 포함된 경우 반드시 URL 인코딩 값을 사용해야 합니다. (예: `@` ➔ `%40`)

### 3. 배포 실행 및 자동 마이그레이션
* **Deploy the stack** (또는 **Update the stack**) 버튼을 클릭합니다.
* 컨테이너가 가동되는 즉시 `npx prisma migrate deploy`가 자동 실행되어 **13개 도메인 테이블이 PostgreSQL에 자동 생성**됩니다.

---

### 4. 헬스체크(Health Check) 검증

배포 완료 후 웹 브라우저나 터미널에서 정상 기동 여부를 확인합니다:

* **URL**: `https://calendar.godlife.io:6690/health`
* **정상 응답 예시**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-27T13:56:40.123+09:00",
    "timezone": "Asia/Seoul"
  }
  ```

---

## 💻 로컬 개발 환경 실행 (내 PC 직접 실행 시)

```bash
# 1. DB & Redis만 Docker로 기동 (루트 디렉토리)
docker compose up -d postgres redis

# 2. 백엔드 개발 서버 실행
cd backend
npm install

# 3. Prisma 마이그레이션 및 시드 데이터 적재
npx prisma migrate dev
npm run prisma:seed

# 4. 개발 서버 시작 (핫 리로딩 지원)
npm run start:dev
```
