"""
pytest configuration for VideoPlanet tests
"""

import pytest
import os
import django
from django.conf import settings

# Configure Django settings before importing models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')


def pytest_configure():
    """Configure pytest with Django settings"""
    settings.DEBUG = False
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
    django.setup()


@pytest.fixture(scope='session')
def django_db_setup():
    """Override django db setup"""
    pass


@pytest.fixture
def api_client():
    """Provide API client for tests"""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client):
    """Provide authenticated API client"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.create_user(
        username='testuser@example.com',
        email='testuser@example.com',
        password='TestPass123!',
        nickname='TestUser'
    )
    
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def test_user():
    """Create a test user"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    return User.objects.create_user(
        username='fixture_user@example.com',
        email='fixture_user@example.com',
        password='FixturePass123!',
        nickname='FixtureUser'
    )


@pytest.fixture
def test_project(test_user):
    """Create a test project"""
    from projects.models import Project
    
    return Project.objects.create(
        project_name='Test Project',
        client_name='Test Client',
        user=test_user,
        production_scale='중형',
        project_description='Test project for automated testing'
    )