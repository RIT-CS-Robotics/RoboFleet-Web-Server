// src/components/MapComponent.jsx
import React from 'react'; 
import golisano from '../assets/map.png'; 
import './MapComponent.css'; 

// Resolution should be 0.0388 
// FIX: Accept children so the robot dot loops can inject directly on top of the image boundary 
export default function MapComponent({ dots }) { 
  return ( 
    <div className="map-container"> 
      <h4 className="map-title">Robot Locations in Golisano</h4> 
      <div className="map-wrapper"> 
        <img src={golisano} alt="Golisano Building Map" className="map-image" /> 
        {/* This places the floating dots on top of the map layer */} 
        {dots} 
      </div> 
    </div> 
  ); 
}
