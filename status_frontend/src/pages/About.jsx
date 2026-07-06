// src/components/About.jsx
import React from 'react';

export default function About() {
  return (
    <div style={{ 
      padding: '40px 24px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      color: 'var(--text-main)',
      fontFamily: 'var(--font-sans)',
      height: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{ fontSize: '34px', marginBottom: '16px', letterSpacing: '-0.025em' }}>
        About RoboFleet Live Monitor
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
        Welcome to the control instrumentation matrix. This application serves as a localized tracking system for autonomous network assets.
      </p>

      <div style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius)', 
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--accent)' }}>System Features</h3>
        <ul style={{ color: 'var(--text-main)', paddingLeft: '20px', lineHeight: '2' }}>
          <li>Real-time websocket socket tracking loops.</li>
          <li>Widescreen MJPEG camera hardware streams.</li>
          <li>Independent percentage map layout coordinates tracking.</li>
        </ul>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
        Build Version: 1.0.0 // Environment: Production
      </p>
    </div>
  );
}
