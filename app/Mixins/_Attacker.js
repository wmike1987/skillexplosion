define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'utils/GameUtils'], function($, Matter, PIXI, CommonGameMixin, utils) {

    return {
        //private
        isAttacker: true,
        currentTarget: null,
        currentHone: null,
        canAttack: true,
        sensorCollisionCategory: 0x8000,
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

        _initAttacker: function() {
            if (this._attackerInit) return;
            this.availableTargets = new Set();
            this.tickCallbacks = [];

            //setup collision params
            this.body.collisionFilter.category = this.team || 4;

            //create improved honable and attack sensors
            this.tickCallbacks.push(currentGame.addTickCallback(function() {
                this.currentHone = null; //blitz current hone?
                this.currentTarget = null;
                $.each(currentGame.bodiesByTeam, function(i, obj) {
                    if (i != this.team) {
                        var currentHoneDistance = null;
                        var currentAttackDistance = null;
                        $.each(obj, function(i, teamBody) {
                            //specific attack target case
                            if (this.specifiedAttackTarget && teamBody != this.specifiedAttackTarget) {
                                return;
                            }

                            if (!teamBody.isAttackable) return;
                            var dist = utils.distanceBetweenBodies(this.body, teamBody);
                            if (dist > this.honeRange) return; //we're outside the larger distance, don't go further

                            //determine the closest honable target
                            if (!currentHoneDistance) {
                                currentHoneDistance = dist;
                                this.currentHone = teamBody;
                            } else {
                                if (dist < currentHoneDistance) {
                                    currentHoneDistance = dist;
                                    this.currentHone = teamBody;
                                }
                            }

                            //figure out who (if anyone) is within range to attack
                            if (dist <= this.range) {
                                if (!currentAttackDistance) {
                                    currentAttackDistance = dist;
                                    this.currentTarget = teamBody.unit;
                                } else {
                                    if (dist < currentAttackDistance) {
                                        currentAttackDistance = dist;
                                        this.currentTarget = teamBody.unit;
                                    }
                                }
                            }

                        }.bind(this))
                    }
                }.bind(this))

                if (this.currentHone == null && this.currentTarget == null && this.attackMoveDestination && this.canAttack && !this.isMoving) {
                    this.attackMove(this.attackMoveDestination);
                }
            }.bind(this)))

            Matter.Events.on(this, "onremove", function() {
                $.each(this.tickCallbacks, function(index, cb) {
                    currentGame.removeTickCallback(cb);
                })
                currentGame.removeTickCallback(this.attackHoneTick);
                currentGame.removeTickCallback(this.attackMoveTick);
                currentGame.invalidateTimer(this.cooldownTimer);
            }.bind(this));

            this.cooldownTimer = currentGame.addTimer({
                name: 'cooldown' + this.body.id,
                runs: 0,
                timeLimit: this.cooldown,
                callback: function() {
                    this.canAttack = true;
                }.bind(this)
            });

            //extend move to cease attacking
            this.rawMove = this.move;
            var originalMove = this.move;
            this.move = function(destination) {
                originalMove.call(this, destination);
                this._becomePeaceful();
            }

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

            this.pauseMovement = function() {
                this.isMoving = false;
            }

            this._becomeOnAlert();
            this._attackerInit = true;
        },

        _attack: function(target) {
            if (this.canAttack) {
                //if we attack, pause the movement, the attacking engine will resume movement
                this.pause();
                if (this.attack) {
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

        //this assumes _moveable is mixed in
        attackMove: function(destination) {

            //nullify specified attack target
            if (this.specifiedAttackTarget) {
                Matter.Events.off(this.specifiedAttackTarget, 'onremove', this.specifiedCallback);
                this.specifiedAttackTarget = null;
            };


            this.attackMoveDestination = destination;

            //move unit
            this.rawMove(destination);

            //become alert to nearby enemies
            this._becomeOnAlert();
        },

        //this assumes _moveable is mixed in
        attackSpecificTarget: function(destination, target) {

            this.specifiedAttackTarget = target;
            this.specifiedCallback = function() {
                this.stop();
                this.specifiedAttackTarget = null;
            }.bind(this);
            Matter.Events.on(target, 'onremove', this.specifiedCallback);

            //move unit
            this.rawMove(destination);

            //become alert to nearby enemies, but since we have a specific target, other targets won't be considered
            this._becomeOnAlert();
        },

        _becomeOnAlert: function() {
            /*
             * Honing callbacks
             */
            if (this.attackHoneTick) {
                currentGame.removeTickCallback(this.attackHoneTick);
            }

            //constantly scan for units within honing range and move towards them, unless we have a current target.
            this.attackHoneTick = currentGame.addTickCallback(function() {
                if (this.currentHone && !this.currentTarget && this.canAttack && !this.specifiedAttackTarget)
                    this.rawMove(this.currentHone.position);
            }.bind(this));

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
