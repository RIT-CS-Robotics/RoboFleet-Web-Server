/**
 * Functionality: Validates RoboFleet Java code to check for syntax errors and illegal actions and
 * returns the validation result as success or failure to decide to run the code or not.
 * 
 * @file: Validator.java
 * @author: Aidan Sanderson
 * @date: 7/1/2026
 */

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ParseProblemException;
import com.github.javaparser.Problem;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Set;
import java.util.function.Function;

/**
 * The Validator Object
 */
public class Validator {

    // Enum for valid or invalid numerical exit values
    private enum Check {
        VALID(0), INVALID(1);

        private final int value;

        Check(int value) {
            this.value = value;
        }

        public int getValue() {
            return this.value;
        }
    }

    // Exception while validating object
    private static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
    }

    /**
     * Gets the compilation tree for the Java code to be able to validate it for RoboFleet standards.
     * 
     * @param filePath: The file path for the file containing the code to validate.
     * @return: The compilation tree of the code.
     */
    private static CompilationUnit getTree(String filePath) {
        try {
            File file = new File(filePath);
            CompilationUnit tree = StaticJavaParser.parse(file);
            return tree;
        } catch (FileNotFoundException e) {
            System.err.println("VALIDATION ERROR: File not found - " + filePath);
            return null;
        } catch (ParseProblemException e) {
            System.err.println("VALIDATION ERROR: Failed to parse Java code.");
            for (Problem problem : e.getProblems()) {
                System.err.println(problem.getMessage());
            }
            return null;
        }
    }

    /* ==================== Validation functions ==================== */

    /**
     * Checks the code for any illegal imports or calls.
     *
     * @param tree: The ast tree for the code to validate for.
     * @return: Check.INVALID for any illegal imports or calls, Check.VALID otherwise.
     */
    private static Check validateIllegal(CompilationUnit tree) {
        /* NOTE: ADD ALLOWED PACKAGES HERE */
        // Added "java" so students can use basic language features (like java.util.List)
        Set<String> allowedModules = Set.of(
            "robot", "java"
        );

        /* NOTE: ADD BANNED PACKAGES AND UTILITIES HERE */
        Set<String> bannedBuiltins = Set.of(
            "reflect", "network", "Socket", "URL", "URLConnection", "Net", 
            "io", "nio", "File", "FileReader", "FileWriter", "Path", "Paths"
        );

        /* NOTE: ADD BANNED EXPLOIT OPERATIONS HERE */
        // Catches process spawners, thread exploits, and dangerous robot overrides
        Set<String> bannedOperations = Set.of(
            // Process Hijacking / Command Execution
            "Runtime", "getRuntime", "ProcessBuilder", "exec",
            // Thread Manipulations
            "Thread", "ThreadGroup", "ClassLoader", "System",
            // Destructive Robot Commands
            "destroy_node", "publish"
        );

        try {
            // Tree scanner to walk through specific nodes sequentially
            tree.accept(new VoidVisitorAdapter<Void>() {
                @Override
                public void visit(ImportDeclaration n, Void arg) {
                    super.visit(n, arg);
                    String importName = n.getNameAsString();
                    
                    String rootPackage = importName.contains(".") ? importName.split("\\.")[0] : importName;

                    if (!allowedModules.contains(rootPackage)) {
                        System.err.println("ILLEGAL IMPORT: '" + importName + "'");
                        throw new ValidationException("Invalid import");
                    }

                    // Deep check to verify they didn't import a banned package like java.lang.reflect
                    for (String banned : bannedBuiltins) {
                        if (importName.contains(banned)) {
                            System.err.println("BANNED PACKAGE IMPORTED: '" + importName + "'");
                            throw new ValidationException("Banned package import");
                        }
                    }
                }

                // ast name checks (Variables, variable usage, or class identifiers)
                @Override
                public void visit(NameExpr n, Void arg) {
                    super.visit(n, arg);
                    checkIdentifier(n.getNameAsString());
                }

                // ast attribute / call checks (Method properties and functions)
                @Override
                public void visit(MethodCallExpr n, Void arg) {
                    super.visit(n, arg);
                    checkIdentifier(n.getNameAsString());
                }

                // Internal shared verification module
                private void checkIdentifier(String id) {
                    // builtins check
                    if (bannedBuiltins.contains(id)) {
                        System.err.println("BANNED UTILITY DETECTED: '" + id + "'");
                        throw new ValidationException("Banned utility");
                    }

                    // operations check
                    if (bannedOperations.contains(id)) {
                        System.err.println("BANNED OPERATION DETECTED: '" + id + "'");
                        throw new ValidationException("Banned operation");
                    }

                    // dunder check (Kept just in case students write weird tokens)
                    if (id.startsWith("__")) {
                        System.err.println("ILLEGAL -> STARTS WITH __: '" + id + "'");
                        throw new ValidationException("Starts with dunder");
                    }
                }
            }, null);
        } catch (ValidationException e) {
            return Check.INVALID;
        }

        System.out.println("VALIDATE ILLEGAL: PASSED");
        return Check.VALID;
    }

    @SuppressWarnings("unchecked") // suppresses warnings that are not important
    public static void main(String[] args) {
        // checks for correct number of args
        if (args.length != 1) {
            System.err.println("VALIDATION ERROR: Missing file path argument.");
            System.exit(Check.INVALID.getValue());
        }

        // code file to validate for
        String filePath = args[0];

        // gets the compilation tree to use to validate the code
        CompilationUnit tree = getTree(filePath);
        if (tree == null) {
            System.exit(Check.INVALID.getValue());
        }

        Check valid = Check.VALID;

        // Instantiates the functional reference inside a separate variable first to bypass generic array limitations
        Function<CompilationUnit, Check> illegalTest = Validator::validateIllegal;
        Function<CompilationUnit, Check>[] validatorTests = (Function<CompilationUnit, Check>[]) new Function[] { 
            illegalTest 
        };

        // runs all validation tests
        for (Function<CompilationUnit, Check> test : validatorTests) {
            valid = test.apply(tree);
            if (valid == Check.INVALID) {
                break;
            }
        }

        // exits with success (0) or failure (1) to validate the code
        System.exit(valid.getValue());
    }
}
