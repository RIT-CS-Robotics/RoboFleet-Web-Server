/**
 * Functionality: Java Robot API Resource component for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/resources/java_api/JavaAPIComponent.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import React, { useEffect, useState } from 'react';
import './JavaAPIComponent.css';
import rawAPI from './java_docs.txt?raw'; // The Robot.java documentation

/**
 * Java Robot API Component for Resources Page
 */
export default function JavaAPIComponent() {
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
   * builds the list of Robot.Java API elements to display on the page and sets them for the useState variable.
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
   * Loads the Robot.java API on the page load.
   */
  useEffect( () => {
    buildAPI();
  }, []);

  return (
    <div className="java-api-container">
        <header className="java-api-header">
          <h2>Robot.java API</h2>
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