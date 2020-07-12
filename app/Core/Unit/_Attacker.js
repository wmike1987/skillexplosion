define(['jquery', 'matter-js', 'pixi', 'utils/GameUtils'], function($, Matter, PIXI, utils) {

    return {
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
            if(this.attackExtension) {
                this.attackExtension(target);
            }
            target.sufferAttack(this.damage, this);
        },

        //user defined
        honeRange: 250,
        range: 100,
        cooldown: 3000,
        damage: 6,

        initAttacker: function() {
            this.availableTargets = new Set();
            this.cooldownTimer = currentGame.addTimer({
                name: 'cooldown' + this.body.id,
                runs: 0,
                timeLimit: this.cooldown,
                callback: function() {
                    this.attackReady = true;
                }.bind(this)
            });
            utils.deathPact(this, this.cooldownTimer);

            //extend move to cease attacking
            this.rawMove = this.move;
            var originalMove = this.move;
            this.move = function move(destination, commandObj) {
                this.isAttacking = false;
                this.isHoning = false;
                this.attackMoveDestination = null;
                this.attackMoving = false;
                this.isHoldingPosition = false;
                originalMove.call(this, destination, commandObj);
                this._becomePeaceful();
            }

            //extend stop
            this.rawStop = this.stop;
            var originalStop = this.stop;
            this.stop = function(commandObj) {
                if (this.specifiedAttackTarget) {
                    Matter.Events.off(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
                    this.specifiedAttackTarget = null;
                };
                originalStop.call(this);
                Matter.Sleeping.set(this.body, false);
                this.isAttacking = false;
                this.isHoning = false;
                this.attackMoveDestination = null;
                this.attackMoving = false;
                this.isHoldingPosition = false;
                this._becomeOnAlert();
                if(commandObj) {
                    commandObj.command.done();
                }
            }

            this.eventKeyMappings[this.commands.stop.key] = this.stop;
            this.eventKeyMappings[this.commands.holdPosition.key] = this.holdPosition;

            this.eventClickMappings[this.commands.attack.key] = this.attackMove;
            this.eventClickMappings[this.commands.move.key] = this.move;

            this.canAttack = true;
            this.isAttackable = true;

            this._becomeOnAlert();
        },

        _attack: function(target) {
            if(!this.canAttack) {
                return;
            }

            //Another aspect of "canAttack." If we're offscreen and have gotten here,
            //don't allow the attack to continue, just keep moving until we're within bounds.
            //And if we want to attack but are offscreen and aren't moving, issue an attackMove.
            if(!utils.isPositionWithinPlayableBounds(this.position, 20)) {
                if(!this.isMoving) {
                    this.attackMove(target.position);
                }
                return;
            }

            if (this.attackReady && this.attack) {
                this.rawStop();

                //set state
                Matter.Sleeping.set(this.body, true);
                this.isAttacking = true;
                this.attackMoving = false;
                this.attackReady = false;
                this.cooldownTimer.reset();
                this.cooldownTimer.runs = 1;
                this.cooldownTimer.timeLimit = this.cooldown;
                this.isHoning = false;

                //call attack
                this.attack(target);

                //trigger the attack event
                Matter.Events.trigger(this, 'attack', {
                    direction: utils.isoDirectionBetweenPositions(this.position, target.position)
                });
            }
        },

        //this assumes _moveable is mixed in
        attackMove: function(destination, commandObj) {

            //nullify specified attack target
            if (this.specifiedAttackTarget) {
                Matter.Events.off(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
                this.specifiedAttackTarget = null;
            };

            //set state
            this.attackMoveDestination = destination;
            this.attackMoving = true;
            this.isHoldingPosition = false;
            this.isHoning = false;

            //move unit, rawly
            this.rawMove(this.attackMoveDestination, commandObj);

            //become alert to nearby enemies
            this._becomeOnAlert(commandObj);
        },

        //this assumes _moveable is mixed in
        attackSpecificTarget: function(destination, target) {

            if(!this.canTargetUnit(target)) {
                this.attackMove({x: target.position.x, y: target.position.y}); //I think we need to pass the unit's position object
                return;
            };

            //set the specified target
            this.specifiedAttackTarget = target;

            //If the specified dies (is removed), stop and reset state.
            this.specifiedCallback = function() {
                this.stop();
                this.specifiedAttackTarget = null;
            }.bind(this);
            var callback = Matter.Events.on(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
            this.specifiedAttackTargetStop = callback;

            //But if we die first, remove the onremove listener
            utils.deathPact(this, function() {
                Matter.Events.off(target, 'onremove', this.specifiedCallback);
            }, 'removeSpecifiedAttackTarget');

            //move unit
            this.rawMove(destination);

            //become alert to nearby enemies, but since we have a specific target, other targets won't be considered
            this._becomeOnAlert();
        },

        holdPosition: function() {
            this.stop();
            this.isHoldingPosition = true;

            //remove the attack hone functionality since we don't want to move
            if (this.attackHoneTick) {
                currentGame.removeTickCallback(this.attackHoneTick);
            }
            Matter.Sleeping.set(this.body, true);
        },

        _becomeOnAlert: function(commandObj) {

            //setup target sensing
            this.setupHoneAndTargetSensing(commandObj)

            //reset last hone since this is a new alert
            this.lastHone = null;

            /*
             * Move/Honing callback
             */
            if (this.attackHoneTick) {
                currentGame.removeTickCallback(this.attackHoneTick);
            }
            //unless we have a target, move towards currentHone
            this.attackHoneTick = currentGame.addTickCallback(function() {
                //initiate a raw move towards the honed object. If we switch hones, we will initiate a new raw move (note the commented out part, not sure why i had that here, but we should want to hone a specified target)
                if (this.currentHone && (this.lastHone != this.currentHone || !this.isMoving) && !this.currentTarget && this.attackReady) {// && !this.specifiedAttackTarget) {
                    this.lastHone = this.currentHone;
                    this.rawMove(this.currentHone.position);
                    this.isHoning = true;
                }
            }.bind(this));
            utils.deathPact(this, this.attackHoneTick, 'attackHoneTick')

            /*
             * Attacking callbacks
             */
            if (this.attackTick) {
                currentGame.removeTickCallback(this.attackTick);
            }
            //if we have a target, attack it
            this.attackTick = currentGame.addTickCallback(function() {
                if (this.currentTarget) {
                    this.lastHone = null; //if we're attacking something, reset the lastHoned unit
                    this._attack(this.currentTarget);
                }
            }.bind(this))
            utils.deathPact(this, this.attackTick, 'attackTick')
        },

        setupHoneAndTargetSensing: function(commandObj) {
            if(this.honeAndTargetSensorCallback)
                currentGame.removeTickCallback(this.honeAndTargetSensorCallback);

            var sensingFunction = function() {
                this.currentHone = null; //blitz current hone?
                this.currentTarget = null;
                var currentHoneDistance = null;
                var currentAttackDistance = null;

                utils.applyToUnitsByTeam(function(team) {
                    if(this.attackHoneTeamPredicate)
                        return this.attackHoneTeamPredicate(team);
                    else
                        return this.team != team;
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


                    var dist = utils.distanceBetweenBodies(this.body, unit.body);
                    if (dist > this.honeRange) return; //we're outside the larger distance, don't go further

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

                    //force currentHone to be the specificAttackTarget
                    if (this.specifiedAttackTarget) {
                        this.currentHone = unit;
                    }

                    //figure out who (if anyone) is within range to attack and set current target to be the closest one
                    if (dist <= this.range) {
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
                }.bind(this))

                //If we were attacking but no longer have a target
                if(!this.currentTarget && this.attackReady && this.isAttacking) {
                    Matter.Sleeping.set(this.body, false);
                    this.isAttacking = false;
                }

                //If we're here, we're on alert...
                //Either we were given an attack move command, "still" and on-alert, or were given a specific target
                //If we were given an "attack move" command and no longer have a target or a hone, let's issue an identical attackMove command
                //If we are "still" and no longer have a target or a hone, let's stop.
                //If we were given a "specific target" to attack, we we only want to naturally stop if we can no longer attack it
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
                        }
                    }
                }
            }.bind(this)
            this.honeAndTargetSensorCallback = currentGame.addTickCallback(sensingFunction);
            utils.deathPact(this, this.honeAndTargetSensorCallback, 'honeAndTargetSensorCallback');
        },

        _becomePeaceful: function() {
            this.currentTarget = null;

            //nullify specified attack target
            if (this.specifiedAttackTarget) {
                Matter.Events.off(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
                this.specifiedAttackTarget = null;
            };

            this.attackMoving = false;

            if(this.honeAndTargetSensorCallback)
                currentGame.removeTickCallback(this.honeAndTargetSensorCallback);

            if (this.attackTick) {
                currentGame.removeTickCallback(this.attackTick);
            }
            if (this.attackHoneTick) {
                currentGame.removeTickCallback(this.attackHoneTick);
            }
        },
    }

})
