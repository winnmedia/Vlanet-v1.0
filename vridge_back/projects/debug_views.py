"""프로젝트 API 디버깅을 위한 뷰"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db import connection
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@login_required
def debug_project_list(request):
    """프로젝트 목록 API 디버깅"""
    try:
        user = request.user
        
        # 1. 데이터베이스 테이블 구조 확인
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'projects_project'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
        
        # 2. 간단한 프로젝트 목록 쿼리
        from .models import Project
        projects = Project.objects.filter(owner=user).values('id', 'name', 'created')
        
        return JsonResponse({
            "status": "success",
            "user": user.username,
            "table_columns": [{"name": col[0], "type": col[1]} for col in columns],
            "project_count": projects.count(),
            "projects": list(projects[:5])  # 처음 5개만
        })
        
    except Exception as e:
        logger.error(f"Debug project list error: {str(e)}", exc_info=True)
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }, status=500)