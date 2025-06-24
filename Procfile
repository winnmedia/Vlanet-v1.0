web: cd vridge_back && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
release: cd vridge_back && python manage.py migrate --settings=config.settings.railway