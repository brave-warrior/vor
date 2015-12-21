'use strict';
const Rx = require('rx');

class Location {
  constructor(beacons) {
    this.beacons = beacons;
  }

  fromDeviceStream(stream) {
    return stream
      .bufferWithCount(3)
      .do(([b1, b2, b3]) => console.log('Server - beacons --> ', b1, b2, b3))
      .map((beaconMessages) => this.beacons.reduce(reduceConfig(beaconMessages), []))
      .filter(validBeacons => validBeacons.length === 3)
      .map(([beacon1, beacon2, beacon3]) => {
        const messageData = Object.assign({
          email: beacon1.email, // get email data from beacon
          type: 'location' // constant for every message
        }, calculatePosition(beacon1, beacon2, beacon3));
        const logBeacons = `${beacon1.id}, ${beacon2.id}, ${beacon3.id}`;
        console.log(`Server - location for (${logBeacons}) --> ${JSON.stringify(messageData)}`);
        return messageData;
      });
  }
}

function reduceConfig(beacons) {
  return function(validBeacons, config) {
    const beaconWithConfig = beacons
      .filter(beacon => beacon.id === config.id)
      .filter(beacon => beacon.floor === config.floor)
      .map(beacon => {
        return {
          id: beacon.id,
          email: beacon.email,
          distance: beacon.distance,
          x: config.x,
          y: config.y
        };
      });
    return validBeacons.concat(beaconWithConfig);
  };
}

/*
 http://everything2.com/title/Triangulate
 http://stackoverflow.com/questions/20332856/triangulate-example-for-ibeacons#answer-20976803
 */

function calculatePosition(obj1, obj2, obj3) {

  const W = getIntersectionPoint(obj1, obj2);
  const Z = getIntersectionPoint(obj2, obj3);
  const Y = (W * (obj3.y - obj2.y) - Z * (obj2.y - obj1.y));
  const x = Y / (2 * ((obj2.x - obj1.x) * (obj3.y - obj2.y) - (obj3.x - obj2.x) * (obj2.y - obj1.y)));
  const y = (W - 2 * x * (obj2.x - obj1.x)) / (2 * (obj2.y - obj1.y));

  return {
    x: isValidPosition(x) && x || 0,
    y: isValidPosition(y) && y || 0
  };
}
const getIntersectionPoint = (obj1, obj2) => {
  const areaDifference = Math.pow(obj1.distance, 2) - Math.pow(obj2.distance, 2);
  return areaDifference - Math.pow(obj1.x, 2) - Math.pow(obj1.y, 2) + Math.pow(obj2.x, 2) + Math.pow(obj2.y, 2);
};

const isValidPosition = (x) => !(isNaN(x) || x + x === x); // infinity + infinity = infinity

module.exports = Location;
