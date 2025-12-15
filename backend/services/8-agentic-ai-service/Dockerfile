
FROM python:3.11-slim

WORKDIR /app

# Copy requirements file first
COPY requirements.txt .

# Install dependencies using a faster mirror
RUN pip install --no-cache-dir --index-url https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# Copy the application source code
COPY ./src ./src

# Expose the port the app runs on
EXPOSE 8001

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
