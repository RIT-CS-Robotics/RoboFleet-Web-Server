import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

import java.util.Arrays;
import java.util.Scanner;
import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;

public class Robot implements AutoCloseable {

	private String robotIp;
	private int port;
	private Socket socket;
	private Scanner inputStream;

	private volatile boolean runningProgram, isTraveling, musicPlaying;
	private String destName, currentSong;
	private double[] destPos;

	private LinkedBlockingQueue<String> blockQueue, nonBlockQueue, playlist;
	private final AtomicBoolean isProcessingCommand = new AtomicBoolean(false);
	private double METRE_MAX = 3.0;

	private final int IMG_HEIGHT = 480;
	private final int IMG_WIDTH = 640;

	private static class Detection {
		private final String item;
		private final double x;
		private final double y;

		public Detection (String item, double x, double y) {
			this.item = item;
			this.x = x;
			this.y = y;
		}

		public String getItem() { return this.item; }
		public double getX() { return this.x; }
		public double getY() { return this.y; }
	}


	/**
	 * Create a new Robot object and connect to the robot.
	 * @throws IOException
	 */
	public Robot () throws IOException {
		this.robotIp = System.getenv("ROBOT_HOST");
		this.port = 10001;

	        this.isTraveling = false;
		this.destName = "N/A";
		this.destPos = null;

		this.blockQueue = new LinkedBlockingQueue<>();
		this.nonBlockQueue = new LinkedBlockingQueue<>();

		// playlist
		this.playlist = new LinkedBlockingQueue<>();
		this.musicPlaying = false;
        	this.currentSong = "N/A";

		// socket connections
        	socket = new Socket(this.robotIp, this.port);
        	inputStream = new Scanner(socket.getInputStream());
		this.runningProgram = true;

		// multithreading handlers + daemon threading
		ExecutorService executor = Executors.newFixedThreadPool(3, runnable -> {
               		Thread t = Executors.defaultThreadFactory().newThread(runnable);
                	t.setDaemon(true);
                	return t;
        	});
	    	executor.submit(this::listener);
        	executor.submit(this::queueExecutor);
        	executor.submit(this::playList);
	}

	/**
	 * Tell the robot to speak aloud (using tts) the given message.
	 * @param message the message to speak
	 * @param voiceId the voice to use 
	 */
	public String speak(String message, int voiceId) {
		// disallow speaking while playing music
        	if (this.musicPlaying) {
			return "[ERROR] Cannot speak while music is playing.";
		}

		// enforce character limit
		final int CHAR_LIMIT = 250;
		if (message.length() > CHAR_LIMIT) {
			message = message.substring(0, CHAR_LIMIT);
			System.out.println("Warning: only the first " + CHAR_LIMIT + " characters will be said.");
		}

		// replace commas
		message = message.replace(",", ".");

		// send cmd
		try {
			String command = String.format("SPEAK:%s,%d\n", message, voiceId);
			this.sendCommand(command, "B");
			String response = this.blockQueue.poll(15, TimeUnit.SECONDS);
			return response;
		} catch (Exception e) {
			System.out.println("[ERROR] occured when robot speak: " + e);
			Thread.currentThread().interrupt();
			return null;
		}
	}

	/**
	 * Default speak command.
	 * @param message the message to speak
	 */
	public String speak(String message) {
		return speak(message, 1);
	}

	/**
	 * Listen until provided timeouts.
	 * @param listenTimeout time to wait for robot to hear someone speak before giving up
	 * @param phraseTimeout time to wait for person to finish speaking before timing out
	 * @return phrase heard by robot or null
	 */
	public String listen(int listenTimeout, int phraseTimeout) {
		// disallow while music playing
		if (this.musicPlaying) {
			return "[ERROR] cannot listen while playing music";
		}

		// handle out of bounds
		if (listenTimeout > 30) {
			listenTimeout = 30;
		} else if (listenTimeout < 0) {
			return "[ERROR] timeout values should be positive";
		}

		if (phraseTimeout > 30) {
			phraseTimeout = 30;
		} else if (phraseTimeout < 0) {
			return "[ERROR] timeout values should be positive";
		}

		// send command
		try {
			String command = String.format("LISTEN:%d,%d\n", listenTimeout, phraseTimeout);
			this.sendCommand(command, "B");
			String response = this.blockQueue.take();

			if (response != null && !response.trim().isEmpty()) {
				return response.trim();
			}
			return null;
		} catch (Exception e) {
			System.out.println("[ERROR] occured when robot listen: " + e);
			Thread.currentThread().interrupt();
		return null;
		}
	}
	
	/** 
	 * Default listen command.
	 * @return phrase heard by robot or null
	 */
	public String listen() {
		return listen(10, 10);
	}

	/** 
	 * Listen until robot hears a certain phrase.
	 * @param listenTimeout time to wait for robot to hear someone speak before giving up
	 * @param phraseTimeout time to wait for person to finish speaking before timing out
	 * @return phrase heard by robot or null
	 */
	public String listenUntil(List<String> lst, int listenTimeout, int phraseTimeout) {
		// disallow while music playing
		if (this.musicPlaying) {
			return "[ERROR] Cannot listen while music is playing";
		}

		// send command
		try {
			String command = String.format("LISTEN_UNTIL:%s,%d,%d\n", lst.toString(), listenTimeout, phraseTimeout);
			this.sendCommand(command, "B");

			String response = this.blockQueue.take();

			if (response != null && !response.trim().isEmpty()) {
				return response.trim();
			}
			return null;

		} catch (Exception e) {
			System.out.println("[ERROR] occured in listen until " + e);
			Thread.currentThread().interrupt();
			return null;
		}
	}

	public String listenUntil(List<String> lst) {
		return listenUntil(lst, 10, 10);
	}
	
	/**
	 * Return a set of all the objects seen in frame, otherwise
	 * an empty set.
	 * @return HashSet<String> of objects seen
	 */
	public HashSet<String> objectsSeen() {
		try {
			String command = "OBJECTS_SEEN:" + "\n";
			this.sendCommand(command, "B");

			String response =  this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);

			String clean = response.replaceAll("[\\[\\]'\"\\s]","");

			if (clean.isEmpty()) {
				return new HashSet<String>();
			}

			String cleaned_again = clean.replace("{", "").replace("}","");
			String[] items = cleaned_again.split(",");
			return new HashSet<>(Arrays.asList(items));
 
		} catch (Exception e) {
			System.out.println("[ROBOT] Error getting scanned objects: " + e);
		}

		return new HashSet<>();
	}

	/**
	 *
 	 */
	public ArrayList<Detection> getObjectScan() {
		try {
			String command = "GET_OBJECT_SCAN:\n";
			this.sendCommand(command, "B");

			String response = this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);
			if (response != null && !response.contains("ERROR")) {
				return parseTupleList(response);
			}

		} catch (Exception e) {
			System.out.println("[ERROR] in getObjectScan: " + e);
		}
		return new ArrayList<>();
	}


	/**
	 * Return a set of all the people  seen in frame, otherwise
	 * an empty set.
	 * @return HashSet<String> of people seen
	 */
	public List<List<Double>> scanFor(String item) {
		try {
			String command = "SCAN_FOR:" + item + "\n";
			this.sendCommand(command, "B");
			String response =  this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);
			return parseScanList(response);
 
		} catch (Exception e) {
			System.out.println("[ROBOT] Error in scanFor: " + e);
		}

		return null;
	}


	/**
	 * Return a set of all the people  seen in frame, otherwise
	 * an empty set.
	 * @return HashSet<String> of people seen
	 */
	public HashSet<String> whosThere() {
		try {
			String command = "WHOS_THERE:" + "\n";
			this.sendCommand(command, "B");
			String response =  this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);
			String clean = response.replaceAll("[\\[\\]'\"\\s]","");

			if (clean.isEmpty()) {
				return new HashSet<String>();
			}

			String cleaned_again = clean.replace("{", "").replace("}","");
			String[] items = cleaned_again.split(",");
			return new HashSet<>(Arrays.asList(items));
 
		} catch (Exception e) {
			System.out.println("[ROBOT] Error getting scanned people: " + e);
		}

		return new HashSet<>();
	}

	/**
	 * Returns a list of Detections of all the people seen and their x, y coordinates.
	 * @return ArrayList<Detection> of all people seen (including unknown)
	 */
	public ArrayList<Detection> getTargets() throws IOException {
		String command = "GET_TARGETS:\n";
		this.sendCommand(command, "B");

		try {
			String response = this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);
			if (response != null && !response.contains("ERROR")) {
				return parseTupleList(response);
			}

		} catch (Exception e) {
			System.out.println("[ERROR] in getTargets: " + e);
		}
		return new ArrayList<>();
	}

	/**
	 * Helper function to parse a list of tuples.
 	 */
	private ArrayList<Detection> parseTupleList (String response) {

		ArrayList<Detection> objects = new ArrayList<>();
		String clean = response.trim();
		// empty
		if (clean.equals("[]") || clean.isEmpty()) {
			return objects;
 		}

		// split
		clean = clean.substring(1, clean.length() - 1);
		String[] detections = clean.split("\\)\\s*,\\s*\\("); 

		// parse
		for (String group : detections) {
			System.out.println("detection: " + group);
			String cleaned_again = group.replace("(", "").replace(")","").replace("'","").replace("\"","");
			String[] parts = cleaned_again.split("\\s*,\\s*");

			// each 'tuple'
			if (parts.length == 3) {
				String name = parts[0];
				Double x = Double.parseDouble(parts[1]);
				Double y = Double.parseDouble(parts[2]);

				objects.add(new Detection(name, x, y));
			}
		}
		return objects;
	}


	/**
	 * Parser for list of lists - getLaserScan() and scanFor().
	 * @param response the string to parse
	 * @return a list of List<Double>
	 */
	private List<List<Double>> parseScanList (String response) {
		List<List<Double>> result = new ArrayList<>();
		String clean = response.trim();

		// empty
		if (response == null || clean.isEmpty() || clean.equals("[]")) {
			return result;
		}

		// split
		clean = clean.substring(1, clean.length() - 1);
		String[] elements = clean.split("\\)\\s*,\\s*\\(");

		// parse
		for (String element : elements) {
			String cleaned_again = element.replace("(", "").replace(")", "").trim();

			String[] parts = cleaned_again.split("\\s*,\\s*");
			List<Double> items = new ArrayList<>();
			for (String part : parts) {
				if (!part.isEmpty()) {
					// handle infinity in scans
					if (part.contains("inf")) {
						items.add(Double.POSITIVE_INFINITY); 
					}
					else {
						items.add(Double.parseDouble(part));
					}
				}
			}
			result.add(items);
		}
		return result;
	}

	public boolean is_traveling() {
		return this.isTraveling || this.nonBlockQueue.isEmpty();
	}

	public String getDestName() {
		return this.destName;
	}

	public double[] getDestPos() {
		return this.destPos;
	}


	/**
	 * Get the current position of the robot.
	 * @return [x, y] coordinates of robot.
	 */
	public double[] getPos() {
		try {
			String command = "GET_POS\n";
			this.sendCommand(command, "B");
			String response =  this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);

			// convert to double array
			String[] coord = response.strip().split(",");
			double[] coordinates = new double[2];
			coordinates[0] = Double.parseDouble(coord[0]);
			coordinates[1] = Double.parseDouble(coord[1]);

			return coordinates;

 
		} catch (Exception e) {
			System.out.println("[ROBOT] Error retrieving current position: " + e);
		}
		return null;
	} 

	/**
	 * Get the laser scan.
	 * @return list of double (metre distances)
	 */
	public ArrayList<Double> getLaserScan() {
		try {
			String command = "GET_LASER_SCAN\n";
			this.sendCommand(command, "B");
			String response =  this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);
			String clean = response.trim();

			ArrayList<Double> points = new ArrayList<>();

			// empty
			if (response == null || clean.isEmpty() || clean.equals("[]")) {
				return points;
			}

			// convert to double arraylist
			String[] stringPoints = clean.replace("[","").replace("]","").split(",");
			for (String p : stringPoints) {
				if (p.contains("inf")) {
					points.add(Double.POSITIVE_INFINITY);
				}
				else {
					points.add(Double.parseDouble(p));
				}
			}

			return points;

		} catch (Exception e) {
			System.out.println("[ROBOT] Error retrieving laser scan: " + e);
		}
		return new ArrayList<>();
	}

	/**
	 * Clear the movement queue and halt the current movement immediately.
	 */
	public void halt() {
		this.nonBlockQueue.clear();
		try {
			String command = "HALT\n";
			this.sendCommand(command, "B");
			this.blockQueue.poll(3000, TimeUnit.MILLISECONDS);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			System.out.println("[ROBOT] Halt interrupted.");
		} catch (Exception e) {
			System.out.println("[ROBOT] Error sending halt command: " + e);
		}
	}



	public void rotate(double degrees) {
		try {
			String command = "ROTATE:" + degrees + "\n";
			this.sendCommand(command, "NB");
			Thread.sleep(50);
			this.isTraveling = true;
		} catch (Exception e) {
			System.out.println("[ERROR] while rotating: " + e);
		}

	}

	/**
	 * Travel given distance in a straight line in front of the robot, considering KeepoutZones
	 * and obstacles.
	 * @param metres the distance to travel
	 */
	public void move(double metres) throws InterruptedException, IOException {
		if (0.0 > metres || METRE_MAX < metres) {
			System.out.println("INVALID: metres must be between 0.0 and 3.0.");
		return;
		}

		// send command
		String command = "MOVE:" + metres + "\n";
	
		this.sendCommand(command, "NB");

		Thread.sleep(50);

		while (this.isTraveling) {
			Thread.sleep(100);
        	}
	}

	/**
	 * Create a path plan and go distance provided, if/until valid.
	 * @param metres the distance to navigate forward to
	 */
	public void move_to(double metres) throws IOException {
		String command = "MOVE_TO:" + metres + "\n";
		this.sendCommand(command, "NB");
	}

	/**
	 * Create a path plan and go to location, if in database.
	 * @param location to navigate to
	 */
	public void nav_to(String location) throws IOException {
		String command = "NAV_TO:" + location + "\n";
		this.sendCommand(command, "NB");

	}

	/**
	 * Create a path plan and go to given (x, y) coordinates, if valid.
	 * @param x coordinate
	 * @param y coordinate
 	 */
	public void go_to(double x, double y) throws IOException {
		String command = "GO_TO:" + x + "," + y + "\n";
		this.sendCommand(command, "NB");
	}

    private void sendCommand(String command, String type) throws IOException {
        if ("B".equals(type)) {
            OutputStream out = socket.getOutputStream();
            out.write(command.getBytes(StandardCharsets.UTF_8));
            out.flush();
        } else {
            System.out.println("ROBOT: Queued command " + command);
            this.nonBlockQueue.add(command);
        }
    }

    /**
     * 	Handle communication sent back from the robot (listener)
     *  and blocking commands.
     */
    private void listener() {
        try {
            while (this.runningProgram && inputStream.hasNextLine()) {
                String line = inputStream.nextLine().strip();
		System.out.println("Listener sent LINE: " + line);
                    // empty
                    if (line.isEmpty()) {
                        continue;
                    }

                    // end
                    if (line.startsWith("STATUS")) {
                        this.isTraveling = false;
                        this.destName = "N/A";
                        this.destPos = null;
                        System.out.println("ROBOT: Movement finished with status: " + line);
                    }

                    // begin movement
                    else if (line.contains("STARTED")) {
                        System.out.println("ROBOT: Movement started.");
                    }

                    // playlist
                    else if (line.contains("SONG")) {
                        this.musicPlaying = false;
                        this.currentSong = "N/A";
                        System.out.println("ROBOT: Song ended.");
                    }

                    else {
                        this.blockQueue.add(line);
                    }
                }

            }
            catch (Exception e) {
		e.printStackTrace();
            }
    }

    /**
     * Handle non blocking commands. Each command is put into a
     * queue. Once one is done, the next one is sent to Nav2 and 
     * executes accordingy. 
     * @return
     */
    private void queueExecutor() {
        while (this.runningProgram) {
            try {
                // get command and wait for previous to finish
	        while (this.isTraveling && this.runningProgram) {
                    Thread.sleep(100);
			System.out.println("STUCK HERE??");
                }

		if (this.nonBlockQueue.isEmpty()) {
			continue;
		}

                String command = this.nonBlockQueue.poll(500, TimeUnit.MILLISECONDS);
  		System.out.println("It takes from queue x times.");

		this.isProcessingCommand.set(true);
                this.isTraveling = true;

                // update destination
                String[] cmd_arr = command.split(":");
                String location = cmd_arr[1];
                String[] dest = location.split(",");

                if (dest.length == 1) {
                    this.destName = dest[0];
                } else if (dest.length == 2) {
                    double x = Double.parseDouble(dest[0]);
                    double y = Double.parseDouble(dest[1]);
                    this.destPos = new double[] {x, y};
                }

                // send command to Nav2
                System.out.println("Sending command to Nav2: " + command);
                OutputStream out = socket.getOutputStream();
                out.write(command.getBytes(StandardCharsets.UTF_8));
                out.flush();
		System.out.println("Command sent.");
                Thread.sleep(100);

                // dequeue once robot is done with command
    //            while (this.isTraveling && this.runningProgram) {
  //                  Thread.sleep(100);
    //            }
            } 
            
            catch (Exception e) {
		e.printStackTrace();
		System.out.println("ERROR!");
            } finally {
		this.isProcessingCommand.set(false);
		}
        }
}

	private void playList() {
	}

	private boolean pendingWork() {
		return !nonBlockQueue.isEmpty() || isTraveling || isProcessingCommand.get();
	}

	@Override
	public void close() throws Exception {
		while (pendingWork()) {
			try {
				Thread.sleep(100);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				break;
			}
		}

		this.runningProgram = false;
		try {
			if (socket != null && !socket.isClosed()) {
				socket.close();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}