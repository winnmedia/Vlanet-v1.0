# 마이페이지 API 문서

## 개요
사용자가 자신의 정보, 프로젝트, 활동 내역 등을 확인할 수 있는 마이페이지 API입니다.

## API 엔드포인트

### 1. 마이페이지 종합 정보
**GET** `/api/users/mypage`

모든 마이페이지 정보를 한 번에 조회합니다.

**응답 예시:**
```json
{
    "status": "success",
    "data": {
        "profile": {
            "email": "user@example.com",
            "nickname": "사용자닉네임",
            "login_method": "email",
            "is_staff": false,
            "is_superuser": false,
            "date_joined": "2024-01-01",
            "last_login": "2024-12-20 14:30"
        },
        "projects": {
            "owned": {
                "total": 5,
                "recent": [
                    {
                        "id": 1,
                        "name": "프로젝트명",
                        "created": "2024-12-15",
                        "status": "in_progress"
                    }
                ]
            },
            "member": {
                "total": 3,
                "as_manager": 1,
                "as_member": 2,
                "recent": [
                    {
                        "id": 2,
                        "name": "협업 프로젝트",
                        "role": "manager",
                        "joined": "2024-12-10"
                    }
                ]
            },
            "recent_activity": [
                {
                    "id": 3,
                    "name": "최근 활동 프로젝트",
                    "updated": "2024-12-20 10:00",
                    "is_owner": true
                }
            ]
        },
        "stats": {
            "total_projects": 8,
            "active_projects": 4,
            "completed_projects": 2,
            "total_collaborators": 15
        },
        "recent_memos": [
            {
                "id": 1,
                "content": "메모 내용...",
                "created": "2024-12-19 16:00"
            }
        ]
    }
}
```

### 2. 사용자 활동 내역
**GET** `/api/users/mypage/activity`

최근 활동 내역을 조회합니다.

**쿼리 파라미터:**
- `days` (선택): 조회할 일수 (기본값: 30)

**응답 예시:**
```json
{
    "status": "success",
    "activities": [
        {
            "type": "project_created",
            "description": "프로젝트 '새 프로젝트' 생성",
            "date": "2024-12-19 14:30",
            "project_id": 5
        },
        {
            "type": "project_joined",
            "description": "프로젝트 '협업 프로젝트'에 관리자로 참여",
            "date": "2024-12-18 10:00",
            "project_id": 4
        },
        {
            "type": "memo_created",
            "description": "메모 작성",
            "date": "2024-12-17 16:00",
            "memo_id": 3
        }
    ],
    "total": 15,
    "period_days": 30
}
```

### 3. 사용자 설정
**GET** `/api/users/mypage/preferences`

사용자 설정을 조회합니다.

**응답 예시:**
```json
{
    "status": "success",
    "preferences": {
        "notifications": {
            "email": true,
            "project_updates": true,
            "member_invites": true
        },
        "privacy": {
            "show_email": false,
            "show_projects": true
        },
        "display": {
            "language": "ko",
            "timezone": "Asia/Seoul"
        }
    }
}
```

**POST** `/api/users/mypage/preferences`

사용자 설정을 업데이트합니다.

**요청 본문:**
```json
{
    "notifications": {
        "email": false
    }
}
```

## 기존 프로필 API와의 차이점

### 기존 프로필 API (`/api/users/profile`)
- 기본적인 프로필 정보만 제공
- 프로필 수정 기능 포함
- 단순한 프로젝트 수 정보

### 새로운 마이페이지 API (`/api/users/mypage`)
- 종합적인 대시보드 정보 제공
- 최근 활동, 프로젝트 상태별 분류
- 협업자 수, 활동 통계 등 상세 정보
- 활동 내역 타임라인
- 사용자 설정 관리

## 프론트엔드 연동 예시

```javascript
// 마이페이지 정보 조회
const response = await fetch('/api/users/mypage', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const myPageData = await response.json();

// 최근 7일 활동 내역 조회
const activityResponse = await fetch('/api/users/mypage/activity?days=7', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const activityData = await activityResponse.json();
```

## 인증
모든 마이페이지 API는 JWT 토큰 인증이 필요합니다.
- Header: `Authorization: Bearer {token}`
- Cookie: `vridge_session={token}`