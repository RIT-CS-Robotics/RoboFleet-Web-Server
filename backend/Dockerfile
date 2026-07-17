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
COPY ./code_files/Robot.java /app/robot/Robot.java

# Compile the internal Robot framework class inside the image
RUN javac /app/robot/Robot.java

# Switch to the non-root user
USER nobody:nogroup

# SMART LAYER: Instantly executes Python if present; otherwise cleanly compiles and executes StudentCode.java out of RAM
CMD ["sh", "-c", "if [ -f user_code.py ]; then exec python3 -u user_code.py; elif [ -f StudentCode.java ]; then mkdir -p /tmp/classes && javac -d /tmp/classes -cp . StudentCode.java && exec java -cp .:/tmp/classes StudentCode; else echo \"Execution Error: No valid student code found inside the container.\" >&2; exit 1; fi"]
