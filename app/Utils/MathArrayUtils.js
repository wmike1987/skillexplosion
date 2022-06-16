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

    scaleValueToScreenCoordinates: function(value) {
        return value * globals.currentGame.renderer.screenScaleFactor;
    },

    scalePositionToScreenCoordinates: function(position) {
        if (position) {
            return {
                x: this.scaleValueToScreenCoordinates(position.x),
                y: this.scaleValueToScreenCoordinates(position.y)
            };
        }
    },

    scaleScreenValueToWorldCoordinate: function(value) {
        return value / globals.currentGame.renderer.screenScaleFactor;
    },

    scaleScreenPositionToWorldPosition: function(position) {
        if (position) {
            return {
                x: this.scaleScreenValueToWorldCoordinate(position.x),
                y: this.scaleScreenValueToWorldCoordinate(position.y)
            };
        }
    },

    getRandomNegToPos: function(number) {
        return Math.random() * (number * 2) - number;
    },

    distanceBetweenBodies: function(bodyA, bodyB) {
        var a = bodyA.position.x - bodyB.position.x;
        var b = bodyA.position.y - bodyB.position.y;
        return Math.sqrt(a * a + b * b);
    },

    distanceBetweenPoints: function(A, B) {
        return (Matter.Vector.magnitude(Matter.Vector.sub(A, B)));
    },

    addVectorToPointInDirection: function(initialPoint, endPoint, scalar) {
        var normal = Matter.Vector.normalise(Matter.Vector.sub(endPoint, initialPoint));
        var multdVector = this.multipleVectorByScalar(normal, scalar);
        return {x: initialPoint.x + multdVector.x, y: initialPoint.y + multdVector.y};
    },

    isObject: function(varr) {
        return typeof varr === 'object' && varr !== null;
    },

    distributeXPositionsEvenlyAroundPoint: function(options) {
        options = options || {};
        var position = options.position;
        var numberOfPositions = options.numberOfPositions;
        var numberOnSides = (numberOfPositions - 1) / 2.0;
        var spacing = options.spacing || 50;

        var calculatedPositions = [];

        var totalSpacing = spacing * numberOfPositions - 1;
        for (var x = -numberOnSides; x <= numberOnSides; x++) {
            calculatedPositions.push(this.clonePosition(position, {
                x: (x * spacing)
            }));
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

    //(0.75, 1.00) returns any decimal between the two values, inclusive
    getRandomNumberBetween: function(low, high) {
        return low + Math.random() * (high - low);
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

    reverseForEach: function(array, func) {
        let len = array.length - 1;
        for (var x = len; x >= 0; x--) {
            func(array[x], x);
        }
    },

    operateOnObjectByKey: function(object, operatorFunc) {
        if (!object) return;
        var keys = Object.keys(object);
        var length = keys.length;
        var i = 0;
        var last = false;
        keys.forEach(key => {
            if (i == length - 1) {
                last = true;
            }
            operatorFunc(key, object[key], i, last);
            i++;
        });
    },

    getLengthOfObject: function(object) {
        if (!object) {
            return 0;
        }
        return Object.values(object).length;
    },

    repeatXTimes: function(func, times) {
        times = this.convertToArray(times);
        times = this.getRandomElementOfArray(times);
        var rets = [];
        for (var i = 0; i < times; i++) {
            rets[i] = func(i);
        }

        return rets;
    },

    convertObjectValuesToArray: function(object) {
        if (!object) return;
        var array = [];
        var keys = Object.keys(object);
        keys.forEach(key => {
            array.push(object[key]);
        });

        return array;
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

    defaultValue: function(value, defaultValue) {
        if (this.isFalseNotZero(value)) {
            return defaultValue;
        } else {
            return value;
        }
    },

    resolveBooleanParam: function(value) {
        if (value === false || value === null) {
            return false;
        } else {
            return true;
        }
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
        if (!vector) {
            return null;
        }
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

    multipleVectorByScalar: function(vector, scalar) {
        vector = {
            x: vector.x,
            y: vector.y
        };
        return {
            x: vector.x * scalar,
            y: vector.y * scalar
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

    degreesToRadians: function(degrees) {
        return degrees * (Math.PI / 180);
    },

    //return new position
    addScalarToVectorAtAngle: function(start, angle, scalar) {
        var radians = this.degreesToRadians(angle);
        var opposite = Math.sin(radians);
        var adjacent = Math.cos(radians);
        var destinationPoint = Matter.Vector.add(start, {
            x: adjacent,
            y: -opposite
        });
        return this.addScalarToVectorTowardDestination(start, destinationPoint, scalar);
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

    getSumOfArrayOfValues: function(array) {
        let sum = 0;
        sum = array.reduce(
            (previousValue, currentValue) => previousValue + currentValue,
            0
        );

        return sum;
    },

    getImpeder: function(options) {
        var impeder;
        if(options.sprite) {
            impeder = {
                id: options.id,
                x: mathArrayUtils.scaleScreenValueToWorldCoordinate(options.sprite.getBounds().left),
                y: mathArrayUtils.scaleScreenValueToWorldCoordinate(options.sprite.getBounds().top),
                width: mathArrayUtils.scaleScreenValueToWorldCoordinate(options.sprite.getBounds().width),
                height: mathArrayUtils.scaleScreenValueToWorldCoordinate(options.sprite.getBounds().height),
            }
        } else {
            impeder = {
                id: options.id,
                x: options.x,
                y: options.y,
                width: options.width,
                height: options.height,
            };
        }

        impeder.impedesPoint = function(point) {
            let impeded = true;
            let pointX = point.x;
            let pointY = point.y;

            //add/subtract one to width and height to account for any screen --> world rounding errors
            if (pointX < (this.x - 1) || pointX > this.x + (this.width + 1)) {
                impeded = false;
            }
            if (pointY < (this.y - 1) || pointY > this.y + (this.height + 1)) {
                impeded = false;
            }

            return impeded;
        };

        return impeder;
    }
};

//aliases
mathArrayUtils.getIntBetween = mathArrayUtils.getRandomIntInclusive;
mathArrayUtils.distanceBetweenUnits = mathArrayUtils.distanceBetweenBodies;
mathArrayUtils.getId = mathArrayUtils.uuidv4;
mathArrayUtils.cloneVector = mathArrayUtils.clonePosition;

export {
    mathArrayUtils
};
