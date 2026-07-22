import socket, sys, ast, os, queue, threading, time, logging
import cv2 as cv
import numpy as np
from contextlib import AbstractContextManager
from pathlib import Path
from ultralytics import YOLO

METRE_MAX = 3.0
BANNED_WORDS = "banned.txt"

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
		self.dest_name = "N/A"
		self.dest_pos = None

		# playlist
		self.playlist = queue.Queue()
		self.music_playing = False
		self.current_song = "N/A"

		# banned words
		self.banned_words = set()
		with open(BANNED_WORDS) as file:
			for line in file:
				self.banned_words.add(line.strip())

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

		# jukebox
		self.jukebox = threading.Thread(target=self.song_player, daemon=True)
		self.jukebox.start()


	def take_photo(self):
		command = "TAKE_PHOTO\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get()
			if "ERROR" not in response:
				resp = response.replace("array('B',", "")
				resp = resp.replace(")", "")
				arr = ast.literal_eval(resp)
				photo = Photo(self, arr)
				return photo
			return response
		except Exception as e:
			print(f"take_photo [ERROR] {e}")
			return None

	def photo_objects_seen(self, val):
		command = f"PHOTO_OBJECTS_SEEN:{val}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=10.0)
			if "ERROR" not in response:
				object_set = ast.literal_eval(response)
				if object_set is None:
					object_set = set()
				return object_set
			return response
		except Exception as e:
			err = f"photo_objects_seen() error: {e}"
			print(err)
			return err

	def photo_whos_there(self, val):
		command = f"PHOTO_WHOS_THERE:{val}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=10.0)
			if "ERROR" not in response:
				object_set = ast.literal_eval(response)
				if object_set is None:
					object_set = set()
				return object_set
			return response
		except Exception as e:
			err = f"photo_objects_seen() error: {e}"
			print(err)
			return err

	def get_targets(self):
		"""
		Return a list of tuples in the format (item, x, y) of all
		the items spotted during the scan and their locations.
		"""
		command = "GET_TARGETS\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=1.0)
			if "ERROR" not in response:
				objects = ast.literal_eval(response)
				if objects is None:
					objects = []
				return objects
			return response
		except Exception as e:
			print("Error: thread timed out")

	def whos_there(self):
		command = f"WHOS_THERE\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=5.0)
			if "ERROR" not in response:
				object_set = ast.literal_eval(response)
				if object_set is None:
					object_set = set()
				return object_set
			return response
		except Exception as e:
			print(f"whos_there() error: {e}")

	def play_music(self, song_link):
		# check if url allowed
		# send
		self.playlist.put(song_link)

	def add_to_queue(self, song_link):
		pass

	def show(self, message):
		if len(message) > 250:
			return "Exceeds character limit of 250."
		command = f"SHOW:{message}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get()
			return response
		except Exception as e:
			print("[ERROR] {e}")

	def speak(self, message, voice_id=1):
		# disallow speaking while playing music
		if self.music_playing:
			return "[ERROR] Cannot speak while music is playing."
		# enforce character limit
		CHAR_LIMIT = 250
		if len(message) > CHAR_LIMIT:
			message = message[:CHAR_LIMIT]
			print(f"Warning: only the first {CHAR_LIMIT} characters will be said.")

		for word in self.banned_words:
			if word in message:
				return "[ERROR] Message contained banned word. Denied."

		# replace commas
		message = message.replace(",", ".")

		# send cmd
		command = f"SPEAK:{message},{voice_id}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get(timeout=15.0)
			return response
		except Exception as e: 
			print("[ERROR] thread timed out")

	def listen(self, listen_timeout=10, phrase_timeout=10):
		# disallow while music playing
		if self.music_playing:
			return "[ERROR] cannot listen while playing music"

		# handle out of bounds
		if listen_timeout > 30:
			listen_timeout = 30
		elif listen_timeout < 0:
			return "[ERROR] timeout values should be positive"
		if phrase_timeout > 30:
			phrase_timeout = 30
		elif phrase_timeout < 0:
			return "[ERROR] timeout values should be positive"

		# send command
		command = f"LISTEN:{listen_timeout},{phrase_timeout}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get()
			if response.strip():
				return response.strip()
			return None
		except Exception as e:
			print("[ERROR] thread timed out")

	def listen_until(self, lst, listen_timeout=10, phrase_timeout=10):
		# disallow while music playing
		if self.playing_music:
			return "[ERROR] Cannot listen while music is playing"
		command = f"LISTEN_UNTIL:{lst},{listen_timeout},{phrase_timeout}\n"
		self.send_command(command, "B")
		try:
			response = self.block_queue.get()
			if response.strip():
				return response.strip()
			return None
		except Exception as e:
			print("[ERROR] thread timed out")

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
			print("[ERROR] thread timed out")

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
				if objects is None:
					objects = []
				return objects
			return response
		except Exception as e:
			print("[ERROR] thread timed out")

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
				if object_set is None:
					object_set = set()
				return object_set
			return response
		except Exception as e:
			print("[ERROR] thread timed out")

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
				if coordinate_list is None:
					coordinate_list = []
				return coordinate_list
			return response
		except Exception as e:
			print("[ERROR] thread timed out")

	def get_dest_name(self):
		"""
		Return the current destination of the robot, or "N/A"
		if there is None.
		"""
		return self.dest_name

	def get_dest_pos(self):
		return self.dest_pos

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
			print("[ERROR] thread timed out")

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
			print("[ROBOT] Error, could not get scan.")


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
			print("[ROBOT] HALT confirmed.")
		except queue.Empty:
			print("[ROBOT] Could not halt.")

		self._is_traveling = False
		self.destination = "N/A"
		print("[ROBOT] Queue is clear.")

	def move(self, metres):
		"""
		Move {metres} metres.
		"""
		if 0.0 > metres or METRE_MAX < metres:
			return "INVALID: metres must be between 0.0 and 3.0"
			
		command = f"MOVE:{metres}\n"
		self.send_command(command, "NB")

		time.sleep(0.05)

		while self.is_traveling():
			time.sleep(0.1)

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

		time.sleep(0.05)

		self._is_traveling = True

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
						self.dest_name = "N/A"
						self.dest_pos = None
						print("\nROBOT: Movement finished with",
							" status: ", line)

					elif "STARTED" in line:
						print("ROBOT: Movement started")

					elif "SONG" in line:
						self.music_playing = False
						self.current_song = "N/A"
						print("\nROBOT: Song ended: ", line)

					else:
						self.block_queue.put(line)

			except Exception as e:
				print(f"\n Error - robot disconnect.")
				break

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
				loc = cmd_arr[1]
				self.dest_name = loc
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


	def song_player(self):
		"""
		Handle playlist. Each command is put into a
		queue. Once one is done, the next one is sent to listener and
		executes accordingly.
		"""
		while self.running_program:
			try:
				# get command and wait for previous to finish
				song = self.playlist.get(timeout=0.5)

				while self.music_playing and self.running_program:
					time.sleep(0.1)

				self.music_playing = True

				# update song
				self.current_song = song
				command = f"PLAY_MUSIC:{song}\n"

				# send command to Nav2
				print("Sending command to Nav2: ", command)
				self.sock.sendall(command.encode("utf-8"))

				time.sleep(0.1)

				# dequeue once robot is done with cmd
				while self.music_playing and self.running_program:
					time.sleep(0.1)
				self.playlist.task_done()
				print("Song ended")

			except queue.Empty:
				continue

	def send_command(self, command, cmd_type):
		"""
		Handles "command" sending, based on "B" - blocking,
		or non-blocking commands.
		"""
		if "\n" not in command:
			command += "\n"
		if cmd_type == "B":
			self.sock.sendall(command.encode("utf-8"))
		elif cmd_type == "NB":
			print("[ROBOT] QUEUED COMMAND: ", command)
			self.non_block_queue.put(command)

	def __exit__(self, exc_type, exc_value, traceback):
		"""
		Wait for the non-blocking commands to execute,
		then end the program and close the socket.
		"""
		while self.is_traveling() or self.music_playing:
			time.sleep(0.1)

		self.running_program = False
		time.sleep(0.2)

		try:
			self.sock.shutdown(socket.SHUT_RDWR)
		except Exception:
			print("[ROBOT] could not shut down socket.")
		self.sock.close()
		return

class Photo:
	def __init__(self, robot_obj, data):
		self.data = data
		self.photo_objects_seen = robot_obj.photo_objects_seen
		self.photo_whos_there = robot_obj.photo_whos_there

	def objects_seen(self):
		objects = self.photo_objects_seen(self.data)
		return objects

	def whos_there(self):
		people = self.photo_whos_there(self.data)
		return people