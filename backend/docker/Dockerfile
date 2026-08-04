FROM python:3.11-slim

# Silence the interactive frontend warnings completely
ENV DEBIAN_FRONTEND=noninteractive

# Install OpenCV Headless, Numpy, and resolve the Debian-slim headless Java manpath bug
RUN apt-get update && \
    mkdir -p /usr/share/man/man1 && \
    apt-get install -y --no-install-recommends \
    default-jdk-headless \
    && pip install --no-cache-dir opencv-python-headless numpy \
    && rm -rf /var/lib/apt/lists/*

# Create a restricted user structure matching your legacy cache
RUN useradd -m studentuser

# Set working directory to the framework root
WORKDIR /app

# Put the files back into the root /app folder for Python tracking
COPY ./code_files/robot.py /app/robot.py

# Place Robot.java inside an explicit /app/robot folder to satisfy Java's package constraint
COPY ./code_files/Robot.java /app/robot/Robot.java

# Compile Robot.java from within /app so it generates the package class accurately
RUN javac /app/robot/Robot.java

# Copy the entrypoint routing script into the image and give it permission
COPY ./docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch context to the workspace directory where the host folder will mount
WORKDIR /app/workspace

# Switch to the non-root user
USER nobody:nogroup

# Route the container startup directly to the script
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
