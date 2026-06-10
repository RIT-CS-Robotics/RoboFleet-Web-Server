/**
 * File: destinations.js
 * @author Aidan Sanderson
 * Date: 6/9/2026
 * 
 * Functionality: Creates a system for mapping x and y coordinates to location names in the RIT Golisano building 
 * and allows for O(1) retreival of location names when the x and y coordinates are used to search for them.
 */

require('dotenv').config(); // Version: dotenv@17.4.2
const fs = require('fs'); // Version: node@24.16.0
const path = require('path'); // Version: node@24.16.0

const destinationData_path = path.join(__dirname, process.env.DESTINATIONS); // path to the destinations database
const destinationData = fs.readFileSync(destinationData_path, 'utf-8'); // reads destination database in and saves to variable

/**
 * Calculates all pairings to create keys for a specific locations pixel coordinates to include a 1 pixel margin of error
 * 
 * @param xPxl: The x pixel coordinate
 * @param yPxl: The y pixel coordinate
 * @returns All combinations of x and y coordinate pairings with a 1 pixel margin of error (both x and y, - and +)
 */
function pixelError(xPxl, yPxl) {
    const xRange = [xPxl-1, xPxl, xPxl+1];
    const yRange = [yPxl-1, yPxl, yPxl+1];
    const cartesianProduct = [];

    for (let x = 0; x <= 2; x++) {
        for (let y = 0; y <= 2; y++) {
            const pairing = [xRange[x], yRange[y]];
            cartesianProduct.push(pairing);
        }
    }
    return cartesianProduct;
}

/**
 * Converts the destination coordinate from meters to pixels
 * 
 * @param coord: The coordinate in meters to convert to pixels
 * @returns the destination coordinate in pixels
 */
function pixelConverter(coord) {
    const PIXEL_PER_METER = 25.773; 
    const pixelCon = coord * PIXEL_PER_METER; 
    return pixelCon;
}

// Coordinate to Destination Map: O(1)
const destinationMap = new Map();

/**
 * Constructs a key using the x and y coordinates in the RIT Golisano building. 
 * Valid keys will map to a location name in the building.
 * 
 * @param xCoord: The x coordinate of the location in the RIT Golisano building.
 * @param yCoord: The y coordinate of the location in the RIT Golisano building.
 * @returns A key combining the x and y coordinate for its location name in the Map().
 */
function createKey(xCoord, yCoord) {
    const xKey = Math.floor(xCoord);
    const yKey = Math.floor(yCoord);
    const key = `x:${xKey},y:${yKey}`;
    return key;
}

/**
 * Constructs a key using the x and y coordinates in the RIT Golisano building 
 * and uses it to return a location that its mapped to in the destination Map().
 * 
 * @param xCoord: The x coordinate of the location in the RIT Golisano building.
 * @param yCoord: The y coordinate of the location in the RIT Golisano building.
 * @returns A location name mapped to the x and y coordinates, or undefined if the key has no mapping.
 */
function getDestination(xCoord, yCoord) {
    const x = pixelConverter(xCoord);
    const y = 3069 - pixelConverter(yCoord); // because top left is origin and down is positive, it must reverse the conversion so it uses the map height -   y coordinate in pixels
    const key = createKey(x, y);
    return destinationMap.get(key);
}

/**
 * Constructs a Map() which maps x and y coordinate keys to location names in the RIT Golisano building. Does so by reading 
 * in location data from a database and then constructs x and y coordinate keys which then map to their respective location names.
 */
function buildDestinationMap() {
    const lines = destinationData.split('\n');
    for (const line of lines) {
        const cleanLine = line.trim(); // removes whitespaces
        if (cleanLine === "") { // skips empty lines
            continue;
        }
        else {
            const parts = cleanLine.split(/\s+/);
            const destination = parts[0];
            const xCoord = Number(parts[1]);
            const yCoord = Number(parts[2]);
            
            const pairings = pixelError(xCoord, yCoord);
            for (const pair of pairings) {
                const key = createKey(pair[0], pair[1]);
                destinationMap.set(key, destination);
            }
        }
    }
}

buildDestinationMap();

// Use as an import in app.js
module.exports = {getDestination};