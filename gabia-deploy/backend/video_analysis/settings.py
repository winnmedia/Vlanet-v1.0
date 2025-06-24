"""
Twelve Labs API 설정
"""
from django.conf import settings

# Twelve Labs API 설정
TWELVE_LABS_API_KEY = getattr(settings, 'TWELVE_LABS_API_KEY', '')
TWELVE_LABS_INDEX_ID = getattr(settings, 'TWELVE_LABS_INDEX_ID', '')

# API 엔드포인트
TWELVE_LABS_BASE_URL = 'https://api.twelvelabs.io/v1.2'

# 지원하는 비디오 형식
SUPPORTED_VIDEO_FORMATS = [
    'mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp'
]

# 최대 파일 크기 (바이트)
MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024  # 2GB

# 최대 비디오 길이 (초)
MAX_VIDEO_DURATION = 3600  # 1시간

# API 타임아웃 설정
API_TIMEOUT = {
    'upload': 600,      # 10분
    'generate': 300,    # 5분
    'classify': 120,    # 2분
    'search': 60        # 1분
}

# 분석 옵션
ANALYSIS_OPTIONS = {
    'generate_summary': True,
    'classify_content': True,
    'analyze_scenes': True,
    'extract_thumbnails': False,
    'transcribe_audio': True
}

# 프롬프트 템플릿
PROMPTS = {
    'summary': """
이 영상을 영상 제작 전문가 관점에서 분석해주세요. 다음 요소들을 포함해서 한국어로 설명해주세요:

1. 구도 (Composition): 화면 구성, 피사체 배치, 삼분할 법칙 적용 여부
2. 조명 (Lighting): 조명의 방향, 밝기, 자연스러움
3. 색감 (Color): 색온도, 채도, 전체적인 색감
4. 움직임 (Movement): 카메라 워크, 피사체 움직임, 안정성
5. 음성 (Audio): 음성 품질, 배경음악, 노이즈 레벨
6. 편집 (Editing): 장면 전환, 템포, 리듬감

각 요소별로 점수(1-10)와 개선점을 제안해주세요.
""",
    
    'quality_analysis': """
이 영상의 기술적 품질을 평가해주세요:
- 해상도와 선명도
- 프레임레이트와 부드러움  
- 노출과 화이트밸런스
- 오디오 품질
- 전체적인 완성도
""",

    'improvement_suggestions': """
이 영상을 더욱 개선하기 위한 구체적인 조언을 3-5개 항목으로 제시해주세요.
초보자도 이해할 수 있도록 쉽게 설명해주세요.
"""
}

# 검색 쿼리 (장면 분석용)
SCENE_ANALYSIS_QUERIES = [
    # 구도 관련
    "클로즈업 샷",
    "미디엄 샷", 
    "와이드 샷",
    "오버숄더 샷",
    
    # 조명 관련
    "밝은 장면",
    "어두운 장면",
    "백라이트 장면",
    "자연광 장면",
    
    # 움직임 관련
    "정적인 장면",
    "역동적인 장면",
    "카메라 팬 움직임",
    "줌인/줌아웃",
    
    # 감정/분위기
    "행복한 분위기",
    "진지한 분위기",
    "활기찬 장면",
    "차분한 장면"
]

# 콘텐츠 분류 옵션
CONTENT_CATEGORIES = [
    "교육/강의",
    "엔터테인먼트",
    "뉴스/시사",
    "스포츠",
    "음악/공연",
    "게임/e스포츠",
    "요리/푸드",
    "여행/브이로그",
    "제품 리뷰",
    "인터뷰/토크",
    "기타"
]

# 점수 계산 가중치
SCORING_WEIGHTS = {
    'composition': 0.2,    # 구도 20%
    'lighting': 0.2,       # 조명 20%
    'audio': 0.15,         # 음성 15%
    'stability': 0.15,     # 안정성 15%
    'color': 0.15,         # 색감 15%
    'editing': 0.15        # 편집 15%
}

# 에러 메시지
ERROR_MESSAGES = {
    'api_key_missing': 'Twelve Labs API 키가 설정되지 않았습니다.',
    'index_id_missing': 'Twelve Labs Index ID가 설정되지 않았습니다.',
    'upload_failed': '영상 업로드에 실패했습니다.',
    'analysis_failed': '영상 분석에 실패했습니다.',
    'file_too_large': f'파일 크기가 {MAX_VIDEO_SIZE // (1024*1024)}MB를 초과합니다.',
    'unsupported_format': f'지원하지 않는 파일 형식입니다. 지원 형식: {", ".join(SUPPORTED_VIDEO_FORMATS)}',
    'video_too_long': f'영상 길이가 {MAX_VIDEO_DURATION // 60}분을 초과합니다.'
}