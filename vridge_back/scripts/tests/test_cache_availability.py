#!/usr/bin/env python3
"""
Test if cache is properly configured and working
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.cache import cache
from django.conf import settings
import time

print("=== CACHE CONFIGURATION TEST ===")
print(f"Current settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
print(f"DEBUG: {settings.DEBUG}")

# Check cache backend
try:
    cache_backend = settings.CACHES.get('default', {}).get('BACKEND', 'Not configured')
    print(f"Cache backend: {cache_backend}")
except:
    print("ERROR: CACHES not configured in settings!")
    cache_backend = None

# Test cache operations
print("\n=== TESTING CACHE OPERATIONS ===")

# Test 1: Set and get
test_key = "test_cache_key"
test_value = {"test": "value", "timestamp": time.time()}

try:
    # Set value
    cache.set(test_key, test_value, 30)
    print("✓ Cache SET operation successful")
    
    # Get value
    retrieved = cache.get(test_key)
    if retrieved == test_value:
        print("✓ Cache GET operation successful")
        print(f"  Retrieved value: {retrieved}")
    else:
        print("✗ Cache GET failed - value mismatch")
        print(f"  Expected: {test_value}")
        print(f"  Got: {retrieved}")
        
    # Delete value
    cache.delete(test_key)
    print("✓ Cache DELETE operation successful")
    
    # Verify deletion
    deleted_value = cache.get(test_key)
    if deleted_value is None:
        print("✓ Cache deletion verified")
    else:
        print("✗ Value still exists after deletion")
        
except Exception as e:
    print(f"✗ Cache operations failed: {str(e)}")
    print(f"  Error type: {type(e).__name__}")
    
    # Check if it's a connection error
    if "Connection" in str(e) or "connect" in str(e).lower():
        print("\nERROR: Cannot connect to cache backend!")
        print("This means idempotency checks will NOT work!")
        print("\nPossible causes:")
        print("1. Redis is not running")
        print("2. REDIS_URL environment variable is not set")
        print("3. Network/firewall issues")
        
# Test 2: Check if cache is dummy
print("\n=== CACHE BACKEND ANALYSIS ===")
if cache_backend:
    if 'DummyCache' in cache_backend:
        print("WARNING: Using DummyCache - this does nothing!")
        print("Idempotency will NOT work with DummyCache!")
    elif 'LocMemCache' in cache_backend:
        print("WARNING: Using LocMemCache - only works within single process!")
        print("Multiple workers will NOT share cache!")
    elif 'RedisCache' in cache_backend or 'redis' in cache_backend.lower():
        print("✓ Using Redis cache - good for production")
    else:
        print(f"INFO: Using {cache_backend}")

# Test 3: Simulate idempotency check
print("\n=== SIMULATING IDEMPOTENCY CHECK ===")
idempotency_key = "test_idempotency_123"
cache_key = f"project_creation_{idempotency_key}"

try:
    # First request
    existing = cache.get(cache_key)
    if existing:
        print("✗ Unexpected: Found existing entry")
    else:
        print("✓ First request: No existing entry found")
        
    # Set processing flag
    cache.set(cache_key, {"message": "processing"}, 30)
    print("✓ Set processing flag")
    
    # Second request (duplicate)
    duplicate = cache.get(cache_key)
    if duplicate and duplicate.get("message") == "processing":
        print("✓ Duplicate request would be blocked!")
    else:
        print("✗ Duplicate request would NOT be blocked!")
        
    # Clean up
    cache.delete(cache_key)
    
except Exception as e:
    print(f"✗ Idempotency simulation failed: {str(e)}")
    print("This means duplicate requests will NOT be prevented!")

print("\n=== RECOMMENDATIONS ===")
if not cache_backend or 'DummyCache' in str(cache_backend):
    print("1. Set REDIS_URL environment variable in production")
    print("2. Or configure a proper cache backend in settings")
    print("3. Without cache, idempotency checks don't work!")
else:
    print("Cache seems properly configured.")
    print("If duplicates still occur, check:")
    print("1. Network latency causing timeouts")
    print("2. Client-side retry logic")
    print("3. Load balancer/proxy retry settings")