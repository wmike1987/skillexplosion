import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import utils from '@utils/GameUtils.js'
import Command from '@core/Unit/Command.js'
import {globals} from '@core/Fundamental/GlobalState.js'

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
    groupOvershootBuffer: 20, //pixels
    smallerBodyCollisionCategory: 0x4000,
    noProgressBuffer: 15, //pixels
    canMove: true,

    //user defined
    moveSpeed: null,

    //directional data
    facing: null,
    visibleSprite: null,

    moveableInit: function() {
        this.eventClickMappings[this.commands.move.key] = this.move;
        this.eventClickStateGathering[this.commands.move.key] = function() {
            return {isSoloMover: Object.keys(globals.currentGame.unitSystem.selectedUnits).length == 1};
        }

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

        utils.attachSomethingToBody({something: this.smallerBody, body: this.body, offset: {x: 0, y: this.hitboxYOffset != null ? this.hitboxYOffset : -8}});
        globals.currentGame.addBody(this.smallerBody);

        Matter.Events.on(this.body, 'onCollideActive', this.avoidCallback);

        //Deathpact these entities
        utils.deathPact(this, this.smallerBody);
    },

    move: function(destination, commandObj) {

        Matter.Events.trigger(this, 'unitMove', {unit: this, destination: destination});

        //if command is given, we're being executed as part of a command queue, else, fake the command object
        if(!commandObj) {
            commandObj = {
                command: {done: function() {return;}}
            };
        }

        if(commandObj.command.state && commandObj.command.state.isSoloMover) {
            this.isSoloMover = true;
        }

        //don't do anything if they're already at their destination
        if (this.body.position.x == destination.x && this.body.position.y == destination.y)
            return;

        if(!this.canMove)
            return;

        //set state
        this.destination = destination;
        this.isMoving = true;
        this.body.frictionAir = 0;
        this.lastPosition = { //nullify "lastPosition"
            x: -50,
            y: -50
        };

        //immediate set the velocity (rather than waiting for the next tick)
        this.constantlySetVelocityTowardsDestination(null);

        //setup the constant move tick
        if(this.moveTick)
            globals.currentGame.removeRunnerCallback(this.moveTick);
        this.moveTick = globals.currentGame.addRunnerCallback(this.constantlySetVelocityTowardsDestination.bind(this), false);
        utils.deathPact(this, this.moveTick, 'moveTick');

        //Setup stop conditions
        //general condition
        if(this.stopConditionCheck)
            globals.currentGame.removeRunnerCallback(this.stopConditionCheck);
        this.stopConditionCheck = globals.currentGame.addRunnerCallback(this.generalStopCondition.bind(this, commandObj), false, 'afterStep');
        utils.deathPact(this, this.stopConditionCheck, 'generalStopCondition');

        //"no progress" stop condition
        this.tryForDestinationTimer = {
            name: 'tryForDestination' + this.body.id,
            gogogo: true,
            timeLimit: 550,
            callback: function() {
                if (this.lastPosition && this.isMoving && !this.isHoning && !this.isAttacking) {
                    //clickPointSprite2.position = this.position;
                    if (this.lastPosition.x + this.noProgressBuffer > this.body.position.x && this.lastPosition.x - this.noProgressBuffer < this.body.position.x) {
                        if (this.lastPosition.y + this.noProgressBuffer > this.body.position.y && this.lastPosition.y - this.noProgressBuffer < this.body.position.y) {
                            this.stop();
                            commandObj.command.done();
                        }
                    }
                }
                //clickPointSprite.position = this.lastPosition || {x: 0, y: 0};
                this.lastPosition = Matter.Vector.clone(this.body.position);
            }.bind(this)
        };
        globals.currentGame.addTimer(this.tryForDestinationTimer);
        utils.deathPact(this, this.tryForDestinationTimer, 'tryForDestination');

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
                        this.stop();
                        commandObj.command.done();
                    }
                }
            }
        }.bind(this);
        Matter.Events.on(this.body, 'onCollideActive', this.collideCallback);

        if(this.moveExtension)
            this.moveExtension();
    },
    stop: function() {

        //stop the unit
        Matter.Body.setVelocity(this.body, {
            x: 0.0,
            y: 0.0
        });

        //body has stopped, therefore
        this.body.oneFrameOverrideInterpolation = true;

        //return body to non Sleeping
        Matter.Sleeping.set(this.body, false);

        //remove movement callback
        if(this.moveTick)
            globals.currentGame.removeRunnerCallback(this.moveTick);

        //remove stop conditions
        if(this.stopConditionCheck)
            globals.currentGame.removeRunnerCallback(this.stopConditionCheck);

        if(this.tryForDestinationTimer)
            globals.currentGame.invalidateTimer(this.tryForDestinationTimer);

        if(this.collideCallback) {
            Matter.Events.off(this.body, 'onCollideActive', this.collideCallback);
        }

        //trigger the stop event
        Matter.Events.trigger(this, 'stop', {});

        //set state
        this.body.frictionAir = .9;
        this.isMoving = false;
        this.isSoloMover = false;
    },

    generalStopCondition: function(commandObj) {
        var alteredOvershootBuffer = this.isSoloMover ? this.overshootBuffer : this.groupOvershootBuffer;

        //stop condition: This executes after an engine update, but before a render. It detects when a body has overshot its destination
        //and will stop the body. Group movements are more forgiving in terms of reaching one's destination; this is reflected in a larger
        //overshoot buffer
        if (this.destination.x + alteredOvershootBuffer > this.body.position.x && this.destination.x - alteredOvershootBuffer < this.body.position.x) {
            if (this.destination.y + alteredOvershootBuffer > this.body.position.y && this.destination.y - alteredOvershootBuffer < this.body.position.y) {
                this.stop();
                commandObj.command.done();
            }
        }
    },

    constantlySetVelocityTowardsDestination: function(event, options) {
        var options = options || {};

        if (!this.isMoving || this.isAttacking) {
            return;
        }

        //return body to non Sleeping
        Matter.Sleeping.set(this.body, false);

        //send body
        utils.sendBodyToDestinationAtSpeed(this.body, this.destination, this.moveSpeed, false);

        //trigger movement event (for direction)
        Matter.Events.trigger(this, 'move', {
            direction: utils.isoDirectionBetweenPositions(this.position, this.destination)
        });
    },

    //This will move me out of the way if I'm not moving and a moving object is colliding with me.
    avoidCallback: function(pair) {
        //if we're busy with something, don't avoid anything
        var myUnit = this.unit;
        if (myUnit.isMoving || myUnit.isAttacking || myUnit.isHoning || myUnit.isSleeping || myUnit.isOccupied) return;

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

            var maxScatterDistance = this.circleRadius * 2;

            //if the moving-unit's destination doesn't go beyond the still-unit, we don't want to move the still-unit too much
            var moverToDestination = utils.distanceBetweenPoints(otherUnit.position, otherUnit.destination);
            var moverToMe = utils.distanceBetweenPoints(myUnit.position, otherUnit.position);
            if(moverToDestination < moverToMe) {
                maxScatterDistance = this.circleRadius;
            }

            var minScatterDistance = this.circleRadius;
            var newVelocity = Matter.Vector.normalise({x: otherBody.velocity.y * swapX, y: otherBody.velocity.x * swapY});

            var movePercentage = Math.PI/2.0 - utils.angleBetweenTwoVectors(otherBody.velocity, Matter.Vector.sub(this.position, otherBody.position))
            //movePercentage = Math.max(.2, movePercentage);
            newVelocity = Matter.Vector.mult(newVelocity, Math.max(minScatterDistance, movePercentage*maxScatterDistance));

            if(!myUnit.isAttacker) {
                myUnit.move(Matter.Vector.add(this.position, newVelocity));
                myUnit.isSoloMover = true;
            }
            else {
                myUnit.attackMove(Matter.Vector.add(this.position, newVelocity));
                myUnit.isSoloMover = true;
            }
        }
    },

    groupRightClick: function(destination) {
        this.move(destination);
    },
}

export default moveable;
