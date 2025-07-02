# Root Cause Analysis: Duplicate Project Creation

## Executive Summary

The duplicate project creation issue is caused by **Redis cache not being available in production**, which breaks the idempotency mechanism. When multiple requests arrive quickly (from multiple tabs/domains or network retries), they all pass the cache check and create duplicate projects.

## Root Causes Identified

### 1. **Primary Issue: Cache Configuration**
- Production settings only configure Redis if `REDIS_URL` environment variable is set
- If Redis is not available, the idempotency checks using cache fail silently
- No fallback mechanism when cache is unavailable

```python
# In settings_prod.py
if os.environ.get('REDIS_URL'):  # This condition might be False!
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL'),
        }
    }
# No else clause - so no cache backend at all!
```

### 2. **Secondary Issue: Multiple Domains**
- Application is accessible from multiple domains:
  - `vlanet.net`
  - `www.vlanet.net`
  - `vlanet-v1-0.vercel.app`
  - `vridge-front-production.up.railway.app`
- Users might have multiple tabs open on different domains
- Each domain makes independent requests

### 3. **Contributing Factors**
- No database-level constraints to prevent duplicates
- Frontend allows button to be clicked multiple times in quick succession
- No request deduplication at the infrastructure level

## Immediate Solution

### 1. **Fix Cache Configuration**
Update `/vridge_back/config/settings_prod.py` to always have a cache backend:

```python
# Cache settings - ALWAYS configure a cache backend
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    # Fallback to database cache if Redis not available
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'django_cache_table',
        }
    }
    # Note: You need to run: python manage.py createcachetable
```

### 2. **Implement Robust Idempotency**
Use the improved view with database fallback (`views_idempotent_fixed.py`):

```python
# In urls.py
path("create", views_idempotent_fixed.CreateProjectIdempotentFixed.as_view()),
```

This includes:
- Cache availability detection
- Database-based idempotency records as fallback
- Multiple duplicate prevention mechanisms

### 3. **Add Database Migration**
Run the migration to create the IdempotencyRecord table:

```bash
python manage.py makemigrations projects
python manage.py migrate
```

## Long-term Recommendations

### 1. **Infrastructure Level**
- Ensure Redis is properly provisioned and `REDIS_URL` is set
- Add monitoring for Redis availability
- Implement request deduplication at load balancer/CDN level
- Use a single canonical domain and redirect others

### 2. **Application Level**
- Add database constraints:
  ```python
  class Meta:
      constraints = [
          models.UniqueConstraint(
              fields=['user', 'name', 'created__date'],
              name='unique_project_per_user_per_day'
          )
      ]
  ```

### 3. **Frontend Improvements**
- Implement request tracking with correlation IDs
- Add debouncing to prevent rapid clicks
- Show loading overlay to prevent user interaction during submission
- Clear localStorage/sessionStorage on successful submission

### 4. **Monitoring**
- Log all project creation attempts with detailed metadata
- Set up alerts for duplicate creation attempts
- Monitor cache hit/miss rates
- Track idempotency key usage

## Testing the Fix

1. **Check if Redis is available:**
   ```bash
   python manage.py shell
   from django.core.cache import cache
   cache.set('test', 'value', 30)
   print(cache.get('test'))  # Should print 'value'
   ```

2. **Test duplicate prevention:**
   - Open multiple browser tabs
   - Submit the same project quickly from different tabs
   - Check that only one project is created

3. **Monitor logs:**
   ```bash
   tail -f django.log | grep -E "DUPLICATE|PROJECT CREATION|Idempotency"
   ```

## Emergency Hotfix

If you need an immediate fix without code changes:

1. **Set REDIS_URL in production:**
   ```bash
   export REDIS_URL=redis://your-redis-host:6379/0
   ```

2. **Or use local Redis as temporary solution:**
   ```bash
   export REDIS_URL=redis://localhost:6379/0
   ```

3. **Restart the application**

## Conclusion

The root cause is the absence of a cache backend in production when Redis is not configured. The idempotency mechanism relies on cache operations that fail silently, allowing duplicate requests to proceed. The solution involves ensuring a cache backend is always available and implementing multiple layers of duplicate prevention.