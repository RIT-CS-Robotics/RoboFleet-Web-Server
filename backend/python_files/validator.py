import sys
import os
import ast
from enum import Enum

class check(Enum):
    VALID = 0
    INVALID = 1

### Helper functions ###

def get_code(file_path):
    with open(file_path, 'r') as code_file:
        code = code_file.read()
        return code



### Validation functions ###

def validate_syntax(file_path):
    valid = check.VALID
    return valid

def validate_operations(file_path):
    valid = check.VALID
    return valid

def validate_illegal(file_path):
    allowed_modules = {
            # --- Python Standard Library Frameworks ---
    'sys', 'os', 'ast', 'queue', 'threading', 'time', 'logging', 'socket', 'contextlib', 'math',
    
    # --- Interactive Media Drivers ---
    'pyttsx3', 'pygame', 'speech_recognition',
    
    # --- ROS2 & Nav2 System Frameworks ---
    'rclpy', 
    'ament_index_python', 
    'geometry_msgs.msg', 
    'nav2_msgs.action', 
    'nav_msgs.msg', 
    'vision_msgs.msg', 
    'sensor_msgs.msg',
    
    # --- Your Custom Local Extensions ---
    'extras',  # Contains PointDataset and PoseReader

    'robot'
    }

    banned_operations = {    # --- Standard High-Risk OS Exploits ---
    'system', 'popen', 'rmdir', 'remove', 'unlink', 'eval', 'exec',
    
    # --- Network Infrastructure Hijacking ---
    'connect',   # Blocks rogue secondary outbound network connections
    'bind',      # Prevents unauthorized secondary listening ports 
    'shutdown',  # Blocks cutting off rclpy nodes or sockets abruptly
    
    # --- ROS2 State Disruptions ---
    'destroy_node', # Prevents destroying active listener/pose reader nodes
    'publish',      # Forces scripts to use your safe move/rotate logic instead of 
                    # broadcasting raw motor strings directly to '/cmd_vel'
                    
    # --- Peripheral Sabotage (Audio & Hardware) ---
    'init',  # Stops scripts from re-initializing pygame.mixer or pyttsx3 engines mid-loop
    'stop'   # Prevents scripts from cutting off active text-to-speech outputs
    }

    try:
        code = get_code(file_path)
    except Exception:
        print("VALIDATOR FILE READING ERROR", file=sys.stderr)
        return check.INVALID
    
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return check.VALID
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for module in node.names:
                if module.name not in allowed_modules:
                    print("ALLOWED MODULE ERROR: Import", file=sys.stderr)
                    return check.INVALID
        
        elif isinstance(node, ast.ImportFrom):
            if node.module not in allowed_modules:
                print("ALLOWED MODULE ERROR: ImportFrom", file=sys.stderr)
                return check.INVALID
        
        elif isinstance(node, ast.Call):
            function_name = None
            if isinstance(node.func, ast.Name):
                function_name = node.func.id
            elif isinstance(node.func, ast.Attribute):
                function_name = node.func.attr
            
            if function_name in banned_operations:
                print("BANNED OPERATION ERROR", file=sys.stderr)
                return check.INVALID
    
    return check.VALID

### Main ###

def main():
    file_path = sys.argv[1]
    valid = check.VALID

    validator_tests = [
    validate_syntax, 
    validate_operations, 
    validate_illegal
    ]

    for test in validator_tests:
        valid = test(file_path)
        if valid == check.INVALID:
            break

    sys.exit(valid.value)

if __name__ == "__main__":
    main()