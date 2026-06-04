
import React from 'react';
import golisano from './assets/map.png';

// Resolution should be 0.0388
// FIX: Accept children so the robot dot loops can inject directly on top of the image boundary
export default function GolisanoMap({ dots }) {
  return (
    <div style={{ marginTop: '30px' }}>
      <h4>Robot Locations in Golisano</h4>
      <div 
        className="map-wrapper" 
        style={{ 
          position: 'relative',    // CRITICAL: Anchors the absolute dots to the image's top-left corner
          display: 'inline-block', 
          maxWidth: '100%', 
          marginTop: '10px' 
        }}
      >
        <img 
          src={golisano} 
          alt="Golisano Building Map" 
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #e5e7eb' }} 
        />
        
        {/* This places the floating dots on top of the map layer */}
        {dots}
      </div>
    </div>
  );
}