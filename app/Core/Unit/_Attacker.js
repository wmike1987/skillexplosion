import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';
import {globals} from '@core/Fundamental/GlobalState.js';

export default {
    //private
    isAttacker: true,
    isAttacking: false,
    isHoning: false,
    currentTarget: null,
    currentHone: null,
    attackReady: true,
    randomizeHone: true,
    honableTargets: null, //this prevents the need for honing sensor (which can have a negative performance impact). This may not be relevant anymore
    specifiedAttackTarget: null,
    attackAutocast: true,

    //default
    attack: function(target) {
        var attackManipulations = {delay: 0};
        if(this.attackExtension) {
            var ret = this.attackExtension(target);
            if(ret) {
                attackManipulations = ret;
            }
        }
        gameUtils.doSomethingAfterDuration(function() {
            if(this.isAttacking) {
                var damageAmount = this.damage + this.getDamageAdditionSum();
                target.sufferAttack(damageAmount, this);
            }
        }.bind(this), attackManipulations.delay);
    },

    //user defined
    honeRange: 250,
    range: 100,
    cooldown: 3000,
    damage: 6,

    initAttacker: function() {
        this.cooldownTimer = globals.currentGame.addTimer({
            name: 'cooldown' + this.body.id,
            runs: 0,
            timeLimit: this.cooldown,
            callback: function() {
                this.attackReady = true;
            }.bind(this)
        });
        gameUtils.deathPact(this, this.cooldownTimer);

        //extend move to cease attacking
        this.rawMove = this.move;
        var originalMove = this.move;
        this.move = function move(destination, commandObj) {
            this.isAttacking = false;
            this.isHoning = false;
            this.attackMoveDestination = null;
            this.attackMoving = false;
            this.isHoldingPosition = false;
            var moveInfo = originalMove.call(this, destination, commandObj);
            if(!moveInfo.moveCancelled) {
                this._becomePeaceful();
            }
        };

        //extend stop
        this.rawStop = this.stop;
        var originalStop = this.stop;
        this.stop = function(commandObj, options) {
            options = options || {};
            if (this.specifiedAttackTarget) {
                Matter.Events.off(this.specifiedAttackTarget, 'death', this.specifiedCallback);
                this.specifiedAttackTarget = null;
            }
            originalStop.call(this);
            Matter.Sleeping.set(this.body, false);
            this.isAttacking = false;
            this.isHoning = false;
            this.attackMoveDestination = null;
            this.attackMoving = false;
            if(options.isHoldingPosition) {
                this.isHoldingPosition = true;
            } else {
                this.isHoldingPosition = false;
            }
            if(options.peaceful) {
                //nothing
                this._becomePeaceful();
            } else {
                this._becomeOnAlert();
            }
            if(commandObj) {
                commandObj.command.done();
            }
        };

        Matter.Events.on(this, 'death', function() {
            if(this.specifiedAttackTarget) {
                Matter.Events.off(this.specifiedAttackTarget, 'death', this.specifiedCallback);
            }
            this.specifiedAttackTarget = null;
        }.bind(this));

        this.eventKeyMappings[this.commands.stop.key] = this.stop;
        this.eventKeyMappings[this.commands.holdPosition.key] = this.holdPosition;

        this.eventClickMappings[this.commands.attack.key] = function(target, commandObj) {
            if(commandObj.command.targetType == 'unit') {
                if(target.isDead) {
                    commandObj.command.done();
                }
                this.attackSpecificTarget(target.position, target, commandObj);
            } else {
                this.attackMove(target, commandObj);
            }
        };
        this.eventClickMappings[this.commands.move.key] = this.move;

        this.canAttack = true;
    },

    canAttackPredicate: function(target) {
        return this.canAttack && (gameUtils.isPositionWithinPlayableBounds(this.position, 40) || this.team == globals.currentGame.playerTeam);
    },

    _attack: function(target) {
        if(!this.canAttackPredicate(target)) {
            return;
        }

        if(this.canAttackExtension && !this.canAttackExtension(target)) {
            return;
        }

        if (this.attackReady && this.attack) {
            if(!this.canAttackAndMove) {
                this.rawStop();
                //set state
                Matter.Sleeping.set(this.body, true);
            }

            this.isAttacking = true;
            this.attackMoving = false;
            this.attackReady = false;
            this.cooldownTimer.reset();
            this.cooldownTimer.runs = 1;
            this.cooldownTimer.timeLimit = this.cooldown;
            this.isHoning = false;

            //trigger the attack event
            Matter.Events.trigger(this, 'attack', {
                direction: gameUtils.isoDirectionBetweenPositions(this.position, target.position),
                targetUnit: target
            });

            //call attack
            this.attack(target);
        } else if(!this.attackReady && !this.isAttacking) {
            //if we're on cooldown and not already attacking
            this.rawStop();
            //trigger the attack event
            Matter.Events.trigger(this, 'attackStance', {
                direction: gameUtils.isoDirectionBetweenPositions(this.position, target.position),
                targetUnit: target,
                stop: true
            });
            Matter.Sleeping.set(this.body, true);
        }
    },

    //this assumes _moveable is mixed in
    attackMove: function(destination, commandObj, options) {
        options = options || {};

        //nullify specified attack target
        if (this.specifiedAttackTarget) {
            Matter.Events.off(this.specifiedAttackTarget, 'death', this.specifiedCallback);
            this.specifiedAttackTarget = null;
        }

        //set state
        this.attackMoveDestination = destination;
        this.attackMoving = true;
        this.isHoldingPosition = false;
        this.isHoning = false;

        //move unit, rawly
        this.rawMove(this.attackMoveDestination, commandObj, options);
        Matter.Events.trigger(this, 'attackMove', {destination: destination});

        //become alert to nearby enemies
        this._becomeOnAlert(commandObj);
    },

    //this assumes _moveable is mixed in
    attackSpecificTarget: function(destination, target, commandObj) {

        if(!this.canTargetUnit(target)) {
            this.attackMove({x: target.position.x, y: target.position.y}); //I think we need to pass the unit's position object
            return;
        }

        //set the specified target
        this.specifiedAttackTarget = target;

        //If the specified unit dies (is removed), stop and reset state.
        this.specifiedCallback = function() {
            //always do this
            this.specifiedAttackTarget = null;

            if(!this.isAttacking) {
                if(!commandObj.command.queue.hasNext()) {
                    this.stop();
                }
                commandObj.command.done();
            } else {
                gameUtils.doSomethingAfterDuration(() => {
                    //if we're still "attacking" but don't have a current target nor current hone, aka we're begging to stop
                    if(this.isAttacking && !this.currentTarget && !this.currentHone) {
                        if(!commandObj.command.queue.hasNext()) {
                            this.stop();
                        }
                        commandObj.command.done();
                    }
                }, this.cooldown);
            }
        }.bind(this);
        var callback = Matter.Events.on(this.specifiedAttackTarget, 'death', this.specifiedCallback);

        //But if we are removed (from the game) first, remove the onremove listener
        gameUtils.deathPact(this, function() {
            if(this.specifiedAttackTarget)
                Matter.Events.off(this.specifiedAttackTarget, 'death', this.specifiedCallback);
        }.bind(this), 'removeSpecifiedAttackTarget');

        //move unit
        this.rawMove(destination);

        //become alert to nearby enemies, but since we have a specific target, other targets won't be considered
        this._becomeOnAlert();
    },

    holdPosition: function() {
        if(this.isMoving) {
            this.stop(null, {isHoldingPosition: true});
        }

        this.isHoldingPosition = true;

        Matter.Events.trigger(this, 'holdPosition');

        Matter.Sleeping.set(this.body, true);
    },

    _becomeOnAlert: function(commandObj) {

        //setup target sensing
        this.setupHoneAndTargetSensing(commandObj);

        //reset last hone since this is a new alert
        this.lastHone = null;

        /*
         * Move/Honing callback
         */
        if (this.attackHoneTick) {
            globals.currentGame.removeTickCallback(this.attackHoneTick);
        }
        //unless we have a target, move towards currentHone
        this.attackHoneTick = globals.currentGame.addTickCallback(function() {
            if(this.attackerDisabled || this.isHoldingPosition) return;

            //initiate a raw move towards the honed object. If we switch hones, we will initiate a new raw move (note the commented out part, not sure why i had that here, but we should want to hone a specified target)
            if (this.currentHone && (this.lastHone != this.currentHone || !this.isMoving) && !this.currentTarget && this.attackReady) {// && !this.specifiedAttackTarget) {

                //if we have an additional attack predicate, make sure this passes before we hone on our target
                if(this.canAttackExtension && !this.canAttackExtension(this.currentHone)) {
                    return;
                }

                this.lastHone = this.currentHone;
                this.isHoning = true;
                this.rawMove(this.currentHone.position);
            }
        }.bind(this), {runImmediately: true});
        gameUtils.deathPact(this, this.attackHoneTick, 'attackHoneTick');

        /*
         * Attacking callbacks
         */
        if (this.attackTick) {
            globals.currentGame.removeTickCallback(this.attackTick);
        }
        //if we have a target, attack it
        this.attackTick = globals.currentGame.addTickCallback(function() {
            if(this.attackerDisabled) return;

            if (this.currentTarget) {
                this.lastHone = null; //if we're attacking something, reset the lastHoned unit
                this._attack(this.currentTarget);
            }
        }.bind(this), {runImmediately: true});
        gameUtils.deathPact(this, this.attackTick, 'attackTick');
    },

    setupHoneAndTargetSensing: function(commandObj) {
        if(this.honeAndTargetSensorCallback)
            globals.currentGame.removeTickCallback(this.honeAndTargetSensorCallback);

        var sensingFunction = function(options) {
            this.currentHone = null; //blitz current hone?
            this.currentTarget = null;
            var currentHoneDistance = null;
            var currentAttackDistance = null;

            gameUtils.applyToUnitsByTeam(function(team) {
                if(this.attackHoneTeamPredicate)
                    return this.attackHoneTeamPredicate(team);
                else if(!this.specifiedAttackTarget){
                    return this.team != team && globals.currentGame.neutralTeam != team;
                } else {
                    return team == this.specifiedAttackTarget.team;
                }
            }.bind(this), function(unit) {
                if(unit) {
                    return this.canTargetUnit(unit);
                } else {
                    return false;
                }
            }.bind(this), function(unit) {
                //if autocast is off and we don't have a specified target, don't continue
                if (this.attackAutocast === false && !this.specifiedAttackTarget) {
                    return;
                }

                //if we have a target specific, ignore other units, forcing currentTarget to be the specified unit
                if (this.specifiedAttackTarget && unit != this.specifiedAttackTarget) {
                    return;
                }

                var dist = mathArrayUtils.distanceBetweenBodies(this.body, unit.body);
                //we're outside the larger distance, don't go further...
                if (dist > this.honeRange) {
                    //unless we have a specific target
                    if (this.specifiedAttackTarget) {
                        this.currentHone = unit;
                    }
                    return;
                }

                //determine the closest honable target
                if (!currentHoneDistance) {
                    currentHoneDistance = dist;
                    this.currentHone = unit;
                } else {
                    if (dist < currentHoneDistance) {
                        currentHoneDistance = dist;
                        this.currentHone = unit;
                    }
                }

                //We've set our hone... now see if we can attack
                //figure out who (if anyone) is within range to attack and set current target to be the closest one
                if (this.canAttackPredicate() && dist <= this.range) {
                    if (!currentAttackDistance) {
                        currentAttackDistance = dist;
                        this.currentTarget = unit;
                    } else {
                        if (dist < currentAttackDistance) {
                            currentAttackDistance = dist;
                            this.currentTarget = unit;
                        }
                    }
                }
            }.bind(this));

            //If we're from the immediate call, stop here
            if(options.onlySense) {
                return;
            }

            //If we were attacking but no longer have a target
            if(!this.currentTarget && this.attackReady && this.isAttacking) {
                Matter.Sleeping.set(this.body, false);
                this.isAttacking = false;
            }

            //If we're here, we're on alert...
            //Either we were given an attack move command, "still" and on-alert, or were given a specific target
            //If we were given an "attack move" command and no longer have a target or a hone, let's issue an identical attackMove command
            //If we are "still" and no longer have a target or a hone, let's stop.
            //If we were given a "specific target" to attack, we only want to naturally stop if we can no longer attack it
            if (!this.currentHone && !this.currentTarget) {
                //given attack move, reissue the attack move
                if(this.attackMoveDestination && (!this.attackMoving || this.isHoning) && this.attackReady) {
                    this.attackMove(this.attackMoveDestination, commandObj);
                //we were still, let's stop
                } else if(!this.attackMoveDestination && !this.attackMoving && !this.specifiedAttackTarget && this.isMoving) {
                        this.stop();
                //else let's check to see if our specified attack target can still be targeted
                } else if(this.specifiedAttackTarget) {
                    if(!this.canTargetUnit(this.specifiedAttackTarget)) {
                        this.stop();
                    } else {
                        //else this specifiedAttackTarget is no longer with us, let's attack move to it
                        this.attackSpecificTarget(this.specifiedAttackTarget.position, this.specifiedAttackTarget);
                    }
                }
            }
        }.bind(this);

        this.honeAndTargetSensorCallback = globals.currentGame.addTickCallback(sensingFunction, {runImmediately: true, immediateOptions: {onlySense: true}});
        gameUtils.deathPact(this, this.honeAndTargetSensorCallback, 'honeAndTargetSensorCallback');
    },

    _becomePeaceful: function() {
        this.currentTarget = null;
        this.currentHone = null;

        //nullify specified attack target
        if (this.specifiedAttackTarget) {
            Matter.Events.off(this.specifiedAttackTarget, 'death', this.specifiedCallback);
            this.specifiedAttackTarget = null;
        }

        this.attackMoving = false;

        if(this.honeAndTargetSensorCallback)
            globals.currentGame.removeTickCallback(this.honeAndTargetSensorCallback);

        if (this.attackTick) {
            globals.currentGame.removeTickCallback(this.attackTick);
        }
        if (this.attackHoneTick) {
            globals.currentGame.removeTickCallback(this.attackHoneTick);
        }
    },
};
