#!/bin/bash
set -e

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
cd vridge_front
npm install
npm run build
cd ..

# Collect static files
cd vridge_back
python manage.py collectstatic --noinput --settings=config.settings.railway