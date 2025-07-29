from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test accounts for development and testing'

    def handle(self, *args, **options):
        test_accounts = [
            {
                'email': 'test@example.com',
                'username': 'testuser',
                'password': 'Test123!',
                'first_name': 'Test',
                'last_name': 'User',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'admin@example.com',
                'username': 'adminuser',
                'password': 'Admin123!',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        ]

        with transaction.atomic():
            for account_data in test_accounts:
                email = account_data['email']
                
                try:
                    user = User.objects.get(email=email)
                    self.stdout.write(
                        self.style.WARNING(f'User {email} already exists, updating...')
                    )
                    user.username = account_data['username']
                    user.first_name = account_data['first_name']
                    user.last_name = account_data['last_name']
                    user.is_staff = account_data['is_staff']
                    user.is_superuser = account_data['is_superuser']
                    user.is_active = True
                    user.set_password(account_data['password'])
                    user.save()
                    
                except User.DoesNotExist:
                    user = User.objects.create_user(
                        email=email,
                        username=account_data['username'],
                        password=account_data['password'],
                        first_name=account_data['first_name'],
                        last_name=account_data['last_name'],
                        is_staff=account_data['is_staff'],
                        is_superuser=account_data['is_superuser'],
                        is_active=True
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully created user {email}')
                    )

        self.stdout.write(self.style.SUCCESS('\nTest accounts created/updated:'))
        self.stdout.write('- test@example.com / Test123! (Regular user)')
        self.stdout.write('- admin@example.com / Admin123! (Admin user)')