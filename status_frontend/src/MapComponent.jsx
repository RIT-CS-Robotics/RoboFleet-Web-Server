import React from 'react';
import golisano from './assets/map.png';

export default function GolisanoMap() {
  return (
    <div style={{ marginTop: '30px' }}>
      <h4>Robot Locations in Golisano</h4>
      <div className="map-wrapper" style={{ display: 'inline-block', maxWidth: '100%', marginTop: '10px' }}>
        <img 
          src={golisano} 
          alt="Golisano Building Map" 
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #e5e7eb' }} 
        />
      </div>
    </div>
  );
}
