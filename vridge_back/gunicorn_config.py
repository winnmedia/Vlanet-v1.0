"""
Gunicorn 설정 파일 - 빠른 시작과 안정적인 운영을 위한 최적화
"""
import os
import multiprocessing

# 서버 소켓
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
backlog = 2048

# 워커 프로세스
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 2

# 서버 메커니즘
daemon = False
raw_env = [
    'DJANGO_SETTINGS_MODULE=config.settings_railway_simple',
]
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# 로깅
errorlog = '-'
loglevel = 'info'
accesslog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# 프로세스 이름
proc_name = 'vridge-backend'

# 서버 후크
def on_starting(server):
    """서버 시작 시"""
    server.log.info("Starting Vridge Backend Server")
    server.log.info(f"Listening at: {bind}")
    server.log.info(f"Using {workers} workers")

def on_reload(server):
    """리로드 시"""
    server.log.info("Reloading Vridge Backend Server")

def worker_int(worker):
    """워커 인터럽트 시"""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """워커 fork 전"""
    server.log.info(f"Forking worker {worker.pid}")

def pre_exec(server):
    """새 마스터 프로세스 실행 전"""
    server.log.info("Forked child, re-executing.")

def when_ready(server):
    """서버 준비 완료 시"""
    server.log.info("Server is ready. Spawning workers")
    # 헬스체크가 즉시 응답할 수 있도록 준비 완료 신호
    import requests
    try:
        port = os.environ.get('PORT', '8000')
        response = requests.get(f'http://localhost:{port}/api/health/', timeout=5)
        server.log.info(f"Health check ready: {response.status_code}")
    except:
        server.log.info("Health check warming up...")

def worker_abort(worker):
    """워커 중단 시"""
    worker.log.info("Worker received SIGABRT signal")