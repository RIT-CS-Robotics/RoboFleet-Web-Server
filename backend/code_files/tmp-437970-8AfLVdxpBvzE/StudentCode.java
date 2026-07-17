import robot.Robot;

public class StudentCode {
    public static void main(String[] args) {
        try (Robot rob = new Robot()) {
            rob.rotate(360.0);
        }
    }
}
