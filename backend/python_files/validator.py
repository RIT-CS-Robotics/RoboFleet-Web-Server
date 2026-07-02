"""
File: validator.py
Date: 7/1/2026
Author:

Functionality: Validates code to check for syntax errors and illegal actions and 
returns the validation result as success or failure to decide to run the code or not.
"""

import sys
import os
import ast
from enum import Enum

# Validation results
class check(Enum):
    VALID = 0
    INVALID = 1

### Helper functions ###

"""
Constructs the ast tree for validation.

@param: file_path - The file path for the code to validate.
@except: SyntaxError - The code has a syntax error (returns None for failed validation).
@except: Exception - The code has a file reading error (returns None for failed validation).
@return: The ast tree of the code from the code file.
"""
def get_tree(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as code_file:
            code = code_file.read()
            tree = ast.parse(code)
    except SyntaxError as err:
        print(f"Error Message: {err.msg}", file=sys.stderr)
        print(f"Line Number: {err.lineno}", file=sys.stderr)
        print(f"Line: {err.text.rstrip()}", file=sys.stderr)
        print("      " + " " * (err.offset - 1) + "^", file=sys.stderr)
        tree = None
    except Exception:
        print("VALIDATION ERROR", file=sys.stderr)
        tree = None
    return tree


### Validation functions ###
### NOTE: IMPLEMENT NEEDED VALIDATION FUNCTIONS HERE WITH THE AST TREE AS THE PARAMETER ###

"""
Checks the code for any illegal imports or calls.

@param: tree - The ast tree for the code to validate for.
@return: check.INVALID for any illegal imports or calls, check.VALID otherwise.
"""
def validate_illegal(tree):
    ### NOTE: ADD ALLOWED MODULES HERE ###
    allowed_modules = {
    'robot'
    }

    ### NOTE: ADD BANNED BUILTINS HERE ###
    banned_builtins = {
    'eval', 'exec', 'open', 'compile', '__import__',
    'getattr', 'setattr', 'delattr', 'globals', 'locals'
    }

    ### NOTE: ADD BANNED OPERATIONS HERE ###
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
    
    # checks every ast tree node
    for node in ast.walk(tree):
        # import check
        if isinstance(node, ast.Import):
            for module in node.names:
                if module.name not in allowed_modules:
                    print(f"ILLEGAL IMPORT: '{module.name}'", file=sys.stderr)
                    return check.INVALID
        
        # import from check
        elif isinstance(node, ast.ImportFrom):
            if node.module not in allowed_modules:
                print(f"ILLEGAL IMPORT: '{node.module}'", file=sys.stderr)
                return check.INVALID
        
        # ast name checks
        elif isinstance(node, ast.Name):
            # builtins check
            if node.id in banned_builtins:
                print(f"BANNED BUILTINS: '{node.id}'", file=sys.stderr)
                return check.INVALID
            # operations check
            if node.id in banned_operations:
                print(f"BANNED OPERATIONS: '{node.id}'", file=sys.stderr)
                return check.INVALID
            # dunder check
            if node.id.startswith('__'):
                print(f"ILLEGAL -> STARTS WITH __: '{node.id}'", file=sys.stderr) 
                return check.INVALID

        # ast attribute checks
        elif isinstance(node, ast.Attribute):
            # builtins check
            if node.attr in banned_builtins:
                print(f"BANNED BUILTINS: '{node.attr}'", file=sys.stderr)
                return check.INVALID
            # operations check
            if node.attr in banned_operations:
                print(f"BANNED OPERATIONS: '{node.attr}'", file=sys.stderr)
                return check.INVALID
            # dunders check
            if node.attr.startswith('__'):
                print(f"ILLEGAL -> STARTS WITH __: '{node.attr}'", file=sys.stderr)
                return check.INVALID
    
    print("VALIDATE ILLEGAL: PASSED", file=sys.stdout)
    return check.VALID

"""
Runs the validation tests to validate the code.

@argv[1]: The code file to validate code from.
@exit(0): Exit success for successful validation (check.VALID).
@exit(1): Exit failure for failed validation (check.INVALID).
"""
def main():
    # code file to validate for
    file_path = sys.argv[1]

    # gets the ast tree
    tree = get_tree(file_path)
    if not tree:
        sys.exit(check.INVALID.value)

    valid = check.VALID

    ### ADD TESTS HERE ###
    ### NOTE: ALL TESTS MUST TAKE IN AST TREE AS ONLY PARAMETER ###
    validator_tests = [
    validate_illegal
    ]

    #runs all validation tests
    for test in validator_tests:
        valid = test(tree)
        if valid == check.INVALID:
            break

    # exits with success (0) or failure (1) to validate the code
    sys.exit(valid.value)

if __name__ == "__main__":
    main()