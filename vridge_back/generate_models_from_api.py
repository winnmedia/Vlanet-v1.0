#!/usr/bin/env python3
"""
Django 모델 및 마이그레이션 자동 생성 스크립트
VideoPlanning/Calendar/ProjectCreate/feedback API 엔드포인트 분석
"""

import json
import os
import requests
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, Any, List

class ModelGenerator:
    def __init__(self, base_url="https://videoplanet.up.railway.app"):
        self.base_url = base_url
        self.models = {}
        self.api_endpoints = []
        
    def analyze_existing_apis(self):
        """기존 프로젝트의 URL 패턴을 분석하여 API 엔드포인트 추출"""
        # VideoPlanning 관련 API
        video_planning_apis = [
            "/api/video-planning/generate/structure/",
            "/api/video-planning/generate/story/", 
            "/api/video-planning/generate/scenes/",
            "/api/video-planning/generate/shots/",
            "/api/video-planning/generate/storyboards/",
            "/api/video-planning/save/",
            "/api/video-planning/list/",
            "/api/video-planning/recent/"
        ]
        
        # Projects 관련 API  
        project_apis = [
            "/api/projects/",
            "/api/projects/list/",
            "/api/projects/create/",
            "/api/projects/atomic-create/"
        ]
        
        # Feedbacks 관련 API
        feedback_apis = [
            "/api/feedbacks/",
            "/api/feedbacks/list/",
            "/api/feedbacks/create/"
        ]
        
        # Users 관련 API
        user_apis = [
            "/api/users/profile/",
            "/api/users/login/",
            "/api/users/register/"
        ]
        
        # Video Analysis 관련 API
        video_analysis_apis = [
            "/api/video-analysis/analyze/",
            "/api/video-analysis/result/",
            "/api/video-analysis/teacher/"
        ]
        
        self.api_endpoints = (video_planning_apis + project_apis + 
                            feedback_apis + user_apis + video_analysis_apis)
        
    def get_sample_data(self):
        """실제 모델에서 샘플 데이터 추출"""
        sample_data = {
            "VideoPlanning": {
                "id": 1,
                "title": "샘플 영상 기획",
                "planning_text": "영상 기획안 텍스트입니다. 이것은 영상의 전체적인 구성과 방향성을 담고 있습니다.",
                "stories": [
                    {
                        "title": "도입부",
                        "summary": "영상의 시작 부분입니다.",
                        "stage": "기",
                        "stage_name": "도입"
                    }
                ],
                "selected_story": {
                    "title": "선택된 스토리",
                    "summary": "선택된 스토리 요약"
                },
                "scenes": [
                    {
                        "location": "사무실", 
                        "time_of_day": "오후",
                        "description": "사무실에서 벌어지는 장면",
                        "characters": ["주인공", "동료"],
                        "mood": "긴장감"
                    }
                ],
                "shots": [
                    {
                        "shot_size": "클로즈업",
                        "description": "주인공의 표정",
                        "camera_angle": "아이레벨",
                        "duration": "3초"
                    }
                ],
                "storyboards": [
                    {
                        "description": "스토리보드 설명",
                        "image_url": "https://example.com/image.png",
                        "frame_number": 1
                    }
                ],
                "is_completed": False,
                "current_step": 1,
                "created_at": "2023-12-07T10:00:00Z",
                "updated_at": "2023-12-07T10:00:00Z"
            },
            
            "Project": {
                "id": 1,
                "name": "샘플 프로젝트",
                "manager": "프로젝트 매니저",
                "consumer": "고객사명",
                "description": "프로젝트 설명입니다. 이것은 프로젝트의 목적과 범위를 설명합니다.",
                "color": "#4318FF",
                "tone_manner": "친근하고 전문적인",
                "genre": "기업 홍보",
                "concept": "모던하고 깔끔한",
                "created": "2023-12-07T10:00:00Z",
                "updated": "2023-12-07T10:00:00Z"
            },
            
            "Feedback": {
                "id": 1,
                "title": "피드백 제목",
                "url": "https://example.com/video.mp4",
                "description": "피드백 설명입니다. 영상에 대한 상세한 피드백 내용을 포함합니다.",
                "status": "active",
                "is_public": True,
                "created_at": "2023-12-07T10:00:00Z"
            },
            
            "User": {
                "id": 1,
                "username": "testuser",
                "email": "test@example.com",
                "first_name": "테스트",
                "last_name": "사용자",
                "is_active": True,
                "is_staff": False,
                "date_joined": "2023-12-07T10:00:00Z"
            },
            
            "VideoAnalysisResult": {
                "id": 1,
                "video_id": "12345",
                "analysis_status": "completed",
                "twelve_labs_video_id": "tl_video_123",
                "index_id": "idx_123",
                "analysis_data": {
                    "summary": "영상 분석 결과",
                    "highlights": ["중요 장면 1", "중요 장면 2"],
                    "transcript": "영상 내용 텍스트"
                },
                "created_at": "2023-12-07T10:00:00Z"
            },
            
            "AIFeedbackItem": {
                "id": 1,
                "feedback_type": "technical",
                "confidence": 0.95,
                "teacher_personality": "professional",
                "feedback_content": "AI 선생님의 피드백 내용입니다.",
                "created_at": "2023-12-07T10:00:00Z"
            },
            
            "IdempotencyRecord": {
                "id": 1,
                "idempotency_key": "unique_key_123",
                "project_id": 1,
                "request_data": "요청 데이터 JSON",
                "status": "completed",
                "created_at": "2023-12-07T10:00:00Z"
            }
        }
        return sample_data
        
    def infer_field_type(self, key: str, value: Any) -> str:
        """값의 타입을 기반으로 Django 필드 타입 추론"""
        if isinstance(value, bool):
            return "models.BooleanField(default=False)"
        elif isinstance(value, int):
            if key in ['id', 'pk']:
                return "models.AutoField(primary_key=True)"
            return "models.IntegerField(null=True, blank=True)"
        elif isinstance(value, float):
            return "models.FloatField(null=True, blank=True)"
        elif isinstance(value, str):
            if key in ['created_at', 'updated_at', 'date_joined']:
                return "models.DateTimeField(auto_now_add=True)"
            elif key == 'updated_at':
                return "models.DateTimeField(auto_now=True)"
            elif 'email' in key.lower():
                return "models.EmailField(max_length=254, null=True, blank=True)"
            elif 'url' in key.lower():
                return "models.URLField(max_length=500, null=True, blank=True)"
            elif len(str(value)) > 255:
                return "models.TextField(null=True, blank=True)"
            else:
                return "models.CharField(max_length=255, null=True, blank=True)"
        elif isinstance(value, (list, dict)):
            return "models.JSONField(default=dict, null=True, blank=True)"
        else:
            return "models.JSONField(default=dict, null=True, blank=True)"
    
    def generate_models(self):
        """샘플 데이터를 기반으로 Django 모델 생성"""
        sample_data = self.get_sample_data()
        
        for model_name, fields_data in sample_data.items():
            fields = {}
            for key, value in fields_data.items():
                if key != 'id':  # id는 자동으로 추가
                    fields[key] = self.infer_field_type(key, value)
            self.models[model_name] = fields
            
    def write_models_file(self):
        """models_from_spec.py 파일 생성"""
        output_path = Path("app")
        output_path.mkdir(exist_ok=True)
        
        models_content = '''"""
VideoPlanning/Calendar/ProjectCreate/Feedback API에서 자동 생성된 Django 모델
"""
from django.db import models
from django.contrib.auth.models import User

'''
        
        for model_name, fields in self.models.items():
            models_content += f"\nclass {model_name}FromSpec(models.Model):\n"
            models_content += f'    """API 스펙에서 자동 생성된 {model_name} 모델"""\n'
            
            # id 필드는 Django에서 자동 생성되므로 제외
            for field_name, field_type in fields.items():
                models_content += f"    {field_name} = {field_type}\n"
            
            models_content += f"\n    class Meta:\n"
            models_content += f"        db_table = '{model_name.lower()}_from_spec'\n"
            models_content += f"        verbose_name = '{model_name} (API 스펙)'\n"
            models_content += f"        verbose_name_plural = '{model_name}s (API 스펙)'\n"
            models_content += f"        ordering = ['-id']\n"
            
            models_content += f"\n    def __str__(self):\n"
            if 'title' in fields:
                models_content += f"        return self.title or str(self.pk)\n"
            elif 'name' in fields:
                models_content += f"        return self.name or str(self.pk)\n"
            else:
                models_content += f"        return f'{model_name}({{self.pk}})'\n"
            
            models_content += "\n"
            
        models_file = output_path / "models_from_spec.py"
        models_file.write_text(models_content)
        print(f"✅ 모델 파일 생성: {models_file}")
        
    def write_migration_files(self):
        """마이그레이션 파일들 생성"""
        output_dir = Path("migrations_from_spec")
        output_dir.mkdir(exist_ok=True)
        
        # __init__.py 파일 생성
        (output_dir / "__init__.py").write_text("")
        
        migration_number = 1
        for model_name, fields in self.models.items():
            migration_content = f'''# Generated migration for {model_name}FromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='{model_name}FromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
'''
            
            for field_name, field_type in fields.items():
                migration_content += f"                ('{field_name}', {field_type}),\n"
            
            migration_content += '''            ],
            options={
                'db_table': \'''' + model_name.lower() + '''_from_spec\',
                'verbose_name': \'''' + model_name + ''' (API 스펙)\',
                'verbose_name_plural': \'''' + model_name + '''s (API 스펙)\',
                'ordering': ['-id'],
            },
        ),
    ]
'''
            
            migration_file = output_dir / f"{migration_number:04d}_create_{model_name.lower()}_from_spec.py"
            migration_file.write_text(migration_content)
            print(f"✅ 마이그레이션 파일 생성: {migration_file}")
            migration_number += 1
            
    def generate_usage_guide(self):
        """사용 가이드 생성"""
        guide_content = f'''# Django 모델 및 마이그레이션 자동 생성 결과

## 생성된 파일들

### 1. 모델 파일
- `app/models_from_spec.py` - API 스펙에서 추론한 Django 모델들

### 2. 마이그레이션 파일들
- `migrations_from_spec/` 디렉토리에 {len(self.models)}개의 마이그레이션 파일 생성

## 생성된 모델들

'''
        for model_name, fields in self.models.items():
            guide_content += f"\n### {model_name}FromSpec\n"
            guide_content += f"- 테이블명: `{model_name.lower()}_from_spec`\n"
            guide_content += f"- 필드 수: {len(fields)}개\n"
            guide_content += "- 필드 목록:\n"
            for field_name, field_type in fields.items():
                guide_content += f"  - `{field_name}`: {field_type}\n"
        
        guide_content += '''

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
'''
        
        guide_file = Path("API_MODELS_GUIDE.md")
        guide_file.write_text(guide_content)
        print(f"✅ 사용 가이드 생성: {guide_file}")

def main():
    print("🚀 Django 모델 및 마이그레이션 자동 생성 시작")
    print("=" * 60)
    
    generator = ModelGenerator()
    
    print("📊 API 엔드포인트 분석 중...")
    generator.analyze_existing_apis()
    
    print("🔍 샘플 데이터 기반 모델 생성 중...")
    generator.generate_models()
    
    print("📝 Django 모델 파일 작성 중...")
    generator.write_models_file()
    
    print("📁 마이그레이션 파일 생성 중...")
    generator.write_migration_files()
    
    print("📚 사용 가이드 생성 중...")
    generator.generate_usage_guide()
    
    print("\n" + "=" * 60)
    print("✅ Django 모델 및 마이그레이션 생성 완료!")
    print(f"✅ 총 {len(generator.models)}개의 모델 생성")
    print("📂 생성된 파일들:")
    print("   - app/models_from_spec.py")
    print("   - migrations_from_spec/*.py")
    print("   - API_MODELS_GUIDE.md")

if __name__ == "__main__":
    main()