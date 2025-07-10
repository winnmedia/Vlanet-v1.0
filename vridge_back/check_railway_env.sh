#!/bin/bash
echo "=== Railway Environment Check ==="
echo "PORT: $PORT"
echo "RAILWAY_ENVIRONMENT: $RAILWAY_ENVIRONMENT"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "SECRET_KEY: ${SECRET_KEY:0:10}..."
echo "REDIS_URL: ${REDIS_URL:0:30}..."
echo ""
echo "Python version:"
python3 --version
echo ""
echo "Pip packages:"
pip list | grep -E "(django|gunicorn|psycopg2|redis)"
echo ""
echo "Current directory:"
pwd
echo ""
echo "Files in directory:"
ls -la | head -10