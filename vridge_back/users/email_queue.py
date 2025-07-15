import os
import time
import threading
from queue import Queue, Empty
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class EmailQueueManager:
    """이메일 발송을 관리하는 큐 매니저"""
    
    def __init__(self):
        self.queue = Queue()
        self.worker_thread = None
        self.is_running = False
        self.retry_queue = Queue()
        self.max_retries = 3
        self.retry_delay = 30  # 30초 후 재시도
        
    def start(self):
        """워커 스레드 시작"""
        if not self.is_running:
            self.is_running = True
            self.worker_thread = threading.Thread(target=self._process_emails, daemon=True)
            self.worker_thread.start()
            logger.info("[EmailQueue] Email queue manager started")
    
    def stop(self):
        """워커 스레드 중지"""
        self.is_running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
            logger.info("[EmailQueue] Email queue manager stopped")
    
    def add_email(self, subject, body, recipient_list, html_message=None, priority=5):
        """이메일을 큐에 추가"""
        email_data = {
            'subject': subject,
            'body': body,
            'recipient_list': recipient_list,
            'html_message': html_message,
            'priority': priority,
            'retry_count': 0,
            'created_at': timezone.now()
        }
        self.queue.put((priority, email_data))
        logger.info(f"[EmailQueue] Email added to queue: {subject} to {recipient_list}")
    
    def _process_emails(self):
        """이메일 큐를 처리하는 워커"""
        while self.is_running:
            try:
                # 재시도 큐 처리
                self._process_retry_queue()
                
                # 메인 큐 처리
                try:
                    priority, email_data = self.queue.get(timeout=1)
                    self._send_email(email_data)
                except Empty:
                    continue
                    
            except Exception as e:
                logger.error(f"[EmailQueue] Error in worker thread: {str(e)}")
                time.sleep(1)
    
    def _process_retry_queue(self):
        """재시도 큐 처리"""
        retry_items = []
        
        # 재시도 큐에서 아이템 가져오기
        while not self.retry_queue.empty():
            try:
                retry_time, email_data = self.retry_queue.get_nowait()
                if timezone.now() >= retry_time:
                    self._send_email(email_data)
                else:
                    retry_items.append((retry_time, email_data))
            except Empty:
                break
        
        # 아직 재시도 시간이 안 된 아이템들을 다시 큐에 넣기
        for item in retry_items:
            self.retry_queue.put(item)
    
    def _send_email(self, email_data):
        """실제 이메일 발송"""
        try:
            logger.info(f"[EmailQueue] Sending email: {email_data['subject']} to {email_data['recipient_list']}")
            
            email = EmailMultiAlternatives(
                subject=email_data['subject'],
                body=email_data['body'],
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=email_data['recipient_list']
            )
            
            if email_data.get('html_message'):
                email.attach_alternative(email_data['html_message'], "text/html")
            
            # 이메일 발송
            result = email.send(fail_silently=False)
            
            email_backend = 'SendGrid' if os.environ.get('SENDGRID_API_KEY') else 'Gmail'
            logger.info(f"[EmailQueue] Email sent successfully via {email_backend}: {email_data['subject']}")
            
        except Exception as e:
            logger.error(f"[EmailQueue] Failed to send email: {str(e)}")
            
            # 재시도 처리
            email_data['retry_count'] += 1
            if email_data['retry_count'] < self.max_retries:
                retry_time = timezone.now() + timezone.timedelta(seconds=self.retry_delay * email_data['retry_count'])
                self.retry_queue.put((retry_time, email_data))
                logger.info(f"[EmailQueue] Email queued for retry {email_data['retry_count']}/{self.max_retries}")
            else:
                logger.error(f"[EmailQueue] Email failed after {self.max_retries} retries: {email_data['subject']}")

# 싱글톤 인스턴스
email_queue_manager = EmailQueueManager()

# Django 앱 시작 시 큐 매니저 시작
def start_email_queue():
    email_queue_manager.start()

# Django 앱 종료 시 큐 매니저 중지
def stop_email_queue():
    email_queue_manager.stop()