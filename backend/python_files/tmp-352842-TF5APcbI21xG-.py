from robot import Robot

with Robot() as r:
    r.nav_to("Office3509")
    r.rotate(360)
    r.nav_to("RNDLab")