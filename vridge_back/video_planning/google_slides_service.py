import os
import json
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import requests
from io import BytesIO

logger = logging.getLogger(__name__)


class GoogleSlidesService:
    """Google Slides API를 사용하여 프레젠테이션을 생성하는 서비스"""
    
    def __init__(self):
        self.credentials = None
        self.service = None
        self.drive_service = None
        self.initialize_service()
    
    def initialize_service(self):
        """Google API 서비스 초기화"""
        try:
            # 서비스 계정 인증 정보 로드
            credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            if not credentials_path:
                logger.warning("GOOGLE_APPLICATION_CREDENTIALS 환경변수가 설정되지 않았습니다.")
                # 개발 환경에서의 임시 처리
                logger.info("Google Slides 서비스가 비활성화됩니다.")
                return
            
            # 파일 존재 여부 확인
            if not os.path.exists(credentials_path):
                logger.error(f"서비스 계정 키 파일을 찾을 수 없습니다: {credentials_path}")
                return
            
            self.credentials = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=[
                    'https://www.googleapis.com/auth/presentations',
                    'https://www.googleapis.com/auth/drive'
                ]
            )
            
            self.service = build('slides', 'v1', credentials=self.credentials)
            self.drive_service = build('drive', 'v3', credentials=self.credentials)
            logger.info("Google Slides 서비스가 성공적으로 초기화되었습니다.")
            
        except Exception as e:
            logger.error(f"Google API 서비스 초기화 실패: {str(e)}", exc_info=True)
    
    def create_presentation(self, title, planning_data):
        """비디오 기획안을 기반으로 Google Slides 프레젠테이션 생성"""
        if not self.service:
            error_msg = 'Google Slides 서비스가 초기화되지 않았습니다. '
            error_msg += 'Railway 환경에서 GOOGLE_APPLICATION_CREDENTIALS 환경변수와 서비스 계정 키 파일을 설정해주세요.'
            logger.error(error_msg)
            return {'error': error_msg}
        
        try:
            # 1. 새 프레젠테이션 생성
            presentation = self.service.presentations().create(body={
                'title': title
            }).execute()
            
            presentation_id = presentation.get('presentationId')
            
            # 2. 슬라이드 추가 요청 준비
            requests = []
            
            # 타이틀 슬라이드
            requests.extend(self._create_title_slide(planning_data))
            
            # 기획 개요 슬라이드
            requests.extend(self._create_overview_slide(planning_data))
            
            # 스토리 구성 슬라이드 (기승전결)
            requests.extend(self._create_story_slides(planning_data))
            
            # 씬별 상세 슬라이드
            requests.extend(self._create_scene_slides(planning_data))
            
            # 3. 모든 요청 일괄 실행
            if requests:
                self.service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={'requests': requests}
                ).execute()
            
            # 4. 공유 설정 (선택적)
            self._set_sharing_permissions(presentation_id)
            
            return {
                'presentation_id': presentation_id,
                'url': f'https://docs.google.com/presentation/d/{presentation_id}/edit'
            }
            
        except HttpError as error:
            logger.error(f"Google Slides API 오류: {error}")
            return {'error': str(error)}
        except Exception as e:
            logger.error(f"프레젠테이션 생성 중 오류: {str(e)}")
            return {'error': str(e)}
    
    def _create_title_slide(self, planning_data):
        """타이틀 슬라이드 생성"""
        requests = []
        
        # 새 슬라이드 추가
        slide_id = 'title_slide'
        requests.append({
            'createSlide': {
                'objectId': slide_id,
                'slideLayoutReference': {
                    'predefinedLayout': 'TITLE'
                }
            }
        })
        
        # 제목 텍스트 설정
        title = planning_data.get('title', '영상 기획안')
        subtitle = f"장르: {planning_data.get('genre', 'N/A')} | 타겟: {planning_data.get('target', 'N/A')}"
        
        requests.extend([
            {
                'insertText': {
                    'objectId': f'{slide_id}_title',
                    'text': title
                }
            },
            {
                'insertText': {
                    'objectId': f'{slide_id}_subtitle',
                    'text': subtitle
                }
            }
        ])
        
        return requests
    
    def _create_overview_slide(self, planning_data):
        """기획 개요 슬라이드 생성"""
        requests = []
        
        slide_id = 'overview_slide'
        requests.append({
            'createSlide': {
                'objectId': slide_id,
                'slideLayoutReference': {
                    'predefinedLayout': 'TITLE_AND_BODY'
                }
            }
        })
        
        # 개요 내용 구성
        overview_text = f"""기획 개요
        
• 톤앤매너: {planning_data.get('tone', 'N/A')}
• 장르: {planning_data.get('genre', 'N/A')}
• 콘셉트: {planning_data.get('concept', 'N/A')}
• 타겟: {planning_data.get('target', 'N/A')}
• 목적: {planning_data.get('purpose', 'N/A')}
• 러닝타임: {planning_data.get('duration', 'N/A')}

기획 의도:
{planning_data.get('planning_text', '')}"""
        
        requests.extend([
            {
                'insertText': {
                    'objectId': f'{slide_id}_title',
                    'text': '기획 개요'
                }
            },
            {
                'insertText': {
                    'objectId': f'{slide_id}_body',
                    'text': overview_text
                }
            }
        ])
        
        return requests
    
    def _create_story_slides(self, planning_data):
        """스토리 구성 슬라이드 생성"""
        requests = []
        stories = planning_data.get('stories', [])
        
        for idx, story in enumerate(stories):
            slide_id = f'story_slide_{idx}'
            requests.append({
                'createSlide': {
                    'objectId': slide_id,
                    'slideLayoutReference': {
                        'predefinedLayout': 'TITLE_AND_TWO_COLUMNS'
                    }
                }
            })
            
            story_phase = ['기', '승', '전', '결'][idx] if idx < 4 else f'스토리 {idx+1}'
            
            requests.extend([
                {
                    'insertText': {
                        'objectId': f'{slide_id}_title',
                        'text': f'{story_phase} - {story.get("phase", "")}'
                    }
                },
                {
                    'insertText': {
                        'objectId': f'{slide_id}_body1',
                        'text': story.get('content', '')
                    }
                },
                {
                    'insertText': {
                        'objectId': f'{slide_id}_body2',
                        'text': f"핵심 포인트:\n{story.get('key_point', '')}"
                    }
                }
            ])
        
        return requests
    
    def _create_scene_slides(self, planning_data):
        """씬별 상세 슬라이드 생성"""
        requests = []
        scenes = planning_data.get('scenes', [])
        
        for idx, scene in enumerate(scenes):
            slide_id = f'scene_slide_{idx}'
            
            # 이미지가 있는 경우 이미지 레이아웃 사용
            if scene.get('storyboard', {}).get('image_url'):
                requests.extend(self._create_scene_slide_with_image(slide_id, scene, idx))
            else:
                requests.extend(self._create_scene_slide_text_only(slide_id, scene, idx))
        
        return requests
    
    def _create_scene_slide_with_image(self, slide_id, scene, idx):
        """이미지가 포함된 씬 슬라이드 생성"""
        requests = []
        
        # 슬라이드 생성
        requests.append({
            'createSlide': {
                'objectId': slide_id,
                'slideLayoutReference': {
                    'predefinedLayout': 'CAPTION_ONLY'
                }
            }
        })
        
        # 제목 추가
        requests.append({
            'insertText': {
                'objectId': f'{slide_id}_title',
                'text': f'씬 {idx + 1}: {scene.get("title", "")}'
            }
        })
        
        # 이미지 추가
        image_url = scene.get('storyboard', {}).get('image_url')
        if image_url:
            # 이미지를 Google Drive에 업로드하고 Slides에 삽입
            image_id = f'{slide_id}_image'
            requests.append({
                'createImage': {
                    'objectId': image_id,
                    'url': image_url,
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {
                            'width': {'magnitude': 400, 'unit': 'PT'},
                            'height': {'magnitude': 300, 'unit': 'PT'}
                        },
                        'transform': {
                            'scaleX': 1,
                            'scaleY': 1,
                            'translateX': 50,
                            'translateY': 100,
                            'unit': 'PT'
                        }
                    }
                }
            })
        
        # 설명 텍스트 추가
        description = scene.get('storyboard', {}).get('description_kr', scene.get('description', ''))
        if description:
            text_id = f'{slide_id}_text'
            requests.append({
                'createTextBox': {
                    'objectId': text_id,
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {
                            'width': {'magnitude': 600, 'unit': 'PT'},
                            'height': {'magnitude': 100, 'unit': 'PT'}
                        },
                        'transform': {
                            'scaleX': 1,
                            'scaleY': 1,
                            'translateX': 50,
                            'translateY': 420,
                            'unit': 'PT'
                        }
                    }
                }
            })
            
            requests.append({
                'insertText': {
                    'objectId': text_id,
                    'text': description
                }
            })
        
        return requests
    
    def _create_scene_slide_text_only(self, slide_id, scene, idx):
        """텍스트만 있는 씬 슬라이드 생성"""
        requests = []
        
        requests.append({
            'createSlide': {
                'objectId': slide_id,
                'slideLayoutReference': {
                    'predefinedLayout': 'TITLE_AND_BODY'
                }
            }
        })
        
        requests.extend([
            {
                'insertText': {
                    'objectId': f'{slide_id}_title',
                    'text': f'씬 {idx + 1}: {scene.get("title", "")}'
                }
            },
            {
                'insertText': {
                    'objectId': f'{slide_id}_body',
                    'text': scene.get('description', '')
                }
            }
        ])
        
        return requests
    
    def _set_sharing_permissions(self, presentation_id):
        """프레젠테이션 공유 권한 설정"""
        try:
            # 링크를 통한 읽기 권한 부여
            self.drive_service.permissions().create(
                fileId=presentation_id,
                body={
                    'type': 'anyone',
                    'role': 'reader'
                }
            ).execute()
        except Exception as e:
            logger.error(f"공유 권한 설정 실패: {str(e)}")