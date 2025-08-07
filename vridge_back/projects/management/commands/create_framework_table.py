from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Create DevelopmentFramework table if not exists'
    
    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'projects_developmentframework'
                );
            """)
            exists = cursor.fetchone()[0]
            
            if not exists:
                self.stdout.write("Creating projects_developmentframework table...")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS projects_developmentframework (
                        id SERIAL PRIMARY KEY,
                        created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        name VARCHAR(100) NOT NULL,
                        intro_hook TEXT NOT NULL,
                        immersion TEXT NOT NULL,
                        twist TEXT NOT NULL,
                        hook_next TEXT NOT NULL,
                        is_default BOOLEAN NOT NULL DEFAULT FALSE,
                        user_id INTEGER REFERENCES users_user(id) ON DELETE CASCADE
                    );
                """)
                
                # Create indexes
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_framework_user ON projects_developmentframework(user_id);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_framework_default ON projects_developmentframework(is_default);")
                
                self.stdout.write(self.style.SUCCESS('Successfully created DevelopmentFramework table'))
            else:
                self.stdout.write(self.style.SUCCESS('DevelopmentFramework table already exists'))