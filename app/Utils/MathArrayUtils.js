/*
 * Module containing math and array utilities
 */
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import hs from '@utils/HS.js';
import * as $ from 'jquery';
import * as h from 'howler';
import styles from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import gleamShader from '@shaders/GleamShader.js';
import seedrandom from 'seedrandom';

var mathArrayUtils = {
    uuidv4: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    distanceBetweenBodies: function(bodyA, bodyB) {
        var a = bodyA.position.x - bodyB.position.x;
        var b = bodyA.position.y - bodyB.position.y;
        return Math.sqrt(a * a + b * b);
    },
    distanceBetweenPoints: function(A, B) {
        return (Matter.Vector.magnitude(Matter.Vector.sub(A, B)));
    },

    isObject: function(varr) {
        return typeof varr === 'object' && varr !== null;
    },

    distributeXPositionsEvenlyAroundPoint: function(options) {
        options = options || {};
        var position = options.position;
        var numberOfPositions = options.numberOfPositions;
        var numberOnSides = (numberOfPositions-1)/2.0;
        var spacing = options.spacing || 50;

        var calculatedPositions = [];

        var totalSpacing = spacing * numberOfPositions-1;
        for(var x = -numberOnSides; x <= numberOnSides; x++) {
            calculatedPositions.push(this.clonePosition(position, {x: (x * spacing)}));
        }

        return calculatedPositions;
    },

    setRandomToTrueRandom: function() {
        this.setRandomizerSeed(null);
    },

    setRandomizerSeed: function(seed) {
        if (!seed) {
            seed = seedrandom()();
        }
        seedrandom(seed, {
            global: true
        });
        return seed;
    },

    //1, 4 return an int in (1, 2, 3, 4)
    getRandomIntInclusive: function(low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    },

    getRandomElementOfArray: function(array) {
        if (array && array.length > 0) {
            return array[this.getRandomIntInclusive(0, array.length - 1)];
        }
    },

    removeObjectFromArray: function(objToRemove, array) {
        var index = array.indexOf(objToRemove);
        if (index > -1) {
            array.splice(index, 1);
        }
    },

    operateOnObjectByKey: function(object, operatorFunc) {
        if (!object) return;
        var keys = Object.keys(object);
        keys.forEach(key => {
            operatorFunc(key, object[key]);
        });
    },

    convertToArray: function(object) {
        var arr;
        if (!$.isArray(object)) {
            arr = [object];
        } else {
            arr = object;
        }

        return arr;
    },

    //This counts zero "0" as a valid value
    isFalseNotZero: function(value) {
        return (!value && (value !== 0));
    },

    cloneVertices: function(vertices) {
        var newVertices = [];
        $.each(vertices, function(index, vertice) {
            newVertices.push({
                x: vertice.x,
                y: vertice.y
            });
        });
        return newVertices;
    },

    cloneParts: function(parts) {
        var newParts = [];
        $.each(parts, function(index, part) {
            newParts.push({
                vertices: this.cloneVertices(part.vertices)
            });
        }.bind(this));
        return newParts;
    },

    clonePosition: function(vector, offset) {
        offset = $.extend({
            x: 0,
            y: 0
        }, offset);
        return {
            x: vector.x + offset.x,
            y: vector.y + offset.y
        };
    },

    addScalarToPosition: function(position, scalar, reverseY) {
        reverseY = reverseY ? -1 : 1;
        return {
            x: position.x + scalar,
            y: position.y + scalar * reverseY
        };
    },

    multiplyPositionAndScalar: function(position, scalar) {
        position = $.extend({
            x: 0,
            y: 0
        }, position);
        return {
            x: position.x * scalar,
            y: position.y * scalar
        };
    },

    flipCoin: function() {
        return Math.random() > 0.5;
    },

    //round position to whole numbers
    roundPositionToWholeNumbers: function(position) {
        position.x = Math.round(position.x);
        position.y = Math.round(position.y);
        return position;
    },

    //return new position
    addScalarToVectorTowardDestination: function(start, destination, scalar) {
        var subbed = Matter.Vector.sub(destination, start);
        var normed = Matter.Vector.normalise(subbed);
        var scaled = Matter.Vector.mult(normed, scalar);
        return Matter.Vector.add(start, scaled);
    },

    //return angle to rotate something facing an original direction, towards a point
    pointInDirection: function(origin, destination, orientation) {
        orientation = orientation || 'north';
        if (orientation == 'east')
            orientation = {
                x: origin.x + 1,
                y: origin.y
            };
        else if (orientation == 'north')
            orientation = {
                x: origin.x,
                y: origin.y + 1
            };
        else if (orientation == 'west')
            orientation = {
                x: origin.x - 1,
                y: origin.y
            };
        else if (orientation == 'south')
            orientation = {
                x: origin.x,
                y: origin.y - 1
            };

        var originAngle = Matter.Vector.angle(origin, orientation);
        var destAngle = Matter.Vector.angle(origin, {
            x: destination.x,
            y: (origin.y + (origin.y - destination.y))
        });

        return originAngle - destAngle;
    },

    angleBetweenTwoVectors: function(vecA, vecB) {
        return Math.acos((Matter.Vector.dot(vecA, vecB)) / (Matter.Vector.magnitude(vecA) * Matter.Vector.magnitude(vecB)));
    },
};

//aliases
mathArrayUtils.getIntBetween = mathArrayUtils.getRandomIntInclusive;
mathArrayUtils.distanceBetweenUnits = mathArrayUtils.distanceBetweenBodies;
mathArrayUtils.getId = mathArrayUtils.uuidv4;

export {
    mathArrayUtils
};