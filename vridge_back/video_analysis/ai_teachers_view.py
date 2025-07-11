"""
AI 선생님 관련 뷰
"""
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


# AI 선생님 정의
AI_TEACHERS = [
    {
        "id": 1,
        "name": "김기술 선생님",
        "type": "technical",
        "specialties": ["촬영 기법", "조명", "카메라 설정", "영상 품질"],
        "description": "영상의 기술적 완성도를 분석하고 개선 방안을 제시합니다.",
        "avatar": "👨‍🏫"
    },
    {
        "id": 2,
        "name": "박창의 선생님",
        "type": "creative",
        "specialties": ["스토리텔링", "연출", "구성", "창의성"],
        "description": "영상의 창의적 요소와 스토리텔링을 평가하고 조언합니다.",
        "avatar": "👩‍🎨"
    },
    {
        "id": 3,
        "name": "이편집 선생님",
        "type": "editing",
        "specialties": ["편집 리듬", "전환 효과", "색보정", "사운드 디자인"],
        "description": "편집 기술과 후반 작업의 완성도를 분석합니다.",
        "avatar": "👨‍💻"
    },
    {
        "id": 4,
        "name": "최마케팅 선생님",
        "type": "marketing",
        "specialties": ["타겟 분석", "메시지 전달", "브랜딩", "CTA"],
        "description": "마케팅 관점에서 영상의 효과성을 평가합니다.",
        "avatar": "👩‍💼"
    }
]


@method_decorator(csrf_exempt, name='dispatch')
class AITeachersListView(View):
    """AI 선생님 목록 조회"""
    
    def get(self, request):
        return JsonResponse({
            "status": "success",
            "teachers": AI_TEACHERS,
            "total": len(AI_TEACHERS)
        })
    
    def post(self, request):
        """특정 AI 선생님으로 분석 요청"""
        import json
        
        try:
            data = json.loads(request.body)
            teacher_id = data.get('teacher_id')
            video_id = data.get('video_id')
            
            # 선택된 AI 선생님 찾기
            teacher = next((t for t in AI_TEACHERS if t['id'] == teacher_id), None)
            if not teacher:
                return JsonResponse({
                    "status": "error",
                    "message": "선택한 AI 선생님을 찾을 수 없습니다."
                }, status=404)
            
            # TODO: 실제 AI 분석 로직 구현
            # 현재는 Mock 응답 반환
            return JsonResponse({
                "status": "success",
                "message": f"{teacher['name']}이(가) 영상을 분석 중입니다.",
                "analysis": {
                    "teacher": teacher,
                    "video_id": video_id,
                    "status": "analyzing",
                    "estimated_time": "2-3분"
                }
            })
            
        except Exception as e:
            return JsonResponse({
                "status": "error",
                "message": f"요청 처리 중 오류가 발생했습니다: {str(e)}"
            }, status=500)