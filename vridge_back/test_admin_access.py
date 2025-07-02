#!/usr/bin/env python
"""Test script to check Django admin configuration and access issues"""

import os
import sys
import django

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')

# Setup Django
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.admin.sites import site
from django.test import Client
from django.urls import reverse

print("=== Django Admin Configuration Check ===\n")

# 1. Check basic configuration
print("1. Basic Configuration:")
print(f"   - DEBUG: {settings.DEBUG}")
print(f"   - ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print(f"   - STATIC_URL: {settings.STATIC_URL}")
print(f"   - STATIC_ROOT: {settings.STATIC_ROOT}")
print(f"   - ADMIN_ENABLED: {'django.contrib.admin' in settings.INSTALLED_APPS}")

# 2. Check middleware
print("\n2. Middleware Configuration:")
for i, middleware in enumerate(settings.MIDDLEWARE):
    print(f"   {i+1}. {middleware}")

# 3. Check authentication settings
print("\n3. Authentication Settings:")
print(f"   - AUTH_USER_MODEL: {settings.AUTH_USER_MODEL}")
print(f"   - SESSION_ENGINE: {getattr(settings, 'SESSION_ENGINE', 'Default')}")
print(f"   - SESSION_COOKIE_SECURE: {getattr(settings, 'SESSION_COOKIE_SECURE', False)}")
print(f"   - CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', False)}")

# 4. Check CORS settings
print("\n4. CORS Settings:")
print(f"   - CORS middleware installed: {'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE}")
print(f"   - CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)}")
print(f"   - CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', [])}")

# 5. Check registered models
print("\n5. Registered Admin Models:")
for model, admin_class in site._registry.items():
    print(f"   - {model._meta.app_label}.{model._meta.model_name}: {admin_class.__class__.__name__}")

# 6. Check URL configuration
print("\n6. Admin URL Configuration:")
try:
    admin_url = reverse('admin:index')
    print(f"   - Admin URL resolved: {admin_url}")
except Exception as e:
    print(f"   - ERROR: Could not resolve admin URL: {e}")

# 7. Check for superuser
print("\n7. Superuser Check:")
User = get_user_model()
superusers = User.objects.filter(is_superuser=True)
print(f"   - Total superusers: {superusers.count()}")
for user in superusers[:5]:  # Show first 5
    print(f"     - {user.username} (active: {user.is_active})")

# 8. Test admin access
print("\n8. Admin Access Test:")
client = Client()

# Test GET request to admin
response = client.get('/admin/', follow=True)
print(f"   - GET /admin/ status: {response.status_code}")
if response.redirect_chain:
    print(f"   - Redirects: {response.redirect_chain}")

# Test admin login page
response = client.get('/admin/login/', follow=False)
print(f"   - GET /admin/login/ status: {response.status_code}")

# 9. Check for common issues
print("\n9. Common Issues Check:")

# Check if admin static files are accessible
admin_css_url = f"{settings.STATIC_URL}admin/css/base.css"
print(f"   - Admin CSS URL: {admin_css_url}")

# Check for blocking middleware
blocking_middleware = [
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
]
for mw in blocking_middleware:
    if mw in settings.MIDDLEWARE:
        print(f"   - Potential blocking middleware found: {mw}")

# Check security settings
security_settings = {
    'X_FRAME_OPTIONS': getattr(settings, 'X_FRAME_OPTIONS', None),
    'SECURE_BROWSER_XSS_FILTER': getattr(settings, 'SECURE_BROWSER_XSS_FILTER', None),
    'SECURE_CONTENT_TYPE_NOSNIFF': getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', None),
}
print("\n   Security Settings:")
for key, value in security_settings.items():
    print(f"     - {key}: {value}")

print("\n=== End of Admin Configuration Check ===")