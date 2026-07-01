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
    'robot'
    }

    banned_builtins = {
    'eval', 'exec', 'open', 'compile', '__import__',
    'getattr', 'setattr', 'delattr', 'globals', 'locals'
    }

    banned_operations = { 
    # Standard High-Risk Exploits
    'system', 'popen', 'rmdir', 'remove', 'unlink', 
    # Network Infrastructure Hijacking
    'connect', 'bind', 'shutdown', 
    # ROS2 State Disruptions
    'destroy_node', 'publish', 
    # Peripheral Sabotage
    'init', 'stop'
    }

    try:
        code = get_code(file_path)
    except Exception:
        print("VALIDATOR FILE READING ERROR", file=sys.stderr)
        return check.INVALID
    
    try:
        tree = ast.parse(code)
    except SyntaxError:
        print("VALIDATE ILLEGAL: N/A (SyntaxError)", file=sys.stderr)
        return check.VALID
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for module in node.names:
                if module.name not in allowed_modules:
                    print(f"ALLOWED MODULE ERROR: Import '{module.name}'", file=sys.stderr)
                    return check.INVALID
        
        elif isinstance(node, ast.ImportFrom):
            if node.module not in allowed_modules:
                print(f"ALLOWED MODULE ERROR: ImportFrom '{node.module}'", file=sys.stderr)
                return check.INVALID
        
        elif isinstance(node, ast.Name):
            if node.id in banned_builtins:
                print(f"BANNED BUILTINS ERROR: NAME '{node.id}'", file=sys.stderr)
                return check.INVALID
            if node.id in banned_operations:
                print(f"BANNED OPERATIONS ERROR: NAME '{node.id}'", file=sys.stderr)
                return check.INVALID
            if node.id.startswith('__'):
                print(f"STARTS WITH __ ERROR: NAME '{node.id}'", file=sys.stderr) 
                return check.INVALID

        elif isinstance(node, ast.Attribute):
            if node.attr in banned_builtins:
                print(f"BANNED BUILTINS ERROR: ATTRIBUTE '{node.attr}'", file=sys.stderr)
                return check.INVALID
            if node.attr in banned_operations:
                print(f"BANNED OPERATIONS ERROR: ATTRIBUTE '{node.attr}'", file=sys.stderr)
                return check.INVALID
            if node.attr.startswith('__'):
                print(f"STARTS WITH __ ERROR: ATTRIBUTE '{node.attr}'", file=sys.stderr)
                return check.INVALID
    
    print("VALIDATE ILLEGAL: PASSED", file=sys.stdout)
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