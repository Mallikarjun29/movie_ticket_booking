#!/bin/bash

# Start the API server
python api.py &

# Start the Celery Beat scheduler
celery -A api.celery beat &

# Start the Celery worker
celery -A api.celery worker &

# Start the Redis server
redis-server &

# Open a web browser to the application
open http://127.0.0.1:5000/login.html
