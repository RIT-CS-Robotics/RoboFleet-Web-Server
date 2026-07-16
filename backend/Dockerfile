FROM python:3.11-slim

# Install the default headless Java Development Kit available for this Debian release
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Create a restricted user
RUN useradd -m studentuser
WORKDIR /app

# Copy your custom robot library from code_files directly into the container's app directory
COPY ./code_files/robot.py /app/robot.py

# Switch to the non-root user
USER nobody:nogroup

CMD ["python3", "-u", "user_code.py"]
