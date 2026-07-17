package robot;

import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.Socket;

public class Robot implements AutoCloseable {
    private static final int PORT = 10001;

    private Socket socket;
    private PrintWriter writer;

    /**
     * Initializes a persistent connection to the robot using the ROBOT_HOST variable.
     * Matches the precise __init__ socket configuration protocol from robot.py
     */
    public Robot() {
        String robotIp = System.getenv("ROBOT_HOST");
        if (robotIp == null || robotIp.isEmpty()) {
            System.err.println("[Robot API Error]: ROBOT_HOST environment variable is not set.");
            return;
        }

        try {
            // MATCH PYTHON ENGINE: Connect the socket instantly when the object is instantiated
            this.socket = new Socket(robotIp, PORT);
            this.writer = new PrintWriter(this.socket.getOutputStream(), true);
            System.out.println("[Robot API]: Persistent socket link connected successfully to " + robotIp + ":" + PORT);
        } catch (Exception e) {
            System.err.println("[Robot API Error]: Failed to connect to robot server: " + e.getMessage());
        }
    }

    /**
     * Rotates the robot by sending the command string over the active socket stream.
     * Matches the exact command format: "ROTATE:degrees\n"
     * 
     * @param degrees The number of degrees to rotate the robot.
     */
    public void rotate(double degrees) {
        if (this.writer == null || this.socket == null || this.socket.isClosed()) {
            System.err.println("[Robot API Error]: Cannot rotate. No active connection to the robot.");
            return;
        }

        try {
            // Using println automatically appends '\n' and flushes the data stream
            this.writer.println("ROTATE:" + degrees);
            System.out.println("[Robot API]: Command successfully sent -> ROTATE:" + degrees);
        } catch (Exception e) {
            System.err.println("[Robot API Error]: Failed to send rotation packet down stream: " + e.getMessage());
        }
    }

    /**
     * Closes the active network socket connection when the driver finishes execution.
     * Matches the clean teardown framework of __exit__ from robot.py
     */
    @Override
    public void close() {
        try {
            if (this.writer != null) {
                this.writer.close();
            }
            if (this.socket != null && !this.socket.isClosed()) {
                this.socket.close();
                System.out.println("[Robot API]: Network connection terminated cleanly.");
            }
        } catch (Exception e) {
            System.err.println("[Robot API Error]: Exception occurred while closing socket: " + e.getMessage());
        }
    }
}
