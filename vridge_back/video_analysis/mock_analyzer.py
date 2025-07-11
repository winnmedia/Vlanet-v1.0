"""
개발 환경용 Mock Video Analyzer
실제 API 없이도 개발/테스트 가능
"""
import logging
from typing import Dict, List, Optional
import random

logger = logging.getLogger(__name__)


class MockVideoAnalyzer:
    """개발 환경용 Mock 비디오 분석기"""
    
    def __init__(self):
        logger.info("Mock Video Analyzer initialized")
        self.api_key = "mock_api_key"
    
    async def analyze_video(self, video_path: str, analysis_type: str = "comprehensive") -> Dict:
        """Mock 비디오 분석"""
        logger.info(f"Mock analyzing video: {video_path} with type: {analysis_type}")
        
        return {
            "status": "completed",
            "analysis_type": analysis_type,
            "duration": 120.5,
            "results": {
                "technical_quality": {
                    "overall_score": 85,
                    "video_quality": 90,
                    "audio_quality": 80,
                    "stability": 85
                },
                "content_analysis": {
                    "scene_count": 15,
                    "dominant_colors": ["blue", "white", "gray"],
                    "detected_objects": ["person", "computer", "desk"],
                    "mood": "professional"
                },
                "suggestions": [
                    "조명을 더 밝게 조정하면 좋겠습니다.",
                    "배경 음악 볼륨을 약간 낮추면 대화가 더 잘 들릴 것 같습니다.",
                    "카메라 각도를 조금 더 높이면 더 나은 구도가 될 것 같습니다."
                ]
            }
        }
    
    def get_analysis_status(self, task_id: str) -> Dict:
        """Mock 분석 상태 확인"""
        return {
            "task_id": task_id,
            "status": "completed",
            "progress": 100
        }
    
    def create_index(self, index_name: str) -> Dict:
        """Mock 인덱스 생성"""
        return {
            "index_id": f"mock_index_{index_name}",
            "status": "created"
        }
    
    def upload_video(self, index_id: str, video_path: str) -> Dict:
        """Mock 비디오 업로드"""
        return {
            "video_id": f"mock_video_{random.randint(1000, 9999)}",
            "status": "uploaded",
            "duration": 120.5
        }
    
    def search_in_video(self, index_id: str, query: str) -> List[Dict]:
        """Mock 비디오 내 검색"""
        return [
            {
                "timestamp": 10.5,
                "confidence": 0.95,
                "text": f"Found '{query}' in the video",
                "context": "This is a mock search result"
            }
        ]
    
    def generate_summary(self, video_id: str) -> str:
        """Mock 비디오 요약 생성"""
        return "이것은 테스트용 비디오 요약입니다. 실제 환경에서는 AI가 비디오 내용을 분석하여 자동으로 요약을 생성합니다."
    
    def extract_highlights(self, video_id: str, num_highlights: int = 3) -> List[Dict]:
        """Mock 하이라이트 추출"""
        return [
            {
                "start_time": i * 30,
                "end_time": (i + 1) * 30,
                "confidence": 0.9 - i * 0.1,
                "description": f"하이라이트 장면 {i + 1}"
            }
            for i in range(num_highlights)
        ]