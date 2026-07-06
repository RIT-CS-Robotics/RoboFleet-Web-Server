import React from 'react';
import golisano from '../assets/map.png';
import './MapComponent.css';

const MAP_SIZE_X = 2012;
const MAP_SIZE_Y = 3069;

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

function getRobotColor(robotId) {
  let robotColor = "gray";
  if (robotId.includes("1")) robotColor = "red";
  if (robotId.includes("2")) robotColor = "blue";
  if (robotId.includes("3")) robotColor = "green";
  return robotColor;
}

export default function MapComponent({ fleetData }) {
  return (
    <div className="map-container">
      <h4 className="map-title">Robot Locations in Golisano</h4>
      <div className="map-wrapper">
        <img src={golisano} alt="Golisano Building Map" className="map-image" />
        
        {Object.entries(fleetData || {}).map(([robotId, info]) => {
          if (!info?.online || info?.position?.x === undefined || info?.position?.y === undefined) {
            return null;
          }

          const { x, y } = robotPlacement(info.position.x, info.position.y);
          const percentYTop = `${100 - parseFloat(y)}%`;

          return (
            <div 
              key={robotId} 
              title={robotId} 
              className="robot-map-dot" 
              style={{ 
                backgroundColor: getRobotColor(robotId), 
                left: x, 
                top: percentYTop, 
                transform: 'translate(-50%, -50%)', 
                transition: 'left 0.5s linear, top 0.5s linear' 
              }} 
            />
          );
        })}
      </div>
    </div>
  );
}
