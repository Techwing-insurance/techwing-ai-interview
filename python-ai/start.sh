#!/bin/bash
# Production Start Script for Python AI Service
# Starts Uvicorn with 4 workers to handle multiple concurrent requests

uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
