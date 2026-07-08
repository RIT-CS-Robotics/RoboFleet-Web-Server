/**
 * @file status_frontend/src/components/MapComponent.jsx
 * 
 * @fileoverview Map component for the status page (robotics-project.gccis.rit.edu/status)
 * 
 * @date 7/8/2026
 * @author Aidan Sanderson
 */

import React from 'react';
import golisano from '../assets/map.png';
import './MapComponent.css';

const MAP_SIZE_X = 2012;
const MAP_SIZE_Y = 3069;

/**
 * Computes the needed x and y coordinates from meters to pixels on the map as a percentage of where to place the robot dots on the map.
 * 
 * @param {number} metersX: The x coordinate in meters.
 * @param {number} metersY: The y coordinate in meters.
 * @returns {{x: string, y: string}} The x and y percentage coordinates for pixels.
 */
export function robotPlacement(metersX, metersY) {
  const PIXEL_PER_METER = 25.773;
  const pixelConX = metersX * PIXEL_PER_METER;
  const pixelConY = metersY * PIXEL_PER_METER;
  
  const percentX = (pixelConX / MAP_SIZE_X) * 100;
  const percentY = (pixelConY / MAP_SIZE_Y) * 100;
  
  return { 
    x: `${percentX}%`, 
    y: `${percentY}%` 
  };
}

export default function MapComponent({ fleetData }) {
  return (
    <div className="map-container">
      <h4 className="map-title">Robot Locations in Golisano</h4>
      <div className="map-wrapper">
        {/* MAP IMAGE */}
        <img src={golisano} alt="Golisano Building Map" className="map-image" />
        
        {Object.entries(fleetData || {}).map(([robotId, info]) => {
          if (!info?.online || info?.position?.x === undefined || info?.position?.y === undefined) {
            return null;
          }

          const { x, y } = robotPlacement(info.position.x, info.position.y);
          const percentYTop = `${100 - parseFloat(y)}%`;

          // ROBOT DOT ON THE MAP
          return (
            <div 
              key={robotId} 
              title={robotId} 
              className="robot-map-dot" 
              style={{ 
                backgroundColor: info.color, 
                left: x, 
                top: percentYTop, 
                transform: 'translate(-50%, -50%)', 
                transition: 'left 2s linear, top 2s linear' 
              }} 
            />
          );
        })}
      </div>
    </div>
  );
}
