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
        var itemPlaceSound = utils.getSound('itemplace.wav', {volume: .06, rate: 1});
        var petrifySound = utils.getSound('petrify.wav', {volume: .07, rate: 1});

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
            dropItemsOnDeath: true,

            sufferAttack: function(damage, attackingUnit) {
                var alteredDamage = Math.max(1, (damage - this.defense));
                this.currentHealth -= alteredDamage;
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
                Matter.Events.trigger(this, 'sufferedAttack', alteredDamage);
            },

            _death: function() {

                if(this.dropItemsOnDeath) {
                    this.dropAllItems();
                }
                this.isDead = true;
                Matter.Events.trigger(this, 'death', {});
                this.death();
            },

            canTargetUnit: function(unit) {
                return unit.isTargetable && this.team != unit.team;
            },

            pickupItem: function(item, explicitSlot) {
                var slot = explicitSlot || this.findItemSlot(item);
                if(slot) {
                    //set ownership
                    item.owningUnit = this;

                    //add benefits (if necessary)
                    if(slot.active)
                        this.equipItem(item);

                    //play Sound
                    if(this.team == currentGame.playerTeam)
                        itemPlaceSound.play();

                    //add item to unit's item list
                    slot.location[slot.index] = item;
                    item.currentSlot = slot;

                    Matter.Events.trigger(currentGame.itemSystem, 'pickupItem', {item: item, unit: this});
                }
                return slot;
            },

            dropItem: function(item) {
                if(item.isEmpty) return; //do nothing with a blank item

                //spawn new item of same type
                var spawnPosition = {};
                do {
                    spawnPosition = {x: this.position.x + (Math.random()*60 - 30), y: this.position.y + (Math.random()*60 - 30)}
                } while (!utils.isPositionWithinPlayableBounds(spawnPosition))

                item.drop(spawnPosition);

                //remove added benefits (if necessary)
                this.unequipItem(item);
            },

            dropAllItems: function() {
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
            },

            findItemSlot: function(itemToPlace) {
                var finalSlot = null;
                var workableSlots = []
                $.each(this.getAllItems(), function(i, item) {
                    if(item.isEmpty && itemToPlace.worksWithSlot(item.currentSlot)) {
                        workableSlots.push(item.currentSlot);
                    }
                })

                //default to the first found workable slot, but search to see
                //if there's an active available slot too, and prefer that slot if it exists
                if(workableSlots.length > 0) {
                    finalSlot = workableSlots[0];
                    $.each(workableSlots, function(i, slot) {
                        if(slot.active) {
                            finalSlot = slot;
                            return false;
                        }
                    })
                }
                return finalSlot;
            },

            equipItem: function(item) {
                item.equip(this);
            },

            unequipItem: function(item) {
                if(item.currentSlot.active)
                    item.unequip(this);

                //empty the item's slot
                item.currentSlot.location[item.currentSlot.index] = item.currentSlot.slotDef;

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

                Object.defineProperty(this, 'emptySlots', {
                    get: function() {
                        return this.emptyRegularSlots.concat(this.emptySpecialtySlots).concat(this.emptyBackpackSlots);
                    },
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
                    $.each(this.getAllItems(true), function(i, item) {
                        if(item) {
                            currentGame.removeItem(item);
                        }
                    })
                }.bind(this));

                //add filter on the main render sprite
                var hoverFilter = new PIXI.Filter(undefined, hoverShader, {active: false, r: 0.0, g: 0.0, b: 0.0});
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

                Object.defineProperty(this, 'isTargetable', {
                    get: function() {
                        return this._isTargetable && utils.isPositionWithinPlayableBounds(this.position);
                    },

                    set: function(value) {
                        this._isTargetable = value;
                    },
        			configurable: true
                });
                this.isTargetable = true;

                Object.defineProperty(this, 'isAttackable', {
                    get: function() {
                        return this._isAttackable && utils.isPositionWithinPlayableBounds(this.position);
                    },

                    set: function(value) {
                        this._isAttackable = value;
                    },
        			configurable: true
                });
                this.isAttackable = true;

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
                    if (this.health) {
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
                    spritesheetName: 'BaseUnitAnimations1',
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

                Matter.Events.trigger(this, 'levelup', {unit: this});
            },

            giveExperience: function(exp) {
                this.currentExperience += exp;
                if(this.currentExperience >= this.nextLevelExp) {
                    this.levelUp();
                }
            },

            getAllItems: function(includeBlank) {
                var items = this.currentItems.concat(this.currentBackpack).concat(this.currentSpecialtyItems);
                if(includeBlank)
                    items.concat(this.emptySlots);
                return items;
            },

            petrify: function(duration) {
                this.stop();
                this.canMove = false;
                this.canAttack = false;
                this.isTargetable = false;
                this.isoManagedAlpha = .6;
                this.idleCancel = true;
                Matter.Sleeping.set(this.body, true);
                if(this.petrifyTintTimer) {
                    currentGame.invalidateTimer(this.petrifyTintTimer);
                }
                this.petrifyTintTimer = utils.graduallyTint(this, 0x18bb96, 0xb0b0b0, 3000, 'isoManagedTint');
                utils.shakeSprite(this.isoManager.currentAnimation.spine, 400);

                var unit = this;
                petrifySound.play();
                currentGame.addTimer({
                    name: 'petrified' + this.unitId,
                    runs: 1,
                    timeLimit: duration || 2000,
                    killsSelf: true,
                    callback: function() {
                        Matter.Sleeping.set(unit.body, false);
                        unit.canMove = true;
                        unit.canAttack = true;
                        unit.isTargetable = true;
                        unit.idleCancel = false;
                        currentGame.invalidateTimer(unit.petrifyTintTimer);
                        unit.isoManagedTint = null;
                        unit.isoManagedAlpha = null;
                    }
                });
            },
        }

        return function() {
            return $.extend(true, {}, UnitBase);
        };
    }
)
