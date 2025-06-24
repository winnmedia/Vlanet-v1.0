web: gunicorn --chdir vridge_back config.wsgi:application --bind 0.0.0.0:$PORT
release: python vridge_back/manage.py migrate --settings=config.settings.railway