#!/usr/bin/env python3
"""
Fix UserProfile table issue
This script checks if the users_userprofile table exists and creates it if needed
"""
import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.db import connection
from django.core.management import call_command

def table_exists(table_name):
    """Check if a table exists in the database"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_name = %s
        """, [table_name])
        result = cursor.fetchone()
        return result[0] > 0

def main():
    print("Checking for users_userprofile table...")
    
    if not table_exists('users_userprofile'):
        print("Table users_userprofile does not exist!")
        print("Creating table manually...")
        
        with connection.cursor() as cursor:
            # Create the table with proper PostgreSQL syntax
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users_userprofile (
                    id BIGSERIAL PRIMARY KEY,
                    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    profile_image VARCHAR(100),
                    bio TEXT,
                    phone VARCHAR(20),
                    company VARCHAR(100),
                    position VARCHAR(100),
                    user_id BIGINT NOT NULL UNIQUE REFERENCES users_user(id) ON DELETE CASCADE
                );
            """)
            
            # Create index on user_id
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS users_userprofile_user_id_idx 
                ON users_userprofile(user_id);
            """)
            
            print("Table users_userprofile created successfully!")
            
            # Mark the migration as applied if it wasn't
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                SELECT 'users', '0007_remove_user_bio_remove_user_company_and_more', NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM django_migrations 
                    WHERE app = 'users' 
                    AND name = '0007_remove_user_bio_remove_user_company_and_more'
                );
            """)
            
    else:
        print("Table users_userprofile already exists.")
        
    # Check if any users need profiles created
    from users.models import User, UserProfile
    users_without_profile = User.objects.filter(profile__isnull=True)
    
    if users_without_profile.exists():
        print(f"Found {users_without_profile.count()} users without profiles. Creating profiles...")
        for user in users_without_profile:
            UserProfile.objects.create(user=user)
            print(f"Created profile for user: {user.username}")
    else:
        print("All users have profiles.")
    
    print("UserProfile table fix completed!")

if __name__ == "__main__":
    main()