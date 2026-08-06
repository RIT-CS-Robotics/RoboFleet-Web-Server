/**
 * Functionality: Instructions Resource component for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/resources/InstructionsComponent.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import React from 'react';
import './InstructionsComponent.css';

/**
 * Instructions Component for Resources Page
 */
export default function InstructionsComponent() {

    /**
     * ENTER INSTRUCTIONS HERE IN THE ORDER YOU WANT THEM TO SHOW!
     */
    const instructions = [
    "Click Login from the Status Page to go to the RoboFleet Dashboard Login Page.",

    "Use your RIT username (Example: abc1234) and the password your professor gave you to login.",

    "Select a target robot dropdown menu on the left-hand side.",

    "Write code, import code from your device, or pull code from a past log into the text editor workspace.",

    "Make sure you have a valid .py or .java title. Note: for Java the title must be the same as the class name.",

    "Click \"Deploy\" to have your code control the selected robot.",

    "Once the robot finishes, click the new log created to view the output.",

    "If the code does not work correctly, view the new code log generated at the top of your logs to see why."
  ];

  return (
    <div className="instructions-container">
      <header className="instructions-header">
        <h2>RoboFleet Instructions</h2>
      </header>

      <div className="instructions-box shortened-box">
        {instructions.map((text, index) => (
          <div key={index} className="instruction-row">
            <div className="step-badge">{index + 1}</div>
            <p className="instruction-text">{text}</p>
            </div>
        ))}
      </div>

    </div>
  );
}