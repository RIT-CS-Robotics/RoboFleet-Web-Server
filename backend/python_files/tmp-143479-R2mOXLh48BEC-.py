import sys
import os
from robot import Robot

robot = Robot()

for i in range(2):
  robot.nav_to("Office3509")
  robot.nav_to("RNDLab")