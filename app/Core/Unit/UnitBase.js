import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Moveable from '@core/Unit/_Moveable.js'
import Attacker from '@core/Unit/_Attacker.js'
import Iso from '@core/Unit/IsoSpriteManager.js'
import EmptySlot from '@core/Unit/EmptySlot.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import Command from '@core/Unit/Command.js'
import styles from '@utils/Styles.js'
import CommandQueue from '@core/Unit/CommandQueue.js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'

var levelUpSound = gameUtils.getSound('levelup.wav', {volume: .45, rate: .8});
var itemPlaceSound = gameUtils.getSound('itemplace.wav', {volume: .06, rate: 1});
var petrifySound = gameUtils.getSound('petrify.wav', {volume: .07, rate: 1});
var maimSound = gameUtils.getSound('maimsound.wav', {volume: .5, rate: 1.6});
var condemnSound = gameUtils.getSound('condemn.wav', {volume: .15, rate: .9});
var buffSound = gameUtils.getSound('buffcreate.wav', {volume: .015, rate: 1.0});
var healSound = gameUtils.getSound('healsound.wav', {volume: .006, rate: 1.3});

//default unit attributes
var UnitBase = {
    isUnit: true,
    isoManaged: true,
    maxHealth: 20,
    currentHealth: 20,
    damageAdditions: [],
    defense: 0,
    defenseAdditions: [],
    dodge: 0,
    dodgeAdditions: [],
    grit: 0,
    gritAdditions: [],
    gritMult: 1,
    level: 1,
    currentExperience: 0,
    nextLevelExp: 100,
    lastLevelExp: 0,
    expendableSkillPoints: 0,
    energyRegenerationRate: 0,
    energyRegenerationMultiplier: 1,
    healthRegenerationRate: 0,
    healthRegenerationMultiplier: 1,
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

    sufferAttack: function(damage, attackingUnit, options) {
        options = Object.assign({isProjectile: false}, options);
        attackingUnit = attackingUnit || {name: 'empty'};
        var damageObj = {damage: damage};
        Matter.Events.trigger(this, 'preDodgeSufferAttack', {performingUnit: attackingUnit, sufferingUnit: this, damageObj: damageObj});
        if(this.attackDodged() || damageObj.manualDodge) {
            Matter.Events.trigger(globals.currentGame, 'dodgeAttack', {performingUnit: this});
            Matter.Events.trigger(this, 'dodgeAttack', {performingUnit: this, damageObj: damageObj});
            //display a miss graphic
            graphicsUtils.floatText('Dodge!', {x: this.position.x, y: this.position.y-25}, {style: styles.dodgeText});
            return;
        }

        Matter.Events.trigger(this, 'preSufferAttack', {performingUnit: attackingUnit, sufferingUnit: this, damageObj: damageObj});
        if(options.isProjectile) {
            Matter.Events.trigger(this, 'sufferProjectile', {performingUnit: attackingUnit, sufferingUnit: this, damageObj: damageObj});
        }
        Matter.Events.trigger(attackingUnit, 'dealDamage', {targetUnit: this});

        //pre suffered attack listeners have the right to change the incoming damage, so we use the damageObj to retreive any changes
        damage = damageObj.damage;

        var defenseAdditionSums = this.getDefenseAdditionSum();
        var alteredDamage = Math.max(1, (damage - (this.defense + defenseAdditionSums)));
        var damageReducedByArmor = this.defense;
        if(damage - this.defense <= 0) {
            damageReducedByArmor = damage - 1;
        }
        Matter.Events.trigger(globals.currentGame, 'damageReducedByArmor', {performingUnit: attackingUnit, sufferingUnit: this, amountDone: damageReducedByArmor});
        this.currentHealth -= alteredDamage;
        if (this.currentHealth <= 0) {
            this._death();
            if(attackingUnit) {
                Matter.Events.trigger(attackingUnit, 'kill', {killedUnit: this});
                Matter.Events.trigger(globals.currentGame, 'performKill', {performingUnit: attackingUnit});
            }
        } else {
            Matter.Events.trigger(attackingUnit, 'dealNonLethalDamage', {targetUnit: this});
            this.showLifeBar(true);
            if(!this.barTimer) {
                this.barTimer = globals.currentGame.addTimer({name: this.unitId + 'barTimer', timeLimit: 425, runs: 1, callback: function() {
                    if(!this.showingBarsWithAlt)
                    this.showLifeBar(false);
                }.bind(this)})
                gameUtils.deathPact(this, this.barTimer);
            } else {
                this.barTimer.reset();
            }
        }
        Matter.Events.trigger(globals.currentGame, 'sufferAttack', {performingUnit: attackingUnit, sufferingUnit: this, amountDone: alteredDamage});
    },

    attackDodged: function() {
        var r = Math.random();
        var dodgeSum = this.dodge + this.getDodgeAdditionSum();
        return (r < dodgeSum/100);
    },

    giveHealth: function(amount, performingUnit) {
        performingUnit = performingUnit || {name: 'empty'};
        var healingObj = {amount: amount}
        Matter.Events.trigger(this, 'preReceiveHeal', {performingUnit: performingUnit, healingObj: healingObj});
        amount = healingObj.amount;

        this.currentHealth += amount;
        var healingDone = amount;
        if(this.currentHealth >= this.maxHealth) {
            healingDone -= (this.currentHealth-this.maxHealth);
            this.currentHealth = this.maxHealth;
        }

        Matter.Events.trigger(globals.currentGame, 'performHeal', {performingUnit: performingUnit, amountDone: healingDone});
        Matter.Events.trigger(performingUnit, 'performHeal', {healedUnit: this, performingUnit: performingUnit, amountDone: healingDone});
        Matter.Events.trigger(this, 'receiveHeal', {performingUnit: performingUnit, amountDone: healingDone});
    },

    _death: function() {
        this.deathPosition = mathArrayUtils.clonePosition(this.position);

        if(this.dropItemsOnDeath) {
            this.dropAllItems();
        }
        this.isDead = true;
        Matter.Events.trigger(this, 'death', {});
        var levelLocalEntities = this.death();
        if(levelLocalEntities) {
            levelLocalEntities.forEach((ent) => {
                Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {entity: ent});
            })
        }
    },

    death: function() {

    },

    canTargetUnit: function(unit) {
        return unit.isTargetable && this.team != unit.team;
    },

    pickupItem: function(item, explicitSlot, systemGivenItem) {
        var slot = explicitSlot || this.findItemSlot(item);
        if(slot) {
            //set ownership
            item.owningUnit = this;

            //add benefits (if necessary)
            if(slot.active)
                this.equipItem(item);

            //play Sound
            if(!systemGivenItem) {
                if(this.team == globals.currentGame.playerTeam)
                    itemPlaceSound.play();
            }

            //add item to unit's item list
            slot.location[slot.index] = item;
            item.currentSlot = slot;

            Matter.Events.trigger(globals.currentGame.itemSystem, 'pickupItem', {item: item, unit: this});
        }
        return slot;
    },

    dropItem: function(item) {
        if(item.isEmptySlot) return; //do nothing with a blank item

        //spawn new item of same type
        var spawnPosition = {};
        do {
            spawnPosition = {x: this.position.x + (Math.random()*60 - 30), y: this.position.y + (Math.random()*60 - 30)}
        } while (!gameUtils.isPositionWithinPlayableBounds(spawnPosition))

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
            if(item.isEmptySlot && itemToPlace.worksWithSlot(item.currentSlot)) {
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

        Matter.Events.trigger(globals.currentGame.itemSystem, 'unitUnequippedItem', {item: item, unit: this});
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

    equipPassive: function(passive, type) {
        //equip the new passive
        this[type] = passive;
        Matter.Events.trigger(this, type + 'Equipped', {type: type, passive: passive})
        passive[type] = true;
        passive.isEquipped = true;
        passive.start(type);
    },

    unequipPassive: function(passive) {
        var type = 'attackPassive';
        if(passive.defensePassive) {
            type = 'defensePassive';
        }
        Matter.Events.trigger(this, type + 'Unequipped', {type: type, passive: passive})
        passive.isEquipped = false;
        if(passive.attackPassive) {
            passive.attackPassive = false;
            this.attackPassive = null;
        } else {
            passive.defensePassive = false;
            this.defensePassive = null;
        }
        passive.stop();
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

        Matter.Events.on(globals.currentGame.unitSystem, 'unitSystemEventDispatch', handleEvent);

        Matter.Events.on(this, "onremove", function() {
            Matter.Events.off(globals.currentGame.unitSystem, 'unitSystemEventDispatch', handleEvent)
            if(!this.itemsEnabled) return;
            $.each(this.getCompleteSetOfItemObjects(), function(i, item) {
                if(item) {
                    globals.currentGame.removeItem(item);
                }
            })
        }.bind(this));

        //hover Method
        this.hover = function(event) {
            if(this.team != event.team) {
                if(this.tintMe) {
                    this.tintMe(0xc63e04);
                }
                this.isoManagedTint = 0xc31111;
            } else {
                if(this.tintMe) {
                    this.tintMe(0x018526);
                }
                this.isoManagedTint = 0x3afc53;
            }

        };

        this.unhover = function(event) {
            this.isoManagedTint = 0xFFFFFF;
            if(this.untintMe) {
                this.untintMe();
            }
        };

        this.showLifeBar = function(value) {
            if(this.hideLifeBar) return;
            if(value !== false)
                value = true;
            if(this.renderlings['healthbarbackground']) {
                this.renderlings['healthbarbackground'].visible = value;
                this.renderlings['healthbar'].visible = value;
            }
        };

        this.showEnergyBar = function(value) {
            if(this.hideEnergyBar) return;
            if(value !== false)
                value = true;
            if(this.renderlings['energybarbackground']) {
                this.renderlings['energybarbackground'].visible = value;
                this.renderlings['energybar'].visible = value;
            }
        };

        Object.defineProperty(this, 'isTargetable', {
            get: function() {
                return this._isTargetable && gameUtils.isPositionWithinPlayableBounds(this.position);
            },

            set: function(value) {
                this._isTargetable = value;
            },
			configurable: true
        });
        this.isTargetable = true;

        Object.defineProperty(this, 'isAttackable', {
            get: function() {
                return this._isAttackable && gameUtils.isPositionWithinPlayableBounds(this.position);
            },

            set: function(value) {
                this._isAttackable = value;
            },
			configurable: true
        });
        this.isAttackable = true;

        Matter.Events.on(this, 'addUnit', function() {
            if(this._afterAddInit) {
                this._afterAddInit();
            }

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

                var updateHealthTick = globals.currentGame.addTickCallback(function() {
                    var percentage = this.currentHealth / this.maxHealth;
                    if (this.renderlings['healthbar']) {
                        this.renderlings['healthbar'].scale = {
                            x: backgroundScaleX * barScaleXMultiplier * percentage,
                            y: healthBarScale
                        };
                        this.renderlings['healthbar'].tint = graphicsUtils.rgbToHex(percentage >= .5 ? ((1-percentage) * 2 * 255) : 255, percentage <= .5 ? (percentage * 2 * 255) : 255, 0);
                    }
                }.bind(this))

                gameUtils.deathPact(this, updateHealthTick);
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

                var updateEnergyTick = globals.currentGame.addTickCallback(function() {
                    var percentage = this.currentEnergy / this.maxEnergy;
                    if (this.renderlings['energybar']) {
                        this.renderlings['energybar'].scale = {
                            x: backgroundScaleX * barScaleXMultiplier * percentage,
                            y: healthBarScale
                        };
                    }
                }.bind(this))

                gameUtils.deathPact(this, updateEnergyTick);
            }
        }.bind(this));

        //kill handler (disabled for now)
        if(false) {
            Matter.Events.on(this, 'kill', function(event) {
                if(!this.isDead) {
                    this.giveExperience(event.killedUnit.experienceWorth || 0);
                }
            }.bind(this))
        }

        //grit handling
        this.gritHandler = globals.currentGame.addTickCallback(function() {
            var gritSum = this.grit + this.getGritAdditionSum();
            if(this.currentHealth < gritSum/100*this.maxHealth) {
                this.gritMult = 2;
            } else {
                this.gritMult = 1;
            }
        }.bind(this))
        gameUtils.deathPact(this, this.gritHandler);

        //regen energy
        this.energyRegen = globals.currentGame.addTimer({
            name: 'energyRegen' + this.unitId,
            gogogo: true,
            timeLimit: 100,
            callback: function() {
                if(this.currentEnergy < this.maxEnergy && this.energyRegenerationRate) {
                    this.currentEnergy = Math.min(this.currentEnergy + this.getTotalEnergyRegeneration()/10 || 0, this.maxEnergy);
                }
            }.bind(this)
        });
        gameUtils.deathPact(this, this.energyRegen);

        //regen health
        this.healthRegen = globals.currentGame.addTimer({
            name: 'healthRegen' + this.unitId,
            gogogo: true,
            timeLimit: 100,
            callback: function() {
                if(this.currentHealth < this.maxHealth && this.healthRegenerationRate) {
                    this.currentHealth = Math.min(this.currentHealth + this.getTotalHealthRegeneration()/10, this.maxHealth);
                }
            }.bind(this)
        });
        gameUtils.deathPact(this, this.healthRegen);

        if(this._init) {
            this._init(); //per-unit hook
        }
    },

    getTotalHealthRegeneration: function() {
        return this.healthRegenerationRate * this.gritMult * this.healthRegenerationMultiplier;
    },

    getTotalEnergyRegeneration: function() {
        return this.energyRegenerationRate * this.energyRegenerationMultiplier;
    },

    addFilter: function(filter, filterArea) {
        if(this.mainRenderSprite) {
            if($.isArray(this.mainRenderSprite)) {
                $.each(this.mainRenderSprite, function(i, spriteId) {
                    $.each(this.renderlings, function(id, child) {
                        if(id == spriteId) {
                            if(!child.filters) {
                                child.filters = filter;
                            }
                            else {
                                (child.filters.push(filter))
                            }

                            if(filterArea) {
                                child.filterArea = filterArea;
                            }
                        }
                    }.bind(this))
                }.bind(this))
            } else {
                $.each(this.renderlings, function(id, child) {
                    if(id == this.mainRenderSprite) {
                        if(!child.filters) {
                            child.filters = filter;
                        }
                        else {
                            (child.filters.push(filter))
                        }

                        if(filterArea) {
                            child.filterArea = filterArea;
                        }
                    }
                }.bind(this))
            }
        };
    },

    levelUp: function() {
        this.level++;
        this.lastLevelExp = this.nextLevelExp;
        this.nextLevelExp *= 2.25;

        var levelUpAnimation = gameUtils.getAnimation({
            spritesheetName: 'BaseUnitAnimations1',
            animationName: 'levelup',
            speed: 2.5,
            transform: [this.position.x, this.position.y, .8, 1]
        });
        levelUpAnimation.play();
        graphicsUtils.addSomethingToRenderer(levelUpAnimation, 'stageOne');
        gameUtils.attachSomethingToBody({something: levelUpAnimation, body: this.body});
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

    //This returns a representation of the unit's current visible item-set, including visible empty slots
    getAllItems: function() {
        var items = this.currentItems.concat(this.currentBackpack).concat(this.currentSpecialtyItems);
        return items;
    },

    //This returns all item objects a unit possesses, including hidden empty slots
    getCompleteSetOfItemObjects: function() {
        var completeSet = this.currentItems.concat(this.currentBackpack).concat(this.currentSpecialtyItems).filter(item => {
            return !item.isEmptySlot;
        })

        return completeSet.concat(this.emptySlots);
    },

    petrify: function(duration) {
        var unit = this;
        var buffName = 'petrify';
        var shakeTimer = null;
        this.applyBuff({name: buffName, unit: this, textureName: 'PetrifyBuff', playSound: false, duration: duration || 2000, applyChanges: function() {
            this.stop();
            this.canMove = false;
            this.canAttack = false;
            this.isTargetable = false;
            this.isoManagedAlpha = .6;
            this.idleCancel = true;
            Matter.Sleeping.set(this.body, true);
            if(this.petrifyTintTimer) {
                globals.currentGame.invalidateTimer(this.petrifyTintTimer);
            }
            this.petrifyTintTimer = graphicsUtils.graduallyTint(this, 0x008265, 0xFFFFFF, duration, 'isoManagedTint');
            shakeTimer = graphicsUtils.shakeSprite(this.isoManager.currentAnimation.spine, 400);
            gameUtils.deathPact(unit, shakeTimer);
            petrifySound.play();
        }, removeChanges: function() {
            Matter.Sleeping.set(unit.body, false);
            unit.canMove = true;
            unit.canAttack = true;
            unit.isTargetable = true;
            unit.idleCancel = false;
            gameUtils.undeathPact(unit, shakeTimer);
            globals.currentGame.invalidateTimer(unit.petrifyTintTimer);
            unit.isoManagedTint = null;
            unit.isoManagedAlpha = null;
        }})
    },

    maim: function(duration) {
        var movePenalty = -.5;
        var defensePenalty = -1;

        var unit = this;
        var buffName = 'maim';
        maimSound.play();
        this.applyBuff({name: buffName, unit: this, textureName: 'MaimBuff', playSound: false, duration: duration || 2000, applyChanges: function() {
            unit.moveSpeed += movePenalty;
            unit.addDefenseAddition(defensePenalty);
        }, removeChanges: function() {
            unit.moveSpeed -= movePenalty.toString();
            unit.removeDefenseAddition(defensePenalty);
        }})
    },

    condemn: function(duration, condemningUnit) {
        var defensePenalty = -1;
        var buffName = 'condemn';
        condemnSound.play();
        var handler;
        this.applyBuff({name: buffName, unit: this, textureName: 'CondemnBuff', playSound: false, duration: duration || 2000, applyChanges: function() {
            this.addDefenseAddition(defensePenalty);
            handler = gameUtils.matterOnce(this, 'death', function() {
                var position1 = condemningUnit.position;
                var offset2 = {x: Math.random()*40-20, y: Math.random()*40-20};
                var offset3 = {x: Math.random()*40-20, y: Math.random()*40-20};
                var condemnNote1 = graphicsUtils.addSomethingToRenderer("CondemnBuff", {where: 'stageTwo', position: position1, scale: {x: .8, y: .8}})
                var condemnNote2 = graphicsUtils.addSomethingToRenderer("CondemnBuff", {where: 'stageTwo', position: position1, scale: {x: .8, y: .8}})
                var condemnNote3 = graphicsUtils.addSomethingToRenderer("CondemnBuff", {where: 'stageTwo', position: position1, scale: {x: .8, y: .8}})
                gameUtils.attachSomethingToBody({something: condemnNote1, body: condemningUnit.body});
                gameUtils.attachSomethingToBody({something: condemnNote2, body: condemningUnit.body, offset: offset2});
                gameUtils.attachSomethingToBody({something: condemnNote3, body: condemningUnit.body, offset: offset3});
                graphicsUtils.floatSprite(condemnNote1, {runs: 45});
                graphicsUtils.floatSprite(condemnNote2, {runs: 50});
                graphicsUtils.floatSprite(condemnNote3, {runs: 65});
                condemningUnit.giveHealth(15);
                healSound.play();
            })
        }, removeChanges: function() {
            this.removeDefenseAddition(defensePenalty);
            handler.removeHandler();
        }.bind(this)})
    },

    becomeHidden: function(duration) {
        this.applyBuff({name: 'hidden', textureName: 'HiddenBuff', playSound: true, duration: duration || 2000, applyChanges: function() {
            this.isTargetable = false;
            this.isoManager.currentAnimation.alpha = .4;
            this.isoManagedAlpha = .4;
        }, removeChanges: function() {
            this.isoManagedAlpha = null;
            this.isTargetable = true;
        }.bind(this)})
    },

    //utility methods for units
    getDefenseAdditionSum: function() {
        var sum = 0;
        this.defenseAdditions.forEach((addition) => {
            sum += addition;
        })
        return Math.max(-this.defense, sum);
    },

    getDodgeAdditionSum: function() {
        var sum = 0;
        this.dodgeAdditions.forEach((addition) => {
            sum += addition;
        })
        return Math.max(-this.dodge, sum);
    },

    getGritAdditionSum: function() {
        var sum = 0;
        this.gritAdditions.forEach((addition) => {
            sum += addition;
        })
        return Math.max(-this.grit, sum);
    },

    getDamageAdditionSum: function() {
        var sum = 0;
        this.damageAdditions.forEach((addition) => {
            sum += addition;
        })

        var baseDamageAmount = this.damage;
        if(this.damageMember && this.damageMember instanceof Function) {
            baseDamageAmount = this.damageMember();
        }
        return Math.max(-baseDamageAmount, sum);
    },

    addDefenseAddition: function(amount) {
        this.defenseAdditions.push(amount);
    },

    removeDefenseAddition: function(value) {
        mathArrayUtils.removeObjectFromArray(value, this.defenseAdditions);
    },

    addDodgeAddition: function(amount) {
        this.dodgeAdditions.push(amount);
    },

    removeDodgeAddition: function(value) {
        mathArrayUtils.removeObjectFromArray(value, this.dodgeAdditions);
    },

    addGritAddition: function(amount) {
        this.gritAdditions.push(amount);
    },

    removeGritAddition: function(value) {
        mathArrayUtils.removeObjectFromArray(value, this.gritAdditions);
    },

    addDamageAddition: function(amount) {
        this.damageAdditions.push(amount);
    },

    removeDamageAddition: function(value) {
        mathArrayUtils.removeObjectFromArray(value, this.damageAdditions);
    },

    /*
     * Applies a buff graphic to a unit. This sets a buff object on the unit which can be used to remove the buff image.
     * options {
     *  unit
     *  name
     *  textureName
     *  scale
     *  tint
     * }
     */
    applyBuff: function(options) {
        options = Object.assign({playSound: true}, options)
        var name = options.name;
        var unit = this;
        var textureName = options.textureName;
        var scale = options.scale || {x: 1, y: 1};
        var originalyOffset = options.yoffset || -60;
        var playSound = options.playSound;
        var buffDuration = options.duration;
        if(!unit.buffs) {
            unit.buffs = {};
            unit.orderedBuffs = [];
            unit.removeAllBuffs = function() {
                unit.buffs.forEach((buff) => {
                    buff.removeBuffImage();
                })
            }
        }

        if(unit.buffs[name]) {
            var buffAlreadyExists = true;
        }
        if(!unit.buffs[name]) {
            var buffObj = {
                removeBuffImage: function() {
                    console.info('removing buff: ' + name + ' on unit: ' + unit.name);
                    gameUtils.detachSomethingFromBody(unit.buffs[name].dobj);
                    graphicsUtils.removeSomethingFromRenderer(unit.buffs[name].dobj);
                    mathArrayUtils.removeObjectFromArray(unit.buffs[name], unit.orderedBuffs);
                    var debuffAnim = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations2',
                        animationName: 'buffdestroy',
                        speed: 4,
                        transform: [unit.position.x, unit.position.y, .8, .8],
                        onCompleteExtension: function() {
                            unit.reorderBuffs();
                        }
                    });
                    graphicsUtils.addSomethingToRenderer(debuffAnim, 'stageTwo');
                    gameUtils.attachSomethingToBody({something: debuffAnim, body: unit.body, offset: unit.buffs[name].offset, deathPactSomething: true})
                    debuffAnim.play();
                    gameUtils.doSomethingAfterDuration(unit.reorderBuffs, 200);
                    unit.buffs[name] = null;
                    delete unit.buffs[name];
                }
            }

            if(!textureName) {
                textureName = 'TransparentSquare';
            }
            var dobj = graphicsUtils.addSomethingToRenderer(textureName, {tint: options.tint || 0xFFFFFF, where: 'stageTwo', scale: {x: scale.x, y: scale.y}});
            gameUtils.attachSomethingToBody({something: dobj, body: unit.body, offset: {x: 0, y: originalyOffset}, deathPactSomething: true})
            buffObj.dobj = dobj;
            unit.buffs[name] = buffObj;
            unit.orderedBuffs.push(buffObj);
        }

        //reorder buffs (could be multiple images to show, let's lay them out nicely, rows of three)
        if(!unit.reorderBuffs) {
            var b1 = null;
            var b2 = null;
            var xSpacing = 32;
            var ySpacing = 32;
            unit.reorderBuffs = function() {
                unit.orderedBuffs.forEach((buff, i) => {
                    var attachmentTick = buff.dobj.bodyAttachmentTick;
                    var row = Math.floor(i/3);
                    var yOffset = row * -ySpacing
                    var col = i%3;
                    var xOffset = 0;
                    if(col == 0) {
                        //start of a new row
                        b1 = buff;
                        b2 = null;
                    } else if(col == 1) {
                        xOffset = xSpacing/2;
                        b1.dobj.bodyAttachmentTick.offset.x -= xSpacing/2;
                        b2 = buff;
                    } else if(col == 2) {
                        xOffset = xSpacing;
                        b1.dobj.bodyAttachmentTick.offset.x -= xSpacing/2;
                        b2.dobj.bodyAttachmentTick.offset.x -= xSpacing/2;
                    }
                    buff.offset = {x: xOffset, y: originalyOffset + yOffset};
                    attachmentTick.offset = buff.offset;
                });
            }

            //also create method to remove all buffs
            unit.removeAllBuffs = function() {

            }
        }
        unit.reorderBuffs();

        //always play the buff create animation
        var buffAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'buffcreate',
            // reverse: true,
            speed: 1.5,
            transform: [unit.position.x, unit.position.y, 1.0, 1.0]
        });
        graphicsUtils.addSomethingToRenderer(buffAnim, 'stageTwo');
        gameUtils.attachSomethingToBody({something: buffAnim, body: unit.body, offset: unit.buffs[name].offset, deathPactSomething: true})
        buffAnim.play();

        //play sound
        if(playSound) {
            buffSound.play();
        }

        //if the same buff already exists, destroy previous timers etc
        var realizedBuff = unit.buffs[name];
        if(buffAlreadyExists) {
            realizedBuff.removeBuff(true);
            realizedBuff.removeBuff = null;
        }

        //apply the buff changes
        options.applyChanges.call(this);

        //setup cleanup of buff
        var eventRemoveHandlers = [];
        var removeAllHandlers = function() {
            eventRemoveHandlers.forEach((handler) => {
                handler();
            })
        }
        var mainCleanUp = function(preserveImage) {
            //remove image (we'll preserve if it an incoming buff of the same type overrides it)
            if(!preserveImage) {
                realizedBuff.removeBuffImage();
            }
            //remove associated events
            removeAllHandlers();
            //remove changes
            options.removeChanges();
        }
        if(buffDuration) {
            var timer = gameUtils.doSomethingAfterDuration(mainCleanUp, buffDuration, {executeOnNuke: true, timerName: this.unitId + name + 'buffRemove'});
        }
        if(!realizedBuff.removeBuff) {
            realizedBuff.removeBuff = function(preserveImage) {
                //mainCleanUp
                mainCleanUp(preserveImage);
                //invalidate running timer
                globals.currentGame.invalidateTimer(timer);
            }
        }
        var removeEvents = options.removeEvents || [{obj: globals.currentGame, eventName: 'VictoryOrDefeat'}, {obj: this, eventName: 'death'}]
        removeEvents.forEach((re) => {
            var ret = gameUtils.matterOnce(re.obj, re.eventName, function() {
                realizedBuff.removeBuff();
            })
            eventRemoveHandlers.push(ret.removeHandler);
        })
    }
}

export default UnitBase;
