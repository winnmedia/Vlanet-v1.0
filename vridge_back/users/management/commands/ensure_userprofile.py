from django.core.management.base import BaseCommand
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder

class Command(BaseCommand):
    help = 'Ensure UserProfile table exists'

    def handle(self, *args, **options):
        self.stdout.write('Checking UserProfile table...')
        
        # Check if table exists
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'users_userprofile'
                    );
                """)
            else:  # SQLite
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='users_userprofile';
                """)
            
            result = cursor.fetchone()
            table_exists = bool(result and result[0])
        
        if not table_exists:
            self.stdout.write(self.style.WARNING('UserProfile table does not exist. Creating it now...'))
            
            with connection.cursor() as cursor:
                if connection.vendor == 'postgresql':
                    cursor.execute("""
                        CREATE TABLE users_userprofile (
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
                        
                        CREATE INDEX users_userprofile_user_id_idx ON users_userprofile(user_id);
                    """)
                else:  # SQLite
                    cursor.execute("""
                        CREATE TABLE users_userprofile (
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
                        
                        CREATE INDEX users_userprofile_user_id_idx ON users_userprofile(user_id);
                    """)
            
            self.stdout.write(self.style.SUCCESS('UserProfile table created successfully!'))
            
            # Record the migration as applied
            recorder = MigrationRecorder(connection)
            if not recorder.migration_qs.filter(
                app='users', 
                name='0007_remove_user_bio_remove_user_company_and_more'
            ).exists():
                recorder.record_applied('users', '0007_remove_user_bio_remove_user_company_and_more')
                self.stdout.write(self.style.SUCCESS('Migration recorded as applied.'))
        else:
            self.stdout.write(self.style.SUCCESS('UserProfile table already exists.'))