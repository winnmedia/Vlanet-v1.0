#!/usr/bin/env python3
"""
Ensure UserProfile exists for all users
This script creates UserProfile instances for any users that don't have one
"""
import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

def main():
    from users.models import User, UserProfile
    from django.db import transaction
    
    print("Checking UserProfile instances...")
    
    try:
        # First, let's check if the table exists by trying a simple query
        UserProfile.objects.exists()
        print("UserProfile table exists.")
    except Exception as e:
        print(f"Error accessing UserProfile table: {e}")
        print("The table might not exist. Please run migrations:")
        print("  python3 manage.py migrate users --fake-initial")
        print("  python3 manage.py migrate users 0007")
        return
    
    # Check for users without profiles
    users_without_profile = User.objects.filter(profile__isnull=True)
    
    if users_without_profile.exists():
        print(f"Found {users_without_profile.count()} users without profiles.")
        
        with transaction.atomic():
            for user in users_without_profile:
                try:
                    profile = UserProfile.objects.create(user=user)
                    print(f"✓ Created profile for user: {user.username}")
                except Exception as e:
                    print(f"✗ Error creating profile for {user.username}: {e}")
    else:
        print("All users already have profiles.")
    
    # Verify
    total_users = User.objects.count()
    total_profiles = UserProfile.objects.count()
    print(f"\nSummary: {total_users} users, {total_profiles} profiles")
    
    if total_users != total_profiles:
        print("WARNING: User count doesn't match profile count!")
    else:
        print("✓ All users have profiles!")

if __name__ == "__main__":
    main()