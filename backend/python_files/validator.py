import sys
import os
from enum import Enum

check = Enum('check', {'VALID' : 0, 'INVALID' : 1})

def validate_syntax(code):
    valid = check.VALID
    return valid

def validate_operations(code):
    valid = check.VALID
    return valid

def validate_illegal(code):
    valid = check.VALID
    return valid

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