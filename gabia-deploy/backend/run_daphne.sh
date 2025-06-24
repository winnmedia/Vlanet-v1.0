#!/bin/sh
sudo systemctl restart daphne.service
sudo systemctl restart daphne2.service
sudo systemctl restart daphne3.service
sudo systemctl restart gunicorn.service
