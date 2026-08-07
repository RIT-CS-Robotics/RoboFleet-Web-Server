/**
 * Functionality: Example Code Resource component for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/resources/example/ExampleComponent.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import React from 'react';
import './ExampleComponent.css';

/**
 * Example Code Component for Resources Page
 */
export default function ExampleComponent() {

  const pythonCode = `from robot import Robot\n\nwith Robot() as rob:\n    print("Robot rotating 360 degrees!")\n    rob.rotate(360)\n    print("Robot finished rotating!")`

  const javaCode = `TO BE ADDED SOON`;

    /**
    * Copies robot code to the users clipboard.
    * 
    * @param {String} codeType: The type of code being copied (PYTHON or JAVA).
    */
  const handleCopy = async (codeType) => {
    try {
      if (codeType === 'PYTHON') {
        await navigator.clipboard.writeText(pythonCode);
        console.log(`Copied Python code to clipboard`);
      }
      else if (codeType === 'JAVA') {
        await navigator.clipboard.writeText(javaCode);
        console.log(`Copied Java code to clipboard`);
      }
      else {
        throw new Error(`Could not copy code to clipboard`);
      }
    }
    catch(err) {
      console.error(err.message);
    }
  }

  return (
    <div className="example-container">
        <header className="example-header">
          <h2>RoboFleet Examples</h2>
        </header>

        <div className="split-view-container">
  
          {/* Left Background Box */}
          <div className="panel-box">
            <h3>Python Rotate Code</h3>
            <pre className="code-display-block">
              {pythonCode}
            </pre>
            <button
              onClick={() => handleCopy('PYTHON')}
              title="Copy Python Code"
            >
              Copy Python Code 📋
            </button>
          </div>

          {/* Right Background Box */}
          <div className="panel-box">
            <h3>Java Rotate Code</h3>
            <pre className="code-display-block">
              {javaCode}
            </pre>
            <button
              onClick={() => handleCopy('JAVA')}
              title="Copy Java Code"
            >
              Copy Java Code 📋
            </button>
          </div>

        </div>

        {/* FOOTER */}
        <footer className="example-footer">
            <p className="example-footer-section">
                Try running this code on a robot to make it rotate 360 degrees!
            </p>
        </footer>

    </div>
  );
}