from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for VideoPlanet'

    def handle(self, *args, **options):
        test_users = [
            {
                "email": "test@example.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User",
                "nickname": "테스트유저"
            },
            {
                "email": "admin@example.com", 
                "password": "adminpass123",
                "first_name": "Admin",
                "last_name": "User",
                "nickname": "관리자",
                "is_staff": True,
                "is_superuser": True
            },
            {
                "email": "demo@example.com",
                "password": "demopass123",
                "first_name": "Demo",
                "last_name": "User",
                "nickname": "데모유저"
            }
        ]
        
        for user_data in test_users:
            email = user_data["email"]
            password = user_data["password"]
            
            try:
                with transaction.atomic():
                    if User.objects.filter(username=email).exists():
                        user = User.objects.get(username=email)
                        user.set_password(password)
                        user.email = email
                        user.first_name = user_data.get("first_name", "")
                        user.last_name = user_data.get("last_name", "")
                        user.nickname = user_data.get("nickname", "")
                        user.is_active = True
                        if user_data.get("is_staff"):
                            user.is_staff = True
                        if user_data.get("is_superuser"):
                            user.is_superuser = True
                        user.save()
                        self.stdout.write(self.style.SUCCESS(f'Updated user: {email}'))
                    else:
                        user = User.objects.create_user(
                            username=email,
                            email=email,
                            password=password,
                            first_name=user_data.get("first_name", ""),
                            last_name=user_data.get("last_name", ""),
                            is_active=True,
                            is_staff=user_data.get("is_staff", False),
                            is_superuser=user_data.get("is_superuser", False)
                        )
                        user.nickname = user_data.get("nickname", "")
                        user.save()
                        self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error with user {email}: {e}'))
        
        self.stdout.write(self.style.SUCCESS('\nTest users ready:'))
        self.stdout.write('Email: test@example.com / Password: testpass123')
        self.stdout.write('Email: admin@example.com / Password: adminpass123')
        self.stdout.write('Email: demo@example.com / Password: demopass123')