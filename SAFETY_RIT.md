# 🚨 RoboFleet Safety & Malfunction Protocols (RIT)
> **CRITICAL:** All RIT RoboFleet developers and researchers should read and understand this document before updating any RoboFleet systems or deploying code to any physical hardware. Hardware robotics can cause physical injury and property damage if improperly handled.

---

## 🛑 1. EMERGENCY STOP PROCEDURES
If a robot behaves erratically, moves unpredictably, or fails to respond to software commands, **initiate an emergency stop immediately**. Do not attempt to catch a moving robot.

### 🔴 Physical
* **Button Location:** Every physical robot is equipped with a small black switch on its left side. To stop the robot in an emergency, switch it downwards. This will power off the robot and hard-stop whatever it is trying to do. This is the only sure way to hard-stop the robot.

### 💻 Software
* **Server Kill:** Because of the nature of how the robot and listener scripts interact from the web-server to the robot, there is NO SERVER KILL! You MUST PHYSICALLY STOP THE ROBOT.

---

## ⚙️ 2. PRE-OPERATIONAL SAFETY CHECKLIST
Before executing any custom code or automated movement scripts:

* **Starting Location:** Make sure that the robot is in the starting location that it has saved in its navigation systems. By default this is in the RNDLab, center of the room and facing the white board. Starting from random places will make the robot lost and can cause unexpected behavior.

* **Battery Inspection:** Verify that both the battery of the robot's physical device and the robot's computer are charged enough. This is different for every type of physical robot and computer battery so make sure you understand the limitations of them and plan around them.

---

## 💡 3. Understanding the Systems
The RoboFleet architecture includes multiple systems interacting with each other; understand them:

### ⏱️ Active Status
Make sure that whenever a new function is added to the robot script or listener script, it behaves in a normal runtime fashion and does not stop the script early. Doing so could deactivate the robot's active status on the web-server and allow users to spam commands to the robot, overflowing its command queue and interrupting normal behavior.

### ⚠️ System Limitations
Make sure that you understand the physical device's limitations. Not understanding how the device works might cause you to try adding functions that don't take into account the physical system's limitations and safeguards which can cause unsafe behaviors from the robot.

### 💻 Understanding the Robots Software
Make sure you also understand how the general software works on the robots themselves. Without understanding these things, it will be more common to break the robot's functionality when implementing new features from the web-server.

---

## 💥 4. MALFUNCTION PROTOCOL
In the event of a serious mechanical failure, code loop crash, or physical collision:

1. **Kill Power:** Execute a physical hard-stop instantly.

2. **Assess Damage:** Check for any physical damage on the robot and address those.

3. **Notify the Lab:** Inform the supervising professor (most likley Prof. Zachary Butler).

4. **Log the Bug:** Create a log of the issue in the RIT RoboFleets Documents.
