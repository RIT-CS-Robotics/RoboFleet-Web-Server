require('dotenv').config();
const fs = require('fs');
const path = require('path');

const destinationData_path = path.join(__dirname, process.env.DESTINATIONS);
const destinationData = fs.readFileSync(destinationData_path, 'utf-8');

// Coordinate to Destination Map
const destinationMap = new Map();

function createKey(xCoord, yCoord) {
    const xKey = Number(xCoord).toFixed(3);
    const yKey = Number(yCoord).toFixed(3);
    const key = `x:${xKey},y:${yKey}`;
    return key;
}

function getDestination(xCoord, yCoord) {
    const key = createKey(xCoord, yCoord);
    return destinationMap.get(key);
}

function buildDestinationMap() {
    const lines = destinationData.split('\n');
    for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine === "") {
            continue;
        }
        else {
            const parts = cleanLine.split(/\s+/);
            const destination = parts[0];
            const xCoord = parts[1];
            const yCoord = parts[2];
            
            const key = createKey(xCoord, yCoord);
            destinationMap.set(key, destination);
        }
    }
}

buildDestinationMap();
module.exports = {getDestination};