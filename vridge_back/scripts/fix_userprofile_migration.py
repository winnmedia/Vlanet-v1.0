#!/usr/bin/env python3
"""
Fix UserProfile migration issue
This script re-runs the UserProfile migration if the table doesn't exist
"""
import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.db import connection
from django.core.management import call_command

def main():
    print("Fixing UserProfile migration issue...")
    
    # Check if table exists
    with connection.cursor() as cursor:
        # PostgreSQL-specific check
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename = 'users_userprofile'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
    if not table_exists:
        print("Table users_userprofile doesn't exist. Re-running migration...")
        
        try:
            # First, mark the migration as not applied
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = 'users' 
                    AND name = '0007_remove_user_bio_remove_user_company_and_more';
                """)
                print("Removed migration record.")
            
            # Now run the migration again
            call_command('migrate', 'users', '0007')
            print("Migration re-applied successfully!")
            
        except Exception as e:
            print(f"Error during migration: {e}")
            print("\nTrying alternative approach...")
            
            # If migration fails, create table manually
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        CREATE TABLE users_userprofile (
                            id BIGSERIAL PRIMARY KEY,
                            created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            profile_image VARCHAR(100),
                            bio TEXT DEFAULT '',
                            phone VARCHAR(20) DEFAULT '',
                            company VARCHAR(100) DEFAULT '',
                            position VARCHAR(100) DEFAULT '',
                            user_id BIGINT NOT NULL UNIQUE REFERENCES users_user(id) ON DELETE CASCADE
                        );
                    """)
                    print("Table created manually!")
                    
                    # Mark migration as applied
                    cursor.execute("""
                        INSERT INTO django_migrations (app, name, applied)
                        VALUES ('users', '0007_remove_user_bio_remove_user_company_and_more', NOW());
                    """)
                    print("Migration marked as applied.")
                    
            except Exception as e2:
                print(f"Manual table creation failed: {e2}")
                return
    else:
        print("Table users_userprofile already exists.")
    
    # Ensure all users have profiles
    from users.models import User, UserProfile
    users_without_profile = User.objects.filter(profile__isnull=True)
    
    if users_without_profile.exists():
        print(f"\nCreating profiles for {users_without_profile.count()} users...")
        for user in users_without_profile:
            UserProfile.objects.create(user=user)
            print(f"✓ Created profile for: {user.username}")
    
    print("\nUserProfile migration fix completed!")

if __name__ == "__main__":
    main()