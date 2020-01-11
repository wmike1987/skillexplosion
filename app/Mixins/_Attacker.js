define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/GameUtils'], function($, Matter, PIXI, CommonGameMixin, utils) {

    return {
        //private
        isAttacker: true,
        currentTarget: null,
        currentHone: null,
        canAttack: true,
        randomizeHone: true,
        honableTargets: null, //this prevents the need for honing sensor (which can have a negative performance impact). This may not be relevant anymore
        specifiedAttackTarget: null,

        //default
        attack: function(target) {
            target.sufferAttack(this.damage);
        },

        //user defined
        honeRange: 250,
        range: 100,
        cooldown: 3000,
        damage: 6,

        initAttacker: function() {
            this.eventMappings['attackMove'] = this.attackMove;
            this.availableTargets = new Set();
            this.cooldownTimer = currentGame.addTimer({
                name: 'cooldown' + this.body.id,
                runs: 0,
                timeLimit: this.cooldown,
                callback: function() {
                    this.canAttack = true;
                }.bind(this)
            });
            utils.deathPact(this, this.cooldownTimer);

            //extend move to cease attacking
            this.rawMove = this.move;
            var originalMove = this.move;
            this.move = function(destination, command) {
                originalMove.call(this, destination, command);
                this._becomePeaceful();
            }
            //also be sure to override the 'move' event mapping with the peaceful version
            this.eventMappings['move'] = this.move;

            //extend stop
            this.rawStop = this.stop;
            var originalStop = this.stop;
            this.stop = function() {
                //nullify specified attack target
                if (this.specifiedAttackTarget) {
                    Matter.Events.off(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
                    this.specifiedAttackTarget = null;
                };
                originalStop.call(this);
                this.attackMoveDestination = null;
                this._becomeOnAlert();
            }

            this._becomeOnAlert();
        },

        _attack: function(target) {
            if (this.canAttack) {
                //if we attack, pause the movement, the attacking engine will resume movement
                this.pause();
                if (this.attack) {

                    //Make the body stationary if attacking
                    if(!this.body.isStatic) {
                        Matter.Body.setStatic(this.body, true);
                    }

                    //Call attack()
                    this.attack(target);
                    Matter.Events.trigger(this, 'attack', {
                        direction: utils.isoDirectionBetweenPositions(this.position, target.position)
                    });
                }
                this.canAttack = false;
                this.cooldownTimer.reset();
                this.cooldownTimer.runs = 1;
            }
        },

        setupHoneAndTargetSensing: function(command) {
            if(this.honeAndTargetSensorCallback)
                currentGame.removeTickCallback(this.honeAndTargetSensorCallback);

            var sensingFunction = function() {
                this.currentHone = null; //blitz current hone?
                this.currentTarget = null;
                var currentHoneDistance = null;
                var currentAttackDistance = null;

                currentGame.applyToBodiesByTeam(function(team) {
                    return this.team != team;
                }.bind(this), function(body) {
                    return body.unit && body.isAttackable;
                }, function(body) {
                    //if we have a target specific, ignore other units, forcing currentTarget to be the specified unit
                    if (this.specifiedAttackTarget && body.unit != this.specifiedAttackTarget) {
                        return;
                    }

                    var dist = utils.distanceBetweenBodies(this.body, body);
                    if (dist > this.honeRange) return; //we're outside the larger distance, don't go further

                    //determine the closest honable target
                    if (!currentHoneDistance) {
                        currentHoneDistance = dist;
                        this.currentHone = body;
                    } else {
                        if (dist < currentHoneDistance) {
                            currentHoneDistance = dist;
                            this.currentHone = body;
                        }
                    }

                    //figure out who (if anyone) is within range to attack
                    if (dist <= this.range) {
                        if (!currentAttackDistance) {
                            currentAttackDistance = dist;
                            this.currentTarget = body.unit;
                        } else {
                            if (dist < currentAttackDistance) {
                                currentAttackDistance = dist;
                                this.currentTarget = body.unit;
                            }
                        }
                    }
                }.bind(this))

                //If we don't have a target anymore, and are static, un-static us
                if(!this.currentTarget && this.body.isStatic && this.canAttack) {
                    // if(command)
                    //     command.done();
                    Matter.Body.setStatic(this.body, false);
                }

                if (this.currentHone == null && this.currentTarget == null && this.attackMoveDestination && this.canAttack && !this.isMoving) {
                    this.attackMove(this.attackMoveDestination, command);
                }
            }.bind(this)
            this.honeAndTargetSensorCallback = currentGame.addTickCallback(sensingFunction);
            utils.deathPact(this.honeAndTargetSensorCallback, 'honeAndTargetSensorCallback');
        },

        //this assumes _moveable is mixed in
        attackMove: function(destination, command) {

            //setup target sensing (with command reference)
            this.setupHoneAndTargetSensing(command);

            //nullify specified attack target
            if (this.specifiedAttackTarget) {
                Matter.Events.off(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
                this.specifiedAttackTarget = null;
            };

            this.attackMoveDestination = destination;

            //move unit
            this.rawMove(destination, command);

            //become alert to nearby enemies
            this._becomeOnAlert(command);
        },

        //this assumes _moveable is mixed in
        attackSpecificTarget: function(destination, target) {

            if(target.team == this.team) {
                this.attackMove({x: target.position.x, y: target.position.y});
                return;
            };

            this.specifiedAttackTarget = target;

            //If the specified dies (is removed), stop and reset state.
            this.specifiedCallback = function() {
                this.stop();
                this.specifiedAttackTarget = null;
            }.bind(this);
            var callback = Matter.Events.on(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);

            //But if we die first, remove the onremove listener
            currentGame.deathPact(this, function() {
                Matter.Events.off(target, 'onremove', this.specifiedCallback);
            });

            //move unit
            this.rawMove(destination);

            //become alert to nearby enemies, but since we have a specific target, other targets won't be considered
            this._becomeOnAlert();
        },

        _becomeOnAlert: function(command) {
            //setup target sensing
            this.setupHoneAndTargetSensing(command)

            /*
             * Honing callbacks
             */
            if (this.attackHoneTick) {
                currentGame.removeTickCallback(this.attackHoneTick);
            }
            //constantly scan for units within honing range and move towards them, unless we have a current target.
            this.attackHoneTick = currentGame.addTickCallback(function() {
                if (this.currentHone && !this.currentTarget && this.canAttack && !this.specifiedAttackTarget)
                    this.rawMove(this.currentHone.position, command);
            }.bind(this));
            utils.deathPact(this, this.attackHoneTick, 'attackHoneTick')

            /*
             * Attacking callbacks
             */
            if (this.attackMoveTick) {
                currentGame.removeTickCallback(this.attackMoveTick);
            }
            //constantly scan for units within range and issue attack
            this.attackMoveTick = currentGame.addTickCallback(function() {
                if (this.currentTarget) {
                    this.pause(); //pause when we're in range of our target
                    this._attack(this.currentTarget);
                }
            }.bind(this))
            utils.deathPact(this, this.attackMoveTick, 'attackMoveTick')
        },

        /*
         *
         */
        _becomePeaceful: function() {
            this.currentTarget = null;
            this.specifiedAttackTarget = null;

            if (this.attackMoveTick) {
                currentGame.removeTickCallback(this.attackMoveTick);
            }
            if (this.attackHoneTick) {
                currentGame.removeTickCallback(this.attackHoneTick);
            }
        },

        //might use later for prioritizing targets
        chooseTarget: function() {

        },

        attackChosenTarget: function() {

        },
    }

})
