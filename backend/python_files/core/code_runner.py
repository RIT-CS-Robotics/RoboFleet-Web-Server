#wrapper python script that will inject the student code and run it

import sys
import os
from robot import Robot

robot = Robot()

robot.nav_to("AtriumW")
robot.nav_to("RNDLab")