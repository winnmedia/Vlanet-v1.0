# VideoPlanet 피드백 시스템 완전 구현 아키텍처 설계

## 1. 현황 분석 및 5 Whys 근본 원인 분석

### 1.1 현재 상황
**문제**: 피드백 시스템이 404/500 에러로 작동하지 않음

### 1.2 5 Whys 분석

#### Why 1: 왜 피드백 시스템이 실패하는가?
**답변**: API 엔드포인트와 데이터 모델 간 불일치로 인한 404 에러 발생
- `/api/feedbacks/project/<id>/` 엔드포인트가 모델과 맞지 않음
- FeedBack 모델에 project 필드가 없음 (Project가 feedback을 참조)

#### Why 2: 왜 API와 모델이 불일치하는가?
**답변**: 설계 변경 시 전체 시스템에 대한 영향 분석 없이 부분적 수정만 진행
- feedbacks/views.py에서 Feedback 모델에 없는 project 필드 참조
- 프론트엔드는 존재하지 않는 엔드포인트 호출

#### Why 3: 왜 설계 변경이 체계적으로 관리되지 않았는가?
**답변**: 데이터 모델 변경 시 마이그레이션과 API 수정이 동기화되지 않음
- 마이그레이션 파일 누락 또는 미적용
- API 뷰와 모델 간 관계 검증 부재

#### Why 4: 왜 마이그레이션과 API가 동기화되지 않았는가?
**답변**: 개발 프로세스에 체계적인 검증 단계가 없음
- 모델 변경 → 마이그레이션 → API 수정 → 프론트엔드 수정의 순서 미준수
- 테스트 커버리지 부족

#### Why 5: 왜 체계적인 개발 프로세스가 없었는가?
**답변**: 아키텍처 설계 없이 기능 위주로만 개발 진행
- 전체 시스템 아키텍처 문서 부재
- 각 컴포넌트 간 인터페이스 정의 부족

### 1.3 근본 원인 요약
1. **데이터 모델 설계 오류**: Project → FeedBack 관계가 일대일이 아닌 일대다여야 함
2. **API 설계 불일치**: RESTful 원칙 미준수, 리소스 관계 모호
3. **프로세스 부재**: 변경사항 추적 및 검증 시스템 없음

## 2. 아키텍처 설계

### 2.1 데이터 모델 재설계

```python
# 올바른 관계 설계
class Project(models.Model):
    # 기존 필드들...
    # feedback 필드 제거 (일대일 관계 삭제)

class Feedback(models.Model):
    project = models.ForeignKey(Project, related_name='feedbacks')  # 일대다 관계
    user = models.ForeignKey(User)
    video_file = models.FileField()  # 피드백별 영상 파일
    created_at = models.DateTimeField(auto_now_add=True)
    
class FeedbackComment(models.Model):
    feedback = models.ForeignKey(Feedback, related_name='comments')
    user = models.ForeignKey(User)
    timestamp = models.FloatField()  # 영상 시점 (초 단위)
    content = models.TextField()
    type = models.CharField()  # 일반/기술적/창작/칭찬/질문/긴급
    parent = models.ForeignKey('self', null=True)  # 답글 지원
```

### 2.2 API 엔드포인트 체계

```
/api/projects/{project_id}/feedbacks/
    GET    - 프로젝트의 모든 피드백 목록
    POST   - 새 피드백 생성 (영상 업로드)

/api/projects/{project_id}/feedbacks/{feedback_id}/
    GET    - 특정 피드백 상세 정보
    PUT    - 피드백 정보 수정
    DELETE - 피드백 삭제

/api/projects/{project_id}/feedbacks/{feedback_id}/comments/
    GET    - 피드백의 모든 코멘트
    POST   - 새 코멘트 추가

/api/projects/{project_id}/feedbacks/{feedback_id}/comments/{comment_id}/
    PUT    - 코멘트 수정
    DELETE - 코멘트 삭제
    
/api/projects/{project_id}/feedbacks/{feedback_id}/upload/
    POST   - 영상 파일 업로드
    
/api/projects/{project_id}/feedbacks/{feedback_id}/stream/
    GET    - HLS 스트리밍 URL 반환
```

### 2.3 실시간 동기화 아키텍처

```
┌─────────────────────────────────────────────────┐
│                 프론트엔드                        │
│  React + Redux + WebSocket Client                │
└─────────────────────────────────────────────────┘
                        │
                    WebSocket
                        │
┌─────────────────────────────────────────────────┐
│              Django Channels                     │
│         WebSocket Handler + Redis                │
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│                Django REST API                   │
│            피드백 CRUD + 파일 처리                 │
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│               PostgreSQL + S3                    │
│          메타데이터 + 미디어 파일                  │
└─────────────────────────────────────────────────┘
```

### 2.4 핵심 기능 플로우

#### 2.4.1 피드백 생성 플로우
1. 사용자가 프로젝트 선택
2. 영상 파일 업로드 (청크 업로드 지원)
3. 서버에서 영상 인코딩 (HLS 변환)
4. 피드백 레코드 생성
5. WebSocket으로 팀원에게 알림

#### 2.4.2 코멘트 작성 플로우
1. 영상 특정 시점에서 일시정지
2. 코멘트 타입 선택 및 내용 작성
3. 타임스탬프와 함께 저장
4. WebSocket으로 실시간 동기화
5. 타임라인에 마커 표시

#### 2.4.3 실시간 협업 플로우
1. WebSocket 연결 수립
2. 피드백 룸 입장
3. 다른 사용자 커서/상태 동기화
4. 코멘트 실시간 업데이트
5. 충돌 해결 (OT 알고리즘)

## 3. 구현 계획

### 3.1 Phase 1: 데이터 모델 및 기본 API (1주차)

#### 작업 항목
1. **백엔드 (Backend-Benny)**
   - 새로운 피드백 모델 마이그레이션
   - RESTful API 뷰 구현
   - 파일 업로드 처리
   - 기본 CRUD 테스트

2. **프론트엔드 (Frontend-Fronty)**
   - API 클라이언트 수정
   - 피드백 목록 UI
   - 파일 업로드 UI
   - 에러 핸들링

### 3.2 Phase 2: 영상 처리 및 스트리밍 (2주차)

#### 작업 항목
1. **백엔드 (Backend-Benny + DevOps-Devo)**
   - FFmpeg 통합 (영상 인코딩)
   - HLS 스트리밍 설정
   - 썸네일 생성
   - CDN 설정

2. **프론트엔드 (Frontend-Fronty)**
   - Video.js 플레이어 통합
   - 타임라인 UI 구현
   - 코멘트 마커 표시
   - 재생 컨트롤

### 3.3 Phase 3: 실시간 협업 (3주차)

#### 작업 항목
1. **백엔드 (Backend-Benny)**
   - Django Channels 설정
   - WebSocket 핸들러
   - Redis 연동
   - 인증/권한 처리

2. **프론트엔드 (Frontend-Fronty)**
   - WebSocket 클라이언트
   - 실시간 업데이트 UI
   - 충돌 해결 로직
   - 알림 시스템

### 3.4 Phase 4: 고급 기능 (4주차)

#### 작업 항목
1. **AI 기능 (AI-Aiden)**
   - 영상 자동 분석
   - 피드백 요약
   - 감정 분석
   - 개선점 제안

2. **최적화 (Performance-Perry)**
   - 캐싱 전략
   - 로드 밸런싱
   - 성능 모니터링
   - 에러 추적

## 4. TDD 기반 테스트 케이스 설계

### 4.1 백엔드 테스트 (Pytest)

```python
# test_feedback_api.py

class TestFeedbackAPI:
    def test_create_feedback_without_project_fails(self):
        """프로젝트 없이 피드백 생성 시 실패"""
        response = self.client.post('/api/feedbacks/')
        assert response.status_code == 400
        
    def test_create_feedback_with_valid_project(self):
        """유효한 프로젝트로 피드백 생성 성공"""
        project = Project.objects.create(...)
        response = self.client.post(f'/api/projects/{project.id}/feedbacks/')
        assert response.status_code == 201
        
    def test_upload_large_video_file(self):
        """대용량 영상 파일 업로드 (청크)"""
        # 100MB 파일 테스트
        assert False  # 초기 실패
        
    def test_concurrent_comment_creation(self):
        """동시 코멘트 생성 시 충돌 해결"""
        assert False  # 초기 실패
```

### 4.2 프론트엔드 테스트 (Jest)

```javascript
// feedback.test.js

describe('Feedback System', () => {
  test('should display feedback list for project', async () => {
    const feedbacks = await getFeedbackList(projectId);
    expect(feedbacks).toHaveLength(0); // 초기 실패
  });
  
  test('should sync comments in real-time', async () => {
    const ws = new WebSocket('ws://localhost:8000/ws/feedback/');
    // WebSocket 연결 테스트
    expect(ws.readyState).toBe(WebSocket.OPEN); // 초기 실패
  });
  
  test('should handle video upload progress', async () => {
    const onProgress = jest.fn();
    await uploadVideo(file, onProgress);
    expect(onProgress).toHaveBeenCalled(); // 초기 실패
  });
});
```

### 4.3 통합 테스트

```javascript
// e2e-feedback.test.js

describe('E2E Feedback Flow', () => {
  test('complete feedback workflow', async () => {
    // 1. 프로젝트 생성
    // 2. 영상 업로드
    // 3. 피드백 작성
    // 4. 실시간 동기화 확인
    // 5. 알림 수신 확인
    expect(false).toBe(true); // 초기 실패
  });
});
```

## 5. 각 에이전트별 작업 지시서

### 5.1 Backend-Benny (백엔드 개발)
**우선순위 1**: 데이터 모델 마이그레이션
- [ ] Project-Feedback 관계 재설계
- [ ] 마이그레이션 파일 생성 및 적용
- [ ] 기존 데이터 마이그레이션 스크립트

**우선순위 2**: RESTful API 구현
- [ ] ViewSet 기반 API 뷰 작성
- [ ] 권한 및 인증 처리
- [ ] 페이지네이션 및 필터링

### 5.2 Frontend-Fronty (프론트엔드 개발)
**우선순위 1**: API 클라이언트 수정
- [ ] 새 엔드포인트에 맞춰 API 함수 수정
- [ ] 에러 핸들링 개선
- [ ] 로딩 상태 관리

**우선순위 2**: UI 컴포넌트 개발
- [ ] 피드백 목록 컴포넌트
- [ ] 영상 플레이어 통합
- [ ] 코멘트 타임라인

### 5.3 DevOps-Devo (인프라 및 배포)
**우선순위 1**: 미디어 처리 인프라
- [ ] FFmpeg 설치 및 설정
- [ ] S3/CDN 구성
- [ ] 스트리밍 서버 설정

**우선순위 2**: 실시간 통신 인프라
- [ ] Redis 클러스터 구성
- [ ] WebSocket 로드 밸런싱
- [ ] 모니터링 설정

### 5.4 QA-Q (품질 보증)
**우선순위 1**: 테스트 자동화
- [ ] CI/CD 파이프라인 구축
- [ ] 테스트 커버리지 80% 달성
- [ ] 성능 벤치마크

**우선순위 2**: 보안 및 안정성
- [ ] 보안 취약점 스캔
- [ ] 부하 테스트
- [ ] 장애 복구 시나리오

## 6. 성공 지표

### 6.1 기능적 성공 지표
- [ ] 모든 API 엔드포인트 200/201 응답
- [ ] 영상 업로드 성공률 99% 이상
- [ ] 실시간 동기화 지연 시간 100ms 이하
- [ ] 동시 사용자 100명 지원

### 6.2 비기능적 성공 지표
- [ ] 페이지 로드 시간 2초 이하
- [ ] 영상 버퍼링 시간 1초 이하
- [ ] 시스템 가용성 99.9%
- [ ] 사용자 만족도 90% 이상

## 7. 리스크 및 대응 방안

### 7.1 기술적 리스크
1. **대용량 파일 처리**: 청크 업로드, 백그라운드 처리
2. **실시간 동기화 충돌**: OT 알고리즘, 락 메커니즘
3. **스케일링 이슈**: 마이크로서비스 아키텍처 고려

### 7.2 일정 리스크
1. **의존성 지연**: 병렬 작업 가능한 태스크 분리
2. **기술 학습 곡선**: 페어 프로그래밍, 지식 공유
3. **요구사항 변경**: 애자일 방법론, 스프린트 단위 개발

## 8. 다음 단계

1. **즉시 실행 (오늘)**
   - 데이터 모델 마이그레이션 생성
   - API 엔드포인트 스펙 확정
   - 첫 번째 실패 테스트 작성

2. **단기 (이번 주)**
   - 기본 CRUD API 구현
   - 프론트엔드 API 클라이언트 수정
   - 통합 테스트 환경 구축

3. **중기 (이번 달)**
   - 영상 처리 파이프라인 구축
   - 실시간 협업 기능 구현
   - 성능 최적화

---

**작성일**: 2025-08-05
**작성자**: Aki (아키텍트)
**상태**: 초안 완료, 검토 필요