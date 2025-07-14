#!/usr/bin/env python
"""
Fix UserProfile table missing issue
"""
import os
import sys
import django

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                );
            """, [table_name])
        else:  # SQLite
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name=?;
            """, [table_name])
        
        result = cursor.fetchone()
        return bool(result and result[0])

def create_userprofile_table():
    """Create UserProfile table manually if it doesn't exist"""
    if not check_table_exists('users_userprofile'):
        print("UserProfile table not found. Creating it now...")
        
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users_userprofile (
                        id SERIAL PRIMARY KEY,
                        created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        profile_image VARCHAR(100),
                        bio TEXT,
                        phone VARCHAR(20),
                        company VARCHAR(100),
                        position VARCHAR(100),
                        user_id INTEGER UNIQUE NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
                    );
                    
                    CREATE INDEX IF NOT EXISTS users_userprofile_user_id_idx ON users_userprofile(user_id);
                """)
            else:  # SQLite
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users_userprofile (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        profile_image VARCHAR(100),
                        bio TEXT,
                        phone VARCHAR(20),
                        company VARCHAR(100),
                        position VARCHAR(100),
                        user_id INTEGER UNIQUE NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
                    );
                    
                    CREATE INDEX IF NOT EXISTS users_userprofile_user_id_idx ON users_userprofile(user_id);
                """)
        
        print("UserProfile table created successfully!")
    else:
        print("UserProfile table already exists.")

def main():
    print("Checking UserProfile table...")
    
    # First check if table exists
    create_userprofile_table()
    
    # Check migration status
    print("\nChecking migration status...")
    call_command('showmigrations', 'users')
    
    # Try to fake the migration if needed
    try:
        from django.db.migrations.recorder import MigrationRecorder
        recorder = MigrationRecorder(connection)
        
        # Check if migration 0007 is recorded
        if not recorder.migration_qs.filter(
            app='users', 
            name='0007_remove_user_bio_remove_user_company_and_more'
        ).exists():
            print("\nMigration 0007 not recorded. Faking it...")
            call_command('migrate', 'users', '0007', '--fake')
    except Exception as e:
        print(f"Error checking migrations: {e}")
    
    print("\nDone!")

if __name__ == '__main__':
    main()