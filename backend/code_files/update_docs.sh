#!/bin/bash

# Output directories for code documentation
FRONTEND_DIR="../../status_frontend/src/components/resources"
PYTHON_DOC_DIR="$FRONTEND_DIR/python_api/python_docs.txt"
JAVA_DOC_DIR="$FRONTEND_DIR/java_api/java_docs.txt"

echo "Starting documentation output..."

# Python documentation output
if [ -f "robot.py" ]; then

    echo "Processing documentation output for robot.py"

    python3 -c "

###
### CLONES ROBOT.PY INTO CLONE.PY TO GET RID OF IMPORTS MESSING UP PYDOC ###
###

with open('clone.py', 'w') as write_file:
    with open('robot.py', 'r') as read_file:
        for line in read_file:
            clean_line = line.strip()
            if not clean_line.startswith('import'):
                write_file.write(line)
"

    python3 -m pydoc clone | python3 -c "

###
### USES PYDOC ON CLONE.PY TO GENERATE THE ROBOT.PY DOCUMENTATION AND OUTPUT IT FOR THE RESOURCE STATUS PAGE FRONTEND ###
###

import sys, re

for line in sys.stdin:
    # Clean up hidden terminal text-bolding artifacts
    clean_line = re.sub(r'.\x08', '', line)
    
    # Matches lines having optional spaces, a pipe, exactly two spaces, and a valid Python function signature
    if re.search(r'^\s*\|\s{2}[a-zA-Z_][a-zA-Z0-9_]*\(', clean_line):
        print('###')
        
    sys.stdout.write(clean_line)
" > $PYTHON_DOC_DIR

    rm clone.py

    echo "Python docs updated at: $PYTHON_DOC_DIR"

else

    echo "Error with updating Python docs at: $PYTHON_DOC_DIR"

fi

# Java documentation output
if [ -f "Robot.java" ]; then

    echo "Processing documentation output for Robot.java"

    python3 -c "

###
### READS ROBOT.JAVA AND FINDS THE METHOD DECLERATIONS AND BUILDS A FILE OF THIER DOCUMENTATION TO OUTPUT TO THE RESOURCE STATUS PAGE FRONTEND ###
###
import re, os

java_file = 'Robot.java'
out_path = '$JAVA_DOC_DIR'

with open(java_file, 'r') as f:
    lines = f.readlines()

output = ['Help on Java class Robot:\n\n', 'METHODS\n']
current_doc = []
in_doc = False

for line in lines:
    stripped = line.strip()
    if stripped.startswith('/**'):
        in_doc = True; current_doc = []
        continue
    if stripped.endswith('*/') and in_doc:
        in_doc = False; continue
    if in_doc:
        doc_line = re.sub(r'^\s*\*\s*', '', line).rstrip()
        if doc_line: current_doc.append(doc_line)
        continue

    if ('(' in line) and not any(k in stripped for k in ['if', 'for', 'while', 'switch', 'return', 'catch', '=']) and not stripped.startswith('//'):
        if any(stripped.startswith(mod) for mod in ['public', 'private', 'protected', 'static']):
            clean_sig = re.sub(r'\s*\{.*', '', stripped)
            if clean_sig:
                output.append('###\n')
                output.append(f'    |  {clean_sig}\n')
                if current_doc:
                    for d in current_doc:
                        output.append(f'    |      {d}\n')
                    current_doc = []
                output.append('    |  \n')
        else:
            current_doc = []

with open(out_path, 'w') as out_f:
    out_f.writelines(output)
"

    echo "Java docs updated at: $JAVA_DOC_DIR"

else

    echo "Error with updating Java docs at: $JAVA_DOC_DIR"

fi

echo "Finished attempting to update frontend documentation files in $FRONTEND_DIR for robot.py and Robot.java"

echo "Flushing backend logs..."
pm2 flush

echo "Restarting website..."
pm2 restart all

echo "Checking website connections, errors, and status..."
pm2 list

echo "update_docs.sh complete"