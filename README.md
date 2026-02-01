# 업무 리마인더 (Task Reminder)

할 일을 관리하고 카카오톡으로 리마인더를 받을 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **업무 관리**: 할 일 추가, 수정, 삭제, 완료 체크
- **우선순위 & 마감일**: 긴급/높음/보통/낮음 우선순위, 마감일 설정
- **대시보드**: 전체 통계, 완료율, 오늘 마감 업무 현황
- **카카오톡 알림**: 나에게 보내기 기능으로 리마인더 수신
- **자동 리마인드**: 
  - 매일 오전 9시: 오늘 할 일 알림
  - 매일 오후 6시: "~~ 했나요?" 미완료 체크

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **알림**: Kakao Developers API

## 설치 및 실행

### 1. 의존성 설치

```bash
cd task-reminder
npm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env.local`로 복사하고 값을 입력하세요.

```bash
cp .env.example .env.local
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행
3. Settings > API에서 URL과 키 복사하여 `.env.local`에 입력

### 4. 카카오 개발자 설정

1. [Kakao Developers](https://developers.kakao.com)에서 앱 생성
2. **앱 키** > REST API 키 복사
3. **카카오 로그인** 활성화 및 Redirect URI 등록:
   - `https://your-domain.vercel.app/api/auth/kakao/callback`
4. **동의항목** > 카카오톡 메시지 전송 (talk_message) 활성화
5. **보안** > Client Secret 생성

### 5. 로컬 실행

```bash
npm run dev
```

## Vercel 배포

### 1. Vercel에 배포

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 배포
vercel
```

### 2. 환경 변수 설정

Vercel 대시보드 > Settings > Environment Variables에서 모든 환경 변수 추가

### 3. Cron Job 확인

`vercel.json`에 정의된 크론 작업이 자동으로 설정됩니다:
- `/api/cron/morning`: 매일 오전 9시 (KST) - UTC 0시
- `/api/cron/evening`: 매일 오후 6시 (KST) - UTC 9시

> **참고**: Vercel의 크론은 UTC 기준입니다. 한국 시간에 맞게 조정되어 있습니다.

## 프로젝트 구조

```
task-reminder/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tasks/          # 업무 CRUD API
│   │   │   ├── stats/          # 통계 API
│   │   │   ├── auth/kakao/     # 카카오 인증
│   │   │   ├── notification/   # 알림 설정
│   │   │   └── cron/           # 크론 작업
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Dashboard.tsx       # 대시보드 통계
│   │   ├── TaskCard.tsx        # 업무 카드
│   │   ├── TaskForm.tsx        # 업무 입력 폼
│   │   ├── FilterBar.tsx       # 필터 & 정렬
│   │   ├── KakaoConnect.tsx    # 카카오 연결
│   │   └── Toast.tsx           # 알림 토스트
│   ├── lib/
│   │   ├── supabase.ts         # Supabase 클라이언트
│   │   └── kakao.ts            # 카카오 API
│   └── types/
│       └── index.ts            # TypeScript 타입
├── supabase-schema.sql         # DB 스키마
├── vercel.json                 # Vercel 크론 설정
└── .env.example                # 환경 변수 예시
```

## 카카오톡 메시지 예시

### 아침 리마인더 (오전 9시)
```
📋 2월 1일 토요일
오늘의 업무 리마인더

🔥 긴급/중요 업무
  • 프로젝트 제안서 제출
  • 클라이언트 미팅 준비

📝 일반 업무
  • 이메일 확인
  • 주간 보고서 작성

총 4개의 업무가 있어요!
```

### 저녁 리마인더 (오후 6시)
```
📋 저녁 업무 체크

아직 완료하지 않은 업무가 있어요:

🚨 "프로젝트 제안서 제출" 완료하셨나요?
📌 "이메일 확인" 완료하셨나요?

총 2개 남았어요.
```

## 라이선스

MIT
