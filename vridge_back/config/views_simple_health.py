from django.http import JsonResponse

def simple_health(request):
    """가장 간단한 헬스체크"""
    return JsonResponse({"status": "ok", "service": "running"})