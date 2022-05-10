/*
 * Module containing utilities
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
import {
    graphicsUtils
} from '@utils/GraphicsUtils.js';
import {
    mathArrayUtils
} from '@utils/MathArrayUtils.js';
import cursors from '@utils/Cursors.js';
import {
    unitUtils
} from '@utils/UnitUtils.js';

var praiseWords = ["GREAT", "EXCELLENT", "NICE", "WELL DONE", "AWESOME"];
var begin = ["BEGIN"];

var gameUtils = {

    /*
     * options {
     *  (numberOfFrames
     *  startFrameNumber
     *  baseName
     *  bufferUnderTen)
     *  OR
     *  (animationName
     *  spritesheetName)
     *  transform
     *  speed
     *  playThisManyTimes (or times)
     *  rotation
     *  body
     *  where
     *  onComplete
     */
    getAnimation: function(options) {
        var frames = [];
        var anim = null;
        if (options.numberOfFrames) {
            var numberOfFrames = options.numberOfFrames || PIXI.Loader.shared[options.baseName + 'FrameCount'] || 10;
            var startFrame = (options.startFrameNumber == 0 ? 0 : options.startFrameNumber || 1);
            for (var i = startFrame; i < startFrame + numberOfFrames; i++) {
                try {
                    var j = i;
                    if (options.bufferUnderTen && j < 10)
                        j = "0" + j;
                    frames.push(PIXI.Texture.from(options.baseName + j + '.png'));
                } catch (err) {
                    try {
                        frames.push(PIXI.Texture.from(options.baseName + i + '.jpg'));
                    } catch (err) {
                        break;
                    }
                }
            }
            anim = new PIXI.AnimatedSprite(frames);
        } else {
            anim = new PIXI.AnimatedSprite(globals.currentGame.renderer.texturePool[options.spritesheetName].spritesheet.animations[options.animationName]);
        }

        if (options.reverse) {
            anim._textures = [...anim._textures];
            anim._textures.reverse();
        }

        if (options.fadeAway) {
            anim.onComplete = function() { //default onComplete function
                var done = function() {
                    gameUtils.detachSomethingFromBody(anim); //in case we're attached
                    if (options.onCompleteExtension) {
                        options.onCompleteExtension();
                    }
                };
                graphicsUtils.fadeSpriteOverTimeLegacy(anim, options.fadeTime || 2000, false, done);
            }.bind(this);
        } else {
            anim.onComplete = function() { //default onComplete function
                if (!anim.persists) {
                    graphicsUtils.removeSomethingFromRenderer(anim);
                    gameUtils.detachSomethingFromBody(anim); //in case we're attached
                }
                if (options.onCompleteExtension) {
                    options.onCompleteExtension();
                }
            }.bind(this);
        }
        anim.persists = options.persists;
        anim.setTransform.apply(anim, options.transform || [-1000, -1000]);
        anim.animationSpeed = options.speed;
        anim.loop = (options.playThisManyTimes == 'loop') || (options.loop && !options.loopPause);
        anim.loopPause = options.loopPause;
        anim.playThisManyTimes = options.playThisManyTimes || options.times;
        anim.currentPlayCount = anim.playThisManyTimes;
        anim.anchor = options.anchor || {
            x: 0.5,
            y: 0.5
        };

        if (options.rotation)
            anim.rotation = options.rotation;

        //default on complete allows for multi-play
        if (!anim.loop && anim.currentPlayCount && anim.currentPlayCount > 0) {
            anim.onManyComplete = anim.onComplete; //default to remove the animation
            anim.onComplete = function() { //override onComplete to countdown the specified number of times
                if (--anim.currentPlayCount) {
                    //console.info(anim.currentPlayCount);
                    anim.gotoAndPlay(0);
                } else {
                    anim.onManyComplete.call(anim);
                    this.currentPlayCount = this.playThisManyTimes;
                }
            };
        }

        //functionality for loop pause
        if (anim.loopPause) {
            anim.onManyComplete = anim.onComplete; //default to remove the animation
            anim.onComplete = function() { //override onComplete to countdown the specified number of times
                gameUtils.doSomethingAfterDuration(() => {
                    //make sure the animation wasn't destroyed in the meantime. This is a phenomenon where
                    //the animation gets destroyed, but we play it anyway, then if the game is nuked, the destroyed animation
                    //will be playing (and will not get get redestroyed upon render.clear()) but will have its underlying texture
                    //pulled from it and will result in a null pointer
                    if (!anim._destroyed) {
                        anim.gotoAndPlay(0);
                    }
                }, anim.loopPause);
            };
        }

        anim.startFromFrameZero = function() {
            this.gotoAndPlay(0);
        };

        if (options.onComplete) {
            anim.onComplete = options.onComplete;
        }
        if (options.onManyComplete) {
            anim.onManyComplete = options.onManyComplete;
        }

        return anim;
    },

    /*
     * options {
     *  spine: the pixi-spine object
     *  animationName: the animation name
     *  loops: loop or not
     *  times: how many times to play the animation
     *  speed: animation speed
     *  canInterruptSelf: default true
     *
     *  // NOTE: right now we're just using track 0 and this method assumes such
     * }
     */

    getSpineAnimation: function(options) {
        options = $.extend({
            canInterruptSelf: true
        }, options);
        var anim = {
            spine: options.spine
        };

        if (options.listeners) {
            var arrListeners = mathArrayUtils.convertToArray(options.listeners);
            arrListeners.forEach(listener => {
                var event = {};
                event[listener.name] = listener.f;
                anim.spine.state.addListener(event);
            });
        }

        Object.defineProperty(anim, 'visible', {
            set: function(v) {
                options.spine.visible = v;
                // reset lastTime to be null since pixi freezes the delta timing of the pixi-spine object when 'visible' becomes false.
                options.spine.lastTime = null;
            }
        });

        Object.defineProperty(anim, 'alpha', {
            set: function(v) {
                options.spine.alpha = v;
            }
        });

        Object.defineProperty(anim, 'tint', {
            set: function(v) {
                options.spine.tint = v;
            }
        });

        anim.play = function() {
            if (!options.canInterruptSelf && options.spine.currentAnimation == options.animationName) {
                return;
            }

            //Clear any mixed animations
            options.spine.state.clearTrack(1);

            //This is hard coded to play something on track 1, if multiple
            if (options.mixedAnimation) {
                options.spine.state.clearTrack(1);
                var track = options.spine.state.addAnimation(1, options.animationName, false, 0);
                track.mixDuration = 2.0;
                return;
            }

            //Clear track
            options.spine.skeleton.setToSetupPose();
            options.spine.state.clearTrack(0);

            //Set the animation name for use in the above test
            options.spine.currentAnimation = options.animationName;

            //Set animation speed
            options.spine.state.timeScale = options.speed || 1;

            if (!options.times) {
                options.times = 1;
            }
            //Loop if desired
            if (options.loop) {
                options.spine.state.setAnimation(0, options.animationName, options.loop);
            } else if (options.times) {
                //Otherwise queue the animation so many times
                $.each(new Array(options.times), function() {
                    var entry = options.spine.state.addAnimation(0, options.animationName, false, 0);
                });
            }
        };

        anim.stop = function() {
            options.spine.state.clearTrack(0);
            options.spine.state.clearTrack(1);
            options.spine.skeleton.setToSetupPose();
            options.spine.currentAnimation = null;
        };

        options.spine.state.addListener({
            complete: options.completeListener
        });

        return anim;
    },

    /* If we're attaching a body, don't worry about interpolation. Note: attaching
     * a body to another body only updates the attached body after an engine update, so any
     * manual moves of the master body won't take effect until an afterUpdate is triggered
     *
     * If we're attaching a sprite, hitch onto interpolation
     */
    attachSomethingToBody: function(options) {
        var something, body, offset, somethingId;
        ({
            something,
            body,
            offset,
            somethingId
        } = options);

        offset = offset || {
            x: 0,
            y: 0
        };
        var callbackLocation = 'afterRenderWorld';
        if (something.type && something.type == 'body') {
            callbackLocation = 'afterUpdate';
        }

        //first detatch some previous body if possible
        this.detachSomethingFromBody(something);

        //if we run immediately (which we do), then the first iteration will use the following tick (not the tick callback var)
        var tick = {
            offset: offset
        };
        tick = globals.currentGame.addTickCallback(function() {
            if (something.type && something.type == 'body') {
                Matter.Body.setPosition(something, Matter.Vector.add(body.position, tick.offset));
            } else {
                var floatOffset = {
                    x: 0,
                    y: something.floatYOffset || 0
                };
                something.position = Matter.Vector.add(body.lastDrawPosition || body.position, Matter.Vector.add(tick.offset, floatOffset));
            }
        }, {
            runImmediately: true,
            eventName: callbackLocation
        });
        tick.offset = offset; //ability to change the offset via the tick

        something.bodyAttachmentTick = tick;
        something.bodyAttachmentBody = body;
        this.deathPact(body, tick, somethingId);

        //this option allows us to deathpact the attachment image (or body) with the master body
        if (options.deathPactSomething) {
            this.deathPact(body, something);
        }
    },

    detachSomethingFromBody: function(something) {
        if (something.bodyAttachmentTick) {
            this.undeathPact(something.bodyAttachmentBody, something.bodyAttachmentTick);
            this.undeathPact(something.bodyAttachmentBody, something);
            globals.currentGame.removeTickCallback(something.bodyAttachmentTick);
            something.bodyAttachmentBody = null;
            something.bodyAttachmentTick = null;
        }
    },

    getLagCompensatedVerticesForBody: function(body) {
        if (body.verticesCopy && body.verticesCopy.length >= globals.currentGame.lagCompensation) {
            return body.verticesCopy[body.verticesCopy.length - globals.currentGame.lagCompensation];
        } else {
            return null;
        }
    },

    matterOnce: function(obj, eventName, callback, options) {
        options = options || {};
        var wrappedFunction = function(event) {
            var result = callback(event);
            if (options.conditionalOff && !result) {
                return;
            }
            Matter.Events.off(obj, eventName, wrappedFunction);
        };
        var removeFunction = function() {
            Matter.Events.off(obj, eventName, wrappedFunction);
        };
        var f = Matter.Events.on(obj, eventName, wrappedFunction);
        return {
            func: f,
            removeHandler: removeFunction
        };
    },

    matterConditionalOnce: function(obj, eventName, callback) {
        return this.matterOnce(obj, eventName, callback, {
            conditionalOff: true
        });
    },

    scaleBody: function(body, x, y) {
        Matter.Body.scale(body, x, y);
        body.render.sprite.xScale *= x;
        body.render.sprite.yScale *= y;

        //if we're flipping just by 1 axis, we need to reverse the vertices to maintain clockwise ordering
        if (x * y < 0) {
            $.each(body.parts, function(i, part) {
                part.vertices.reverse();
            });
        }
    },

    sendBodyToDestinationAtSpeed: function(body, destination, speed, surpassDestination, rotateTowards, arrivedCallback, track) {
        var setVelocityFunction = function() {
            //see if we have a potentially changing position
            var position = destination;
            if (destination.position) {
                position = destination.position;
            }
            var velocityVector = Matter.Vector.sub(position, body.position);
            var velocityScale = speed / Matter.Vector.magnitude(velocityVector);

            if (surpassDestination) {
                Matter.Body.setVelocity(body, Matter.Vector.mult(velocityVector, velocityScale));
            } else {
                if (Matter.Vector.magnitude(velocityVector) < speed) {
                    Matter.Body.setVelocity(body, velocityVector);
                } else {
                    Matter.Body.setVelocity(body, Matter.Vector.mult(velocityVector, velocityScale));
                }
            }
        };

        //initially set the velocity
        setVelocityFunction();

        //if we're tracking a position, set this up
        var trackingTimer = null;
        if (track) {
            trackingTimer = globals.currentGame.addTimer({
                name: 'trackingTimer:' + mathArrayUtils.getId(),
                gogogo: true,
                tickCallback: setVelocityFunction
            });
        }

        if (arrivedCallback) {
            var originalOrigin = {
                x: body.position.x,
                y: body.position.y
            };
            var originalDistance = Matter.Vector.magnitude(Matter.Vector.sub(destination, body.position));
            var removeSelf = globals.currentGame.addTickCallback(function() {
                if (gameUtils.bodyRanOffStage(body) || mathArrayUtils.distanceBetweenPoints(body.position, originalOrigin) >= originalDistance) {
                    if (trackingTimer) {
                        trackingTimer.invalidate();
                    }
                    arrivedCallback();
                    globals.currentGame.removeTickCallback(removeSelf);
                }
            });
        }

        return trackingTimer;
    },

    bodyRanOffStage: function(body, buffer, topBuffer, bottomBuffer, rightBuffer, leftBuffer) {
        buffer = buffer || 50;
        if (body.velocity.x < 0 && body.bounds.max.x < (leftBuffer || -buffer))
            return true;
        if (body.velocity.x > 0 && body.bounds.min.x > this.getPlayableWidth() + (rightBuffer || buffer))
            return true;
        if (body.velocity.y > 0 && body.bounds.min.y > this.getPlayableHeight() + (bottomBuffer || buffer))
            return true;
        if (body.velocity.y < 0 && body.bounds.max.y < (topBuffer || -buffer))
            return true;
    },

    getRandomPlacementWithinCanvasBounds: function() {
        var placement = {};
        placement.x = Math.random() * this.getCanvasWidth();
        placement.y = Math.random() * this.getCanvasHeight();
        return placement;
    },

    getRandomPlacementWithinPlayableBounds: function(options) {
        var buffer, noZones;
        ({
            buffer,
            noZones
        } = options);

        if (noZones) {
            noZones = mathArrayUtils.convertToArray(noZones);
        }

        if (options.useUpcomingSceneNoZones) {
            noZones = noZones.concat(globals.currentGame.upcomingScene.getNoZones());
        }

        if (buffer && !buffer.x) {
            buffer = {
                x: buffer,
                y: buffer
            };
        }
        if (!buffer) buffer = {
            x: 0,
            y: 0
        };
        var placement = {};

        //this is horrible
        var conflictFound = function(incomingComparisonObject) {
            if (!noZones) {
                return false;
            }
            var conflict = noZones.some((nz) => {
                if (incomingComparisonObject.isDoodad) {
                    return incomingComparisonObject.collidesInTheory(placement, nz);
                } else {
                    return gameUtils.detectNoZoneCollision(incomingComparisonObject, nz);
                }
            });

            return conflict;
        };

        var doodad = options.doodad;
        var comparisonThing = null;
        do {
            placement.x = buffer.x + (Math.random() * (this.getPlayableWidth() - buffer.x * 2));
            placement.y = buffer.y + (Math.random() * (this.getPlayableHeight() - buffer.y * 2));
            if (doodad) {
                comparisonThing = doodad;
            } else {
                comparisonThing = {
                    center: placement,
                    radius: 0
                };
            }
        } while (conflictFound(comparisonThing));
        return placement;
    },

    detectNoZoneCollision: function(nz1, nz2) {
        var combinedRadius = nz1.radius + nz2.radius;
        return mathArrayUtils.distanceBetweenPoints(nz1.center, nz2.center) < combinedRadius;
    },

    detectNoZoneCollisions: function(nz1, nzArray) {
        return nzArray.some((nz) => {
            let combinedRadius = nz1.radius + nz.radius;
            return mathArrayUtils.distanceBetweenPoints(nz1.center, nz.center) < combinedRadius;
        });
    },

    getRandomPositionWithinRadiusAroundPoint: function(options) {
        var point, radius, buffer, minRadius, maxRadius, maxX, minX, maxY, minY, withinPlayableBounds, playableBoundBuffer, noZones;
        ({
            point,
            radius,
            buffer,
            minRadius,
            maxRadius,
            maxX,
            minX,
            maxY,
            minY,
            withinPlayableBounds,
            playableBoundBuffer,
            noZones
        } = options);

        if (noZones) {
            noZones = mathArrayUtils.convertToArray(noZones);
        } else {
            noZones = [];
        }

        var position = {
            x: 0,
            y: 0
        };
        buffer = buffer || 0;
        minRadius = minRadius || 0;
        maxRadius = maxRadius || 999999;
        radius = radius || maxRadius;
        radius = radius - buffer;
        maxX = maxX || gameUtils.getPlayableWidth() - buffer;
        minX = minX || 0 + buffer;
        maxY = maxY || gameUtils.getPlayableHeight() - buffer;
        minY = minY || 0 + buffer;

        do {
            position.x = point.x - radius + (Math.random() * (radius * 2));
            position.y = point.y - radius + (Math.random() * (radius * 2));

        } while ((gameUtils.detectNoZoneCollisions({center: position, radius: 20}, noZones) ||
                position.y > maxY ||
                position.y < minY ||
                position.x > maxX ||
                position.x < minX ||
                mathArrayUtils.distanceBetweenPoints(position, point) < minRadius ||
                mathArrayUtils.distanceBetweenPoints(position, point) > maxRadius) ||
            (withinPlayableBounds && !this.isPositionWithinPlayableBounds(position, playableBoundBuffer)));

        return mathArrayUtils.roundPositionToWholeNumbers(position);
    },

    isPositionWithinPlayableBounds: function(position, buffer) {
        if (buffer && !buffer.x) {
            buffer = {
                x: buffer,
                y: buffer
            };
        }
        if (!buffer) buffer = {
            x: 0,
            y: 0
        };
        if (position.x > 0 + buffer.x && position.x < this.getPlayableWidth() - buffer.x) {
            if (position.y > 0 + buffer.y && position.y < this.getPlayableHeight() - buffer.y) {
                return true;
            }
        }
        return false;
    },

    isPositionWithinMapBounds: function(position, buffer) {
        buffer = buffer || {x: 0, y: 0};
        var mapBuffer = {x: 100 + buffer.x, y: 0 + buffer.y};
        return this.isPositionWithinPlayableBounds(position, mapBuffer);
    },

    isPositionWithinCanvasBounds: function(position, buffer) {
        if (buffer && !buffer.x) {
            buffer = {
                x: buffer,
                y: buffer
            };
        }
        if (!buffer) buffer = {
            x: 0,
            y: 0
        };
        if (position.x > 0 + buffer.x && position.x < this.getCanvasWidth() - buffer.x) {
            if (position.y > 0 + buffer.y && position.y < this.getCanvasHeight() - buffer.y) {
                return true;
            }
        }
        return false;
    },

    isPositionWithinRealCanvasBounds: function(position, buffer) {
        if (buffer && !buffer.x) {
            buffer = {
                x: buffer,
                y: buffer
            };
        }
        if (!buffer) buffer = {
            x: 0,
            y: 0
        };
        if (position.x > 0 + buffer.x && position.x < this.getRealCanvasWidth() - buffer.x) {
            if (position.y > 0 + buffer.y && position.y < this.getRealCanvasHeight() - buffer.y) {
                return true;
            }
        }
        return false;
    },

    addRandomVariationToGivenPosition: function(position, randomFactorX, randomFactorY) {
        position.x += (1 - 2 * Math.random()) * randomFactorX;
        position.y += (1 - 2 * Math.random()) * (randomFactorY || randomFactorX);
        return position;
    },

    createAmbientLights: function(options) {
        options = options || {};
        var hexColorArray, where, intensity, rotate, rotateSpeed;
        ({
            hexColorArray,
            where,
            intensity,
            rotate,
            rotateSpeed
        } = options);

        var numberOfLights = hexColorArray.length;
        var spacing = gameUtils.getCanvasWidth() / (numberOfLights * 2);
        var lights = [];
        $.each(hexColorArray, function(i, color) {
            var l = graphicsUtils.createDisplayObject("AmbientLight" + (i % 3 + 1), {
                position: this.addRandomVariationToGivenPosition({
                    x: ((i + 1) * 2 - 1) * spacing,
                    y: gameUtils.getCanvasHeight() / 2
                }, 300 / numberOfLights, 300),
                tint: color,
                where: where || 'backgroundOne',
                alpha: intensity || 0.25
            });
            // Object.assign(l, doOptions);

            //rotate the lights if specified
            if (options.rotate) {
                graphicsUtils.rotateSprite(l, {
                    speed: options.rotateSpeed || 6
                });
            }
            lights.push(l);
        }.bind(this));
        return lights;
    },

    createAmbientLightBorder: function(tint, where, intensity) {
        var l = graphicsUtils.createDisplayObject("AmbientBorder1", {
            position: this.getPlayableCenter(),
            tint: tint,
            where: where || 'backgroundOne',
            alpha: intensity || 0.25
        });

        graphicsUtils.makeSpriteSize(l, this.getPlayableWH());
        if (mathArrayUtils.flipCoin()) {
            l.scale.x *= -1;
        }
        if (mathArrayUtils.flipCoin()) {
            l.scale.y *= -1;
        }
        return l;
    },

    moveSpriteOffScreen: function(something) {
        something.position = {
            x: 8000,
            y: 8000
        };
    },

    calculateRandomPlacementForBodyWithinCanvasBounds: function(body, neatly) {
        var placement = {};
        var bodyWidth = (body.bounds.max.x - body.bounds.min.x);
        var XRange = Math.floor(this.getPlayableWidth() / bodyWidth);
        var bodyHeight = (body.bounds.max.y - body.bounds.min.y);
        var YRange = Math.floor(this.getPlayableHeight() / bodyHeight);
        var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        if (neatly) {
            var Xtile = mathArrayUtils.getIntBetween(0, XRange - 1);
            var Ytile = mathArrayUtils.getIntBetween(0, YRange - 1);
            placement.x = Xtile * bodyWidth + bodyHalfWidth;
            placement.y = Ytile * bodyHeight + bodyHalfHeight;
        } else {
            placement.x = Math.random() * (this.getPlayableWidth() - bodyHalfWidth * 2) + bodyHalfWidth;
            placement.y = Math.random() * (this.getPlayableHeight() - bodyHalfHeight * 2) + bodyHalfHeight;
        }

        return placement;
    },

    placeBodyWithinCanvasBounds: function(body) {
        //if we've added a unit, call down to its body
        if (body.isUnit) {
            body = body.body;
        }
        var placement = {};
        var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        placement.x = Math.random() * (this.getCanvasWidth() - bodyHalfWidth * 2) + bodyHalfWidth;
        placement.y = Math.random() * (this.getCanvasHeight() - bodyHalfHeight * 2) + bodyHTalfHeight;
        Matter.Body.setPosition(body, placement);
        return placement;
    },

    placeBodyWithinRadiusAroundCanvasCenter: function(body, radius, minRadius) {
        //if we've added a unit, call down to its body
        if (body.isUnit) {
            body = body.body;
        }
        var placement = {};
        var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        do {
            let canvasCenter = this.getCanvasCenter();
            placement.x = canvasCenter.x - radius + (Math.random() * (radius * 2 - bodyHalfWidth * 2) + bodyHalfWidth);
            placement.y = canvasCenter.y - radius + (Math.random() * (radius * 2 - bodyHalfHeight * 2) + bodyHalfHeight);

        } while (placement.y > this.getPlayableHeight() || placement.y < 0 || placement.x > this.getPlayableWidth() || placement.x < 0 ||
            Matter.Vector.magnitude(Matter.Vector.sub(this.getPlayableCenter(), placement)) < (minRadius || 0));
        Matter.Body.setPosition(body, placement);
        return placement;
    },

    getJustOffscreenPosition: function(direction, variation) {
        var placement = {};
        var randomPlacement = this.getRandomPlacementWithinCanvasBounds();
        var offscreenAmount = 50;
        variation = Math.random() * (variation || offscreenAmount);
        offscreenAmount += variation;
        if (direction == 'random' || !direction) {
            direction = mathArrayUtils.getRandomIntInclusive(1, 4);
        }
        if (direction == 'top' || direction == 1) {
            placement.y = 0 - (offscreenAmount);
            placement.x = randomPlacement.x;
        } else if (direction == 'left' || direction == 2) {
            placement.y = randomPlacement.y;
            placement.x = 0 - offscreenAmount;
        } else if (direction == 'right' || direction == 3) {
            placement.y = randomPlacement.y;
            placement.x = this.getCanvasWidth() + offscreenAmount;
        } else if (direction == 'bottom' || direction == 4) {
            placement.y = this.getPlayableHeight() + offscreenAmount;
            placement.x = randomPlacement.x;
        }

        return placement;
    },

    placeBodyJustOffscreen: function(body, direction, variation) {
        //if we've added a unit, call down to its body
        if (body.isUnit) {
            body = body.body;
        }
        var placement = this.getJustOffscreenPosition(direction, variation);
        Matter.Body.setPosition(body, placement);

        return placement;
    },

    offScreenPosition: function() {
        return {
            x: -9999,
            y: -9999
        };
    },

    isoDirectionBetweenPositions: function(v1, v2) {
        var angle = Matter.Vector.angle({
            x: 0,
            y: 0
        }, Matter.Vector.sub(v2, v1));
        var dir = null;
        if (angle >= 0) {
            if (angle < Math.PI / 8) {
                dir = 'right';
            } else if (angle < Math.PI * 3 / 8) {
                dir = 'downRight';
            } else if (angle < Math.PI * 5 / 8) {
                dir = 'down';
            } else if (angle < Math.PI * 7 / 8) {
                dir = 'downLeft';
            } else {
                dir = 'left';
            }
        } else {
            if (angle > -Math.PI / 8) {
                dir = 'right';
            } else if (angle > -Math.PI * 3 / 8) {
                dir = 'upRight';
            } else if (angle > -Math.PI * 5 / 8) {
                dir = 'up';
            } else if (angle > -Math.PI * 7 / 8) {
                dir = 'upLeft';
            } else {
                dir = 'left';
            }
        }
        return dir;
    },

    getCanvasCenter: function() {
        return {
            x: this.getCanvasWidth() / 2,
            y: this.getCanvasHeight() / 2
        };
    },

    getCanvasHeight: function() {
        return globals.currentGame.worldOptions.height + (globals.currentGame.worldOptions.unitPanelHeight || 0);
    },

    getCanvasWidth: function() {
        return globals.currentGame.worldOptions.width;
    },

    getCanvasWH: function() {
        return {
            x: this.getCanvasWidth(),
            y: this.getCanvasHeight(),
            w: this.getCanvasWidth(),
            h: this.getCanvasHeight()
        };
    },

    getPlayableCenter: function() {
        return {
            x: this.getPlayableWidth() / 2,
            y: this.getPlayableHeight() / 2
        };
    },

    getPlayableCenterPlus: function(offset) {
        return mathArrayUtils.clonePosition(this.getPlayableCenter(), offset);
    },

    getPlayableWH: function() {
        return {
            x: this.getPlayableWidth(),
            y: this.getPlayableHeight(),
            w: this.getPlayableWidth(),
            h: this.getPlayableHeight()
        };
    },

    getRealPlayableWidth: function() {
        return globals.currentGame.renderer.canvasEl.width;
    },

    getRealPlayableHeight: function() {
        return this.getPlayableHeight() * globals.currentGame.renderer.screenScaleFactor;
    },

    getRealPlayableCenter: function() {
        return {
            x: this.getRealPlayableWidth() / 2,
            y: this.getRealPlayableHeight() / 2
        };
    },

    getRealPlayableWH: function() {
        return {
            x: this.getRealPlayableWidth(),
            y: this.getRealPlayableHeight(),
            w: this.getRealPlayableWidth(),
            h: this.getRealPlayableHeight()
        };
    },

    getRealCanvasWidth: function() {
        return globals.currentGame.renderer.canvasEl.width;
    },

    getRealCanvasHeight: function() {
        return globals.currentGame.renderer.canvasEl.height;
    },

    getRealCanvasCenter: function() {
        return {
            x: this.getRealCanvasWidth() / 2.0,
            y: this.getRealCanvasHeight() / 2.0
        };
    },

    getRealCanvasWH: function() {
        return {
            x: globals.currentGame.renderer.canvasEl.width,
            y: globals.currentGame.renderer.canvasEl.height,
            w: globals.currentGame.renderer.canvasEl.width,
            h: globals.currentGame.renderer.canvasEl.height,
        };
    },

    getPlayableWidth: function() {
        return globals.currentGame.worldOptions.width;
    },

    getPlayableHeight: function() {
        return globals.currentGame.worldOptions.height;
    },

    getUnitPanelCenter: function() {
        return {
            x: this.getCanvasCenter().x,
            y: this.getPlayableHeight() + globals.currentGame.unitPanelHeight / 2
        };
    },

    getUnitPanelHeight: function() {
        return globals.currentGame.unitPanelHeight;
    },

    getSound: function(name, options) {
        options = options || {};
        options.src = 'Sounds/' + name;
        // options.src = name;
        return new h.Howl(options);
    },

    playAsMusic: function(newSong, options) {
        options = Object.assign({
            fadeDuration: 750,
            newSongDelay: 0,
            repeat: false
        }, options);

        //capture current song
        var currentSong = globals.currentGame.currentSong.h;
        var currentSongId = globals.currentGame.currentSong.id;

        //play new song
        globals.currentGame.currentSong.h = newSong;
        globals.currentGame.currentSong.id = newSong.play();

        if(options.repeat) {
            newSong.loop(true, globals.currentGame.currentSong.id);
        }

        //fade out last song
        if (currentSong && currentSong.playing(currentSongId)) {
            currentSong.once('fade', () => {
                currentSong.stop(currentSongId);
            }, currentSongId);
            currentSong.fade(currentSong.volume(currentSongId), 0, options.fadeDuration, currentSongId);
        }
    },

    praise: function(options) {
        if (!options) {
            options = {
                style: styles.praiseStyle
            };
        } else if (!options.style) {
            options.style = styles.praiseStyle;
        }
        var praiseWord = praiseWords[mathArrayUtils.getIntBetween(0, praiseWords.length - 1)] + "!";
        this.floatText(praiseWord, options.position || this.getCanvasCenter(), options);
    },

    setCursorStyle: function(style) {
        let currentCursor = globals.currentGame.currentCursor;
        let cursorChanged = false;

        if (style == 'Main' && currentCursor != 'Main') {
            $('*').css('cursor', cursors.main);
            cursorChanged = true;
        } else if (style == 'Over' && currentCursor != 'Over') {
            $('*').css('cursor', cursors.over);
            cursorChanged = true;
        } else if (style == 'OverAttack' && currentCursor != 'OverAttack') {
            $('*').css('cursor', cursors.overAttack);
            cursorChanged = true;
        } else if (style == 'None' && currentCursor != 'None') {
            cursorChanged = true;
        } else if (style == 'Info' && currentCursor != 'Info') {
            $('*').css('cursor', 'help');
            cursorChanged = true;
        } else if(style == 'Attack' && currentCursor != 'Attack') {
            $('*').css('cursor', cursors.attack);
            cursorChanged = true;
        } else if(style == 'Target' && currentCursor != 'Target') {
            $('*').css('cursor', cursors.target);
            cursorChanged = true;
        }

        if(cursorChanged) {
            // console.info(globals.currentGame.currentCursor);
            globals.currentGame.currentCursor = style;
            this.forceWebkitRepaint(3);
        }
    },

    forceWebkitRepaint: function(numberOfTimes) {
        // console.info('redraw-' + numberOfTimes);
        var el = document.getElementById('body');
        el.style.display="none";
        el.offsetHeight;
        el.style.display="block";

        if(numberOfTimes) {
            gameUtils.executeSomethingNextFrame(() => {
                this.forceWebkitRepaint(numberOfTimes-1);
            });
        }
    },

    pixiPositionToPoint: function(pointObj, event) {
        globals.currentGame.renderer.interaction.mapPositionToPoint(pointObj, event.clientX, event.clientY);
    },

    /*
     * options {
     *   where: stage
     *   texture: particle texture
     *   config: particle configuration (see https://pixijs.io/pixi-particles-editor/#)
     * }
     */
    createParticleEmitter: function(options) {
        // Create a new emitter
        var emitter = new PIXI.particles.Emitter(

            // The PIXI.Container to put the emitter in
            // if using blend modes, it's important to put this
            // on top of a bitmap, and not use the root stage Container
            options.where,

            // The collection of particle images to use
            [options.texture || PIXI.Texture.from('Textures/particle.png')],

            // Emitter configuration, edit this to change the look
            // of the emitter
            options.config
        );

        emitter.spawnPos = {
            x: 0,
            y: 0
        };

        // Calculate the current time
        var elapsed = Date.now();

        // Update function every frame - though it seems we don't need this when doing playOnceAndDestroy()
        emitter.startUpdate = function() {

            // Update the next frame
            requestAnimationFrame(emitter.startUpdate);

            var now = Date.now();

            // The emitter requires the elapsed
            // number of seconds since the last update
            emitter.update((now - elapsed) * 0.001);
            elapsed = now;
        };

        // Start emitting
        emitter.emit = false;

        return emitter;
    },

    /*
     * Keep in mind where this is being called from. Calling this after the tick
     * event will prevent the current frame from decrementing frameCount.
     */
    executeSomethingNextFrame: function(callback, frameCount) {
        var limit = frameCount == null ? 1 : frameCount;
        globals.currentGame.addTimer({
            name: mathArrayUtils.uuidv4(),
            killsSelf: true,
            timeLimit: 200,
            gogogo: true,
            tickCallback: function() {
                if (limit > 0) {
                    limit--;
                } else {
                    callback();
                    globals.currentGame.invalidateTimer(this);
                }
            },
        });
    },

    oneTimeCallbackAtEvent: function(callback, event) {
        var fun = function() {
            callback();
            globals.currentGame.removeTickCallback(fun);
        };
        return globals.currentGame.addTickCallback(fun, false, event);
    },

    doSomethingAfterDuration: function(callback, duration, options) {
        options = options || {};
        if (!duration) {
            callback();
            return;
        }

        var timer =  globals.currentGame.addTimer({
            name: options.timerName || ('afterDurationTask:' + mathArrayUtils.getId()),
            timeLimit: duration,
            killsSelf: true,
            trueTimer: options.trueTimer,
            executeOnNuke: options.executeOnNuke,
            totallyDoneCallback: function() {
                callback();
                gameUtils.fullUndeathPact(timer);
            }
        });

        return timer;
    },

    signalNewWave: function(wave, deferred) {
        this.floatText("Wave: " + wave, this.getCanvasCenter(), {
            runs: 50,
            stationary: true,
            style: styles.newWaveStyle,
            deferred: deferred
        });
    },

    //Death pact currently supports other units, bodies, tick callbacks, timers, and finally functions-to-execute
    //It will also search for an existing slave with the given id and replace it with the incoming slave
    deathPact: function(master, slave, slaveId) {
        if (!master.slaves) {
            master.slaves = [];
        }

        if (!slave.masters) {
            slave.masters = [];
        }

        var added = false;
        if (slaveId) {
            slave.slaveId = slaveId;
            $.each(master.slaves, function(i, existingSlave) {
                if (existingSlave.slaveId == slaveId) {
                    master.slaves[i] = slave;
                    added = true;
                }
            });
        }
        if (!added) {
            master.slaves.push(slave);

            if (!slave.noMasterRegistration) {
                slave.masters.push(master);
            }
        }
    },

    undeathPact: function(master, slave) {
        mathArrayUtils.removeObjectFromArray(slave, master.slaves);

        if (slave.masters) {
            mathArrayUtils.removeObjectFromArray(master, slave.masters);
        }
    },

    fullUndeathPact: function(slave) {
        if (slave.masters) {
            slave.masters.forEach((master) => {
                mathArrayUtils.removeObjectFromArray(slave, master.slaves);
            });
            slave.masters = [];
        }
    },

    mixinDefaults: function(options) {
        var params = options.params;
        var defaults = options.defaults;
        return Object.assign({}, defaults, params);
    }
};

export {
    gameUtils
};
