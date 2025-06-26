from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Create admin user for Vlanet'

    def handle(self, *args, **options):
        username = 'admin'
        email = 'admin@vlanet.net'
        password = 'vlanet2024!@#'
        nickname = 'Vlanet Admin'
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User {username} already exists'))
            return
            
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            nickname=nickname
        )
        
        self.stdout.write(self.style.SUCCESS(f'''
Admin user created successfully!

========================================
Django Admin Access Information
========================================
URL: https://videoplanet.up.railway.app/admin/
Username: {username}
Email: {email}
Password: {password}
========================================

Please change the password after first login!
        '''))