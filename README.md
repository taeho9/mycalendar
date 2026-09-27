# MyCalendar 협업 캘린더 플랫폼

구글 캘린더 양방향 연동 및 다대다(M:N) 계층형 분류 체계를 갖춘 협업 플랫폼 프로젝트입니다.

---

## 📁 프로젝트 구조

```text
MyCallendar/
├── backend/                  # NestJS 백엔드 API (TypeScript)
│   ├── src/                  # 소스코드 (AppModule, Controllers, Services)
│   ├── Dockerfile            # Portainer Git Stack 배포용 Multi-stage Dockerfile
│   └── package.json
├── android/                  # Android 네이티브 앱 (Kotlin + Jetpack Compose)
├── docker-compose.yml        # Portainer Git Stack용 통합 Compose (API + Postgres + Redis)
├── .env.example              # 환경변수 템플릿
└── .gitignore
```

---

## 🚀 Portainer 배포 가이드 (WSL / Docker Desktop)

1. **Portainer 웹 콘솔 접속**: `https://localhost:9443`
2. **Stacks 메뉴 이동** > **Add stack** 클릭
3. **Build method**: **Repository** 선택
4. **설정값 입력**:
   - **Name**: `mycalendar`
   - **Repository URL**: GitHub 저장소 주소
   - **Repository reference**: `refs/heads/develop` (개발 브랜치)
   - **Compose path**: `docker-compose.yml`
   - **Automatic updates**: Webhook 또는 주기적 폴링 활성화 (선택 사항)
5. **Environment variables (스택 환경변수 설정)**:
   - Public GitHub 저장소 보호를 위해 민감한 값은 저장소에 올리지 않고, Portainer 콘솔의 **Environment variables**에 직접 등록합니다:

   | 환경변수 키 | 권장 설정값 예시 | 설명 및 주의사항 |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` 또는 `development` | 실행 환경 모드 |
   | `TZ` | `Asia/Seoul` | 컨테이너 타임존 (한국 표준시 KST) |
   | `DB_USER` | `postgres` | PostgreSQL 접속 계정명 |
   | `DB_PASSWORD` | `your_secure_password` | PostgreSQL 실제 비밀번호 (필수) |
   | `DB_NAME` | `mycalendar` | 기본 데이터베이스명 |
   | `DB_PORT` | `5432` | 호스트 루프백 포트 번호 |
   | `DATABASE_URL` | `postgresql://postgres:encoded_pwd@postgres:5432/mycalendar?schema=public` | **★ 주의 1, 2 필독** |
   | `JWT_SECRET` | `openssl rand -base64 32` 생성값 | 인증 토큰 암호화 키 (32자 이상, 필수) |
   | `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Google Cloud Console OAuth 클라이언트 ID |
   | `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | Google Cloud Console OAuth 클라이언트 시크릿 |
   | `GOOGLE_REDIRECT_URI` | `https://calendar.godlife.io:6690/api/v1/auth/google/callback` | OAuth 승인 리다이렉트 URI |

   > **⚠️ DATABASE_URL 설정 시 필수 주의사항**:
   > 1. **도커 내부 호스트명(`@postgres`) 사용**: 컨테이너 간 통신이므로 호스트는 `localhost`가 아닌 서비스명인 **`@postgres:5432`** 를 지정해야 합니다.
   > 2. **특수문자 URL 인코딩(Percent-Encoding)**: 비밀번호에 특수문자(`@`, `#`, `%` 등)가 포함된 경우 연결 문자열이 깨지지 않도록 반드시 URL 인코딩 값을 사용해야 합니다. (예: `@` ➔ `%40`)

6. **Deploy the stack** 클릭

배포 완료 시:
- **API 서버**: 호스트 내부 `http://127.0.0.1:3000` (Caddy 리버스 프록시 연동)
- **PostgreSQL 16**: `127.0.0.1:5432` (외부 노출 차단, 로컬 루프백만 허용)
- **Redis 7**: `127.0.0.1:6379` (외부 노출 차단, 로컬 루프백만 허용)

---

## 💻 로컬 개발 환경 실행 (로컬 호스트 직접 실행 시)

```bash
# 1. DB & Redis만 Docker로 기동
docker compose up -d postgres redis

# 2. 백엔드 개발 서버 실행
cd backend
npm install
npm run start:dev
```
