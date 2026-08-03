# 🚨 RoboFleet Safety & Malfunction Protocols (General)
> **CRITICAL:** All developers and researchers should read and understand this document before updating any RoboFleet systems or deploying code to any physical hardware. Hardware robotics can cause physical injury and property damage if improperly handled.

---

## 🛑 1. EMERGENCY STOP PROCEDURES
If a robot behaves erratically or moves unpredictably, **initiate an emergency stop immediately**. Do not attempt to catch a moving robot.

### 🔴 Physical
* **Button Location:** The lab's robots likely have a physical power switch. Locate this and be prepared to manually power it off in case of a robot emergency. This should hard-stop the robot instantly.

### 💻 Software
* **Server Kill:** Because of the nature of how the robot framework and listener scripts interact from the web-server to the client hardware, a software-based server kill may not exist depending on your deployment. Operators must be prepared to manually interrupt physical hardware.

---

## ⚙️ 2. PRE-OPERATIONAL SAFETY CHECKLIST
Before executing any custom code or automated movement scripts:

* **Starting Location:** Ensure the robot is placed in its designated starting location within its local navigation system. Initializing from random locations can result in localization failure and unpredictable pathing.

* **Battery Inspection:** Verify that all robot system batteries are charged before planning to deploy the robots.

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

1. **Kill Power:** Execute a physical hardware or emergency stop instantly.

2. **Assess Damage:** Check for structural, mechanical, or electrical damage on the hardware and address those.

3. **Notify the Lab:** Alert your lab administrator or lead researcher.

4. **Log the Bug:** Record the technical failure logs and physical conditions in your local lab's designated tracking system.
