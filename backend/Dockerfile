FROM python:3.11-slim

# Install the default headless Java Development Kit available for this Debian release
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Create a restricted user
RUN useradd -m studentuser

# Set working directory to the framework root
WORKDIR /app

# 1. FIXED: Put your files back into the root /app folder for Python tracking
COPY ./code_files/robot.py /app/robot.py

# 2. FIXED: Place Robot.java inside an explicit /app/robot folder to satisfy Java's package constraint
COPY ./code_files/Robot.java /app/robot/Robot.java

# 3. FIXED: Compile Robot.java from within /app so it generates the package class accurately
RUN javac /app/robot/Robot.java

# Switch context to the workspace directory where the host folder will mount
WORKDIR /app/workspace

# Switch to the non-root user
USER nobody:nogroup

# Clear legacy entrypoints caching from previous builds
ENTRYPOINT []

# SMART LAYER: Scans /app/workspace, compiles out of RAM, and retains access to the /app framework classpath
CMD ["sh", "-c", "PY_FILE=$(ls *.py 2>/dev/null | head -n 1); JAVA_FILE=$(ls *.java 2>/dev/null | head -n 1); if [ -n \"$PY_FILE\" ]; then export PYTHONPATH=/app:$PYTHONPATH; exec python3 -u \"$PY_FILE\"; elif [ -n \"$JAVA_FILE\" ]; then CLASS_NAME=$(basename \"$JAVA_FILE\" .java); mkdir -p /tmp/classes && javac -d /tmp/classes -cp /app:. \"$JAVA_FILE\" && exec java -cp /app:/app/workspace:/tmp/classes \"$CLASS_NAME\"; else echo \"Execution Error: No valid student code found inside the container.\" >&2; exit 1; fi"]
