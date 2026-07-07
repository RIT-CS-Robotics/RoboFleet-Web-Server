// src/components/About.jsx
import React from 'react';
import './About.css';
import robotImage from '../assets/robot.png';

export default function About() {
  return (
    <div className="about-container">

        <header className="about-header">
          <h2>About RoboFleet</h2>
        </header>

      <div className="about-scrollable-content">

        <main className="about-content">

          <img src={robotImage} alt='A RoboFleet Robot'></img>

          {/* System Features Panel */}
          <section className="content-card-panel">
            <h3>System Features</h3>
            <ul className="features-list">
              <li>Real-time robot tracking</li>
              <li>Deployable robots by student code</li>
              <li>Boosting student engagement in computer science</li>
            </ul>
          </section>

          {/* Project Purpose Panel */}
          <section className="content-card-panel">
            <p className="purpose-text">
              The purpose of the RoboFleet project is to... (Will fill in later)
            </p>
          </section>

          {/* Research Team Information */}
          <section className="team-section">
            <h3>Research Team</h3>
            <p className="team-roster">
              Zachary Butler, Aidan Sanderson, Anusha Ghosh, Mayank Rawat
            </p>

          </section>
        </main>
      </div>

      {/* Technical Build Metadata Footer - Fixed to Bottom */}
      <footer className="about-footer">
        <code className="build-version">Build Version: 0.9.0 // BETA</code>
          <p className="email-section">
              For more information please email Zachary Butler @ zxbvcs@rit.edu (Professor of Computer Science at Rochester Institute of Technology, Ph.D. in Robotics)
          </p>
      </footer>
    </div>
  );
}
