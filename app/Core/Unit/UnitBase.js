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

        //default unit attributes
        var UnitBase = {
            isUnit: true,
            isoManaged: true,
            maxHealth: 20,
            currentHealth: 20,
            maxEnergy: 0,
            currentEnergy: 0,
            isSelectable: true,
            isAttackable: true,
            abilities: [],
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
            currentItems: [],
            maxItems: 6,

            sufferAttack: function(damage) {
                this.currentHealth -= damage;
                if (this.currentHealth <= 0) {
                    this._death();
                } else {
                    this.showLifeBar(true);
                    if(!this.barTimer) {
                        this.barTimer = currentGame.addTimer({name: this.id + 'barTimer', timeLimit: 650, runs: 1, callback: function() {
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
                    this.dropItem(item);
                }.bind(this))
                this.death();
            },

            canTargetUnit: function(unit) {
                return unit.isAttackable && this.team != unit.team;
            },

            pickupItem: function(item) {
                if(this.canPickupItem(item)) {
                    //set ownership
                    item.owningUnit = this;

                    //add benefits
                    this.equipItem(item);

                    //remove item and its body
                    currentGame.removeItem(item);

                    //add item to unit's item list
                    var insertedItem = false;
                    for(var i = 0; i < this.currentItems.length; i++) {
                        if(this.currentItems[i] == null) {
                            this.currentItems[i] = item;
                            insertedItem = true;
                            break;
                        }
                    }
                    if(!insertedItem) {
                        this.currentItems.push(item);
                    }
                }
            },

            dropItem: function(item) {
                //remove ownership
                item.owningUnit = null;

                //spawn new item of same type
                var spawnPosition = {};
                do {
                    spawnPosition = {x: this.position.x + (Math.random()*60 - 30), y: this.position.y + (Math.random()*60 - 30)}
                } while (!utils.isPositionWithinPlayableBounds(spawnPosition))
                ItemUtils.spawn({name: item.name.replace(/ /g,''), position: spawnPosition})

                //remove added benefits
                this.unequipItem(item);

                //remove from current item list
                var index = this.currentItems.indexOf(item);
                this.currentItems[index] = null;

                Matter.Events.trigger(this, 'dropItem', {item: item, unit: this});
            },

            canPickupItem: function() {
                var notFull = this.currentItems.length < this.maxItems;
                var emptySpot = false;
                for(var i = 0; i < this.currentItems.length; i++) {
                    if(this.currentItems[i] == null) {
                        emptySpot = true;
                        break;
                    }
                }
                return notFull || emptySpot;
            },

            equipItem: function(item) {
                item.equip(this);
            },

            unequipItem: function(item) {
                item.unequip(this);
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
                                })
                            } else //we have a more complex object
                            {
                                newCommand = Command({
                                    queue: this.commandQueue,
                                    context: this,
                                    type: 'click',
                                    target: event.target,
                                    state: eventState,
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
                                })
                            } else //we have a more complex object
                            {
                                newCommand = Command({
                                    queue: this.commandQueue,
                                    context: this,
                                    type: 'key',
                                    target: event.target,
                                    state: eventState,
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
            }
        }

        return UnitBase;
    }
)
