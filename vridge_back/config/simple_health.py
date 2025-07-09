from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def simple_health_check(request):
    """간단한 헬스체크 - DB 연결 체크 없이 빠르게 응답"""
    return JsonResponse({
        "status": "ok",
        "service": "vridge-backend"
    })