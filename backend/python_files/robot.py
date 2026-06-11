import socket, os, queue, threading, time

class Robot:
	def __init__(self):
		"""
		Create a new Robot object and connect to the robot.
		"""

		#self.robot_ip = os.environ.get("ROBOT_IP")
		self.robot_ip = "129.21.65.243" # laptop 2
		#self.robot_ip = "129.21.118.12" # laptop 3
		self.port = 10001

		# create task queues
		self._is_traveling = False
		self.block_queue = queue.Queue()
		self.non_block_queue = queue.Queue()
		self.destination = "N/A"

		# connect socket
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.sock.connect((self.robot_ip, self.port))
		self.running_program = True

		# start threading
		self.listener_thread = threading.Thread(target=self.listener, daemon=True)
		self.listener_thread.start()

		# non blocking queue thread
		self.non_block_thread = threading.Thread(target=self.queue_executor, daemon=False)
		self.non_block_thread.start()

	def listener(self):
		"""
		Handle communication sent back from the robot (listener)
		and blocking commands.
		"""
		buffer = ""
		while self.running_program:
			try:	# same bit as listener.py
				data = self.sock.recv(1024).decode("utf-8")
				if not data:
					break

				buffer += data
				while "\n" in buffer:
					line, buffer = buffer.split("\n", 1)
					line = line.strip()

					# empty
					if not line:
						continue

					# end
					if line.startswith("STATUS"):
						self._is_traveling = False
						self.destination = "N/A"
						print("\nROBOT: Movement finished with",
							" status: ", line)

					elif "STARTED" in line:
						print("ROBOT: Movement started")

					else:
						self.block_queue.put(line)

			except Exception as e:
				print(f"\n Error - robot disconnect.")
				break

	def send_command(self, command, cmd_type):
		"""
		Handles "command" sending, based on "B" - blocking,
		or non-blocking commands.
		"""
		if "\n" not in command:
			command += "\n"
		if cmd_type == "B":
			self.sock.sendall(command.encode("utf-8"))
		else:
			print("ROBOT: QUEUED COMMAND: ", command)
			self.non_block_queue.put(command)

	def halt(self):
		# send_command("HALT\n", "B")
		while not self.non_block_queue.empty():
			try:
				self.non_block_queue.get_nowait()
				self.non_block_queue.task_done()
			except queue.Empty:
				break

		self.send_command("HALT\n","B")
		try:
			self.block_queue.get(timeout=3.0)
			print("ROBOT: HALT confirmed.")
		except queue.Empty:
			print("ROBOT: Could not halt.")

		self._is_traveling = False
		self.destination = "N/A"
		print("ROBOT: Queue is clear.")

	def queue_executor(self):
		"""
		Handle non blocking commands. Each command is put into a
		queue. Once one is done, the next one is sent to Nav2 and
		executes accordingly.
		"""
		while self.running_program:
			try:
				# get command and wait for previous to finish
				command = self.non_block_queue.get(timeout=1.0)
				while self._is_traveling and self.running_program:
					time.sleep(0.1)


				# update dest
				cmd_arr = command.split(":")
				self.destination = cmd_arr[1]

				# send command to Nav2
				print("Sending command to Nav2: ", command)
				self._is_traveling = True
				self.sock.sendall(command.encode("utf-8"))

				time.sleep(0.1)

				# dequeue once robot is done with cmd
				while self._is_traveling and self.running_program:
					time.sleep(0.1)
				self.non_block_queue.task_done()

			except queue.Empty:
				continue

	def is_traveling(self):
		return self._is_traveling or not self.non_block_queue.empty()

	def get_destination(self):
		return self.destination

	def get_pos(self):
		"""
		Get the current position (x, y) of the robot.
		"""
		command = f"GET_POS\n"
		self.send_command(command, "B")

		# wait for background thread
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				x, y = map(float, response.split(","))
				return x, y
			return response
		except Exception as e:
			print("Error: thread timed out")

	def go_to(self, x, y):
		"""
		Go to given (x, y) coordinates, if valid.
		"""
		command = f"GO_TO:{x},{y}\n"
		self.send_command(command, "NB")

	def nav_to(self, location):
		"""
		Go to given location string, if in database.
		"""
		command = f"NAV_TO:{location}\n"
		self.send_command(command, "NB")

	def move(self, steps):
		"""
		ADJUST: Move {steps} seconds.
		"""
		command = f"MOVE:{steps}\n"
		self.send_command(command, "NB")

	def rotate(self, degrees):
		"""
		ADJUST: Rotate for {degrees} seconds.
		"""
		command = f"ROTATE:{degrees}\n"
		self.send_command(command, "NB")

	def close(self):
		"""
		Close the program running and the socket.
		"""
		self.running_program = False
		self.sock.close()
