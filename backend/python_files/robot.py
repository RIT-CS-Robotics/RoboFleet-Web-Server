import socket, ast, os, queue, threading, time, logging
from contextlib import AbstractContextManager

class Robot(AbstractContextManager):
	def __init__(self):
		"""
		Create a new Robot object and connect to the robot.
		"""

		self.robot_ip = os.environ.get("ROBOT_HOST")

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
		print("bob")

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

	def pixel_to_map(self, x, y):
		command = f"PIXEL_TO_MAP:{x},{y}\n"
		self.send_command(command, "NB")
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				x, y = float(map, response.split(","))
				return x, y
			return response
		except Exception as e:
			print("Error: thread timed out")

	def speak(self, message, voice_id=1):
		# enforce character limit
		if len(message) > 250:
			return "Exceeds character limit of 250."
		# send cmd
		command = f"SPEAK:{message},{voice_id}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=1.0)
			return response
		except Exception as e: 
			print("Error: thread timed out")

	def listen(self, listen_timeout=10, phrase_timeout=10):
		command = f"LISTEN:{listen_timeout},{phrase_timeout}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get()
			if response.strip():
				return response.strip()
			return None
		except Exception as e:
			print("Error: thread timed out")



	def get_legs(self):
		"""
		Return the number of "legs" seen.
		"""
		command = "GET_LEGS\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				legs = int(response.strip())
				return legs
			return response
		except Exception as e:
			print("Error: thread timed out")

	def get_object_scan(self):
		"""
		Return a list of tuples in the format (item, x, y) of all
		the items spotted during the scan and their locations.
		"""
		command = "GET_OBJECT_SCAN\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				objects = ast.literal_eval(response)
				return objects
			return response
		except Exception as e:
			print("Error: thread timed out")

	def objects_seen(self):
		"""
		Return a set of all unique objects detected.
		"""
		command = "OBJECTS_SEEN\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				object_set = ast.literal_eval(response)
				return object_set
			return response
		except Exception as e:
			print("Error: thread timed out")

	def scan_for(self, item):
		"""
		Return a list of coordinates of all the instances of the item
		detected.
		"""
		command = f"SCAN_FOR:{item}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				coordinate_list = ast.literal_eval(response)
				return coordinate_list
			return response
		except Exception as e:
			print("Error: thread timed out")

	def get_destination(self):
		"""
		Return the current destination of the robot, or "N/A"
		if there is None.
		"""
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

	def get_laser_scan(self):
		"""
		Get the current laser scan of the robot.
		"""
		command = f"GET_LASER_SCAN\n"
		self.send_command(command, "B")

		# wait for bg thread
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				scan = ast.literal_eval(response)
				return scan
		except Exception as e:
			print("ROBOT: Error, could not get scan.")


	def halt(self):
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

	def move(self, metres):
		"""
		Move {metres} metres.
		"""
		command = f"MOVE:{metres}\n"
		self.send_command(command, "NB")

		time.sleep(0.05)

		while self.is_traveling():
			time.sleep(0.1)

	def queue_executor(self):
		"""
		Handle non blocking commands. Each command is put into a
		queue. Once one is done, the next one is sent to Nav2 and
		executes accordingly.
		"""
		while self.running_program:
			try:
				# get command and wait for previous to finish
				command = self.non_block_queue.get(timeout=0.5)

				while self._is_traveling and self.running_program:
					time.sleep(0.1)

				self._is_traveling = True

				# update dest
				cmd_arr = command.split(":")
				self.destination = cmd_arr[1]
				print(cmd_arr[1])

				# send command to Nav2
				print("Sending command to Nav2: ", command)
				self.sock.sendall(command.encode("utf-8"))

				time.sleep(0.1)

				# dequeue once robot is done with cmd
				while self._is_traveling and self.running_program:
					time.sleep(0.1)
				self.non_block_queue.task_done()

			except queue.Empty:
				continue

	def is_traveling(self):
		"""
		Returns whether0 the robot is travelling.
		"""
		return self._is_traveling or not self.non_block_queue.empty()

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

	def move_admin(self, steps):
		"""
		"""
		command = f"MOVE_ADMIN:{steps}\n"
		self.send_command(command, "NB")

	def rotate(self, degrees):
		"""
		Rotate {degrees} degrees.
		"""
		command = f"ROTATE:{degrees}\n"
		self.send_command(command, "NB")

	def __exit__(self, exc_type, exc_value, traceback):
		"""
		Wait for the non-blocking commands to execute,
		then end the program and close the socket.
		"""
		while self.is_traveling():
			time.sleep(0.1)

		self.running_program = False
		time.sleep(0.2)
		try:
			self.sock.shutdown(socket.SHUT_RDWR)
		except Exception:
			print("ROBOT: could not shut down socket.")
		self.sock.close()
		return