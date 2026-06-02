#!/bin/bash
# Load local .env file if it exists inside the backend folder
if [ -f .env ]; then
  echo "Loading environment configurations from .env..."
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "Starting FastAPI server on port 8000..."
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
