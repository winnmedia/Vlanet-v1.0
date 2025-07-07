# Django 모델 및 마이그레이션 자동 생성 결과

## 생성된 파일들

### 1. 모델 파일
- `app/models_from_spec.py` - API 스펙에서 추론한 Django 모델들

### 2. 마이그레이션 파일들
- `migrations_from_spec/` 디렉토리에 7개의 마이그레이션 파일 생성

## 생성된 모델들


### VideoPlanningFromSpec
- 테이블명: `videoplanning_from_spec`
- 필드 수: 11개
- 필드 목록:
  - `title`: models.CharField(max_length=255, null=True, blank=True)
  - `planning_text`: models.CharField(max_length=255, null=True, blank=True)
  - `stories`: models.JSONField(default=dict, null=True, blank=True)
  - `selected_story`: models.JSONField(default=dict, null=True, blank=True)
  - `scenes`: models.JSONField(default=dict, null=True, blank=True)
  - `shots`: models.JSONField(default=dict, null=True, blank=True)
  - `storyboards`: models.JSONField(default=dict, null=True, blank=True)
  - `is_completed`: models.BooleanField(default=False)
  - `current_step`: models.IntegerField(null=True, blank=True)
  - `created_at`: models.DateTimeField(auto_now_add=True)
  - `updated_at`: models.DateTimeField(auto_now_add=True)

### ProjectFromSpec
- 테이블명: `project_from_spec`
- 필드 수: 10개
- 필드 목록:
  - `name`: models.CharField(max_length=255, null=True, blank=True)
  - `manager`: models.CharField(max_length=255, null=True, blank=True)
  - `consumer`: models.CharField(max_length=255, null=True, blank=True)
  - `description`: models.CharField(max_length=255, null=True, blank=True)
  - `color`: models.CharField(max_length=255, null=True, blank=True)
  - `tone_manner`: models.CharField(max_length=255, null=True, blank=True)
  - `genre`: models.CharField(max_length=255, null=True, blank=True)
  - `concept`: models.CharField(max_length=255, null=True, blank=True)
  - `created`: models.CharField(max_length=255, null=True, blank=True)
  - `updated`: models.CharField(max_length=255, null=True, blank=True)

### FeedbackFromSpec
- 테이블명: `feedback_from_spec`
- 필드 수: 6개
- 필드 목록:
  - `title`: models.CharField(max_length=255, null=True, blank=True)
  - `url`: models.URLField(max_length=500, null=True, blank=True)
  - `description`: models.CharField(max_length=255, null=True, blank=True)
  - `status`: models.CharField(max_length=255, null=True, blank=True)
  - `is_public`: models.BooleanField(default=False)
  - `created_at`: models.DateTimeField(auto_now_add=True)

### UserFromSpec
- 테이블명: `user_from_spec`
- 필드 수: 7개
- 필드 목록:
  - `username`: models.CharField(max_length=255, null=True, blank=True)
  - `email`: models.EmailField(max_length=254, null=True, blank=True)
  - `first_name`: models.CharField(max_length=255, null=True, blank=True)
  - `last_name`: models.CharField(max_length=255, null=True, blank=True)
  - `is_active`: models.BooleanField(default=False)
  - `is_staff`: models.BooleanField(default=False)
  - `date_joined`: models.DateTimeField(auto_now_add=True)

### VideoAnalysisResultFromSpec
- 테이블명: `videoanalysisresult_from_spec`
- 필드 수: 6개
- 필드 목록:
  - `video_id`: models.CharField(max_length=255, null=True, blank=True)
  - `analysis_status`: models.CharField(max_length=255, null=True, blank=True)
  - `twelve_labs_video_id`: models.CharField(max_length=255, null=True, blank=True)
  - `index_id`: models.CharField(max_length=255, null=True, blank=True)
  - `analysis_data`: models.JSONField(default=dict, null=True, blank=True)
  - `created_at`: models.DateTimeField(auto_now_add=True)

### AIFeedbackItemFromSpec
- 테이블명: `aifeedbackitem_from_spec`
- 필드 수: 5개
- 필드 목록:
  - `feedback_type`: models.CharField(max_length=255, null=True, blank=True)
  - `confidence`: models.FloatField(null=True, blank=True)
  - `teacher_personality`: models.CharField(max_length=255, null=True, blank=True)
  - `feedback_content`: models.CharField(max_length=255, null=True, blank=True)
  - `created_at`: models.DateTimeField(auto_now_add=True)

### IdempotencyRecordFromSpec
- 테이블명: `idempotencyrecord_from_spec`
- 필드 수: 5개
- 필드 목록:
  - `idempotency_key`: models.CharField(max_length=255, null=True, blank=True)
  - `project_id`: models.IntegerField(null=True, blank=True)
  - `request_data`: models.CharField(max_length=255, null=True, blank=True)
  - `status`: models.CharField(max_length=255, null=True, blank=True)
  - `created_at`: models.DateTimeField(auto_now_add=True)


## 사용 방법

### 1. Django 앱에 모델 추가
```python
# settings.py의 INSTALLED_APPS에 'app' 추가
INSTALLED_APPS = [
    # ... 기존 앱들
    'app',
]
```

### 2. 마이그레이션 적용
```bash
# 마이그레이션 파일을 앱의 migrations 디렉토리로 복사
cp migrations_from_spec/*.py your_app/migrations/

# 마이그레이션 적용
python manage.py migrate
```

### 3. 모델 사용 예시
```python
from app.models_from_spec import VideoplanningFromSpec, ProjectFromSpec

# 데이터 생성
planning = VideoplanningFromSpec.objects.create(
    title="새 영상 기획",
    planning_text="기획안 내용..."
)

# 데이터 조회
all_plannings = VideoplanningFromSpec.objects.all()
```

## 주의사항
- 이 모델들은 API 응답 구조를 기반으로 자동 생성되었습니다
- 실제 사용 시 필드 타입이나 제약조건을 검토하고 조정하세요
- Foreign Key나 Many-to-Many 관계는 수동으로 추가해야 합니다
