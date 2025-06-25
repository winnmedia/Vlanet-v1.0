#!/bin/bash
echo "Starting VideoPlanet Backend..."
cd /app/vridge_back
export DJANGO_SETTINGS_MODULE=config.settings.railway_simple
gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}