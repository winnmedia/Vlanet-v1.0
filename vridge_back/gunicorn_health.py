"""
Gunicorn configuration for Railway with IPv6 support
"""
import os
import multiprocessing

# Bind to IPv6 any address
bind = f"[::]:{os.environ.get('PORT', '8000')}"

# Workers configuration
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))
threads = int(os.environ.get('WEB_THREADS', 4))
worker_class = os.environ.get('WORKER_CLASS', 'sync')

# Timeout configuration
timeout = 120
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('LOG_LEVEL', 'info')
capture_output = True
enable_stdio_inheritance = True

# Process naming
proc_name = 'vridge-backend'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL/Security
secure_scheme_headers = {'X-FORWARDED-PROTOCOL': 'https', 'X-FORWARDED-PROTO': 'https', 'X-FORWARDED-SSL': 'on'}
forwarded_allow_ips = '*'

# Server hooks
def when_ready(server):
    server.log.info("Server is ready. Listening on: %s", server.address)

def worker_int(worker):
    worker.log.info("worker received INT or QUIT signal")

def pre_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def pre_exec(server):
    server.log.info("Forked child, re-executing.")

def worker_abort(worker):
    worker.log.info("worker received SIGABRT signal")