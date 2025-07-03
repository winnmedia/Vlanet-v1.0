from django.http import JsonResponse
from django.db import connection
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint for monitoring
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return JsonResponse({
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    })

@require_http_methods(["GET"])
def csrf_token_view(request):
    """
    Endpoint to get CSRF token
    """
    from django.middleware.csrf import get_token
    
    return JsonResponse({
        "csrfToken": get_token(request)
    })