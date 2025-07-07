"""
기존 피드백 API를 프로젝트 하위 리소스로 리다이렉트
"""
from django.shortcuts import redirect
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackRedirect(View):
    """기존 /api/feedbacks/{id} 요청을 /api/projects/{id}/feedback/로 리다이렉트"""
    
    def get(self, request, id):
        # 301 대신 307을 사용하여 메서드 유지
        return redirect(f'/api/projects/{id}/feedback/', permanent=False)
    
    def post(self, request, id):
        return redirect(f'/api/projects/{id}/feedback/upload/', permanent=False)
    
    def put(self, request, id):
        return redirect(f'/api/projects/{id}/feedback/comments/', permanent=False)