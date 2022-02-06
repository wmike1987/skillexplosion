import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

//assuming this is just two units, maybe variable number for the future
var unitSpacing = 60;
var zero = {x: 0, y: 0};

var DestinationFinder = function(units, destination) {
    if(units.length == 2) {
        return DuoPositionFinder(units, destination);
    } else {
        return NoopPositionFinder(units, destination);
    }
};

var DuoPositionFinder = function(possibleUnitArray, destination) {
    var unitA = possibleUnitArray[0];
    var unitB = possibleUnitArray[1];

    //preserve angle of unitB to unitA, but bring unitB closer (to unitSpacing)
    var unitBNewPosition = mathArrayUtils.addScalarToVectorTowardDestination(unitA.position, unitB.position, unitSpacing);

    //find middle point
    var middlePoint = mathArrayUtils.addScalarToVectorTowardDestination(unitA.position, unitB.position, unitSpacing/2.0);

    var offsetVector =  Matter.Vector.sub(middlePoint, destination);

    var retValues = {};
    retValues[unitA.unitId] = Matter.Vector.sub(unitA.position, offsetVector);
    retValues[unitB.unitId] = Matter.Vector.sub(unitBNewPosition, offsetVector);
    return retValues;
};

var NoopPositionFinder = function(possibleUnitArray, destination) {
    var retMap = {};
    possibleUnitArray.forEach((unit) => {
        retMap[unit.unitId] = destination;
    });

    return retMap;
};


export {DestinationFinder};
