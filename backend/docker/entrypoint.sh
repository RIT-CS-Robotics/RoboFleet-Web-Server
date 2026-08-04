#!/bin/bash
# Stop the script immediately if any internal command fails
set -e

# Scan the mounted workspace directory
PY_FILE=$(ls *.py 2>/dev/null | head -n 1)
JAVA_FILE=$(ls *.java 2>/dev/null | head -n 1)

if [ -n "$PY_FILE" ]; then
    echo "Python code detected. Launching framework environment..."
    export PYTHONPATH=/app:$PYTHONPATH
    export PYTHONPYCACHEPREFIX=/tmp/pycache
    exec python3 -u "$PY_FILE"

elif [ -n "$JAVA_FILE" ]; then
    echo "Java code detected. Initializing RAM sandbox compilation layer..."
    CLASS_NAME=$(basename "$JAVA_FILE" .java)
    
    # Replicate your exact compiler and execution sandboxing rules
    mkdir -p /tmp/classes
    javac -d /tmp/classes -cp /app:. "$JAVA_FILE"
    exec java -cp /app:/app/workspace:/tmp/classes "$CLASS_NAME"

else
    echo "Execution Error: No valid student code found inside the container." >&2
    exit 1
fi
