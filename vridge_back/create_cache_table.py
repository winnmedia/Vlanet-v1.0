#!/usr/bin/env python3
"""
Create cache table for Django database cache backend
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from django.conf import settings

print("=== CREATING CACHE TABLE ===")
print(f"Current settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")

# Check cache backend
try:
    cache_backend = settings.CACHES.get('default', {}).get('BACKEND', 'Not configured')
    print(f"Cache backend: {cache_backend}")
    
    if 'db.DatabaseCache' in cache_backend:
        print("Database cache detected, creating table...")
        try:
            call_command('createcachetable', 'django_cache_table')
            print("✓ Cache table created successfully!")
        except Exception as e:
            if 'already exists' in str(e):
                print("✓ Cache table already exists")
            else:
                print(f"✗ Error creating cache table: {e}")
    else:
        print("Not using database cache, skipping table creation")
        
except Exception as e:
    print(f"Error: {e}")