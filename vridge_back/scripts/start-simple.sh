#!/bin/bash
echo "Starting VideoPlanet Backend..."
cd /app/vridge_back

# Use environment variable if set, otherwise use railway
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.railway}
echo "Using Django settings: $DJANGO_SETTINGS_MODULE"

# Database URL 확인
echo "Database URL available: ${DATABASE_URL:+Yes}"
echo "Railway Database URL available: ${RAILWAY_DATABASE_URL:+Yes}"

# Create staticfiles directory to avoid warning
mkdir -p /app/vridge_back/staticfiles

# Show migration status before running
echo "Current migration status:"
python manage.py showmigrations feedbacks || echo "Failed to show migrations"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --no-input || echo "Migration failed, but continuing..."

# Specifically migrate feedbacks app
echo "Running feedbacks app migrations..."
python manage.py migrate feedbacks --no-input || echo "Feedbacks migration failed, but continuing..."

# Show migration status after running
echo "Migration status after running:"
python manage.py showmigrations feedbacks || echo "Failed to show migrations"

# Create cache table if using database cache
echo "Creating cache table..."
python manage.py createcachetable || echo "Cache table may already exist"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Gunicorn 시작
echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --threads 2 \
    --timeout 30 \
    --access-logfile - \
    --error-logfile - \
    --log-level info