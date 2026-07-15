/**
 * @file status_frontend/src/pages/About.jsx
 * 
 * @fileoverview About page for RoboFleet (robotics-project.gccis.rit.edu/status)
 * 
 * @date 7/8/2026
 * @author Aidan Sanderson
 */
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

          <img src={robotImage} alt="A RoboFleet Robot" className="about-hero-image" />

          {/* SYSTEM FEATURES */}
          <section className="content-card-panel">
            <h3>System Features</h3>
            <ul className="features-list">
              <li>Deployable robots by student code</li>
              <li>Real-time robot location tracking</li>
              <li>Robot live video streaming</li>
              <li>Robot destination tracking</li>
              <li>Pullable code logs for student understanding and practice</li>
            </ul>
          </section>

          {/* PROJECT PURPOSE */}
          <section className="content-card-panel">
            <p className="purpose-text">
              The purpose of the RoboFleet project is to research the effects that robots can have on beginner computer science courses when implemented as a core part of the curriculum. Evidence has shown that the use of robots in beginner computer science courses can boost student motivation, engagement, and learning. Students can use the RoboFleet website to write code and deploy robots to run that code in order to practice coding while interacting with real world environments through the robots. Students can also view code logs from previous robot deployments to get a better understanding of what their code did, and use that feedback to improve their coding skills and understanding of computer science principles.
            </p>
          </section>

          {/* RESEARCH TEAM INFO */}
          <section className="team-section">
            <h3>Research Team</h3>
            <p className="team-roster">
              Zachary Butler, Aidan Sanderson, Anusha Ghosh, Mayank Rawat
            </p>

            <code className="build-version">Build Version: 0.9.0 // BETA</code>

          </section>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="about-footer">
          <p className="email-section">
              For more information please email Zachary Butler @ zxbvcs@rit.edu (Professor of Computer Science at Rochester Institute of Technology, Ph.D. in Robotics)
          </p>
      </footer>
    </div>
  );
}
