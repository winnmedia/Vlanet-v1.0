"""
Celery configuration for vridge project
"""
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create Celery app
app = Celery('vridge')

# Load config from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Configure task routing
app.conf.task_routes = {
    'feedbacks.tasks.*': {'queue': 'video_processing'},
}

# Task time limits
app.conf.task_time_limit = 3600  # 1 hour hard limit
app.conf.task_soft_time_limit = 3000  # 50 minutes soft limit

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')