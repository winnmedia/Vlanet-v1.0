from django.core.management.base import BaseCommand
from django.db import connection
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fix missing columns in projects_project table'

    def handle(self, *args, **options):
        self.stdout.write('Fixing missing columns in projects_project table...')
        
        with connection.cursor() as cursor:
            # Check which columns exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects_project'
            """)
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            self.stdout.write(f'Existing columns: {existing_columns}')
            
            # Add missing columns
            columns_to_add = [
                ('tone_manner', 'VARCHAR(50)'),
                ('genre', 'VARCHAR(50)'),
                ('concept', 'VARCHAR(50)')
            ]
            
            for column_name, column_type in columns_to_add:
                if column_name not in existing_columns:
                    try:
                        cursor.execute(f"""
                            ALTER TABLE projects_project 
                            ADD COLUMN {column_name} {column_type} NULL
                        """)
                        self.stdout.write(self.style.SUCCESS(f'Added column: {column_name}'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Failed to add column {column_name}: {e}'))
                else:
                    self.stdout.write(f'Column {column_name} already exists')
            
            # Create IdempotencyRecord table if it doesn't exist
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'projects_idempotencyrecord'
                )
            """)
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                try:
                    cursor.execute("""
                        CREATE TABLE projects_idempotencyrecord (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
                            idempotency_key VARCHAR(255) NOT NULL,
                            project_id INTEGER NULL,
                            request_data TEXT NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            status VARCHAR(20) NOT NULL DEFAULT 'processing',
                            UNIQUE(user_id, idempotency_key)
                        )
                    """)
                    cursor.execute("CREATE INDEX idx_idempotency_key ON projects_idempotencyrecord(idempotency_key)")
                    cursor.execute("CREATE INDEX idx_created_at ON projects_idempotencyrecord(created_at)")
                    self.stdout.write(self.style.SUCCESS('Created IdempotencyRecord table'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Failed to create IdempotencyRecord table: {e}'))
            else:
                self.stdout.write('IdempotencyRecord table already exists')
            
            # Add unique constraint if it doesn't exist
            try:
                cursor.execute("""
                    SELECT conname FROM pg_constraint 
                    WHERE conname = 'unique_user_project_name'
                """)
                constraint_exists = cursor.fetchone()
                
                if not constraint_exists:
                    cursor.execute("""
                        ALTER TABLE projects_project 
                        ADD CONSTRAINT unique_user_project_name 
                        UNIQUE (user_id, name)
                    """)
                    self.stdout.write(self.style.SUCCESS('Added unique constraint for user-project name'))
                else:
                    self.stdout.write('Unique constraint already exists')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not add unique constraint: {e}'))
        
        self.stdout.write(self.style.SUCCESS('Column fix complete!'))