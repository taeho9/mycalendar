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
5. **Environment variables**: 필요한 경우 `.env.example`의 값을 복사하여 환경변수 등록
6. **Deploy the stack** 클릭

배포 완료 시:
- **API 서버**: `http://localhost:3000` (헬스체크: `http://localhost:3000/health`)
- **PostgreSQL 16**: `localhost:5432`
- **Redis 7**: `localhost:6379`
로컬 포트로 자동 포워딩되어 바로 테스트할 수 있습니다.

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
