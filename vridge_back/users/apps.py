from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"
    verbose_name = "사용자"
    
    def ready(self):
        """앱이 준비되면 이메일 큐 매니저 시작"""
        try:
            from .email_queue import start_email_queue
            start_email_queue()
        except ImportError:
            pass  # email_queue 모듈이 없으면 무시
