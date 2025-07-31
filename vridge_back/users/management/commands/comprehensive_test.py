"""
VideoPlanet 포괄적 시스템 테스트 명령어
모든 주요 기능을 검증합니다.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from django.test import Client, override_settings
from django.urls import reverse
from django.db import transaction
from users.models import User
from projects.models import Project
import json
import time
from datetime import datetime

class Command(BaseCommand):
    help = 'VideoPlanet 시스템의 모든 주요 기능을 포괄적으로 테스트합니다'

    def __init__(self):
        super().__init__()
        self.client = Client()
        self.test_results = {
            'auth': {'passed': [], 'failed': []},
            'project': {'passed': [], 'failed': []},
            'feedback': {'passed': [], 'failed': []},
            'planning': {'passed': [], 'failed': []},
            'navigation': {'passed': [], 'failed': []},
            'general': {'passed': [], 'failed': []}
        }
        self.start_time = time.time()
        
    def add_result(self, category, test_name, passed, details=''):
        result = {
            'test': test_name,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        
        if passed:
            self.test_results[category]['passed'].append(result)
            status = '✅'
        else:
            self.test_results[category]['failed'].append(result)
            status = '❌'
            
        self.stdout.write(f"{status} [{category.upper()}] {test_name}: {details}")

    def test_authentication_system(self):
        """인증 시스템 테스트"""
        self.stdout.write(self.style.SUCCESS('\n🔐 1. 인증 시스템 테스트'))
        
        # 사용자 존재 확인
        try:
            user = User.objects.get(email='test@example.com')
            self.add_result('auth', '테스트 사용자 존재 확인', True, f'사용자: {user.email}')
        except User.DoesNotExist:
            self.add_result('auth', '테스트 사용자 존재 확인', False, '테스트 사용자가 없음')
            return
        
        # 비밀번호 확인
        if user.check_password('testpassword'):
            self.add_result('auth', '사용자 비밀번호 검증', True, '비밀번호 일치')
        else:
            self.add_result('auth', '사용자 비밀번호 검증', False, '비밀번호 불일치')
        
        # Django 인증 테스트
        auth_user = authenticate(email='test@example.com', password='testpassword')
        if auth_user:
            self.add_result('auth', 'Django 인증 시스템', True, f'인증 성공: {auth_user.email}')
        else:
            self.add_result('auth', 'Django 인증 시스템', False, '인증 실패')
        
        # API 로그인 테스트
        login_data = {
            'email': 'test@example.com',
            'password': 'testpassword'
        }
        
        try:
            response = self.client.post('/api/users/login/',
                                      data=json.dumps(login_data),
                                      content_type='application/json')
            
            if response.status_code == 200:
                response_data = response.json()
                if 'access' in response_data:
                    self.access_token = response_data['access']
                    self.add_result('auth', 'API 로그인', True, f'액세스 토큰 획득: {len(self.access_token)}자')
                elif 'vridge_session' in response_data:
                    self.access_token = response_data['vridge_session']
                    self.add_result('auth', 'API 로그인', True, f'세션 토큰 획득: {len(self.access_token)}자')
                else:
                    self.add_result('auth', 'API 로그인', False, f'토큰 없음: {response_data}')
            else:
                self.add_result('auth', 'API 로그인', False, f'상태 코드: {response.status_code}, 응답: {response.content}')
        except Exception as e:
            self.add_result('auth', 'API 로그인', False, f'예외 발생: {str(e)}')

    def test_project_management(self):
        """프로젝트 관리 테스트"""
        self.stdout.write(self.style.SUCCESS('\n📂 2. 프로젝트 관리 테스트'))
        
        if not hasattr(self, 'access_token'):
            self.add_result('project', '프로젝트 관리 전체', False, '인증 토큰이 없어 테스트 불가')
            return
        
        headers = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
        
        # 프로젝트 목록 조회
        try:
            response = self.client.get('/api/projects/', **headers)
            if response.status_code == 200:
                data = response.json()
                project_count = len(data.get('results', data)) if isinstance(data, dict) else len(data)
                self.add_result('project', '프로젝트 목록 조회', True, f'{project_count}개 프로젝트 조회')
            else:
                self.add_result('project', '프로젝트 목록 조회', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('project', '프로젝트 목록 조회', False, f'예외: {str(e)}')
        
        # 프로젝트 생성 테스트
        project_data = {
            'name': f'시스템 테스트 프로젝트 {int(time.time())}',
            'manager': '테스트 매니저',
            'consumer': '테스트 클라이언트',
            'description': '시스템 테스트용 프로젝트',
            'color': '#1631F8',
            'process_data': [{
                'name': '기획',
                'startDate': datetime.now().isoformat(),
                'endDate': datetime.now().isoformat()
            }]
        }
        
        try:
            response = self.client.post('/api/projects/create/',
                                      data=json.dumps(project_data),
                                      content_type='application/json',
                                      **headers)
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.add_result('project', '프로젝트 생성', True, f'프로젝트 생성 성공: {data.get("project_id", "ID 불명")}')
            else:
                self.add_result('project', '프로젝트 생성', False, f'상태: {response.status_code}, 응답: {response.content}')
        except Exception as e:
            self.add_result('project', '프로젝트 생성', False, f'예외: {str(e)}')
        
        # 프로젝트 프레임워크 조회
        try:
            response = self.client.get('/api/projects/frameworks/', **headers)
            if response.status_code == 200:
                data = response.json()
                framework_count = len(data) if isinstance(data, list) else len(data.keys())
                self.add_result('project', '프로젝트 프레임워크', True, f'{framework_count}개 프레임워크 사용 가능')
            else:
                self.add_result('project', '프로젝트 프레임워크', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('project', '프로젝트 프레임워크', False, f'예외: {str(e)}')

    def test_user_management(self):
        """사용자 관리 테스트"""
        self.stdout.write(self.style.SUCCESS('\n👥 3. 사용자 관리 테스트'))
        
        if not hasattr(self, 'access_token'):
            self.add_result('navigation', '사용자 관리 전체', False, '인증 토큰이 없어 테스트 불가')
            return
        
        headers = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
        
        # 사용자 정보 조회
        try:
            response = self.client.get('/api/users/me/', **headers)
            if response.status_code == 200:
                data = response.json()
                self.add_result('navigation', '사용자 정보 조회', True, f"사용자: {data.get('nickname', data.get('email'))}")
            else:
                self.add_result('navigation', '사용자 정보 조회', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('navigation', '사용자 정보 조회', False, f'예외: {str(e)}')
        
        # 알림 시스템
        try:
            response = self.client.get('/api/users/notifications/', **headers)
            if response.status_code == 200:
                data = response.json()
                notification_count = len(data) if isinstance(data, list) else 0
                self.add_result('navigation', '알림 시스템', True, f'{notification_count}개 알림')
            else:
                self.add_result('navigation', '알림 시스템', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('navigation', '알림 시스템', False, f'예외: {str(e)}')
        
        # 마이페이지
        try:
            response = self.client.get('/api/users/mypage/', **headers)
            if response.status_code == 200:
                self.add_result('navigation', '마이페이지', True, '마이페이지 정보 로드 성공')
            else:
                self.add_result('navigation', '마이페이지', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('navigation', '마이페이지', False, f'예외: {str(e)}')

    def test_feedback_system(self):
        """피드백 시스템 테스트"""
        self.stdout.write(self.style.SUCCESS('\n💬 4. 피드백 시스템 테스트'))
        
        if not hasattr(self, 'access_token'):
            self.add_result('feedback', '피드백 시스템 전체', False, '인증 토큰이 없어 테스트 불가')
            return
        
        headers = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
        
        # 특정 프로젝트의 피드백 조회 (프로젝트 ID 1 사용)
        try:
            response = self.client.get('/api/projects/1/feedback/', **headers)
            if response.status_code == 200:
                data = response.json()
                feedback_count = len(data.get('results', data)) if isinstance(data, dict) else len(data)
                self.add_result('feedback', '프로젝트 피드백 조회', True, f'{feedback_count}개 피드백')
            else:
                self.add_result('feedback', '프로젝트 피드백 조회', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('feedback', '프로젝트 피드백 조회', False, f'예외: {str(e)}')

    def test_video_planning(self):
        """영상 기획 테스트"""
        self.stdout.write(self.style.SUCCESS('\n🎬 5. 영상 기획 테스트'))
        
        if not hasattr(self, 'access_token'):
            self.add_result('planning', '영상 기획 전체', False, '인증 토큰이 없어 테스트 불가')
            return
        
        headers = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
        
        # 영상 기획 목록 조회
        try:
            response = self.client.get('/api/video-planning/', **headers)
            if response.status_code == 200:
                data = response.json()
                planning_count = len(data) if isinstance(data, list) else 0
                self.add_result('planning', '영상 기획 목록', True, f'{planning_count}개 기획 데이터')
            else:
                self.add_result('planning', '영상 기획 목록', False, f'상태: {response.status_code}')
        except Exception as e:
            self.add_result('planning', '영상 기획 목록', False, f'예외: {str(e)}')

    def test_api_health(self):
        """API 헬스체크 테스트"""
        self.stdout.write(self.style.SUCCESS('\n🔍 6. API 상태 테스트'))
        
        # 기본 헬스체크
        try:
            response = self.client.get('/api/health/')
            if response.status_code == 200:
                data = response.json()
                self.add_result('general', 'API 헬스체크', True, f"상태: {data.get('status', 'unknown')}")
            else:
                self.add_result('general', 'API 헬스체크', False, f'상태 코드: {response.status_code}')
        except Exception as e:
            self.add_result('general', 'API 헬스체크', False, f'예외: {str(e)}')
        
        # 데이터베이스 상태 확인
        try:
            user_count = User.objects.count()
            project_count = Project.objects.count()
            self.add_result('general', '데이터베이스 상태', True, f'사용자: {user_count}명, 프로젝트: {project_count}개')
        except Exception as e:
            self.add_result('general', '데이터베이스 상태', False, f'DB 오류: {str(e)}')

    def generate_report(self):
        """최종 보고서 생성"""
        end_time = time.time()
        duration = round(end_time - self.start_time, 2)
        
        total_passed = sum(len(cat['passed']) for cat in self.test_results.values())
        total_failed = sum(len(cat['failed']) for cat in self.test_results.values())
        total_tests = total_passed + total_failed
        success_rate = round((total_passed / total_tests * 100), 1) if total_tests > 0 else 0
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📊 포괄적 시스템 테스트 결과'))
        self.stdout.write('='*60)
        self.stdout.write(f'테스트 일시: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'총 테스트: {total_tests}개')
        self.stdout.write(f'성공: {total_passed}개')
        self.stdout.write(f'실패: {total_failed}개')
        self.stdout.write(f'성공률: {success_rate}%')
        self.stdout.write(f'소요 시간: {duration}초')
        self.stdout.write('='*60)
        
        # 카테고리별 결과
        for category, results in self.test_results.items():
            passed_count = len(results['passed'])
            failed_count = len(results['failed'])
            total_cat = passed_count + failed_count
            
            if total_cat > 0:
                cat_rate = round((passed_count / total_cat * 100), 1)
                self.stdout.write(f'\n🔍 {category.upper()}: {passed_count}/{total_cat} ({cat_rate}%)')
                
                for test in results['passed']:
                    self.stdout.write(f'  ✅ {test["test"]}: {test["details"]}')
                
                for test in results['failed']:
                    self.stdout.write(self.style.ERROR(f'  ❌ {test["test"]}: {test["details"]}'))
        
        # 결론
        if success_rate >= 95:
            conclusion = '🌟 우수: 시스템이 완벽하게 작동하고 있습니다!'
        elif success_rate >= 85:
            conclusion = '✅ 양호: 대부분의 기능이 정상 작동하지만 일부 개선이 필요합니다.'
        elif success_rate >= 70:
            conclusion = '⚠️ 보통: 주요 기능은 작동하지만 여러 문제가 있어 개선이 필요합니다.'
        else:
            conclusion = '🚨 문제: 시스템에 심각한 문제가 있어 즉시 수정이 필요합니다.'
        
        self.stdout.write(f'\n🎯 종합 평가: {conclusion}')
        
        return {
            'success_rate': success_rate,
            'total_tests': total_tests,
            'total_passed': total_passed,
            'total_failed': total_failed,
            'duration': duration,
            'results': self.test_results
        }

    @override_settings(ALLOWED_HOSTS=['*'])
    def handle(self, *args, **options):
        """명령어 실행"""
        self.stdout.write(self.style.SUCCESS('🚀 VideoPlanet 포괄적 시스템 테스트 시작'))
        self.stdout.write('='*60)
        
        try:
            # 모든 테스트 실행
            self.test_authentication_system()
            self.test_project_management()
            self.test_user_management()
            self.test_feedback_system()
            self.test_video_planning() 
            self.test_api_health()
            
            # 최종 보고서 생성
            report = self.generate_report()
            
            self.stdout.write(f'\n🎉 모든 테스트 완료!')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'테스트 실행 중 오류 발생: {str(e)}'))
            raise