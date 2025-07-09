from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def simple_health(request):
    """가장 간단한 헬스체크"""
    try:
        return JsonResponse({"status": "ok", "service": "running"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)