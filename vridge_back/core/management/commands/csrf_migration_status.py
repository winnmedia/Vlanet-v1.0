"""
CSRF 마이그레이션 상태를 확인하고 관리하는 명령어
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from config.csrf_migration import CSRF_PROTECTED_ENDPOINTS, ACTIVE_PHASES


class Command(BaseCommand):
    help = 'CSRF 마이그레이션 상태 확인 및 관리'

    def add_arguments(self, parser):
        parser.add_argument(
            '--activate',
            type=str,
            help='특정 phase를 활성화 (예: phase2)',
        )
        parser.add_argument(
            '--deactivate',
            type=str,
            help='특정 phase를 비활성화',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='모든 phase와 엔드포인트 목록 표시',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.list_phases()
        elif options['activate']:
            self.activate_phase(options['activate'])
        elif options['deactivate']:
            self.deactivate_phase(options['deactivate'])
        else:
            self.show_status()

    def show_status(self):
        self.stdout.write(self.style.SUCCESS('=== CSRF 마이그레이션 상태 ==='))
        self.stdout.write(f"\n현재 활성화된 Phase: {', '.join(ACTIVE_PHASES)}")
        
        total_endpoints = sum(len(endpoints) for endpoints in CSRF_PROTECTED_ENDPOINTS.values())
        protected_endpoints = sum(
            len(endpoints) 
            for phase, endpoints in CSRF_PROTECTED_ENDPOINTS.items() 
            if phase in ACTIVE_PHASES
        )
        
        self.stdout.write(f"보호된 엔드포인트: {protected_endpoints}/{total_endpoints}")
        
        # 각 phase별 상태
        for phase, endpoints in CSRF_PROTECTED_ENDPOINTS.items():
            status = "✓ 활성화" if phase in ACTIVE_PHASES else "✗ 비활성화"
            self.stdout.write(f"\n{phase}: {status} ({len(endpoints)}개 엔드포인트)")

    def list_phases(self):
        self.stdout.write(self.style.SUCCESS('=== CSRF 보호 엔드포인트 목록 ==='))
        
        for phase, endpoints in CSRF_PROTECTED_ENDPOINTS.items():
            status = "활성화" if phase in ACTIVE_PHASES else "비활성화"
            self.stdout.write(f"\n{phase} ({status}):")
            for endpoint in endpoints:
                self.stdout.write(f"  - {endpoint}")

    def activate_phase(self, phase):
        if phase not in CSRF_PROTECTED_ENDPOINTS:
            self.stdout.write(self.style.ERROR(f"알 수 없는 phase: {phase}"))
            return
        
        if phase in ACTIVE_PHASES:
            self.stdout.write(self.style.WARNING(f"{phase}는 이미 활성화되어 있습니다."))
            return
        
        # 실제 설정 변경은 settings 파일을 수정해야 함
        self.stdout.write(self.style.SUCCESS(
            f"\n{phase}를 활성화하려면 settings_base.py에서 다음과 같이 설정하세요:\n"
            f"CSRF_ACTIVE_PHASES = {ACTIVE_PHASES + [phase]}"
        ))

    def deactivate_phase(self, phase):
        if phase not in ACTIVE_PHASES:
            self.stdout.write(self.style.WARNING(f"{phase}는 활성화되어 있지 않습니다."))
            return
        
        new_phases = [p for p in ACTIVE_PHASES if p != phase]
        self.stdout.write(self.style.SUCCESS(
            f"\n{phase}를 비활성화하려면 settings_base.py에서 다음과 같이 설정하세요:\n"
            f"CSRF_ACTIVE_PHASES = {new_phases}"
        ))