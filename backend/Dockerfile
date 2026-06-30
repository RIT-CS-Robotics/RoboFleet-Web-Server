FROM python:3.11-slim

# Create a restricted user
RUN useradd -m studentuser

WORKDIR /app

# Copy your custom robot library from python_files directly into the container's app directory
COPY ./python_files/robot.py /app/robot.py

# Switch to the non-root user
USER nobody:nogroup

CMD ["python3", "-u", "user_code.py"]
