from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
import time
import os
import psutil
import redis

@never_cache
@csrf_exempt
def health_check(request):
    """종합 헬스체크 엔드포인트"""
    start_time = time.time()
    
    health_status = {
        'status': 'healthy',
        'timestamp': int(time.time()),
        'version': os.environ.get('APP_VERSION', 'unknown'),
        'checks': {}
    }
    
    # 1. 데이터베이스 체크
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status['checks']['database'] = {
            'status': 'healthy',
            'response_time': f"{(time.time() - start_time) * 1000:.2f}ms"
        }
    except Exception as e:
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_status['status'] = 'unhealthy'
    
    # 2. Redis 캐시 체크
    cache_start = time.time()
    try:
        cache.set('health_check_test', 'ok', 10)
        if cache.get('health_check_test') == 'ok':
            health_status['checks']['cache'] = {
                'status': 'healthy',
                'response_time': f"{(time.time() - cache_start) * 1000:.2f}ms"
            }
        else:
            raise Exception("Cache read/write failed")
    except Exception as e:
        health_status['checks']['cache'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_status['status'] = 'degraded'
    
    # 3. 시스템 리소스 체크
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_status['checks']['system'] = {
            'status': 'healthy',
            'cpu_usage': f"{cpu_percent}%",
            'memory_usage': f"{memory.percent}%",
            'disk_usage': f"{disk.percent}%"
        }
        
        # 리소스 임계값 체크
        if cpu_percent > 80 or memory.percent > 85 or disk.percent > 90:
            health_status['checks']['system']['status'] = 'warning'
            health_status['status'] = 'degraded'
            
    except Exception as e:
        health_status['checks']['system'] = {
            'status': 'unknown',
            'error': str(e)
        }
    
    # 4. 외부 서비스 체크 (Gemini API)
    if os.environ.get('GOOGLE_API_KEY'):
        try:
            # 실제 API 호출 대신 키 존재 여부만 체크
            health_status['checks']['gemini_api'] = {
                'status': 'configured',
                'key_present': True
            }
        except:
            health_status['checks']['gemini_api'] = {
                'status': 'not_configured',
                'key_present': False
            }
    
    # 5. 응답 시간 체크
    total_time = (time.time() - start_time) * 1000
    health_status['response_time'] = f"{total_time:.2f}ms"
    
    if total_time > 1000:  # 1초 이상
        health_status['status'] = 'degraded'
    
    # HTTP 상태 코드 결정
    status_code = 200
    if health_status['status'] == 'unhealthy':
        status_code = 503
    elif health_status['status'] == 'degraded':
        status_code = 200  # 부분 장애는 200으로 응답
    
    return JsonResponse(health_status, status=status_code)


@never_cache
@csrf_exempt
def liveness_check(request):
    """간단한 생존 체크 (K8s liveness probe용)"""
    return JsonResponse({'status': 'alive'})


@never_cache
@csrf_exempt
def readiness_check(request):
    """준비 상태 체크 (K8s readiness probe용)"""
    try:
        # DB 연결만 간단히 체크
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({'status': 'ready'})
    except:
        return JsonResponse({'status': 'not_ready'}, status=503)