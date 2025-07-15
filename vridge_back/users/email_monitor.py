"""
이메일 발송 모니터링 시스템
"""
from django.core.cache import cache
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)


class EmailDeliveryStatus:
    """이메일 발송 상태 상수"""
    PENDING = 'pending'
    SENT = 'sent'
    FAILED = 'failed'
    RETRYING = 'retrying'
    DELIVERED = 'delivered'
    BOUNCED = 'bounced'


class EmailMonitor:
    """이메일 발송 모니터링 클래스"""
    
    def __init__(self):
        self.cache_prefix = 'email_monitor:'
        self.stats_prefix = 'email_stats:'
        self.ttl = 86400 * 7  # 7일간 보관
        
    def record_email_sent(self, email_id, recipient, subject, email_type='general'):
        """이메일 발송 기록"""
        key = f"{self.cache_prefix}{email_id}"
        data = {
            'id': email_id,
            'recipient': recipient,
            'subject': subject,
            'type': email_type,
            'status': EmailDeliveryStatus.PENDING,
            'created_at': timezone.now().isoformat(),
            'attempts': 1,
            'last_attempt': timezone.now().isoformat(),
            'delivered_at': None,
            'error': None
        }
        
        # Redis에 저장
        cache.set(key, json.dumps(data), self.ttl)
        
        # 통계 업데이트
        self._update_stats('sent', email_type)
        
        logger.info(f"이메일 발송 기록: {email_id} -> {recipient}")
        return data
    
    def update_email_status(self, email_id, status, error=None):
        """이메일 상태 업데이트"""
        key = f"{self.cache_prefix}{email_id}"
        data = cache.get(key)
        
        if not data:
            logger.warning(f"이메일 모니터링 데이터를 찾을 수 없음: {email_id}")
            return None
            
        data = json.loads(data) if isinstance(data, str) else data
        data['status'] = status
        data['last_attempt'] = timezone.now().isoformat()
        
        if status == EmailDeliveryStatus.DELIVERED:
            data['delivered_at'] = timezone.now().isoformat()
            self._update_stats('delivered', data.get('type', 'general'))
        elif status == EmailDeliveryStatus.FAILED:
            data['error'] = error
            self._update_stats('failed', data.get('type', 'general'))
        elif status == EmailDeliveryStatus.RETRYING:
            data['attempts'] = data.get('attempts', 0) + 1
            
        cache.set(key, json.dumps(data), self.ttl)
        logger.info(f"이메일 상태 업데이트: {email_id} -> {status}")
        return data
    
    def get_email_status(self, email_id):
        """이메일 상태 조회"""
        key = f"{self.cache_prefix}{email_id}"
        data = cache.get(key)
        
        if not data:
            return None
            
        return json.loads(data) if isinstance(data, str) else data
    
    def get_recent_emails(self, limit=50, email_type=None):
        """최근 이메일 목록 조회"""
        # 실제 운영에서는 더 효율적인 방법 필요 (Redis ZSET 등)
        # 여기서는 간단한 구현
        pattern = f"{self.cache_prefix}*"
        keys = cache.keys(pattern)
        
        emails = []
        for key in keys[-limit:]:  # 최근 N개만
            data = cache.get(key)
            if data:
                email_data = json.loads(data) if isinstance(data, str) else data
                if not email_type or email_data.get('type') == email_type:
                    emails.append(email_data)
                    
        # 시간순 정렬
        emails.sort(key=lambda x: x['created_at'], reverse=True)
        return emails[:limit]
    
    def get_statistics(self, hours=24):
        """이메일 발송 통계 조회"""
        stats = {
            'total_sent': 0,
            'total_delivered': 0,
            'total_failed': 0,
            'delivery_rate': 0,
            'by_type': {},
            'hourly': []
        }
        
        # 시간별 통계
        now = timezone.now()
        for i in range(hours):
            hour_key = f"{self.stats_prefix}{(now - timedelta(hours=i)).strftime('%Y%m%d%H')}"
            hour_data = cache.get(hour_key)
            if hour_data:
                hour_stats = json.loads(hour_data) if isinstance(hour_data, str) else hour_data
                stats['hourly'].append({
                    'hour': (now - timedelta(hours=i)).strftime('%Y-%m-%d %H:00'),
                    'data': hour_stats
                })
                
                # 전체 통계 계산
                stats['total_sent'] += hour_stats.get('sent', 0)
                stats['total_delivered'] += hour_stats.get('delivered', 0)
                stats['total_failed'] += hour_stats.get('failed', 0)
                
                # 타입별 통계
                for email_type, type_stats in hour_stats.get('by_type', {}).items():
                    if email_type not in stats['by_type']:
                        stats['by_type'][email_type] = {
                            'sent': 0,
                            'delivered': 0,
                            'failed': 0
                        }
                    stats['by_type'][email_type]['sent'] += type_stats.get('sent', 0)
                    stats['by_type'][email_type]['delivered'] += type_stats.get('delivered', 0)
                    stats['by_type'][email_type]['failed'] += type_stats.get('failed', 0)
        
        # 전달률 계산
        if stats['total_sent'] > 0:
            stats['delivery_rate'] = (stats['total_delivered'] / stats['total_sent']) * 100
            
        return stats
    
    def _update_stats(self, action, email_type):
        """통계 업데이트"""
        hour_key = f"{self.stats_prefix}{timezone.now().strftime('%Y%m%d%H')}"
        stats = cache.get(hour_key)
        
        if not stats:
            stats = {
                'sent': 0,
                'delivered': 0,
                'failed': 0,
                'by_type': {}
            }
        else:
            stats = json.loads(stats) if isinstance(stats, str) else stats
            
        # 전체 통계 업데이트
        if action in ['sent', 'delivered', 'failed']:
            stats[action] = stats.get(action, 0) + 1
            
        # 타입별 통계 업데이트
        if email_type not in stats['by_type']:
            stats['by_type'][email_type] = {
                'sent': 0,
                'delivered': 0,
                'failed': 0
            }
            
        if action in ['sent', 'delivered', 'failed']:
            stats['by_type'][email_type][action] = stats['by_type'][email_type].get(action, 0) + 1
            
        # 1시간 동안 캐시
        cache.set(hour_key, json.dumps(stats), 3600)
    
    def cleanup_old_records(self, days=7):
        """오래된 기록 정리"""
        pattern = f"{self.cache_prefix}*"
        keys = cache.keys(pattern)
        
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count = 0
        
        for key in keys:
            data = cache.get(key)
            if data:
                email_data = json.loads(data) if isinstance(data, str) else data
                created_at = datetime.fromisoformat(email_data['created_at'])
                
                if created_at < cutoff_date:
                    cache.delete(key)
                    deleted_count += 1
                    
        logger.info(f"{deleted_count}개의 오래된 이메일 기록 삭제됨")
        return deleted_count


# 전역 모니터 인스턴스
email_monitor = EmailMonitor()