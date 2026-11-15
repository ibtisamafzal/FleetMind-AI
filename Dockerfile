FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Generate datasets and train models if not already present
RUN python ml/data/generate_synthetic_data.py && \
    python ml/train_delay_model.py && \
    python ml/train_risk_model.py

EXPOSE 8000

CMD ["python", "run_app.py"]
