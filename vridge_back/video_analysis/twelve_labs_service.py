import os
import logging
import time
from typing import Dict, List, Optional, Any
from django.conf import settings
from twelvelabs import TwelveLabs
from twelvelabs.models.task import Task

logger = logging.getLogger(__name__)


class TwelveLabsService:
    """
    Twelve Labs API를 사용한 비디오 분석 서비스
    """
    
    def __init__(self):
        api_key = getattr(settings, 'TWELVE_LABS_API_KEY', None) or os.environ.get('TWELVE_LABS_API_KEY')
        if not api_key:
            raise ValueError("TWELVE_LABS_API_KEY not found in settings or environment variables")
        
        self.client = TwelveLabs(api_key=api_key)
        self.default_index_id = None
        
        # 기본 인덱스 설정 또는 생성
        self._ensure_default_index()
    
    def _ensure_default_index(self):
        """기본 인덱스가 있는지 확인하고 없으면 생성"""
        try:
            # 기존 인덱스 목록 조회
            indexes = self.client.index.list()
            
            if indexes and len(indexes) > 0:
                # VideoPlanet 인덱스 찾기
                for index in indexes:
                    if index.name == "videoplanet_videos":
                        self.default_index_id = index.id
                        logger.info(f"Using existing index: {index.name} (ID: {index.id})")
                        return
                
                # VideoPlanet 인덱스가 없으면 첫 번째 인덱스 사용
                self.default_index_id = indexes[0].id
                logger.info(f"Using first available index: {indexes[0].name} (ID: {indexes[0].id})")
            else:
                # 인덱스가 없으면 새로 생성
                self._create_default_index()
                
        except Exception as e:
            logger.error(f"Error checking indexes: {e}")
            # 인덱스 생성 시도
            self._create_default_index()
    
    def _create_default_index(self):
        """기본 인덱스 생성"""
        try:
            index = self.client.index.create(
                name="videoplanet_videos",
                engines=[
                    {
                        "name": "marengo2.6",
                        "options": ["visual", "conversation", "text_in_video", "logo"]
                    }
                ],
                addons=["thumbnail"]  # 썸네일 생성 활성화
            )
            self.default_index_id = index.id
            logger.info(f"Created new index: videoplanet_videos (ID: {index.id})")
        except Exception as e:
            logger.error(f"Failed to create index: {e}")
            raise
    
    def upload_video(self, video_url: str, video_name: str, metadata: Dict = None) -> Dict:
        """
        비디오를 Twelve Labs에 업로드하고 인덱싱
        
        Args:
            video_url: 비디오 URL
            video_name: 비디오 이름
            metadata: 추가 메타데이터
            
        Returns:
            업로드 결과 정보
        """
        try:
            if not self.default_index_id:
                raise ValueError("No default index available")
            
            # 비디오 업로드 태스크 생성
            task = self.client.task.create(
                index_id=self.default_index_id,
                url=video_url,
                name=video_name,
                metadata=metadata or {}
            )
            
            logger.info(f"Video upload task created: {task.id}")
            
            # 태스크 완료 대기
            task_result = self._wait_for_task_completion(task.id)
            
            return {
                "success": True,
                "task_id": task.id,
                "video_id": task_result.video_id if task_result else None,
                "status": task_result.status if task_result else "unknown",
                "metadata": task_result.metadata if task_result else {}
            }
            
        except Exception as e:
            logger.error(f"Failed to upload video: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _wait_for_task_completion(self, task_id: str, timeout: int = 600) -> Optional[Task]:
        """태스크 완료 대기"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                task = self.client.task.retrieve(task_id)
                
                if task.status == "ready":
                    logger.info(f"Task {task_id} completed successfully")
                    return task
                elif task.status == "failed":
                    logger.error(f"Task {task_id} failed")
                    return task
                
                # 진행 상태 로깅
                if hasattr(task, 'progress'):
                    logger.info(f"Task {task_id} progress: {task.progress}%")
                
                time.sleep(5)  # 5초 대기
                
            except Exception as e:
                logger.error(f"Error checking task status: {e}")
                time.sleep(5)
        
        logger.error(f"Task {task_id} timed out after {timeout} seconds")
        return None
    
    def analyze_video(self, video_id: str) -> Dict:
        """
        비디오 분석 수행
        
        Args:
            video_id: Twelve Labs 비디오 ID
            
        Returns:
            분석 결과
        """
        try:
            # 비디오 정보 조회
            video = self.client.video.retrieve(
                index_id=self.default_index_id,
                id=video_id
            )
            
            # 비디오 요약 생성
            summary = self._generate_summary(video_id)
            
            # 주요 순간 추출
            key_moments = self._extract_key_moments(video_id)
            
            # 텍스트 추출 (OCR)
            text_in_video = self._extract_text_in_video(video_id)
            
            # 대화 분석
            conversations = self._analyze_conversations(video_id)
            
            return {
                "success": True,
                "video_info": {
                    "id": video.id,
                    "name": video.metadata.get("name", ""),
                    "duration": video.metadata.get("duration", 0),
                    "fps": video.metadata.get("fps", 0),
                    "width": video.metadata.get("width", 0),
                    "height": video.metadata.get("height", 0)
                },
                "analysis": {
                    "summary": summary,
                    "key_moments": key_moments,
                    "text_in_video": text_in_video,
                    "conversations": conversations
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to analyze video: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_summary(self, video_id: str) -> Dict:
        """비디오 요약 생성"""
        try:
            response = self.client.generate.summarize(
                video_id=video_id,
                type="summary"
            )
            
            return {
                "text": response.summary,
                "chapters": response.chapters if hasattr(response, 'chapters') else []
            }
        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            return {"text": "", "chapters": []}
    
    def _extract_key_moments(self, video_id: str, limit: int = 10) -> List[Dict]:
        """주요 순간 추출"""
        try:
            # 시각적으로 중요한 순간 검색
            response = self.client.search.query(
                index_id=self.default_index_id,
                query="important moments key scenes highlights",
                options=["visual"],
                filter={"video_id": [video_id]},
                page_limit=limit
            )
            
            moments = []
            for result in response.data:
                moments.append({
                    "start_time": result.start,
                    "end_time": result.end,
                    "confidence": result.confidence,
                    "thumbnail_url": result.thumbnail_url if hasattr(result, 'thumbnail_url') else None
                })
            
            return moments
            
        except Exception as e:
            logger.error(f"Failed to extract key moments: {e}")
            return []
    
    def _extract_text_in_video(self, video_id: str) -> List[Dict]:
        """비디오 내 텍스트 추출 (OCR)"""
        try:
            response = self.client.search.query(
                index_id=self.default_index_id,
                query="text",
                options=["text_in_video"],
                filter={"video_id": [video_id]},
                page_limit=20
            )
            
            texts = []
            for result in response.data:
                if hasattr(result, 'text'):
                    texts.append({
                        "text": result.text,
                        "start_time": result.start,
                        "end_time": result.end,
                        "confidence": result.confidence
                    })
            
            return texts
            
        except Exception as e:
            logger.error(f"Failed to extract text: {e}")
            return []
    
    def _analyze_conversations(self, video_id: str) -> List[Dict]:
        """대화 분석"""
        try:
            response = self.client.search.query(
                index_id=self.default_index_id,
                query="conversation dialogue speech",
                options=["conversation"],
                filter={"video_id": [video_id]},
                page_limit=50
            )
            
            conversations = []
            for result in response.data:
                if hasattr(result, 'transcript'):
                    conversations.append({
                        "transcript": result.transcript,
                        "start_time": result.start,
                        "end_time": result.end,
                        "speaker": result.speaker if hasattr(result, 'speaker') else None
                    })
            
            return conversations
            
        except Exception as e:
            logger.error(f"Failed to analyze conversations: {e}")
            return []
    
    def search_in_videos(self, query: str, options: List[str] = None, limit: int = 10) -> List[Dict]:
        """
        비디오 내용 검색
        
        Args:
            query: 검색 쿼리
            options: 검색 옵션 ["visual", "conversation", "text_in_video", "logo"]
            limit: 결과 개수 제한
            
        Returns:
            검색 결과 목록
        """
        try:
            if not options:
                options = ["visual", "conversation", "text_in_video"]
            
            response = self.client.search.query(
                index_id=self.default_index_id,
                query=query,
                options=options,
                page_limit=limit
            )
            
            results = []
            for result in response.data:
                results.append({
                    "video_id": result.video_id,
                    "start_time": result.start,
                    "end_time": result.end,
                    "confidence": result.confidence,
                    "thumbnail_url": result.thumbnail_url if hasattr(result, 'thumbnail_url') else None,
                    "metadata": result.metadata if hasattr(result, 'metadata') else {}
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search videos: {e}")
            return []
    
    def delete_video(self, video_id: str) -> bool:
        """비디오 삭제"""
        try:
            self.client.video.delete(
                index_id=self.default_index_id,
                id=video_id
            )
            logger.info(f"Video {video_id} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to delete video: {e}")
            return False