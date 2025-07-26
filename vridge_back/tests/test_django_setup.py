import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model


class TestDjangoSetup(TestCase):
    """Test that Django is properly configured for testing"""
    
    def test_django_settings(self):
        """Test Django settings are loaded"""
        from django.conf import settings
        assert settings.DEBUG is not None
    
    def test_user_model(self):
        """Test custom user model is configured"""
        User = get_user_model()
        assert User._meta.model_name == 'user'
    
    def test_database_connection(self):
        """Test database is accessible"""
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            assert result[0] == 1