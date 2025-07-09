from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import View
from django.conf import settings
import os

class SPAView(View):
    """React SPA를 위한 catch-all 뷰"""
    
    def get(self, request, *args, **kwargs):
        try:
            # React 빌드 파일의 index.html을 반환
            # WhiteNoise가 설정되어 있으면 WHITENOISE_ROOT 사용
            if hasattr(settings, 'WHITENOISE_ROOT'):
                index_path = os.path.join(settings.WHITENOISE_ROOT, 'index.html')
            else:
                # 대체 경로: 프론트엔드 빌드 디렉토리
                index_path = os.path.join(settings.BASE_DIR, 'frontend_build/index.html')
            
            with open(index_path, 'r', encoding='utf-8') as file:
                return HttpResponse(file.read(), content_type='text/html')
        except:
            # 개발 환경이거나 index.html이 없는 경우
            # CORS 설정된 프론트엔드 URL로 리다이렉트
            return HttpResponse("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>VideoPlanet</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script>
                        // 프론트엔드가 별도로 실행되는 경우
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                            window.location.href = 'http://localhost:3000' + window.location.pathname;
                        } else {
                            // 프로덕션에서는 프론트엔드 URL로
                            window.location.href = 'https://vlanet.net' + window.location.pathname;
                        }
                    </script>
                </body>
                </html>
            """)