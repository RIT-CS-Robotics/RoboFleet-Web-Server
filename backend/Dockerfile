FROM python:3.11-slim

# Silence the interactive frontend warnings completely
ENV DEBIAN_FRONTEND=noninteractive

# Install only OpenCV Headless (automatically includes necessary networking for sockets)
RUN pip install --no-cache-dir opencv-python-headless numpy

# Create a restricted user and ensure they have a writable home directory structure
RUN useradd -m studentuser && \
    mkdir -p /home/studentuser/classes && \
    chown -R nobody:nogroup /home/studentuser

# Set working directory to the framework root
WORKDIR /app

# Copy only the necessary python robot script
COPY ./code_files/robot.py /app/robot.py

# Switch context to the workspace directory where the host folder will mount
WORKDIR /app/workspace

# Switch to the non-root user
USER nobody:nogroup

# Clear legacy entrypoints caching from previous builds
ENTRYPOINT []

# Streamlined Execution Layer for Python
CMD ["sh", "-c", "PY_FILE=$(ls *.py 2>/dev/null | head -n 1); if [ -n \"$PY_FILE\" ]; then export PYTHONPATH=/app:$PYTHONPATH; export PYTHONPYCACHEPREFIX=/tmp/pycache; exec python3 -u \"$PY_FILE\"; else echo \"Execution Error: No valid student code found inside the container.\" >&2; exit 1; fi"]
