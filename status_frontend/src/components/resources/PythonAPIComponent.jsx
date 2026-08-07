/**
 * Functionality: Python Robot API Resource component for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/resources/PythonAPIComponent.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import React, { useEffect, useState } from 'react';
import './PythonAPIComponent.css';
import rawAPI from './api_docs/python_docs.txt?raw'; // The robot.py documentation

/**
 * Python Robot API Component for Resources Page
 */
export default function PythonAPIComponent() {
  const [API, setAPI] = useState([]);

  // Set if the functions to show the documentation for
  const show = new Set([
    'move',
    'rotate',
    'speak',
    'play_music',
    'listen',
  ]);

  /**
   * builds the list of robot.py API elements to display on the page and sets them for the useState variable.
   */
  function buildAPI() {
    const cleanRawAPI = rawAPI.replace(/\|/g, ''); // Regex cleanup to delete | characters
    const functions = cleanRawAPI.split('###'); // Seperates functions

    const cleanFunctions = functions
      .map(item => item.trim())
      .filter(item => show.has(item.match(/^[^(]*/)?.[0]?.trim())); // Regex checking for function names leading up to the first ( in each string

    setAPI(cleanFunctions);
  }

  /**
   * Loads the robot.py API on the page load.
   */
  useEffect( () => {
    buildAPI();
  }, []);

  return (
    <div className="python-api-container">
        <header className="python-api-header">
          <h2>RoboFleet robot.py API</h2>
        </header>

        <div className="scroll-container">
          {API.map((funcText, index) => (
            <div key={index} className="function-box">
              {/* Pulls out the first line of doc text (the function name) */}
              <h3 className="function-title-label">{funcText.split('\n')[0].split('(')[0]}</h3>

              {/* The function doc */}
              <div className='doc-box'>
                {funcText}
              </div>
            </div>
          ))}
        </div>

    </div>
  );
}