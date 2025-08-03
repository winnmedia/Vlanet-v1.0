#!/usr/bin/env python3
"""
VideoPlanet 포괄적 테스트 스크립트
모든 주요 기능이 오류 없이 작동하는지 확인
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = 'http://localhost:8000/api'

class VideoPlanetTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.project_id = None
        self.planning_id = None
        self.results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'details': []
        }
    
    def log_result(self, test_name, success, error=None):
        self.results['total'] += 1
        if success:
            self.results['passed'] += 1
            print(f"✅ {test_name}: 성공")
        else:
            self.results['failed'] += 1
            print(f"❌ {test_name}: 실패 - {error}")
        
        self.results['details'].append({
            'test': test_name,
            'status': 'PASS' if success else 'FAIL',
            'error': error
        })
    
    def test_login(self):
        """로그인 테스트"""
        try:
            response = requests.post(f'{BASE_URL}/users/login/', 
                json={
                    'email': 'ceo@winnmedia.co.kr',
                    'password': 'Qwerasdf!234'
                }
            )
            
            if response.status_code == 200:
                self.token = response.json().get('vridge_session')
                self.user_id = response.json().get('user_id')
                self.log_result('로그인', True)
                return True
            else:
                self.log_result('로그인', False, response.text)
                return False
        except Exception as e:
            self.log_result('로그인', False, str(e))
            return False
    
    def test_project_creation(self):
        """프로젝트 생성 테스트"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.post(f'{BASE_URL}/projects/create/', 
                headers=headers,
                json={
                    'name': f'테스트 프로젝트 {datetime.now().timestamp()}',
                    'description': '포괄적 테스트용 프로젝트',
                    'manager': '테스트 매니저',
                    'consumer': '테스트 고객',
                    'color': '#1631F8',
                    'process': []
                }
            )
            
            if response.status_code == 200:
                self.project_id = response.json().get('project_id')
                self.log_result('프로젝트 생성', True)
                return True
            else:
                self.log_result('프로젝트 생성', False, response.text)
                return False
        except Exception as e:
            self.log_result('프로젝트 생성', False, str(e))
            return False
    
    def test_ai_planning(self):
        """AI 기획 생성 테스트"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            
            # 1. AI 빠른 제안
            response = requests.post(f'{BASE_URL}/video-planning/ai/quick-suggestions/', 
                headers=headers,
                json={
                    'project_type': 'youtube',
                    'main_topic': '테스트 주제',
                    'target_audience': '20-30대',
                    'duration': '5분'
                }
            )
            
            if response.status_code != 200:
                self.log_result('AI 빠른 제안', False, response.text)
                return False
            
            self.log_result('AI 빠른 제안', True)
            
            # 2. AI 전체 기획 생성
            response = requests.post(f'{BASE_URL}/video-planning/ai/generate-full-planning/', 
                headers=headers,
                json={
                    'projectType': 'youtube',
                    'duration': '5분',
                    'targetAudience': '20-30대',
                    'mainTopic': '포괄적 테스트',
                    'keyMessage': '모든 기능이 정상 작동',
                    'desiredMood': '전문적',
                    'enableProOptions': True,
                    'colorTone': 'natural',
                    'aspectRatio': '16:9',
                    'cameraType': 'dslr',
                    'lensType': '35mm',
                    'cameraMovement': 'static'
                }
            )
            
            if response.status_code != 200:
                self.log_result('AI 전체 기획 생성', False, response.text)
                return False
            
            self.log_result('AI 전체 기획 생성', True)
            return True
            
        except Exception as e:
            self.log_result('AI 기획 생성', False, str(e))
            return False
    
    def test_planning_save(self):
        """기획 저장 테스트"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.post(f'{BASE_URL}/video-planning/save/', 
                headers=headers,
                json={
                    'title': '포괄적 테스트 기획',
                    'planning_text': '테스트 기획 내용',
                    'stories': [
                        {'phase': '기', 'content': '도입부'},
                        {'phase': '승', 'content': '전개부'},
                        {'phase': '전', 'content': '절정부'},
                        {'phase': '결', 'content': '결말부'}
                    ],
                    'scenes': [],
                    'shots': [],
                    'storyboards': []
                }
            )
            
            if response.status_code == 201:
                self.planning_id = response.json()['data']['planning_id']
                self.log_result('기획 저장', True)
                return True
            else:
                self.log_result('기획 저장', False, response.text)
                return False
        except Exception as e:
            self.log_result('기획 저장', False, str(e))
            return False
    
    def test_pdf_export(self):
        """PDF 내보내기 테스트"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.post(f'{BASE_URL}/video-planning/export/pdf/', 
                headers=headers,
                json={
                    'planning_data': {
                        'title': 'PDF 테스트',
                        'planning': '테스트 내용',
                        'stories': [],
                        'scenes': []
                    },
                    'use_enhanced_layout': True
                }
            )
            
            if response.status_code == 200 and len(response.content) > 1000:
                self.log_result('PDF 내보내기', True)
                return True
            else:
                self.log_result('PDF 내보내기', False, f'상태코드: {response.status_code}')
                return False
        except Exception as e:
            self.log_result('PDF 내보내기', False, str(e))
            return False
    
    def test_feedback(self):
        """피드백 테스트"""
        try:
            if not self.project_id:
                self.log_result('피드백 작성', False, '프로젝트 ID 없음')
                return False
            
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.post(f'{BASE_URL}/projects/{self.project_id}/feedback/comments/', 
                headers=headers,
                json={
                    'content': '포괄적 테스트 피드백',
                    'feedback_type': 'comment'
                }
            )
            
            if response.status_code in [200, 201]:
                self.log_result('피드백 작성', True)
                return True
            else:
                self.log_result('피드백 작성', False, response.text)
                return False
        except Exception as e:
            self.log_result('피드백 작성', False, str(e))
            return False
    
    def test_profile_update(self):
        """프로필 업데이트 테스트"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.patch(f'{BASE_URL}/users/profile/update/', 
                headers=headers,
                json={
                    'username': 'CEO테스트'
                }
            )
            
            if response.status_code == 200:
                self.log_result('프로필 업데이트', True)
                return True
            else:
                self.log_result('프로필 업데이트', False, response.text)
                return False
        except Exception as e:
            self.log_result('프로필 업데이트', False, str(e))
            return False
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("=" * 50)
        print("VideoPlanet 포괄적 테스트 시작")
        print("=" * 50)
        
        # 순차적으로 테스트 실행
        if self.test_login():
            self.test_project_creation()
            self.test_ai_planning()
            self.test_planning_save()
            self.test_pdf_export()
            self.test_feedback()
            self.test_profile_update()
        
        # 결과 출력
        print("\n" + "=" * 50)
        print("테스트 결과 요약")
        print("=" * 50)
        print(f"총 테스트: {self.results['total']}")
        print(f"성공: {self.results['passed']}")
        print(f"실패: {self.results['failed']}")
        print(f"성공률: {(self.results['passed'] / self.results['total'] * 100):.1f}%")
        
        if self.results['failed'] > 0:
            print("\n실패한 테스트:")
            for detail in self.results['details']:
                if detail['status'] == 'FAIL':
                    print(f"- {detail['test']}: {detail['error']}")
        
        # 결과 JSON 파일로 저장
        with open('comprehensive_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print("\n테스트 결과가 comprehensive_test_results.json에 저장되었습니다.")

if __name__ == '__main__':
    tester = VideoPlanetTester()
    tester.run_all_tests()