"""CORS 테스트 및 디버깅용 뷰"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
def cors_test_view(request):
    """CORS 테스트를 위한 간단한 뷰"""
    logger.info(f"[CORS Test] Request method: {request.method}")
    logger.info(f"[CORS Test] Origin: {request.headers.get('Origin', 'No origin')}")
    
    response_data = {
        'message': 'CORS test successful',
        'method': request.method,
        'origin': request.headers.get('Origin', 'No origin'),
        'headers': dict(request.headers)
    }
    
    response = JsonResponse(response_data)
    
    # 수동으로 CORS 헤더 추가 (테스트용)
    origin = request.headers.get('Origin', '')
    if origin:
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    return response


@method_decorator(csrf_exempt, name='dispatch')
class PublicProjectListView(View):
    """인증 없이 접근 가능한 프로젝트 목록 (CORS 테스트용)"""
    
    def get(self, request):
        logger.info("[Public Project List] Request received")
        
        response_data = {
            'message': 'Public project list',
            'projects': [
                {'id': 1, 'name': 'Test Project 1'},
                {'id': 2, 'name': 'Test Project 2'}
            ]
        }
        
        response = JsonResponse(response_data)
        
        # 수동으로 CORS 헤더 추가
        origin = request.headers.get('Origin', '')
        if origin:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
        
        return response
    
    def options(self, request):
        """OPTIONS 요청 처리 (preflight)"""
        response = JsonResponse({'message': 'OK'})
        
        origin = request.headers.get('Origin', '')
        if origin:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response['Access-Control-Max-Age'] = '86400'
        
        return response