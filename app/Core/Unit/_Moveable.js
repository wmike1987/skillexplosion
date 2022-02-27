import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import Command from '@core/Unit/Command.js';
import {globals} from '@core/Fundamental/GlobalState.js';

var moveable = {
    //private
    isMoveable: true,
    isMoving: false,
    destination: null,
    moveTick: null,
    hasMoved: false,
    isSoloMover: false,
    stopOnCollisionBuffer: 5, //pixels
    overshootBuffer: 5, //pixels
    groupOvershootBuffer: 5, //pixels
    smallerBodyCollisionCategory: 0x4000,
    noProgressBuffer: 15, //pixels
    canMove: true,
    canStop: true,

    //user defined
    moveSpeed: null,

    //directional data
    facing: null,
    visibleSprite: null,

    moveableInit: function() {

        //create setter for moveSpeed
        var baseMoveSpeed = 0.1;
        this._moveSpeed = this.moveSpeed;
        Object.defineProperty(this, 'moveSpeed', {
            get: function() {
                return this._moveSpeed;
            },
            set: function(value) {
                this._moveSpeed = Math.max(value, baseMoveSpeed);
            }
        });

        this.canMovePreventer = 0;
        Object.defineProperty(this, 'canMove', {
            get: function() {
                return !this.canMovePreventer;
            },
            set: function(value) {
                if(!value) {
                    this.canMovePreventer++;
                } else {
                    this.canMovePreventer--;
                    if(this.canMovePreventer < 0) {
                        this.canMovePreventer = 0;
                    }
                }
            }
        });

        this.eventClickMappings[this.commands.move.key] = this.move;
        this.eventClickStateGathering[this.commands.move.key] = function() {
            return {isSoloMover: Object.keys(globals.currentGame.unitSystem.selectedUnits).length == 1};
        };

        //**********************
        //Create body sensor - the selection box collides with a slightly smaller body size
        //**********************
        this.smallerBody = null;
        if(this.useCollisionBodyAsSelectionBody) {
            var sradius = this.smallerBodyRadiusChange ? this.selectionBody.rradius/10*8 : this.selectionBody.rradius;
            this.smallerBody = Matter.Bodies.circle(0, 0, sradius, {
                isSensor: true,
                noWire: true,
            });
        } else {
            var sheight = this.smallerBodyHeightChange ? this.selectionBody.hheight/10*8 : this.selectionBody.hheight;
            var swidth = this.smallerBodyWidthChange ? this.selectionBody.wwidth/7*4 : this.selectionBody.wwidth;
            this.smallerBody = Matter.Bodies.rectangle(0, 0, swidth, sheight, {
                isSensor: true,
                noWire: true
            });
        }
        this.smallerBody.isSelectionBody = true;
        this.smallerBody.collisionFilter.category = this.smallerBodyCollisionCategory;
        this.smallerBody.collisionFilter.mask = 0x0002; //this.smallerBody.collisionFilter.mask - (this.team || 4);
        this.smallerBody.isSmallerBody = true;
        this.smallerBody.unit = this;

        gameUtils.attachSomethingToBody({something: this.smallerBody, body: this.body, offset: {x: 0, y: this.hitboxYOffset != null ? this.hitboxYOffset : -8}});
        globals.currentGame.addBody(this.smallerBody);

        Matter.Events.on(this.body, 'onCollideActive', this.avoidCallback);
        // Matter.Events.on(this.body, 'onCollide', this.avoidCallback);

        //Deathpact these entities
        gameUtils.deathPact(this, this.smallerBody);
    },

    move: function(destination, commandObj, options) {
        options = options || {};

        //trigger the move event
        Matter.Events.trigger(this, 'unitMove', {unit: this, destination: destination});

        //if command is given, we're being executed as part of a command queue, else, fake the command object
        if(!commandObj) {
            commandObj = {
                command: {
                    done: function() {
                        return;
                    },
                    queue: {
                        hasNext: function() {
                            return false;
                        }
                    }
                },
            };
        }

        if(commandObj.command.state && commandObj.command.state.isSoloMover) {
            this.isSoloMover = true;
        }

        //set state
        this.destination = destination;
        var calculatedFootDestination = mathArrayUtils.clonePosition(this.destination, {y: -this.footOffset || -20});

        //don't do anything if they're already at their destination
        if (this.body.position.x == calculatedFootDestination.x && this.body.position.y == calculatedFootDestination.y)
            return {moveCancelled: true};

        if(!this.canMove)
            return {moveCancelled: true};

        if(this.isHoning || options.centerMove) {
            this.footDestination = this.destination; //so foot destination becomes the de-facto "destination." Poor use of foot-destination imo
        } else {
            this.footDestination = calculatedFootDestination; //offset for moving to the "foot location"
        }

        this.isMoving = true;
        this.body.frictionAir = 0;
        this.lastPosition = { //nullify "lastPosition"
            x: -50,
            y: -50
        };

        //if we're changing directions, override interpolation for a frame
        let newDirection = gameUtils.isoDirectionBetweenPositions(this.position, this.footDestination);
        if(this.currentDirection != newDirection) {
            this.body.oneFrameOverrideInterpolation = true;
        }

        //setup the constant move tick
        if(this.moveTick) {
            globals.currentGame.removeTickCallback(this.moveTick);
        }

        this.moveTick = globals.currentGame.addTickCallback(this.constantlySetVelocityTowardsDestination.bind(this), {runImmediately: true});
        gameUtils.deathPact(this, this.moveTick, 'moveTick');

        //Setup stop conditions
        //general condition
        if(this.stopConditionCheck) {
            globals.currentGame.removeTickCallback(this.stopConditionCheck);
        }
        this.stopConditionCheck = globals.currentGame.addTickCallback(this.generalStopCondition.bind(this, commandObj), false, 'afterStep');
        gameUtils.deathPact(this, this.stopConditionCheck, 'generalStopCondition');

        //"no progress" stop condition
        this.tryForDestinationTimer = {
            name: 'tryForDestination' + this.body.id,
            gogogo: true,
            timeLimit: 550,
            callback: function() {
                if(this.alwaysTry) {
                    return;
                }
                if (this.lastPosition && this.isMoving && !this.isHoning && !this.isAttacking) {
                    if (this.lastPosition.x + this.noProgressBuffer > this.body.position.x && this.lastPosition.x - this.noProgressBuffer < this.body.position.x) {
                        if (this.lastPosition.y + this.noProgressBuffer > this.body.position.y && this.lastPosition.y - this.noProgressBuffer < this.body.position.y) {
                            if(!commandObj.command.queue.hasNext()) {
                                this.stop();
                            }
                            commandObj.command.done();
                        }
                    }
                }
                this.lastPosition = Matter.Vector.clone(this.body.position);
            }.bind(this)
        };
        globals.currentGame.addTimer(this.tryForDestinationTimer);
        gameUtils.deathPact(this, this.tryForDestinationTimer, 'tryForDestination');

        //group movement stop condition
        if(this.collideCallback) {
            Matter.Events.off(this.body, 'onCollideActive', this.collideCallback);
        }
        this.collideCallback = function(pair) {
            if (!this.isMoving) return;
            var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
            if (this.destination.x + this.stopOnCollisionBuffer > this.position.x && this.destination.x - this.stopOnCollisionBuffer < this.position.x) {
                if (this.destination.y + this.stopOnCollisionBuffer > this.position.y && this.destination.y - this.stopOnCollisionBuffer < this.position.y) {
                    if (otherBody.isMoveable && !otherBody.isMoving && otherBody.destination && otherBody.destination.x == this.destination.x && otherBody.destination.y == this.destination.y) {
                        if(!commandObj.command.queue.hasNext()) {
                            this.stop();
                        }
                        commandObj.command.done();
                    }
                }
            }
        }.bind(this);
        Matter.Events.on(this.body, 'onCollideActive', this.collideCallback);

        if(this.moveExtension)
            this.moveExtension();

        return {moveCancelled: false};
    },
    stop: function() {
        //stop the unit
        Matter.Body.setVelocity(this.body, {
            x: 0.0,
            y: 0.0
        });

        //body has stopped, therefore... (do i need this? this causes an abrubt looking change in position upon stopping)
        // this.body.oneFrameOverrideInterpolation = true;

        //return body to non Sleeping
        this.setSleep(false);

        //remove movement callback
        if(this.moveTick)
            globals.currentGame.removeTickCallback(this.moveTick);

        //remove stop conditions
        if(this.stopConditionCheck)
            globals.currentGame.removeTickCallback(this.stopConditionCheck);

        if(this.tryForDestinationTimer)
            globals.currentGame.invalidateTimer(this.tryForDestinationTimer);

        if(this.collideCallback) {
            Matter.Events.off(this.body, 'onCollideActive', this.collideCallback);
        }

        //trigger the stop event
        Matter.Events.trigger(this, 'stop', {});

        //set state
        this.body.frictionAir = 0.9;
        this.isMoving = false;
        this.isSoloMover = false;
        this.currentDirection = null;
    },

    generalStopCondition: function(commandObj) {
        var alteredOvershootBuffer = this.isSoloMover ? this.overshootBuffer : this.groupOvershootBuffer;

        //stop condition: This executes after an engine update, but before a render. It detects when a body has overshot its destination
        //and will stop the body. Group movements are more forgiving in terms of reaching one's destination; this is reflected in a larger
        //overshoot buffer
        var stopDestination = this.footDestination;
        if (stopDestination.x + alteredOvershootBuffer > this.body.position.x && stopDestination.x - alteredOvershootBuffer < this.body.position.x) {
            if (stopDestination.y + alteredOvershootBuffer > this.body.position.y && stopDestination.y - alteredOvershootBuffer < this.body.position.y) {
                Matter.Events.trigger(this, 'destinationReached', {destination: stopDestination});
                if(!commandObj.command.queue.hasNext()) {
                    this.stop();
                }
                commandObj.command.done();
            }
        }
    },

    constantlySetVelocityTowardsDestination: function(event, options) {
        options = options || {};

        //if we can stop, and we aren't moving nor attacking, cease this callback
        if (!this.isMoving || this.isAttacking) {
            return;
        }

        //return body to non Sleeping
        this.setSleep(false);

        //send body
        gameUtils.sendBodyToDestinationAtSpeed(this.body, this.footDestination, this.moveSpeed, false);

        //set direction
        this.currentDirection = gameUtils.isoDirectionBetweenPositions(this.position, this.footDestination);

        //trigger movement event (for direction)
        Matter.Events.trigger(this, 'move', {
            direction: this.currentDirection
        });
    },

    //This will move me out of the way if I'm not moving and a moving object is colliding with me.
    avoidCallback: function(pair) {
        //if we're busy with something, don't avoid anything
        var myUnit = this.unit;
        if (myUnit.isMoving || myUnit.isAttacking || myUnit.isHoning || myUnit.isSleeping) return;

        //otherwise, let's avoid the mover
        var otherBody = pair.pair.bodyA == this ? pair.pair.bodyB : pair.pair.bodyA;
        var otherUnit = otherBody.unit;
        if (otherUnit && otherUnit.isMoveable && otherUnit.isMoving /*&& otherBody.destination != this.destination*/ && otherBody.speed > 0) {
            var m = otherBody.velocity.y / otherBody.velocity.x;
            var x = this.position.x - otherBody.position.x;
            var b = otherBody.position.y;
            var magicY = m * x + b;
            var swapX = 1;
            var swapY = 1;
            if (magicY < this.position.y) {
                if (otherBody.velocity.x <= 0)
                    swapY = -1;
                else
                    swapX = -1;
            } else {
                if (otherBody.velocity.x <= 0)
                    swapX = -1;
                else
                    swapY = -1;
            }

            var minScatterDistance = this.circleRadius * 1.2;
            var maxScatterDistance = this.circleRadius * 2.0;

            //if the moving-unit's destination doesn't go beyond the still-unit, we don't want to move the still-unit too much
            var moverToDestination = mathArrayUtils.distanceBetweenPoints(otherUnit.position, otherUnit.destination);
            var moverToMe = mathArrayUtils.distanceBetweenPoints(myUnit.position, otherUnit.position);
            if(moverToDestination < moverToMe) {
                maxScatterDistance = this.circleRadius;
            }

            var movePercentage = Math.PI/2.0 - mathArrayUtils.angleBetweenTwoVectors(otherBody.velocity, Matter.Vector.sub(this.position, otherBody.position));
            var newVelocity = Matter.Vector.normalise({x: otherBody.velocity.y * swapX, y: otherBody.velocity.x * swapY});
            newVelocity = Matter.Vector.mult(newVelocity, Math.max(minScatterDistance, movePercentage*maxScatterDistance));

            if(!myUnit.isAttacker) {
                myUnit.move(Matter.Vector.add(this.position, newVelocity), null, {centerMove: true});
                myUnit.isSoloMover = true;
            }
            else {
                myUnit.attackMove(Matter.Vector.add(this.position, newVelocity), null, {centerMove: true});
                myUnit.isSoloMover = true;
            }
        }
    },

    groupRightClick: function(destination) {
        this.move(destination);
    },
};

export default moveable;
