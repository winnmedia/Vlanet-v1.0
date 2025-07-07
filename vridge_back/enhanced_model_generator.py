#!/usr/bin/env python3
"""
Enhanced Django 모델 및 마이그레이션 자동 생성 스크립트
HAR 파일 및 OpenAPI 스펙을 지원하여 더 정확한 모델 생성
"""

import json
import os
import sys
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, Any, List, Union
import re

class EnhancedModelGenerator:
    def __init__(self):
        self.models = {}
        self.field_analysis = defaultdict(lambda: defaultdict(list))
        self.endpoint_patterns = {}
        
    def load_har_file(self, har_path: str):
        """HAR 파일을 로드하고 API 엔드포인트 분석"""
        try:
            with open(har_path, 'r', encoding='utf-8') as f:
                har_data = json.load(f)
            
            print(f"✅ HAR 파일 로드: {har_path}")
            return self.analyze_har_data(har_data)
        except FileNotFoundError:
            print(f"❌ HAR 파일을 찾을 수 없습니다: {har_path}")
            return False
        except json.JSONDecodeError:
            print(f"❌ HAR 파일 파싱 오류: {har_path}")
            return False
    
    def load_openapi_spec(self, spec_path: str):
        """OpenAPI 스펙 파일을 로드하고 분석"""
        try:
            with open(spec_path, 'r', encoding='utf-8') as f:
                spec_data = json.load(f)
            
            print(f"✅ OpenAPI 스펙 로드: {spec_path}")
            return self.analyze_openapi_spec(spec_data)
        except FileNotFoundError:
            print(f"❌ OpenAPI 스펙 파일을 찾을 수 없습니다: {spec_path}")
            return False
        except json.JSONDecodeError:
            print(f"❌ OpenAPI 스펙 파싱 오류: {spec_path}")
            return False
    
    def analyze_har_data(self, har_data: dict):
        """HAR 데이터에서 API 엔드포인트와 응답 분석"""
        entries = har_data.get('log', {}).get('entries', [])
        api_count = 0
        
        for entry in entries:
            request = entry.get('request', {})
            response = entry.get('response', {})
            
            url = request.get('url', '')
            method = request.get('method', 'GET')
            
            # /api/로 시작하는 엔드포인트만 분석
            if '/api/' not in url:
                continue
                
            api_count += 1
            
            # URL에서 엔드포인트 패턴 추출
            api_path = url.split('/api/')[-1].strip('/')
            endpoint_base = api_path.split('/')[0] if '/' in api_path else api_path
            
            # 응답 데이터 분석
            content = response.get('content', {})
            text = content.get('text', '')
            
            if text:
                try:
                    response_data = json.loads(text)
                    self.analyze_response_data(endpoint_base, response_data, method)
                except json.JSONDecodeError:
                    continue
        
        print(f"📊 분석된 API 엔드포인트: {api_count}개")
        return api_count > 0
    
    def analyze_openapi_spec(self, spec_data: dict):
        """OpenAPI 스펙에서 모델 스키마 분석"""
        components = spec_data.get('components', {})
        schemas = components.get('schemas', {})
        
        for schema_name, schema_def in schemas.items():
            properties = schema_def.get('properties', {})
            
            model_fields = {}
            for field_name, field_def in properties.items():
                field_type = self.openapi_type_to_django_field(field_def)
                model_fields[field_name] = field_type
            
            if model_fields:
                self.models[schema_name] = model_fields
        
        print(f"📊 OpenAPI 스키마에서 {len(self.models)}개 모델 생성")
        return len(self.models) > 0
    
    def analyze_response_data(self, endpoint: str, data: Any, method: str):
        """응답 데이터를 분석하여 필드 타입 추론"""
        model_name = self.endpoint_to_model_name(endpoint)
        
        # data나 data.data 구조 처리
        actual_data = data
        if isinstance(data, dict):
            if 'data' in data and isinstance(data['data'], (dict, list)):
                actual_data = data['data']
            elif 'results' in data and isinstance(data['results'], list):
                actual_data = data['results']
        
        # 리스트인 경우 첫 번째 항목 분석
        if isinstance(actual_data, list) and len(actual_data) > 0:
            actual_data = actual_data[0]
        
        # 딕셔너리 구조 분석
        if isinstance(actual_data, dict):
            for field_name, field_value in actual_data.items():
                if field_name != 'id':  # id는 자동 생성
                    field_type = self.infer_django_field_type(field_name, field_value)
                    self.field_analysis[model_name][field_name].append(field_type)
    
    def endpoint_to_model_name(self, endpoint: str) -> str:
        """엔드포인트명을 모델명으로 변환"""
        # 복수형을 단수형으로 변환하고 CamelCase로 변환
        endpoint = endpoint.rstrip('s')  # 간단한 복수형 제거
        endpoint = endpoint.replace('-', '_').replace('_', ' ')
        return ''.join(word.capitalize() for word in endpoint.split())
    
    def infer_django_field_type(self, field_name: str, value: Any) -> str:
        """값과 필드명을 기반으로 Django 필드 타입 추론 (개선된 버전)"""
        field_name_lower = field_name.lower()
        
        # 특정 필드명 패턴에 따른 타입 결정
        if isinstance(value, bool):
            return "models.BooleanField(default=False)"
        elif isinstance(value, int):
            if 'id' in field_name_lower and field_name_lower != 'id':
                return "models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)"
            return "models.IntegerField(null=True, blank=True)"
        elif isinstance(value, float):
            if 'confidence' in field_name_lower or 'score' in field_name_lower:
                return "models.FloatField(null=True, blank=True, help_text='0.0-1.0 범위')"
            return "models.FloatField(null=True, blank=True)"
        elif isinstance(value, str):
            # 날짜/시간 필드 감지
            if any(pattern in field_name_lower for pattern in ['created', 'updated', 'date', 'time']):
                if 'created' in field_name_lower:
                    return "models.DateTimeField(auto_now_add=True)"
                elif 'updated' in field_name_lower:
                    return "models.DateTimeField(auto_now=True)"
                else:
                    return "models.DateTimeField(null=True, blank=True)"
            
            # 이메일 필드
            elif 'email' in field_name_lower:
                return "models.EmailField(max_length=254, null=True, blank=True)"
            
            # URL 필드
            elif any(pattern in field_name_lower for pattern in ['url', 'link', 'href']):
                return "models.URLField(max_length=500, null=True, blank=True)"
            
            # 상태/선택 필드
            elif any(pattern in field_name_lower for pattern in ['status', 'state', 'type', 'mode']):
                return f"models.CharField(max_length=50, null=True, blank=True, help_text='{field_name} 상태')"
            
            # 텍스트 길이에 따른 필드 선택
            elif len(str(value)) > 500:
                return "models.TextField(null=True, blank=True)"
            elif len(str(value)) > 255:
                return "models.CharField(max_length=500, null=True, blank=True)"
            else:
                return "models.CharField(max_length=255, null=True, blank=True)"
        
        elif isinstance(value, (list, dict)):
            return "models.JSONField(default=dict, null=True, blank=True)"
        else:
            return "models.JSONField(default=dict, null=True, blank=True)"
    
    def openapi_type_to_django_field(self, field_def: dict) -> str:
        """OpenAPI 필드 정의를 Django 필드로 변환"""
        field_type = field_def.get('type', 'string')
        field_format = field_def.get('format', '')
        
        if field_type == 'boolean':
            return "models.BooleanField(default=False)"
        elif field_type == 'integer':
            return "models.IntegerField(null=True, blank=True)"
        elif field_type == 'number':
            return "models.FloatField(null=True, blank=True)"
        elif field_type == 'string':
            if field_format == 'date-time':
                return "models.DateTimeField(null=True, blank=True)"
            elif field_format == 'email':
                return "models.EmailField(max_length=254, null=True, blank=True)"
            elif field_format == 'uri':
                return "models.URLField(max_length=500, null=True, blank=True)"
            else:
                max_length = field_def.get('maxLength', 255)
                if max_length > 255:
                    return "models.TextField(null=True, blank=True)"
                return f"models.CharField(max_length={max_length}, null=True, blank=True)"
        elif field_type in ['array', 'object']:
            return "models.JSONField(default=dict, null=True, blank=True)"
        else:
            return "models.JSONField(default=dict, null=True, blank=True)"
    
    def consolidate_field_types(self):
        """여러 응답에서 수집된 필드 타입들을 통합"""
        for model_name, fields in self.field_analysis.items():
            consolidated_fields = {}
            
            for field_name, type_list in fields.items():
                # 가장 많이 나타난 타입 선택
                type_counter = Counter(type_list)
                most_common_type = type_counter.most_common(1)[0][0]
                consolidated_fields[field_name] = most_common_type
            
            if consolidated_fields:
                self.models[model_name] = consolidated_fields
    
    def write_enhanced_models_file(self):
        """향상된 Django 모델 파일 생성"""
        output_path = Path("app_enhanced")
        output_path.mkdir(exist_ok=True)
        
        models_content = '''"""
HAR/OpenAPI 스펙에서 자동 생성된 Enhanced Django 모델
동적 필드 타입 추론 및 관계 감지 기능 포함
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

'''
        
        for model_name, fields in self.models.items():
            models_content += f"\nclass {model_name}Enhanced(models.Model):\n"
            models_content += f'    """API 스펙에서 자동 생성된 Enhanced {model_name} 모델"""\n'
            
            # 필드 정의
            for field_name, field_type in fields.items():
                # 도움말 주석 추가
                if 'JSONField' in field_type:
                    models_content += f"    {field_name} = {field_type}  # 복합 데이터 구조\n"
                elif 'confidence' in field_name.lower():
                    models_content += f"    {field_name} = {field_type}  # AI 신뢰도 점수\n"
                else:
                    models_content += f"    {field_name} = {field_type}\n"
            
            # Meta 클래스
            models_content += f"\n    class Meta:\n"
            models_content += f"        db_table = '{model_name.lower()}_enhanced'\n"
            models_content += f"        verbose_name = '{model_name} (Enhanced)'\n"
            models_content += f"        verbose_name_plural = '{model_name}s (Enhanced)'\n"
            models_content += f"        ordering = ['-id']\n"
            
            # 인덱스 추가 (성능 최적화)
            index_fields = []
            for field_name in fields.keys():
                if any(pattern in field_name.lower() for pattern in ['status', 'type', 'created', 'updated']):
                    index_fields.append(f"'{field_name}'")
            
            if index_fields:
                models_content += f"        indexes = [\n"
                for field in index_fields:
                    models_content += f"            models.Index(fields=[{field}]),\n"
                models_content += f"        ]\n"
            
            # __str__ 메서드
            models_content += f"\n    def __str__(self):\n"
            str_fields = ['title', 'name', 'username', 'email']
            str_field = None
            for field in str_fields:
                if field in fields:
                    str_field = field
                    break
            
            if str_field:
                models_content += f"        return self.{str_field} or f'{model_name}({{self.pk}})'\n"
            else:
                models_content += f"        return f'{model_name}({{self.pk}})'\n"
            
            # 추가 메서드들
            if 'created_at' in fields or 'updated_at' in fields:
                models_content += f"\n    @property\n"
                models_content += f"    def age_in_days(self):\n"
                models_content += f"        \"\"\"생성일로부터 경과 일수\"\"\"\n"
                models_content += f"        from django.utils import timezone\n"
                if 'created_at' in fields:
                    models_content += f"        return (timezone.now() - self.created_at).days\n"
                else:
                    models_content += f"        return (timezone.now() - self.updated_at).days\n"
            
            models_content += "\n"
        
        models_file = output_path / "models_enhanced.py"
        models_file.write_text(models_content)
        print(f"✅ Enhanced 모델 파일 생성: {models_file}")
        
    def write_enhanced_migrations(self):
        """향상된 마이그레이션 파일들 생성"""
        output_dir = Path("migrations_enhanced")
        output_dir.mkdir(exist_ok=True)
        
        # __init__.py 파일 생성
        (output_dir / "__init__.py").write_text("")
        
        migration_number = 1
        for model_name, fields in self.models.items():
            migration_content = f'''# Enhanced migration for {model_name}Enhanced
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='{model_name}Enhanced',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
'''
            
            for field_name, field_type in fields.items():
                migration_content += f"                ('{field_name}', {field_type}),\n"
            
            migration_content += '''            ],
            options={
                'db_table': \'''' + model_name.lower() + '''_enhanced\',
                'verbose_name': \'''' + model_name + ''' (Enhanced)\',
                'verbose_name_plural': \'''' + model_name + '''s (Enhanced)\',
                'ordering': ['-id'],
            },
        ),
'''
            
            # 인덱스 추가
            index_fields = []
            for field_name in fields.keys():
                if any(pattern in field_name.lower() for pattern in ['status', 'type', 'created', 'updated']):
                    index_fields.append(field_name)
            
            if index_fields:
                for field_name in index_fields:
                    migration_content += f'''        migrations.AddIndex(
            model_name='{model_name.lower()}enhanced',
            index=models.Index(fields=['{field_name}'], name='{model_name.lower()}_{field_name}_idx'),
        ),
'''
            
            migration_content += "    ]\n"
            
            migration_file = output_dir / f"{migration_number:04d}_create_{model_name.lower()}_enhanced.py"
            migration_file.write_text(migration_content)
            print(f"✅ Enhanced 마이그레이션 파일 생성: {migration_file}")
            migration_number += 1

def main():
    print("🚀 Enhanced Django 모델 및 마이그레이션 자동 생성 시작")
    print("=" * 70)
    
    generator = EnhancedModelGenerator()
    
    # 입력 파일 확인
    har_file = Path("api_traffic.har")
    openapi_file = Path("openapi.json")
    
    has_input = False
    
    if har_file.exists():
        print("📁 HAR 파일 발견, 분석 시작...")
        if generator.load_har_file(str(har_file)):
            has_input = True
    
    if openapi_file.exists():
        print("📁 OpenAPI 스펙 발견, 분석 시작...")
        if generator.load_openapi_spec(str(openapi_file)):
            has_input = True
    
    if not has_input:
        print("⚠️  HAR 파일이나 OpenAPI 스펙을 찾을 수 없습니다.")
        print("📝 샘플 데이터로 대체하여 진행합니다...")
        
        # 기본 샘플 데이터 사용
        generator.field_analysis = {
            'VideoPlanning': {
                'title': ['models.CharField(max_length=255, null=True, blank=True)'],
                'description': ['models.TextField(null=True, blank=True)'],
                'status': ["models.CharField(max_length=50, null=True, blank=True, help_text='status 상태')"],
                'created_at': ['models.DateTimeField(auto_now_add=True)']
            },
            'Project': {
                'name': ['models.CharField(max_length=255, null=True, blank=True)'],
                'description': ['models.TextField(null=True, blank=True)'],
                'manager': ['models.CharField(max_length=255, null=True, blank=True)'],
                'created_at': ['models.DateTimeField(auto_now_add=True)']
            }
        }
    
    print("🔍 필드 타입 통합 중...")
    generator.consolidate_field_types()
    
    print("📝 Enhanced Django 모델 파일 작성 중...")
    generator.write_enhanced_models_file()
    
    print("📁 Enhanced 마이그레이션 파일 생성 중...")
    generator.write_enhanced_migrations()
    
    print("\n" + "=" * 70)
    print("✅ Enhanced Django 모델 및 마이그레이션 생성 완료!")
    print(f"✅ 총 {len(generator.models)}개의 Enhanced 모델 생성")
    print("📂 생성된 파일들:")
    print("   - app_enhanced/models_enhanced.py")
    print("   - migrations_enhanced/*.py")
    
    # HAR 파일 생성 가이드
    print("\n📋 HAR 파일 생성 가이드:")
    print("1. 브라우저에서 개발자 도구 열기 (F12)")
    print("2. Network 탭으로 이동")
    print("3. 사이트에서 API 요청 발생시키기")
    print("4. Network 탭에서 마우스 우클릭 → 'Save all as HAR with content'")
    print("5. 'api_traffic.har' 이름으로 저장")

if __name__ == "__main__":
    main()