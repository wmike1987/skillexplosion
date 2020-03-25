define(['jquery', 'matter-js', 'pixi', 'unitcore/_Moveable', 'unitcore/_Attacker', 'unitcore/IsoSpriteManager',
'utils/GameUtils', 'unitcore/CommandQueue', 'unitcore/Command', 'unitcore/ItemUtils'],

    function($, Matter, PIXI, Moveable, Attacker, Iso, utils, CommandQueue, Command, ItemUtils) {

        var hoverShader = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float r;
            uniform float g;
            uniform float b;
            uniform float a;
            uniform bool active;

            void main(){
                if(active) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    if(gl_FragColor.a > 0.3) {
                        if(r > 0.0) {
                            gl_FragColor.r = r;
                        }
                        if(g > 0.0) {
                            gl_FragColor.g = g;
                        }
                        if(b > 0.0) {
                            gl_FragColor.b = b;
                        }
                        if(a > 0.0) {
                            gl_FragColor.a = a;
                        }
                    }
                } else {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                }
            }
        `;

        var levelUpSound = utils.getSound('levelup.wav', {volume: 1, rate: .8});

        //default unit attributes
        var UnitBase = {
            isUnit: true,
            isoManaged: true,
            maxHealth: 20,
            currentHealth: 20,
            defense: 0,
            level: 1,
            currentExperience: 0,
            nextLevelExp: 100,
            lastLevelExp: 0,
            expendableSkillPoints: 0,
            energyRegenerationRate: 0,
            healthRegenerationRate: 0,
            maxEnergy: 0,
            currentEnergy: 0,
            isSelectable: true,
            isAttackable: true,
            smallerBodyWidthChange: false,
            smallerBodyHeightChange: false,
            abilities: [],
            abilityAugments: [],
            commands: {
                attack: {
                    name: "attack",
                    key: 'a',
                    type: 'click'
                },
                move: {
                    name: 'move',
                    key: 'm',
                    type: 'click'
                },
                stop: {
                    name: 'stop',
                    key: 's',
                    type: 'key'
                },
                holdPosition: {
                    name: 'holdPosition',
                    key: 'h',
                    type: 'key'
                }
            },
            team: 4,
            eventClickMappings: {},
            eventClickStateGathering: {},
            eventKeyMappings: {},
            eventKeyStateGathering: {},
            currentItems: [null, null, null, null, null, null],
            currentSpecialtyItems: [null, null, null],
            currentBackpack: [null, null, null],

            sufferAttack: function(damage, attackingUnit) {
                this.currentHealth -= Math.max(0, (damage - this.defense));
                if (this.currentHealth <= 0) {
                    this._death();
                    if(attackingUnit) {
                        Matter.Events.trigger(attackingUnit, 'kill', {killedUnit: this})
                    }
                } else {
                    this.showLifeBar(true);
                    if(!this.barTimer) {
                        this.barTimer = currentGame.addTimer({name: this.unitId + 'barTimer', timeLimit: 650, runs: 1, callback: function() {
                            if(!this.showingBarsWithAlt)
                            this.showLifeBar(false);
                        }.bind(this)})
                        utils.deathPact(this, this.barTimer);
                    } else {
                        this.barTimer.reset();
                    }
                }
                Matter.Events.trigger(this, 'sufferedAttack', damage);
            },

            _death: function() {
                $.each(this.currentItems, function(i, item) {
                    if(item) {
                        this.dropItem(item);
                    }
                }.bind(this))
                $.each(this.currentSpecialtyItems, function(i, item) {
                    if(item) {
                        this.dropItem(item);
                    }
                }.bind(this))
                $.each(this.currentBackpack, function(i, item) {
                    if(item) {
                        this.dropItem(item);
                    }
                }.bind(this))
                this.isDead = true;
                this.death();
            },

            canTargetUnit: function(unit) {
                return unit.isAttackable && this.team != unit.team;
            },

            pickupItem: function(item, explicitSpot) {
                var spot = explicitSpot || this.findItemSpot(item);
                if(spot) {
                    //set ownership
                    item.owningUnit = this;

                    //add benefits (if necessary)
                    if(spot.active)
                        this.equipItem(item);

                    //add item to unit's item list
                    spot.location[spot.index] = item;
                    item.currentSpot = spot;

                    Matter.Events.trigger(currentGame.itemSystem, 'pickupItem', {item: item, unit: this});
                }
                return spot;
            },

            dropItem: function(item) {
                //spawn new item of same type
                var spawnPosition = {};
                do {
                    spawnPosition = {x: this.position.x + (Math.random()*60 - 30), y: this.position.y + (Math.random()*60 - 30)}
                } while (!utils.isPositionWithinPlayableBounds(spawnPosition))

                item.drop(spawnPosition);

                //remove added benefits (if necessary)
                this.unequipItem(item);
            },

            findItemSpot: function(item) {
                var emptySpot = null;
                if(item.unitType == null) { //if we're a regular item
                    for(var i = 0; i < this.currentItems.length; i++) {
                        if(this.currentItems[i] == null) {
                            emptySpot = {location: this.currentItems, index: i, active: true};
                            break;
                        }
                    }
                } else if(item.unitType == this.unitType) {
                    for(var i = 0; i < this.currentSpecialtyItems.length; i++) {
                        if(this.currentSpecialtyItems[i] == null) {
                            emptySpot = {location: this.currentSpecialtyItems, index: i, active: true};
                            break;
                        }
                    }
                }
                if(!emptySpot) {
                    for(var i = 0; i < this.currentBackpack.length; i++) {
                        if(this.currentBackpack[i] == null) {
                            emptySpot = {location: this.currentBackpack, index: i, active: false};
                            break;
                        }
                    }
                }
                return emptySpot;
            },

            equipItem: function(item) {
                item.equip(this);
            },

            unequipItem: function(item) {
                if(item.currentSpot.active)
                    item.unequip(this);

                //nullify the item's slot
                item.currentSpot.location[item.currentSpot.index] = null;

                Matter.Events.trigger(currentGame.itemSystem, 'unitUnequippedItem', {item: item, unit: this});
            },

            getAbilityByName: function(name) {
                var ret = null;
                if(this.abilities) {
                    $.each(this.abilities, function(i, ability) {
                        if(ability.name == name) {
                            ret = ability;
                        }
                        return ret == null;
                    })
                }
                return ret;
            },

            initUnit: function() {

                Object.defineProperty(this, 'maxHealth', {
                    get: function() {
                        return this._maxHealth || 0;
                    },

                    set: function(value) {
                        var currentPercentage = 100;
                        if(this._maxHealth)
                            currentPercentage = this.currentHealth/this._maxHealth;
                        this._maxHealth = value;
                        this.currentHealth = Math.round(this._maxHealth * currentPercentage);
                    }
                });

                Object.defineProperty(this, 'maxEnergy', {
                    get: function() {
                        return this._maxEnergy || 0;
                    },

                    set: function(value) {
                        var currentPercentage = 100;
                        if(this._maxEnergy)
                            currentPercentage = this.currentEnergy/this._maxEnergy;
                        this._maxEnergy = value;
                        this.currentEnergy = Math.round(this._maxEnergy * currentPercentage);
                    }
                });

                Object.defineProperty(this, 'currentHealth', {
                    get: function() {
                        return this._currentHealth || 0;
                    },

                    set: function(value) {
                        this._currentHealth = Math.min(value, this.maxHealth);
                    }
                });

                Object.defineProperty(this, 'currentEnergy', {
                    get: function() {
                        return this._currentEnergy || 0;
                    },

                    set: function(value) {
                        this._currentEnergy = Math.min(value, this.maxEnergy);
                    }
                });

                // setup health and energy
                if (this.health) {
                    this.maxHealth = this.health;
                    this.currentHealth = this.health;
                }

                if (this.energy) {
                    this.maxEnergy = this.energy;
                    this.currentEnergy = this.energy;
                }

                //event handling/dispatch queue
                this.commandQueue = CommandQueue();
                this.handleEvent = function(event) {
                    if(event.type == 'click') {
                        if(this.eventClickMappings[event.id]) {
                            var eventState = {};

                            //determine current state of things and store it in a command object
                            if(this.eventClickStateGathering[event.id]) {
                                eventState = this.eventClickStateGathering[event.id]();
                            }

                            //the mappings can be simply a function, or a more complicated object
                            var newCommand = null;
                            if(typeof this.eventClickMappings[event.id] === "function") {
                                newCommand = Command({
                                    queue: this.commandQueue,
                                    method: this.eventClickMappings[event.id],
                                    context: this,
                                    type: 'click',
                                    target: event.target,
                                    state: eventState,
                                    unit: this,
                                })
                            } else //we have a more complex object
                            {
                                newCommand = Command({
                                    queue: this.commandQueue,
                                    context: this,
                                    type: 'click',
                                    target: event.target,
                                    state: eventState,
                                    unit: this,
                                })

                                $.extend(newCommand, this.eventClickMappings[event.id]);
                            }

                            if(keyStates['Shift']) {
                                this.commandQueue.enqueue(newCommand);
                            }
                            else {
                                this.commandQueue.clear();
                                this.commandQueue.enqueue(newCommand);
                            }
                        }
                    } else if(event.type == 'key') {
                        if(this.eventKeyMappings[event.id]) {
                            var eventState = {};

                            //determine current state of things and store it in a command object
                            if(this.eventKeyStateGathering[event.id]) {
                                eventState = this.eventKeyStateGathering[event.id]();
                            }

                            //the mappings can be simply a function, or a more complicated object
                            var newCommand = null;
                            if(typeof this.eventKeyMappings[event.id] === "function") {
                                newCommand = Command({
                                    queue: this.commandQueue,
                                    method: this.eventKeyMappings[event.id],
                                    context: this,
                                    type: 'key',
                                    target: event.target,
                                    state: eventState,
                                    unit: this,
                                })
                            } else //we have a more complex object
                            {
                                newCommand = Command({
                                    queue: this.commandQueue,
                                    context: this,
                                    type: 'key',
                                    target: event.target,
                                    state: eventState,
                                    unit: this,
                                })

                                $.extend(newCommand, this.eventKeyMappings[event.id]);
                            }

                            if(keyStates['Shift']) {
                                this.commandQueue.enqueue(newCommand);
                            }
                            else {
                                this.commandQueue.clear();
                                this.commandQueue.enqueue(newCommand);
                            }
                        }
                    }
                };

                var handleEvent = function(event) {
                    if(this == event.unit)
                        this.handleEvent(event);
                }.bind(this);

                Matter.Events.on(currentGame.unitSystem, 'unitSystemEventDispatch', handleEvent);
                Matter.Events.on(this, "onremove", function() {
                    Matter.Events.off(currentGame.unitSystem, 'unitSystemEventDispatch', handleEvent)
                });

                Matter.Events.on(this, "onremove", function() {
                    $.each(this.currentItems, function(i, item) {
                        if(item) {
                            currentGame.removeItem(item);
                        }
                    })
                }.bind(this));

                //add filter on the main render sprite
                var hoverFilter = new PIXI.Filter(undefined, hoverShader, {active: false, r: 0.0, g: 0.0, b: 0.0});
                // var hoverShad = new PIXI.Shader(hoverFrag.program, {});
                if(this.mainRenderSprite) {
                    if($.isArray(this.mainRenderSprite)) {
                        $.each(this.mainRenderSprite, function(i, spriteId) {
                            $.each(this.renderChildren, function(index, child) {
                                if(child.id == spriteId) {
                                    child.filter = hoverFilter;
                                }
                            }.bind(this))
                        }.bind(this))
                    } else {
                        $.each(this.renderChildren, function(index, child) {
                            if(child.id == this.mainRenderSprite) {
                                child.filter = hoverFilter;
                            }
                        }.bind(this))
                    }
                };

                //hover Method
                this.hover = function(event) {
                    hoverFilter.uniforms.active = true;
                    if(this.team != event.team) {
                        hoverFilter.uniforms.r = 1;
                        hoverFilter.uniforms.g = .3;
                        hoverFilter.uniforms.b = .1;
                    } else {
                        hoverFilter.uniforms.r = 0.0;
                        hoverFilter.uniforms.g = .4;
                        hoverFilter.uniforms.b = 0.0;
                    }
                };

                this.unhover = function(event) {
                    hoverFilter.uniforms.active = false;
                };

                this.showLifeBar = function(value) {
                    if(value !== false)
                        value = true;
                    if(this.renderlings['healthbarbackground']) {
                        this.renderlings['healthbarbackground'].visible = value;
                        this.renderlings['healthbar'].visible = value;
                    }
                };

                this.showEnergyBar = function(value) {
                    if(value !== false)
                        value = true;
                    if(this.renderlings['energybarbackground']) {
                        this.renderlings['energybarbackground'].visible = value;
                        this.renderlings['energybar'].visible = value;
                    }
                };

                Matter.Events.on(this, 'addUnit', function() {

                    //start unit as idling upon add
                    if (this.isoManaged)
                        this.isoManager.idle();

                    //establish the height of the unit
                    if (this.heightAnimation)
                        this.unitHeight = this.renderlings[this.heightAnimation].height;
                    else
                        this.unitHeight = this.body.circleRadius * 2;

                    //create health bar
                    var backgroundScaleX = 1.8;
                    var barScaleXMultiplier = .96;
                    var healthBorderScale = .16;
                    var healthBarScale = .1;
                    var healthBarYOffset = this.energy ? -20 : -13;
                    if (this.health && this.isAttackable) {
                        this.renderChildren.push({
                            id: 'healthbarbackground',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX,
                                y: healthBorderScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2,
                                y: -this.unitHeight / 2 + healthBarYOffset
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            tint: 0x000000,
                            avoidIsoMgr: true,
                            visible: false,
                        }, {
                            id: 'healthbar',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX * barScaleXMultiplier,
                                y: healthBarScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2 + 32 * backgroundScaleX * (1 - barScaleXMultiplier) / 2,
                                y: -this.unitHeight / 2 + healthBarYOffset
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            avoidIsoMgr: true,
                            tint: 0x00FF00,
                            visible: false
                        });

                        var updateHealthTick = currentGame.addTickCallback(function() {
                            var percentage = this.currentHealth / this.maxHealth;
                            if (this.renderlings['healthbar']) {
                                this.renderlings['healthbar'].scale = {
                                    x: backgroundScaleX * barScaleXMultiplier * percentage,
                                    y: healthBarScale
                                };
                                this.renderlings['healthbar'].tint = utils.rgbToHex(percentage >= .5 ? ((1-percentage) * 2 * 255) : 255, percentage <= .5 ? (percentage * 2 * 255) : 255, 0);
                            }
                        }.bind(this))

                        utils.deathPact(this, updateHealthTick);
                    }

                    //create energy bar
                    if (this.energy) {
                        this.renderChildren.push({
                            id: 'energybarbackground',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX,
                                y: healthBorderScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2,
                                y: -this.unitHeight / 2 - 13
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            tint: 0x000000,
                            avoidIsoMgr: true,
                            visible: false,
                        }, {
                            id: 'energybar',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX * barScaleXMultiplier,
                                y: healthBarScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2 + 32 * backgroundScaleX * (1 - barScaleXMultiplier) / 2,
                                y: -this.unitHeight / 2 - 13
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            avoidIsoMgr: true,
                            tint: 0xDCDBD1,
                            visible: false
                        });

                        var updateEnergyTick = currentGame.addTickCallback(function() {
                            var percentage = this.currentEnergy / this.maxEnergy;
                            if (this.renderlings['energybar']) {
                                this.renderlings['energybar'].scale = {
                                    x: backgroundScaleX * barScaleXMultiplier * percentage,
                                    y: healthBarScale
                                };
                            }
                        }.bind(this))

                        utils.deathPact(this, updateEnergyTick);
                    }
                }.bind(this));

                //kill handler
                Matter.Events.on(this, 'kill', function(event) {
                    if(!this.isDead) {
                        this.giveExperience(event.killedUnit.experienceWorth || 0);
                    }
                }.bind(this))

                //regen energy
                this.energyRegen = currentGame.addTimer({
                    name: 'energyRegen' + this.unitId,
                    gogogo: true,
                    timeLimit: 100,
                    callback: function() {
                        if(this.currentEnergy < this.maxEnergy) {
                            this.currentEnergy = Math.min(this.currentEnergy + this.energyRegenerationRate/10 || 0, this.maxEnergy);
                        }
                    }.bind(this)
                });
                utils.deathPact(this, this.energyRegen);

                //regen energy
                this.healthRegen = currentGame.addTimer({
                    name: 'healthRegen' + this.unitId,
                    gogogo: true,
                    timeLimit: 100,
                    callback: function() {
                        if(this.currentHealth < this.maxHealth && this.healthRegenerationRate) {
                            this.currentHealth = Math.min(this.currentHealth + this.healthRegenerationRate/10 || 0, this.maxHealth);
                        }
                    }.bind(this)
                });
                utils.deathPact(this, this.healthRegen);

                if(this._init) {
                    this._init(); //per-unit hook
                }
            },

            levelUp: function() {
                this.level++;
                this.lastLevelExp = this.nextLevelExp;
                this.nextLevelExp *= 2.25;

                var levelUpAnimation = utils.getAnimationB({
                    spritesheetName: 'animations3',
                    animationName: 'levelup',
                    speed: 2.5,
                    transform: [this.position.x, this.position.y, .8, 1]
                });
                levelUpAnimation.play();
                utils.addSomethingToRenderer(levelUpAnimation, 'stageOne');
                utils.attachSomethingToBody(levelUpAnimation, this.body);
                Matter.Events.on(levelUpAnimation, "destroy", function() {
                    utils.detachSomethingFromBody(levelUpAnimation);
                })
                levelUpSound.play();
                this.currentHealth = this.maxHealth;
                this.currentEnergy = this.maxEnergy;

                this.expendableSkillPoints += 2;
            },

            giveExperience: function(exp) {
                this.currentExperience += exp;
                if(this.currentExperience >= this.nextLevelExp) {
                    this.levelUp();
                }
            },
        }

        return UnitBase;
    }
)
