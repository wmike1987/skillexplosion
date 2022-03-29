import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import Moveable from '@core/Unit/_Moveable.js';
import Attacker from '@core/Unit/_Attacker.js';
import Iso from '@core/Unit/IsoSpriteManager.js';
import EmptySlot from '@core/Unit/EmptySlot.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Command from '@core/Unit/Command.js';
import styles from '@utils/Styles.js';
import Projectile from '@core/Unit/UnitProjectile.js';
import CommandQueue from '@core/Unit/CommandQueue.js';
import {
    globals,
    keyStates
} from '@core/Fundamental/GlobalState.js';

var levelUpSound = gameUtils.getSound('levelup.wav', {
    volume: 0.45,
    rate: 0.8
});
var petrifySound = gameUtils.getSound('petrify.wav', {
    volume: 0.07,
    rate: 1
});
var stunSound = gameUtils.getSound('stunsound2.wav', {
    volume: 0.1,
    rate: 1.1
});
var maimSound = gameUtils.getSound('maimsound.wav', {
    volume: 0.5,
    rate: 1.6
});
var condemnSound = gameUtils.getSound('condemn.wav', {
    volume: 0.2,
    rate: 0.9
});
var condemnSound2 = gameUtils.getSound('condemn.wav', {
    volume: 0.05,
    rate: 1.5
});
var buffSound = gameUtils.getSound('buffcreate.wav', {
    volume: 0.015,
    rate: 1.0
});
var healSound = gameUtils.getSound('healsound.wav', {
    volume: 0.035,
    rate: 1.3
});
var gainKillingBlow = gameUtils.getSound('gainkillingblow.wav', {
    volume: 0.02,
    rate: 1.0
});
var killingBlowBlock = gameUtils.getSound('gainkillingblow.wav', {
    volume: 0.03,
    rate: 2.0
});
var equip = gameUtils.getSound('augmentEquip.wav', {
    volume: 0.03,
    rate: 1.0
});
var dodgeSound = gameUtils.getSound('petrify.wav', {
    volume: 0.07,
    rate: 1.5
});

var backgroundScaleX = 54;
var backgroundScaleY = 6;
var barScaleX = 52;
var barScaleY = 4;

//default unit attributes
var UnitBase = {
    isUnit: true,
    isTargetable: true,
    isoManaged: true,
    maxHealth: 20,
    canTakeAbilityDamage: true,
    currentHealth: 20,
    damageAdditions: [],
    defense: 0,
    defenseAdditions: [],
    dodge: 0,
    dodgeAdditions: [],
    dodgeMax: 75,
    grit: 0,
    gritAdditions: [],
    gritDodgeTimer: null,
    gritCooldown: 14,
    gritMult: 1,
    gritMax: 100,
    additions: {},
    level: 1,
    fatigueReduction: 0,
    organic: true,
    stunnable: true,
    isStunned: 0,
    isPetrified: 0,
    condemnedLifeGain: 10,
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
    energyFadeBars: [],
    healthFadeBars: [],
    showingLifeBars: false,
    showingEnergyBars: false,
    isSelectable: true,
    dodgeSound: dodgeSound,
    smallerBodyWidthChange: false,
    smallerBodyHeightChange: false,
    abilityDamageMultiplier: 1,
    bigBodyAddition: {
        x: 0,
        y: 0
    },
    abilities: [],
    abilityAugments: [],
    passiveOrder: 0,
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
        },
        holdPositionAlternate: {
            name: 'holdPositionAlternate',
            key: 'g',
            type: 'key'
        }
    },
    eventClickMappings: {},
    eventClickStateGathering: {},
    eventKeyMappings: {},
    eventKeyStateGathering: {},
    buffs: {},
    orderedBuffs: [],
    enrageCounter: 0,
    currentItems: [null, null, null, null, null, null],
    currentSpecialtyItems: [null, null, null, null, null, null],
    currentBackpack: [null, null, null],
    dropItemsOnDeath: true,
    friendlyTint: 0x10c700,
    enemyTint: 0x9d2a2a,
    neutralTint: 0xb8b62d,

    sufferAttack: function(damage, attackingUnit, options) {
        var returnInformation = {attackLanded: true};
        if (this.unitRemoved) return {};

        let attackContext = Object.assign({
            isProjectile: false,
            dodgeable: true,
            blockable: true,
            abilityType: false,
            ignoreArmor: false,
            dodgeRolls: 1,
            damageMultiplier: 1,
            dodgeManipulator: (dodge) => {
                return dodge;
            },
            armorSubtractor: 0
        }, options);

        attackingUnit = attackingUnit || {
            isPlaceholder: true
        };

        if(attackContext.abilityType) {
            damage *= this.abilityDamageMultiplier;
        }

        var damageObj = {
            damage: damage
        };

        //dodge
        Matter.Events.trigger(this, 'preDodgeSufferAttack', {
            performingUnit: attackingUnit,
            sufferingUnit: this,
            damageObj: damageObj,
            attackContext: attackContext
        });

        let dodgeReturnArray = mathArrayUtils.repeatXTimes(this.attackDodged.bind(this, {dodgeManipulator: attackContext.dodgeManipulator}), attackContext.dodgeRolls);
        let attackDodged = dodgeReturnArray.some(function(bool) {
            return bool;
        });

        if (attackContext.dodgeable && (attackDodged || attackContext.manualDodge)) {
            Matter.Events.trigger(globals.currentGame, 'dodgeAttack', {
                performingUnit: this
            });
            Matter.Events.trigger(this, 'dodgeAttack', {
                performingUnit: this,
                damageObj: damageObj,
                attackContext: attackContext
            });
            //display a miss graphic
            graphicsUtils.floatText('Dodge!', {
                x: this.position.x,
                y: this.position.y - 25
            }, {
                style: styles.dodgeText
            });
            unitUtils.showBlockGraphic({attackContext: attackContext, attackingUnit: attackingUnit, unit: this, tint: 0x00960f});
            this.dodgeSound.play();

            returnInformation.attackLanded = false;
            return returnInformation;
        }

        Matter.Events.trigger(this, 'preSufferAttack', {
            performingUnit: attackingUnit,
            sufferingUnit: this,
            damageObj: damageObj,
            attackContext: attackContext,
        });

        Matter.Events.trigger(attackingUnit, 'preDealDamage', {
            sufferingUnit: this,
            amountDone: alteredDamage,
            damageObj: damageObj,
            attackContext: attackContext
        });

        //multiply damage by the given multiplier
        damageObj.damage *= attackContext.damageMultiplier;

        //pre suffered attack listeners have the right to change the incoming damage, so we use the damageObj to retreive any changes
        damage = damageObj.damage;

        //factor in armor
        var totalDefense = attackContext.ignoreArmor ? 0 : (Math.max(0, this.getTotalDefense() - attackContext.armorSubtractor));
        returnInformation.armorIgnored = this.getTotalDefense() - totalDefense;

        var alteredDamage = Math.max(1, (damage - totalDefense));

        //killing blow block
        if (this.currentHealth - alteredDamage <= 0) {
            if (this.hasGritDodge && attackContext.blockable) {
                this.giveGritDodge(false);
                this.gritDodgeTimer.reset();
                Matter.Events.trigger(this, 'killingBlowBlock', {
                    performingUnit: this,
                    attackingUnit: attackingUnit,
                    attackContext: attackContext
                });

                //trigger the event on currentGame for the stat collector
                Matter.Events.trigger(globals.currentGame, 'killingBlowBlock', {
                    performingUnit: this,
                    attackingUnit: attackingUnit,
                    attackContext: attackContext
                });

                //display a miss graphic
                graphicsUtils.floatText('Block!', {
                    x: this.position.x,
                    y: this.position.y - 25
                }, {
                    style: styles.dodgeKillingBlowText
                });

                unitUtils.showBlockGraphic({attackContext: attackContext, attackingUnit: attackingUnit, unit: this, tint: 0xd55812});
                killingBlowBlock.play();

                returnInformation.attackLanded = false;
                return returnInformation;
            }
        }

        var damageReducedByArmor = damage - alteredDamage;
        Matter.Events.trigger(globals.currentGame, 'damageReducedByArmor', {
            performingUnit: attackingUnit,
            sufferingUnit: this,
            amountDone: damageReducedByArmor,
            attackContext: attackContext
        });

        this.fadeLifeAmount(this.currentHealth);
        this.currentHealth -= alteredDamage;
        this.updateHealthBar();

        if (this.currentHealth <= 0) {
            this._death({
                attackingUnit: attackingUnit
            });
            if (attackingUnit) {
                Matter.Events.trigger(attackingUnit, 'kill', {
                    killedUnit: this,
                    attackContext: attackContext
                });
                Matter.Events.trigger(globals.currentGame, 'performKill', {
                    performingUnit: attackingUnit,
                    attackContext: attackContext
                });
            }
        } else {
            Matter.Events.trigger(attackingUnit, 'dealNonLethalDamage', {
                sufferingUnit: this,
                attackContext: attackContext
            });
            Matter.Events.trigger(this, 'sufferNonLethalAttack', {
                performingUnit: attackingUnit,
                sufferingUnit: this,
                amountDone: alteredDamage,
                attackContext: attackContext
            });
            this.showLifeBar(true);
            if (!this.barTimer) {
                this.barTimer = globals.currentGame.addTimer({
                    name: this.unitId + 'barTimer',
                    timeLimit: 1000,
                    runs: 1,
                    callback: function() {
                        if (!this.showingBarsWithAlt && !this.barsShowingOverride) {
                            this.showLifeBar(false);
                        }
                    }.bind(this)
                });
                gameUtils.deathPact(this, this.barTimer);
            } else {
                this.barTimer.reset();
            }
        }

        Matter.Events.trigger(globals.currentGame, 'sufferAttack', {
            performingUnit: attackingUnit,
            sufferingUnit: this,
            amountDone: alteredDamage,
            attackContext: attackContext
        });

        Matter.Events.trigger(attackingUnit, 'dealDamage', {
            sufferingUnit: this,
            amountDone: alteredDamage,
            attackContext: attackContext,
            eventSubtractableDamage: alteredDamage
        });

        returnInformation.damageDone = alteredDamage;
        returnInformation.rawDamage = damageObj.damage;
        return returnInformation;
    },

    attackDodged: function(options) {
        options = gameUtils.mixinDefaults(options, {
            dodgeManipulator: (dodge) => {
                return dodge;
            }
        });

        var r = Math.random();
        var dodgeSum = options.dodgeManipulator(this.getTotalDodge());
        return (r < (dodgeSum / 100));
    },

    setHealth: function(amount, options) {
        options = options || {};
        this.currentHealth = Math.min(amount, this.maxHealth);
        this.updateHealthBar({
            overridePendingUpdates: true
        });

        if(options.silent) {
            this.showLifeBar(false);
        }
    },

    setEnergy: function(amount, options) {
        options = options || {};
        this.currentEnergy = Math.min(amount, this.maxEnergy);
        this.updateEnergyBar({
            overridePendingUpdates: true
        });

        if(options.silent) {
            this.showEnergyBar(false);
        }
    },

    giveHealth: function(amount, performingUnit, options) {
        performingUnit = performingUnit || {
            name: 'empty'
        };
        options = options || {
            invisible: false
        };
        var healingObj = {
            amount: amount
        };
        Matter.Events.trigger(this, 'preReceiveHeal', {
            performingUnit: performingUnit,
            healingObj: healingObj
        });
        amount = healingObj.amount;

        var healthDiff = this.maxHealth - this.currentHealth;
        var healingDone = amount;
        if(healthDiff < amount) {
            healingDone = healthDiff;
        }

        this.currentHealth += amount;
        if (this.currentHealth >= this.maxHealth) {
            Matter.Events.trigger(this, 'healedFully', {
                performingUnit: performingUnit
            });
        }

        if(options.immediateChange) {
            this.updateHealthBar({overridePendingUpdates: true});
        } else {
            //show give life fade
            let healthSnapshot = this.currentHealth;
            this.fadeLifeAmount(this.currentHealth, true, () => {
                this.updateHealthBar({
                    amount: healthSnapshot,
                    preserveGainTintTimer: true
                });
            });
        }

        if(options.showGainAnimation) {
            unitUtils.applyHealthGainAnimationToUnit(this);
        }

        if (!options.invisible) {
            this.showLifeBar(true);
            if (!this.barTimer) {
                this.barTimer = globals.currentGame.addTimer({
                    name: this.unitId + 'barTimer',
                    timeLimit: 1000,
                    runs: 1,
                    callback: function() {
                        if (!this.showingBarsWithAlt && !this.barsShowingOverride) {
                            this.showLifeBar(false);
                        }
                    }.bind(this)
                });
                gameUtils.deathPact(this, this.barTimer);
            } else {
                this.barTimer.reset();
            }
            Matter.Events.trigger(globals.currentGame, 'performHeal', {
                performingUnit: performingUnit,
                amountDone: healingDone
            });
            Matter.Events.trigger(performingUnit, 'performHeal', {
                healedUnit: this,
                performingUnit: performingUnit,
                amountDone: healingDone
            });
            Matter.Events.trigger(this, 'receiveHeal', {
                performingUnit: performingUnit,
                amountDone: healingDone
            });
        }

        return healingDone;
    },

    giveEnergy: function(amount, performingUnit, options) {
        options = options || {
            invisible: false,
            noFade: false,
        };

        var energyDiff = this.maxEnergy - this.currentEnergy;
        var energyGained = amount;
        if(energyDiff < amount) {
            energyGained = energyDiff;
        }

        this.currentEnergy += amount;

        if(options.immediateChange) {
            this.updateEnergyBar({overridePendingUpdates: true});
        } else {
            //show give energy fade
            let energySnapshot = this.currentEnergy;
            this.fadeEnergyAmount(this.currentEnergy, true, () => {
                this.updateEnergyBar({
                    amount: energySnapshot
                });
            });
        }

        if(options.showGainAnimation) {
            unitUtils.applyEnergyGainAnimationToUnit(this);
        }

        if (!options.invisible) {
            this.showEnergyBar(true);
            if (!this.energyTimer) {
                this.energyTimer = globals.currentGame.addTimer({
                    name: this.unitId + 'energyTimer',
                    timeLimit: 1000,
                    runs: 1,
                    callback: function() {
                        if (!this.showingBarsWithAlt && !this.barsShowingOverride) {
                            this.showEnergyBar(false);
                        }
                    }.bind(this)
                });
                gameUtils.deathPact(this, this.energyTimer);
            } else {
                this.energyTimer.reset();
            }
        }

        return energyGained;
    },

    _death: function(options) {
        options = options || {};

        this.deathPosition = mathArrayUtils.clonePosition(this.position);

        if (this.dropItemsOnDeath) {
            this.dropAllItems();
        }
        this.isDead = true;
        Matter.Events.trigger(this, 'death', {
            attackingUnit: options.attackingUnit,
            deathPosition: this.deathPosition
        });
        var levelLocalEntities = this.death();
        if (levelLocalEntities) {
            levelLocalEntities.forEach((ent) => {
                Matter.Events.trigger(globals.currentGame, 'LevelLocalEntityCreated', {
                    entity: ent
                });
            });
        }
    },

    getCurrentOrLastStandingPosition: function() {
        if (this.isDead) {
            return this.deathPosition;
        } else {
            return this.position;
        }
    },

    death: function() {

    },

    canTargetUnit: function(unit, options) {
        options = options || {};

        var teamDecision = true;
        if (options.softTarget) {
            //a soft target is one that we've right clicked on
            //in most cases, let's not be able to target a soft target if we're the same team
            if (this.team == unit.team) {
                teamDecision = false;
            }
        }
        return unit.isTargetable && unit != this && teamDecision && gameUtils.isPositionWithinPlayableBounds(unit.position);
    },

    pickupItem: function(item, explicitSlot, systemGivenItem) {
        //verify explicit slot. If it's filled, nullify it so we'll locate a slot
        if (explicitSlot) {
            if (!explicitSlot.location[explicitSlot.index].isEmptySlot) {
                explicitSlot = null;
            }
        }

        var slot = explicitSlot || this.findItemSlot(item);

        if (slot) {
            //set ownership
            item.owningUnit = this;

            //add benefits (if necessary)
            if (slot.active && !this.disregardItemBuffs)
                this.equipItem(item);

            //play Sound
            if (!systemGivenItem) {
                if (this.team == globals.currentGame.playerTeam)
                    globals.currentGame.soundPool.itemPlaceSound.play();
            }

            //add item to unit's item list
            slot.location[slot.index] = item;
            item.currentSlot = slot;

            Matter.Events.trigger(globals.currentGame.itemSystem, 'pickupItem', {
                item: item,
                unit: this
            });
            Matter.Events.trigger(this, 'pickupItem', {
                item: item
            });
        }
        return slot;
    },

    _dropItem: function(item) {
        if (item.isEmptySlot) return; //do nothing with a blank item

        //spawn new item of same type
        var spawnPosition = {};
        do {
            if (this.forcedItemDropOffset) {
                spawnPosition = mathArrayUtils.clonePosition(this.position, this.forcedItemDropOffset);
            } else {
                spawnPosition = {
                    x: this.position.x + (Math.random() * 60 - 30),
                    y: this.position.y + (Math.random() * 60 - 30)
                };
            }
        } while (!gameUtils.isPositionWithinPlayableBounds(spawnPosition));

        item.drop(spawnPosition, {
            fleeting: !item.immortal
        });

        //remove added benefits (if necessary)
        this.unequipItem(item);
    },

    dropAllItems: function() {
        $.each(this.currentItems, function(i, item) {
            if (item) {
                this._dropItem(item);
            }
        }.bind(this));
        $.each(this.currentSpecialtyItems, function(i, item) {
            if (item) {
                this._dropItem(item);
            }
        }.bind(this));
        $.each(this.currentBackpack, function(i, item) {
            if (item) {
                this._dropItem(item);
            }
        }.bind(this));
    },

    findItemSlot: function(itemToPlace) {
        var finalSlot = null;
        var workableSlots = [];
        $.each(this.getAllItems(), function(i, item) {
            if (item.isEmptySlot && itemToPlace.worksWithSlot(item.currentSlot)) {
                workableSlots.push(item.currentSlot);
            }
        });

        //default to the first found workable slot, but search to see
        //if there's an active available slot too, and prefer that slot if it exists
        if (workableSlots.length > 0) {
            finalSlot = workableSlots[0];
            $.each(workableSlots, function(i, slot) {
                if (slot.active) {
                    finalSlot = slot;
                    return false;
                }
            });
        }
        return finalSlot;
    },

    equipItem: function(item) {
        item.equip(this);
        graphicsUtils.addGleamToSprite({
            sprite: item.icon,
            gleamWidth: 15,
            power: 0.75,
            leanAmount: 12,
            duration: 500
        });
    },

    unequipItem: function(item) {
        if (item.currentSlot.active && !this.disregardItemBuffs)
            item.unequip(this);

        //empty the item's slot
        item.currentSlot.location[item.currentSlot.index] = item.currentSlot.slotDef;

        Matter.Events.trigger(globals.currentGame.itemSystem, 'unitUnequippedItem', {
            item: item,
            unit: this
        });
    },

    getAbilityByName: function(name) {
        var ret = null;
        if (this.abilities) {
            $.each(this.abilities, function(i, ability) {
                if (ability.name == name) {
                    ret = ability;
                }
                return ret == null;
            });
        }
        return ret;
    },

    getRandomAbility: function() {
        return mathArrayUtils.getRandomElementOfArray(Object.values(this.abilities));
    },

    equipPassive: function(passive, type) {
        //equip the new passive
        this[type] = passive;
        passive[type] = true;
        passive.isEquipped = true;
        passive.start(type);

        Matter.Events.trigger(this, type + 'Equipped', {
            type: type,
            passive: passive
        });

        Matter.Events.trigger(passive, 'Equip', {
            type: type
        });
    },

    unequipPassive: function(passive, options) {
        options = options || {};
        var type = 'attackPassive';
        if (passive.defensePassive) {
            type = 'defensePassive';
        }
        passive.isEquipped = false;
        if (passive.attackPassive) {
            passive.attackPassive = false;
            this.attackPassive = null;
        } else {
            passive.defensePassive = false;
            this.defensePassive = null;
        }
        passive.stop();

        Matter.Events.trigger(this, type + 'Unequipped', {
            type: type,
            passive: passive
        });

        Matter.Events.trigger(passive, 'Unequip', {
            type: type,
            manual: options.manual
        });
    },

    swapStatesOfMind: function() {
        this.swappingStatesOfMind = true;

        var currentAttack = this.attackPassive;
        var currentDefensive = this.defensePassive;

        if(currentAttack || currentDefensive) {
            equip.play();
        } else {
            return;
        }

        if (currentAttack) {
            this.unequipPassive(currentAttack);
        }

        if (currentDefensive) {
            this.unequipPassive(currentDefensive);
        }

        if (currentAttack) {
            this.equipPassive(currentAttack, 'defensePassive');
        }

        if (currentDefensive) {
            this.equipPassive(currentDefensive, 'attackPassive');
        }

        Matter.Events.trigger(globals.currentGame.unitSystem, 'swapStatesOfMind', {unit: this});
        this.swappingStatesOfMind = false;
    },

    applyUnitStates: function() {
        if(this.hazard) {
            this.isTargetable = false;
            this.isSelectable = false;
            this.hideLifeBar = true;
            this.hideEnergyBar = true;
        }
    },

    initUnit: function() {
        this.applyUnitStates();

        //Enter playable event setup
        var enterPlayableTick = globals.currentGame.addTickCallback(() => {
            if(gameUtils.isPositionWithinPlayableBounds(this.position, 30)) {
                Matter.Events.trigger(globals.currentGame, 'UnitEneteredPlayable', {unit: this});
                globals.currentGame.removeTickCallback(enterPlayableTick);
            }
        }, false);
        gameUtils.deathPact(this, enterPlayableTick);

        Object.defineProperty(this, 'maxHealth', {
            get: function() {
                return this._maxHealth || 0;
            },

            set: function(value) {
                var currentPercentage = 100;
                if (this._maxHealth) {
                    currentPercentage = this.currentHealth / this._maxHealth;
                }
                this._maxHealth = value;
                let diffToGive = this._maxHealth * currentPercentage - this.currentHealth;
                this.giveHealth(diffToGive, null, {immediateChange: true, invisible: true});
            }
        });

        Object.defineProperty(this, 'maxEnergy', {
            get: function() {
                return this._maxEnergy || 0;
            },

            set: function(value) {
                var currentPercentage = 100;
                if (this._maxEnergy) {
                    currentPercentage = this.currentEnergy / this._maxEnergy;
                }
                this._maxEnergy = value;
                let diffToGive = this._maxEnergy * currentPercentage - this.currentEnergy;
                this.giveEnergy(diffToGive, null, {immediateChange: true, invisible: true});
            }
        });

        Object.defineProperty(this, 'currentHealth', {
            get: function() {
                return this._currentHealth || 0;
            },

            set: function(value) {
                if (value < 0) {
                    value = 0;
                }

                if (value > this.maxHealth) {
                    value = this.maxHealth;
                }
                this._currentHealth = value;
            }
        });

        Object.defineProperty(this, 'currentEnergy', {
            get: function() {
                return this._currentEnergy || 0;
            },

            set: function(value) {
                if (value < 0) {
                    value = 0;
                }

                if (value > this.maxEnergy) {
                    value = this.maxEnergy;
                }
                this._currentEnergy = value;
            }
        });

        Object.defineProperty(this, 'footPosition', {
            get: function() {
                return mathArrayUtils.clonePosition(this.position, this.body.renderlings.selected.offset);
            },
        });

        Object.defineProperty(this, 'emptySlots', {
            get: function() {
                return this.emptyRegularSlots.concat(this.emptySpecialtySlots).concat(this.emptyBackpackSlots);
            },
        });

        //event handling/dispatch queue
        this.commandQueue = CommandQueue();
        this.handleEvent = function(event) {
            if (event.type == 'click') {
                if (this.eventClickMappings[event.id]) {
                    let eventState = {};

                    //determine current state of things and store it in a command object
                    if (this.eventClickStateGathering[event.id]) {
                        eventState = this.eventClickStateGathering[event.id]();
                    }

                    //the mappings can be simply a function, or a more complicated object
                    let newCommand = null;
                    if (typeof this.eventClickMappings[event.id] === "function") {
                        newCommand = Command({
                            queue: this.commandQueue,
                            method: this.eventClickMappings[event.id],
                            context: this,
                            type: 'click',
                            target: event.target,
                            targetType: event.targetType,
                            state: eventState,
                            unit: this,
                        });
                    } else //we have a more complex object
                    {
                        newCommand = Command({
                            queue: this.commandQueue,
                            context: this,
                            type: 'click',
                            target: event.target,
                            targetType: event.targetType,
                            state: eventState,
                            unit: this,
                        });

                        $.extend(newCommand, this.eventClickMappings[event.id]);
                    }

                    if (keyStates.Shift) {
                        this.commandQueue.enqueue(newCommand);
                    } else {
                        this.commandQueue.clear();
                        this.commandQueue.enqueue(newCommand);
                    }
                }
            } else if (event.type == 'key') {
                if (this.eventKeyMappings[event.id]) {
                    let eventState = {};

                    //determine current state of things and store it in a command object
                    if (this.eventKeyStateGathering[event.id]) {
                        eventState = this.eventKeyStateGathering[event.id]();
                    }

                    //the mappings can be simply a function, or a more complicated object
                    let newCommand = null;
                    if (typeof this.eventKeyMappings[event.id] === "function") {
                        newCommand = Command({
                            queue: this.commandQueue,
                            method: this.eventKeyMappings[event.id],
                            context: this,
                            type: 'key',
                            target: event.target,
                            targetType: event.targetType,
                            state: eventState,
                            unit: this,
                        });
                    } else //we have a more complex object
                    {
                        newCommand = Command({
                            queue: this.commandQueue,
                            context: this,
                            type: 'key',
                            target: event.target,
                            targetType: event.targetType,
                            state: eventState,
                            unit: this,
                        });

                        $.extend(newCommand, this.eventKeyMappings[event.id]);
                    }

                    if (keyStates.Shift) {
                        this.commandQueue.enqueue(newCommand);
                    } else {
                        this.commandQueue.clear();
                        this.commandQueue.enqueue(newCommand);
                    }
                }
            }
        };

        var handleEvent = function(event) {
            if (this == event.unit)
                this.handleEvent(event);
        }.bind(this);

        Matter.Events.on(globals.currentGame.unitSystem, 'unitSystemEventDispatch', handleEvent);

        Matter.Events.on(this, "onremove", function() {
            this.unitRemoved = true;
            Matter.Events.off(globals.currentGame.unitSystem, 'unitSystemEventDispatch', handleEvent);
            if (!this.itemsEnabled) return;
            $.each(this.getCompleteSetOfItemObjects(), function(i, item) {
                if (item) {
                    globals.currentGame.removeItem(item);
                }
            });
        }.bind(this));

        Matter.Events.on(this, "consume", function(event) {
            var item = event.item;
            this.unequipItem(item);

            if (this.consumeSound) {
                this.consumeSound.play();
            }
            if (this.portrait) {
                graphicsUtils.graduallyTint(this.portrait, 0xFFFFFF, 0x4ecc1a, 100, null, false, 3);
            }
        }.bind(this));

        Matter.Events.on(this, "attackPassiveCharged", function() {
            unitUtils.showExpandingCircleAnimation({unit: this, tint: 0xff3333, play: true});
        }.bind(this));

        Matter.Events.on(this, "defensePassiveCharged", function() {
            unitUtils.showExpandingCircleAnimation({unit: this, tint: 0x479cff, play: true});
        }.bind(this));

        var resetPassiveOrder = function() {
            this.passiveOrder = 0;
        }.bind(this);
        Matter.Events.on(globals.currentGame, "VictoryDefeatSceneFadeIn MultiLevelCampComplete", resetPassiveOrder);
        gameUtils.deathPact(this, () => {
            Matter.Events.off(globals.currentGame, "VictoryDefeatSceneFadeIn MultiLevelCampComplete", resetPassiveOrder);
        });

        Matter.Events.on(this, "changeHoldPosition", function(event) {
            if(this.holdPositionMarker) {
                graphicsUtils.removeSomethingFromRenderer(this.holdPositionMarker);
            }
            if(!event.newValue) {
                return;
            }

            this.holdPositionMarker = graphicsUtils.addSomethingToRenderer('HoldPositionRook', {
                where: 'stageOne',
                rotate: 'none',
                position: mathArrayUtils.roundPositionToWholeNumbers(mathArrayUtils.clonePosition(this.position)),
                scale: {x: 1.0, y: 1.0},
                alpha: 1.0,
                tint: 0xb8b8b8
            });

            graphicsUtils.fadeSpriteOverTimeLegacy(this.holdPositionMarker, 250, true);
            var timer1 = gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.addGleamToSprite({
                    sprite: this.holdPositionMarker,
                    duration: 800,
                    gleamWidth: 20,
                    power: 0.5,
                    red: 1000.0
                });
            }, 250);
            var timer2 = gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTimeLegacy(this.holdPositionMarker, 250, false);
            }, 1750);

            // graphicsUtils.graduallyTint(this.holdPositionMarker, 0x393939, 0xffffff, 1000, null, null, 1);

            Matter.Events.on(this.holdPositionMarker, 'destroy', () => {
                timer1.invalidate();
                timer2.invalidate();
            });

        }.bind(this));


        //hover Method
        this.hover = function() {
            if (this.team == globals.currentGame.enemyTeam) {
                if (this.tintMe) {
                    this.tintMe(this.enemyTint);
                }
                this.isoManagedTint = this.enemyTint;
            } else if (this.team == globals.currentGame.neutralTeam) {
                if (this.tintMe) {
                    this.tintMe(this.neutralTint);
                }
                this.isoManagedTint = this.neutralTint;
            } else {
                if (this.tintMe) {
                    this.tintMe(this.friendlyTint);
                }
                this.isoManagedTint = this.friendlyTint;
            }

        };

        this.unhover = function(event) {
            this.isoManagedTint = 0xFFFFFF;
            if (this.untintMe) {
                this.untintMe();
            }
        };

        this.showLifeBar = function(value) {
            if (this.hideLifeBar) return;
            if (value !== false)
                value = true;
            if (this.renderlings.healthbarbackground) {
                this.renderlings.healthbarbackground.visible = value;
                this.renderlings.healthbar.visible = value;
                this.renderlings.healthbarfade.visible = value;
                this.healthFadeBars.forEach(function(bar) {
                    bar.visible = value;
                });
            }
            this.showingLifeBars = value;
        };

        var fadeDuration = 375;
        var sortYLifeCounter = 500;
        var startingFadeColor = 0x0557d1;
        var alternateStartingFadeColor = 0x0557d1;
        this.fadeLifeAmount = function(startingAmount, fadeIn, done) {
            var givingLife = fadeIn;

            //if fading in, we need a new bar
            if (givingLife) {
                if (this.renderlings.healthbarfade) {
                    // this.renderlings.healthbarfade.alpha = 0.0;
                }
                if (this.healthFadeBars.length == 0) {
                    sortYLifeCounter = 500;
                }
                var newBar = graphicsUtils.addSomethingToRenderer('TintableSquare', {
                    scale: {
                        x: barScaleX,
                        y: barScaleY
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    where: 'foreground',
                    rotate: 'none',
                    avoidIsoMgr: true,
                    tint: startingFadeColor,
                    sortYOffset: --sortYLifeCounter,
                    visible: this.showingLifeBars
                });
                gameUtils.attachSomethingToBody({
                    something: newBar,
                    body: this.body,
                    offset: this.renderlings.healthbar.offset
                });
                let percentage = startingAmount / this.maxHealth;
                newBar.scale = {
                    x: barScaleX * percentage,
                    y: barScaleY
                };

                var originalDone = done;
                done = function() {
                    originalDone();
                    graphicsUtils.removeSomethingFromRenderer(newBar);
                    mathArrayUtils.removeObjectFromArray(newBar, this.healthFadeBars);
                }.bind(this);
                this.healthFadeBars.push(newBar);
                gameUtils.deathPact(this, newBar);

                var color = startingFadeColor;
                if (this.currentHealth / this.maxHealth >= 0.6) {
                    color = alternateStartingFadeColor;
                }
                graphicsUtils.graduallyTint(newBar, color, this._getHealthBarTint(this.currentHealth), fadeDuration, null, null, 0.5, done);

                //also begin tinting existing healthbar
                if (this.healthBarGainTintTimer) {
                    this.healthBarGainTintTimer.invalidate();
                }
                this.healthBarGainTintTimer = graphicsUtils.graduallyTint(this.renderlings.healthbar, this.renderlings.healthbar.tint, this._getHealthBarTint(this.currentHealth), fadeDuration, null, null, 0.5);
            } else {
                //empty gaining bars
                this.healthFadeBars.forEach(function(bar) {
                    graphicsUtils.removeSomethingFromRenderer(bar);
                });

                this.healthFadeBars = [];
                this.renderlings.healthbarfade.alpha = 1.0;

                if (this.renderlings.healthbarbackground) {
                    if (this.healthLossBarFadeTimer) {
                        this.healthLossBarFadeTimer.invalidate();
                    }

                    var percentage = startingAmount / this.maxHealth;
                    if (this.renderlings.healthbarfade) {
                        this.renderlings.healthbarfade.scale = {
                            x: barScaleX * percentage,
                            y: barScaleY
                        };
                    }
                    this.healthLossBarFadeTimer = graphicsUtils.fadeSpriteOverTimeLegacy(this.renderlings.healthbarfade, fadeDuration, fadeIn, done, true);
                }
            }
        };

        var sortYEnergyCounter = 500;
        this.fadeEnergyAmount = function(startingAmount, fadeIn, done) {
            var givingEnergy = fadeIn;

            //if giving energy, make a new bar
            if (givingEnergy) {
                //reset this if we can
                if (this.energyFadeBars.length == 0) {
                    sortYEnergyCounter = 500;
                }
                if (this.renderlings.energybarfade) {
                    // this.renderlings.energybarfade.alpha = 0.0;
                }
                var newBar = graphicsUtils.addSomethingToRenderer('TintableSquare', {
                    scale: {
                        x: barScaleX,
                        y: barScaleY
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    where: 'foreground',
                    rotate: 'none',
                    avoidIsoMgr: true,
                    sortYOffset: --sortYEnergyCounter, //decrement the new bar's sort offset so that new bars appear behind older bars
                    visible: this.showingEnergyBars
                });
                gameUtils.attachSomethingToBody({
                    something: newBar,
                    body: this.body,
                    offset: this.renderlings.energybar.offset
                });
                let percentage = startingAmount / this.maxEnergy;
                newBar.scale = {
                    x: barScaleX * percentage,
                    y: barScaleY
                };

                var originalDone = done;
                done = function() {
                    originalDone();
                    graphicsUtils.removeSomethingFromRenderer(newBar);
                    mathArrayUtils.removeObjectFromArray(newBar, this.energyFadeBars);
                }.bind(this);
                this.energyFadeBars.push(newBar);
                gameUtils.deathPact(this, newBar);
                // graphicsUtils.fadeSpriteOverTimeLegacy(newBar, fadeDuration, fadeIn, done, true);
                graphicsUtils.graduallyTint(newBar, 0x1fffff, 0xb866f9, fadeDuration, null, null, 0.5, done);
            } else {
                //empty gaining bars
                this.energyFadeBars.forEach(function(bar) {
                    graphicsUtils.removeSomethingFromRenderer(bar);
                });
                this.energyFadeBars = [];

                this.renderlings.energybarfade.alpha = 1.0;
                if (this.renderlings.energybarbackground) {
                    if (this.energyLossBarFadeTimer) {
                        this.energyLossBarFadeTimer.invalidate();
                    }

                    let percentage = startingAmount / this.maxEnergy;
                    if (this.renderlings.energybarfade) {
                        this.renderlings.energybarfade.scale = {
                            x: barScaleX * percentage,
                            y: barScaleY
                        };
                    }
                    this.energyLossBarFadeTimer = graphicsUtils.fadeSpriteOverTimeLegacy(this.renderlings.energybarfade, fadeDuration, fadeIn, done, true);
                }
            }
        };

        this.showEnergyBar = function(value) {
            if (this.hideEnergyBar) return;
            if (value !== false)
                value = true;
            if (this.renderlings.energybarbackground) {
                this.renderlings.energybarbackground.visible = value;
                this.renderlings.energybar.visible = value;
                this.renderlings.energybarfade.visible = value;
                this.energyFadeBars.forEach(function(bar) {
                    bar.visible = value;
                });
            }
            this.showingEnergyBars = value;
        };

        this.updateHealthBar = function(options) {
            options = options || {};
            var amount = options.amount || this.currentHealth;
            var overridePendingUpdates = options.overridePendingUpdates;

            if (overridePendingUpdates) {
                this.healthFadeBars.forEach((bar) => {
                    graphicsUtils.removeSomethingFromRenderer(bar);
                });
                if (this.healthLossBarFadeTimer) {
                    this.healthLossBarFadeTimer.skipToEnd = true;
                }
            }

            var percentage = amount / this.maxHealth;
            if (this.renderlings.healthbar) {
                this.renderlings.healthbar.scale = {
                    x: barScaleX * percentage,
                    y: barScaleY
                };
                //stop any previous gain tinting if desired
                if (!options.preserveGainTintTimer) {
                    if (this.healthBarGainTintTimer) {
                        this.healthBarGainTintTimer.invalidate();
                    }
                    this.renderlings.healthbar.tint = this._getHealthBarTint(amount);
                }
            }
        }.bind(this);

        this._getHealthBarTint = function(amount) {
            var percentage = amount / this.maxHealth;
            var r = 255;
            var g = 255;
            var b = 0;
            var threshold = 0.75;

            if (percentage >= threshold) {
                r = 255 * ((1 - percentage) * (1 / (1 - threshold)));
            } else {
                g = 255 * (percentage * (1 / threshold));
            }

            return graphicsUtils.rgbToHex(r, g, b);
        };

        this.updateEnergyBar = function(options) {
            options = options || {};
            var amount = options.amount || this.currentEnergy;
            var overridePendingUpdates = options.overridePendingUpdates;

            if (overridePendingUpdates) {
                this.energyFadeBars.forEach((bar) => {
                    graphicsUtils.removeSomethingFromRenderer(bar);
                });
                if (this.energyLossBarFadeTimer) {
                    this.energyLossBarFadeTimer.skipToEnd = true;
                }
            }
            var percentage = amount / this.maxEnergy;
            if (this.renderlings.energybar) {
                this.renderlings.energybar.scale = {
                    x: barScaleX * percentage,
                    y: barScaleY
                };
            }
        }.bind(this);

        this.spendEnergy = function(amount) {
            //fade the energy loss
            this.fadeEnergyAmount(this.currentEnergy);
            this.currentEnergy -= amount;

            //update the energy bar
            this.updateEnergyBar();

            //show the energy bar
            this.showEnergyBar(true);

            //set the view timer
            if (!this.energyTimer) {
                this.energyTimer = globals.currentGame.addTimer({
                    name: this.unitId + 'energyTimer',
                    timeLimit: 1000,
                    runs: 1,
                    callback: function() {
                        if (!this.showingBarsWithAlt && !this.barsShowingOverride) {
                            this.showEnergyBar(false);
                        }
                    }.bind(this)
                });
                gameUtils.deathPact(this, this.energyTimer);
            } else {
                this.energyTimer.reset();
            }
        };

        this._isTargetable = this.isTargetable;
        Object.defineProperty(this, 'isTargetable', {
            get: function() {
                return this._isTargetable && gameUtils.isPositionWithinPlayableBounds(this.position);
            },

            set: function(value) {
                this._isTargetable = value;
            },
            configurable: true
        });


        this._canTakeAbilityDamage = this.canTakeAbilityDamage;
        Object.defineProperty(this, 'canTakeAbilityDamage', {
            get: function() {
                return this._canTakeAbilityDamage && gameUtils.isPositionWithinPlayableBounds(this.position);
            },

            set: function(value) {
                this._canTakeAbilityDamage = value;
            },
            configurable: true
        });

        //after we've been added
        Matter.Events.on(this, 'addUnit', function() {
            var healthBarYOffset = -20;
            var energyBarYOffset = -12;
            if(!this.energy) {
                healthBarYOffset = energyBarYOffset;
            }

            //start unit as idling upon add - do we need this
            if (this.stop) {
                this.stop(null, {basicStop: true});
            }

            if (this._afterAddInit) {
                this._afterAddInit();
            }

            //establish the height of the unit
            if(this.manualUnitHeight) {
                this.unitHeight = this.manualUnitHeight;
            }
            else if(this.heightAnimation) {
                this.unitHeight = this.renderlings[this.heightAnimation].height;
            }
            else {
                this.unitHeight = this.body.circleRadius * 2;
            }

            //play the pending animation
            mathArrayUtils.operateOnObjectByKey(this.renderlings, function(key, value) {
                if(value.isPendingAnimation) {
                    value.play();
                }
            });

            //create health bar
            if (this.health) {
                this.renderChildren.push({
                    id: 'healthbarbackground',
                    data: 'TintableSquare',
                    scale: {
                        x: backgroundScaleX,
                        y: backgroundScaleY
                    },
                    offset: {
                        x: -backgroundScaleX / 2,
                        y: -this.unitHeight / 2 + healthBarYOffset
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    stage: 'foreground',
                    rotate: 'none',
                    tint: 0x000000,
                    avoidIsoMgr: true,
                    visible: false,
                    sortYOffset: 250,
                }, {
                    id: 'healthbarfade',
                    data: 'TintableSquare',
                    scale: {
                        x: barScaleX,
                        y: barScaleY
                    },
                    offset: {
                        x: (-backgroundScaleX / 2) + ((backgroundScaleX - barScaleX) / 2.0),
                        y: -this.unitHeight / 2 + healthBarYOffset
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    stage: 'foreground',
                    rotate: 'none',
                    avoidIsoMgr: true,
                    tint: 0xff0017,
                    alpha: 0.0,
                    visible: false,
                    sortYOffset: 400,
                }, {
                    id: 'healthbar',
                    data: 'TintableSquare',
                    scale: {
                        x: barScaleX,
                        y: barScaleY
                    },
                    offset: {
                        x: (-backgroundScaleX / 2) + ((backgroundScaleX - barScaleX) / 2.0),
                        y: -this.unitHeight / 2 + healthBarYOffset
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    stage: 'foreground',
                    rotate: 'none',
                    avoidIsoMgr: true,
                    tint: 0x00FF00,
                    visible: false,
                    sortYOffset: 750,
                });
            }

            //create energy bar
            if (this.energy) {
                this.renderChildren.push({
                    id: 'energybarbackground',
                    data: 'TintableSquare',
                    scale: {
                        x: backgroundScaleX,
                        y: backgroundScaleY
                    },
                    offset: {
                        x: -backgroundScaleX / 2,
                        y: -this.unitHeight / 2 + energyBarYOffset
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    stage: 'foreground',
                    rotate: 'none',
                    tint: 0x000000,
                    avoidIsoMgr: true,
                    visible: false,
                    sortYOffset: 250
                }, {
                    id: 'energybarfade',
                    data: 'TintableSquare',
                    scale: {
                        x: barScaleX,
                        y: barScaleY
                    },
                    offset: {
                        x: (-backgroundScaleX / 2) + ((backgroundScaleX - barScaleX) / 2.0),
                        y: -this.unitHeight / 2 + energyBarYOffset
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    stage: 'foreground',
                    rotate: 'none',
                    avoidIsoMgr: true,
                    tint: 0xff366c,
                    alpha: 0.0,
                    visible: false,
                    sortYOffset: 400
                }, {
                    id: 'energybar',
                    data: 'TintableSquare',
                    scale: {
                        x: barScaleX,
                        y: barScaleY
                    },
                    offset: {
                        x: (-backgroundScaleX / 2) + ((backgroundScaleX - barScaleX) / 2.0),
                        y: -this.unitHeight / 2 + energyBarYOffset
                    },
                    anchor: {
                        x: 0,
                        y: 0.5
                    },
                    stage: 'foreground',
                    rotate: 'none',
                    avoidIsoMgr: true,
                    tint: 0xb866f9,
                    visible: false,
                    sortYOffset: 750
                });
            }

            //immediately realize the new render children
            globals.currentGame.renderer.realizeBody(this.body);

            // setup health and energy
            if (this.health) {
                this.maxHealth = this.health;
            }

            if (this.energy) {
                this.maxEnergy = this.energy;
            }
        }.bind(this));

        //kill handler (disabled for now)
        if (false) {
            Matter.Events.on(this, 'kill', function(event) {
                if (!this.isDead) {
                    this.giveExperience(event.killedUnit.experienceWorth || 0);
                }
            }.bind(this));
        }

        //grit handling
        this.gritHandler = globals.currentGame.addTickCallback(function() {
            var gritSum = this.getTotalGrit();
            if (this.currentHealth < gritSum / 100 * this.maxHealth) {
                this.gritMult = 2;
            } else {
                this.gritMult = 1;
            }
        }.bind(this));
        gameUtils.deathPact(this, this.gritHandler);

        var self = this;
        var gritHigh = 16;
        var gritLow = 5;
        this.gritDodgeTimer = globals.currentGame.addTimer({
            name: 'gritDodgeTimer' + this.unitId,
            runs: 1,
            timeLimit: this.gritCooldown * 1000,
            pauseCondition: function() {
                return self.isDead || !globals.currentGame.levelInPlay || self.hasGritDodge;
            },
            callback: function() {
                if (this.timerActive && self.getTotalGrit() > 0.0) {
                    self.giveGritDodge(true);
                }
            },
            tickMonitor: function() {
                if (self.getTotalGrit() > 0.0) {
                    self.gritCooldown = (gritHigh - ((self.getTotalGrit() / 100.0) * (gritHigh - gritLow)));
                    self.gritCooldown = self.gritCooldown.toFixed(2);
                    this.timeLimit = self.gritCooldown * 1000;
                    if (!this.timerActive) {
                        this.timerActive = true;
                        this.reset();
                    }
                } else {
                    self.giveGritDodge(false);
                    this.timerActive = false;
                }
            }
        });
        gameUtils.deathPact(this, this.gritDodgeTimer);

        //regen energy
        this.energyRegen = globals.currentGame.addTimer({
            name: 'energyRegen' + this.unitId,
            gogogo: true,
            timeLimit: 500,
            callback: function() {
                if (this.ignoreEnergyRegeneration) return;
                if (this.currentEnergy < this.maxEnergy && this.energyRegenerationRate) {
                    let energyGained = this.giveEnergy(this.getTotalEnergyRegeneration() / 2.0, null, {
                        invisible: true
                    });

                    if(!energyGained) {
                        return;
                    }

                    Matter.Events.trigger(globals.currentGame, 'energyRegen', {performingUnit: this, value: energyGained});
                }
            }.bind(this)
        });
        gameUtils.deathPact(this, this.energyRegen);

        //regen health
        this.healthRegen = globals.currentGame.addTimer({
            name: 'healthRegen' + this.unitId,
            gogogo: true,
            timeLimit: 500,
            callback: function() {
                if (this.ignoreHealthRegeneration) return;
                if (this.currentHealth < this.maxHealth && this.healthRegenerationRate) {
                    var healthAddition = this.getTotalHealthRegeneration() / 2.0;
                    let healthGained = this.giveHealth(healthAddition, null, {
                        invisible: true
                    });

                    if(!healthGained) {
                        return;
                    }

                    let normalHealGain = healthAddition / this.gritMult;
                    let gritGain = Math.max(0, healthGained - normalHealGain);

                    Matter.Events.trigger(globals.currentGame, 'hpRegen', {performingUnit: this, value: healthGained});
                    Matter.Events.trigger(globals.currentGame, 'gritHPRegen', {performingUnit: this, value: gritGain});
                }
            }.bind(this)
        });
        gameUtils.deathPact(this, this.healthRegen);

        if (this._init) {
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
        if (this.mainRenderSprite) {
            if ($.isArray(this.mainRenderSprite)) {
                $.each(this.mainRenderSprite, function(i, spriteId) {
                    $.each(this.renderlings, function(id, child) {
                        if (id == spriteId) {
                            if (!child.filters) {
                                child.filters = filter;
                            } else {
                                (child.filters.push(filter));
                            }

                            if (filterArea) {
                                child.filterArea = filterArea;
                            }
                        }
                    }.bind(this));
                }.bind(this));
            } else {
                $.each(this.renderlings, function(id, child) {
                    if (id == this.mainRenderSprite) {
                        if (!child.filters) {
                            child.filters = filter;
                        } else {
                            (child.filters.push(filter));
                        }

                        if (filterArea) {
                            child.filterArea = filterArea;
                        }
                    }
                }.bind(this));
            }
        }
    },

    levelUp: function() {
        this.level++;
        this.lastLevelExp = this.nextLevelExp;
        this.nextLevelExp *= 2.25;

        var levelUpAnimation = gameUtils.getAnimation({
            spritesheetName: 'BaseUnitAnimations1',
            animationName: 'levelup',
            speed: 2.5,
            transform: [this.position.x, this.position.y, 0.8, 1]
        });
        levelUpAnimation.play();
        graphicsUtils.addSomethingToRenderer(levelUpAnimation, 'stageOne');
        gameUtils.attachSomethingToBody({
            something: levelUpAnimation,
            body: this.body
        });
        levelUpSound.play();
        this.setHealth(this.maxHealth);
        this.setEnergy(this.maxEnergy);
        this.expendableSkillPoints += 2;

        Matter.Events.trigger(this, 'levelup', {
            unit: this
        });
    },

    giveExperience: function(exp) {
        this.currentExperience += exp;
        if (this.currentExperience >= this.nextLevelExp) {
            this.levelUp();
        }
    },

    //This returns a representation of the unit's current visible item-set, including visible empty slots
    getAllItems: function(options) {
        options = options || {};
        var items = this.currentItems.concat(this.currentBackpack).concat(this.currentSpecialtyItems);

        if(options.namesOnly) {
            items = items.map(item => {
                return item.spacelessName;
            });
        }

        return items;
    },

    //This returns all item objects a unit possesses, including hidden empty slots
    getCompleteSetOfItemObjects: function() {
        var completeSet = this.currentItems.concat(this.currentBackpack).concat(this.currentSpecialtyItems).filter(item => {
            return !item.isEmptySlot;
        });

        return completeSet.concat(this.emptySlots);
    },

    applyDefenseBuff: function(options) {
        options = options || {};
        let duration = options.duration;
        let amount = options.amount;
        let callback = options.callback;
        let id = options.id || "DefenseBuff" + mathArrayUtils.getId();

        var unit = this;
        unit.applyBuff({
            id: id,
            textureName: 'DefensiveBuff',
            duration: duration,
            applyChanges: function() {
                unit.addDefenseAddition(amount);
            },
            removeChanges: function() {
                if(callback) {
                    callback();
                }
                unit.removeDefenseAddition(amount);
            }
        });

        Matter.Events.trigger(this, 'applyDefenseBuff', {
            targetUnit: this,
            id: id
        });
    },

    enrage: function(options) {
        options = options || {};
        let duration = options.duration;
        let amount = options.amount;
        let id = options.id || "EnrageBuff" + mathArrayUtils.getId();
        var unit = this;

        if(unit.damageAdditionType) {
            unit.applyBuff({
                id: id,
                textureName: 'EnrageBuff',
                duration: duration,
                applyChanges: function() {
                    unit.enrageCounter++;
                    unit.addAddition(unit.damageAdditionType, amount);
                },
                removeChanges: function() {
                    unit.enrageCounter--;
                    unit.removeAddition(unit.damageAdditionType, amount);
                }
            });
        } else {
            unit.applyBuff({
                id: id,
                textureName: 'EnrageBuff',
                duration: duration,
                applyChanges: function() {
                    unit.enrageCounter++;
                    unit.addDamageAddition(amount);
                },
                removeChanges: function() {
                    unit.enrageCounter--;
                    unit.removeDamageAddition(amount);
                }
            });
        }


        Matter.Events.trigger(this, 'applyEnrageBuff', {
            targetUnit: this,
            id: id
        });
    },

    berserk: function(options) {
        options = options || {};
        let duration = options.duration;
        let amount = options.amount;
        let id = options.id || "BerserkBuff" + mathArrayUtils.getId();
        var unit = this;

        unit.applyBuff({
            id: id,
            textureName: 'BerserkBuff',
            duration: duration,
            applyChanges: function() {
                unit.cooldownMultiplier /= amount;
            },
            removeChanges: function() {
                unit.cooldownMultiplier *= amount;
            }
        });

        Matter.Events.trigger(this, 'applyBerserkBuff', {
            targetUnit: this,
            id: id
        });
    },

    applyDodgeBuff: function(options) {
        options = options || {};
        let duration = options.duration;
        let amount = options.amount;
        let callback = options.callback;
        let id = options.id || "DodgeBuff" + mathArrayUtils.getId();

        var unit = this;
        unit.applyBuff({
            id: id,
            textureName: 'DodgeBuff',
            duration: duration,
            applyChanges: function() {
                unit.addDodgeAddition(amount);
            },
            removeChanges: function() {
                if(callback) {
                    callback();
                }
                unit.removeDodgeAddition(amount);
            }
        });

        Matter.Events.trigger(this, 'applyDodgeBuff', {
            targetUnit: this,
            id: id
        });
    },

    applyRangeBuff: function(options) {
        options = options || {};
        let duration = options.duration;
        let amount = options.amount;
        let id = options.id || "RangeBuff" + mathArrayUtils.getId();
        var unit = this;

        unit.applyBuff({
            id: id,
            textureName: 'RangeBuff',
            duration: duration,
            applyChanges: function() {
                unit.honeRange += amount;
                unit.range += amount;
            },
            removeChanges: function() {
                unit.honeRange -= amount;
                unit.range -= amount;
            }
        });
    },

    applySpeedBuff: function(options) {
        options = options || {};
        let duration = options.duration;
        let amount = options.amount;
        let id = options.id || "SpeedBuff" + mathArrayUtils.getId();
        var unit = this;

        this.applyBuff({
            id: id,
            textureName: 'SpeedBuff',
            duration: duration,
            applyChanges: function() {
                unit.moveSpeed += amount;
            },
            removeChanges: function() {
                unit.moveSpeed -= amount;
            }
        });

        Matter.Events.trigger(this, 'applySpeedBuff', {
            targetUnit: this,
            id: id
        });
    },

    applyEnergyGem: function(options) {
        options = options || {};
        var duration = options.duration;
        var self = this;

        this.applyBuff({
            id: options.id || "energyGem" + mathArrayUtils.getId(),
            unit: this,
            textureName: 'SpiritualStateEnergyGainBuff',
            duration: duration || 2000,
            applyChanges: function() {
                self.energyRegenerationMultiplier *= 2;
            },
            removeChanges: function() {
                self.energyRegenerationMultiplier /= 2;
            }
        });
    },

    applyHealthGem: function(options) {
        options = options || {};
        var duration = options.duration;
        var self = this;

        this.applyBuff({
            id: options.id || "healthGem" + mathArrayUtils.getId(),
            unit: this,
            textureName: 'WickedWaysHealingBuff',
            duration: duration || 2000,
            applyChanges: function() {
                self.healthRegenerationMultiplier *= 2;
            },
            removeChanges: function() {
                self.healthRegenerationMultiplier /= 2;
            }
        });
    },

    petrify: function(options) {
        options = options || {};
        let duration = options.duration;
        let petrifyingUnit = options.petrifyingUnit;
        var unit = this;

        if (unit.isDead || !unit.isMoveable) {
            return;
        }

        var buffName = 'petrify';
        var shakeTimer = null;
        this.applyBuff({
            id: buffName,
            unit: this,
            textureName: 'PetrifyBuff',
            playSound: false,
            duration: duration || 2000,
            applyChanges: function() {
                unit.stop(null, {
                    peaceful: true
                });
                unit.canMove = false;
                unit.canAttack = false;
                unit.isPetrified += 1;
                unit.isTargetable = false;
                unit.isoManagedAlpha = 0.6;
                unit.idleCancel = true;
                unit.abilityDamageMultiplier *= 2;
                unit.setSleep(true, 'petrifySleeperLock');
                if (this.petrifyTintTimer) {
                    globals.currentGame.invalidateTimer(unit.petrifyTintTimer);
                }
                unit.petrifyTintTimer = graphicsUtils.graduallyTint(unit, 0x008265, 0xFFFFFF, duration, 'isoManagedTint');
                shakeTimer = graphicsUtils.shakeSprite(unit.isoManager.visibleIsoSprite.spine, 400);
                gameUtils.deathPact(unit, shakeTimer);
                petrifySound.play();
            },
            removeChanges: function(context) {
                unit.setSleep(false, 'petrifySleeperLock');
                unit.stop();
                unit.canMove = true;
                unit.canAttack = true;
                unit.isPetrified -= 1;
                unit.isTargetable = true;
                unit.idleCancel = false;
                unit.abilityDamageMultiplier /= 2;
                gameUtils.undeathPact(unit, shakeTimer);
                globals.currentGame.invalidateTimer(unit.petrifyTintTimer);
                unit.isoManagedTint = null;
                unit.isoManagedAlpha = null;
            }
        });
        Matter.Events.trigger(petrifyingUnit, 'petrify', {
            petrifiedUnit: unit,
            petrifyingUnit: petrifyingUnit
        });
    },

    maim: function(options) {
        var duration = options.duration;
        var maimingUnit = options.maimingUnit;
        if (this.isDead) {
            return;
        }
        var movePenalty = 1.5;
        var defensePenalty = -2000;

        var unit = this;
        var buffName = 'maim';
        maimSound.play();
        this.applyBuff({
            id: buffName,
            unit: this,
            textureName: 'MaimBuff',
            playSound: false,
            duration: duration || 2000,
            applyChanges: function() {
                unit.moveSpeed -= movePenalty;
                unit.addDefenseAddition(defensePenalty);
            },
            removeChanges: function() {
                unit.moveSpeed += movePenalty;
                unit.removeDefenseAddition(defensePenalty);
            }
        });

        if(maimingUnit) {
            Matter.Events.trigger(maimingUnit, 'maim', {
                maimedUnit: unit,
                maimingUnit: maimingUnit
            });
        }
    },

    stun: function(options) {
        var duration = options.duration;
        var stunningUnit = options.stunningUnit;
        if (this.isDead || !this.isMoveable || !this.stunnable) {
            return;
        }

        var unit = this;
        var buffName = 'stun';
        this.applyBuff({
            id: buffName,
            unit: this,
            textureName: 'StunBuff',
            playSound: false,
            duration: duration || 2000,
            applyChanges: function() {
                unit.stop(null, {
                    peaceful: true
                });
                unit.canMove = false;
                unit.canAttack = false;
                unit.isStunned += 1;
                unit.isoManagedAlpha = 0.6;
                unit.idleCancel = true;
                unit.setSleep(true, 'stunSleeperLock');

                if (unit.stunTintTimer) {
                    globals.currentGame.invalidateTimer(unit.stunTintTimer);
                }
                unit.stunTintTimer = graphicsUtils.graduallyTint(unit, 0x430050, 0xFFFFFF, duration, 'isoManagedTint');
                stunSound.play();
            },
            removeChanges: function(context) {
                unit.setSleep(false, 'stunSleeperLock');
                unit.stop();
                unit.canMove = true;
                unit.canAttack = true;
                unit.isStunned -= 1;
                unit.idleCancel = false;
                globals.currentGame.invalidateTimer(unit.stunTintTimer);
                unit.isoManagedTint = null;
                unit.isoManagedAlpha = null;
            }
        });

        if(stunningUnit) {
            Matter.Events.trigger(stunningUnit, 'stun', {
                stunnedUnit: unit,
                stunningUnit: stunningUnit
            });
        }
    },

    condemn: function(options) {
        options = options || {};
        let duration = options.duration;
        let condemningUnit = options.condemningUnit;

        var unit = this;
        if (unit.isDead) {
            return;
        }

        var defensePenalty = -1;
        var buffName = 'condemn';
        condemnSound.play();
        var handler;
        this.applyBuff({
            id: buffName,
            unit: this,
            textureName: 'CondemnBuff',
            playSound: false,
            duration: duration || 2000,
            applyChanges: function() {
                this.addDefenseAddition(defensePenalty);
                var condemned = this;
                handler = gameUtils.matterOnce(this, 'death', function() {
                    if (condemningUnit.isDead) {
                        return;
                    }

                    var deathanim = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'crossslash',
                        speed: 0.65,
                        transform: [condemned.position.x, condemned.position.y, 0.3, 0.3]
                    });
                    deathanim.play();
                    graphicsUtils.addSomethingToRenderer(deathanim, 'foreground');

                    //spawn projectile
                    var combospiritAnimation = gameUtils.getAnimation({
                        spritesheetName: 'MedicAnimations2',
                        animationName: 'combospirit',
                        speed: 1.0,
                        loop: true,
                        transform: [condemned.position.x, condemned.position.y, 1.5, 1.5]
                    });
                    combospiritAnimation.tint = 0xdf3453;
                    combospiritAnimation.play();
                    var projectileOptions = {
                        damage: 0,
                        speed: 8.0,
                        displayObject: combospiritAnimation,
                        tracking: true,
                        target: condemningUnit,
                        owningUnit: condemned,
                        impactType: 'collision',
                        collisionFunction: function(otherUnit) {
                            return otherUnit == condemningUnit;
                        },
                        originOffset: 0,

                        autoSend: true,
                        impactFunction: function(target) {
                            var position1 = condemningUnit.position;
                            var offset2 = {
                                x: Math.random() * 40 - 20,
                                y: Math.random() * 40 - 20
                            };
                            var offset3 = {
                                x: Math.random() * 40 - 20,
                                y: Math.random() * 40 - 20
                            };
                            var condemnNote1 = graphicsUtils.addSomethingToRenderer("CondemnBuff", {
                                where: 'stageTwo',
                                position: position1,
                                scale: {
                                    x: 0.8,
                                    y: 0.8
                                }
                            });
                            var condemnNote2 = graphicsUtils.addSomethingToRenderer("CondemnBuff", {
                                where: 'stageTwo',
                                position: position1,
                                scale: {
                                    x: 0.8,
                                    y: 0.8
                                }
                            });
                            var condemnNote3 = graphicsUtils.addSomethingToRenderer("CondemnBuff", {
                                where: 'stageTwo',
                                position: position1,
                                scale: {
                                    x: 0.8,
                                    y: 0.8
                                }
                            });
                            gameUtils.attachSomethingToBody({
                                something: condemnNote1,
                                body: condemningUnit.body
                            });
                            gameUtils.attachSomethingToBody({
                                something: condemnNote2,
                                body: condemningUnit.body,
                                offset: offset2
                            });
                            gameUtils.attachSomethingToBody({
                                something: condemnNote3,
                                body: condemningUnit.body,
                                offset: offset3
                            });
                            graphicsUtils.floatSprite(condemnNote1, {
                                runs: 45
                            });
                            graphicsUtils.floatSprite(condemnNote2, {
                                runs: 50
                            });
                            graphicsUtils.floatSprite(condemnNote3, {
                                runs: 65
                            });
                            var healthGained = condemningUnit.giveHealth(condemningUnit.condemnedLifeGain, condemningUnit);
                            if(options.onHealingRecieved) {
                                options.onHealingRecieved({healingReceived: healthGained});
                            }
                            healSound.play();
                            gameUtils.doSomethingAfterDuration(() => {
                                condemnSound2.play();
                            }, 200);
                        }
                    };
                    var projectile = new Projectile(projectileOptions);
                    var dpfunction = function() {
                        projectile.cleanUp();
                    };
                    gameUtils.deathPact(condemningUnit, dpfunction);
                    Matter.Events.on(projectile, 'remove', () => {
                        gameUtils.undeathPact(condemningUnit, dpfunction);
                    });
                });
            },
            removeChanges: function() {
                this.removeDefenseAddition(defensePenalty);
                handler.removeHandler();
            }.bind(this)
        });
        Matter.Events.trigger(condemningUnit, 'condemn', {
            condemnedUnit: unit,
            condemningUnit: condemningUnit
        });
    },

    becomeHidden: function(duration) {
        this.applyBuff({
            id: 'hidden',
            textureName: 'HiddenBuff',
            playSound: true,
            duration: duration || 2000,
            applyChanges: function() {
                this.isTargetable = false;
                this.isoManager.visibleIsoSprite.alpha = 0.4;
                this.isoManagedAlpha = 0.4;
            },
            removeChanges: function() {
                this.isoManagedAlpha = null;
                this.isTargetable = true;
            }.bind(this)
        });
    },

    //simulates a dead unit without moving it or removing it
    nullify: function() {
        this.stop();
        this.showLifeBar(false);
        this.hideLifeBar = true;
        this.isDead = false;
        this.isTargetable = false;
        this.canTakeAbilityDamage = false;
        this.canMove = false;
        this.canAttack = false;
        this.isSelectable = false;
        this.body.collisionFilter.mask = 0;
        currentGame.unitSystem.deselectUnit(this);
    },

    //utility methods for units
    getDefenseAdditionSum: function() {
        var sum = 0;
        this.defenseAdditions.forEach((addition) => {
            sum += addition;
        });
        return Math.max(-this.defense, sum);
    },

    getTotalDefense: function() {
        return this.defense + this.getDefenseAdditionSum();
    },

    getDodgeAdditionSum: function() {
        var sum = 0;
        this.dodgeAdditions.forEach((addition) => {
            sum += addition;
        });
        return Math.max(-this.dodge, sum);
    },

    getTotalDodge: function() {
        return Math.min(this.dodgeMax, this.dodge + this.getDodgeAdditionSum());
    },

    getTotalRawDodge: function() {
        return this.dodge + this.getDodgeAdditionSum();
    },

    getGritAdditionSum: function() {
        var sum = 0;
        this.gritAdditions.forEach((addition) => {
            sum += addition;
        });
        return Math.max(-this.grit, sum);
    },

    getTotalGrit: function() {
        return Math.min(this.gritMax, this.grit + this.getGritAdditionSum());
    },

    giveGritDodge: function(value) {
        if (value) {
            var gritBlockIndicator = graphicsUtils.addSomethingToRenderer('GritBuff', {
                where: 'stageOne',
                scale: {
                    x: 1.1,
                    y: 1.1
                }
            });
            // graphicsUtils.addGleamToSprite({sprite: gritBlockIndicator, duration: 650, gleamWidth: 10});
            graphicsUtils.fadeSpriteOverTimeLegacy(gritBlockIndicator, 250, true);
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.addGleamToSprite({
                    sprite: gritBlockIndicator,
                    duration: 750,
                    gleamWidth: 20
                });
            }, 250);
            gainKillingBlow.play();
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTimeLegacy(gritBlockIndicator, 250, false);
            }, 850);
            gameUtils.attachSomethingToBody({
                something: gritBlockIndicator,
                runImmediately: true,
                body: this.body,
                somethingId: 'gritBlockIndicator'
            });
        }
        this.hasGritDodge = value;
    },

    getDamageAdditionSum: function() {
        var sum = 0;
        this.damageAdditions.forEach((addition) => {
            sum += addition;
        });

        var baseDamageAmount = this.damage;
        if (this.damageMember && this.damageMember instanceof Function) {
            baseDamageAmount = this.damageMember();
        }
        return Math.max(-baseDamageAmount, sum);
    },

    addAddition: function(type, amount) {
        if (!this.additions[type]) {
            this.additions[type] = [];
        }
        this.additions[type].push(amount);
    },

    getAdditions: function(type) {
        return this.additions[type] || [];
    },

    getAdditionSum: function(type) {
        if (!this.additions[type]) return 0;

        var sum = 0;
        this.additions[type].forEach((addition) => {
            sum += addition;
        });
        return sum;
    },

    removeAddition: function(type, amount) {
        mathArrayUtils.removeObjectFromArray(amount, this.additions[type]);
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
        if(this.isDead) {
            return;
        }

        options = Object.assign({
            playSound: true
        }, options);

        var id = options.id;
        var unit = this;
        var textureName = options.textureName;
        var scale = options.scale || {
            x: 1,
            y: 1
        };
        var originalyOffset = -this.buffYOffset || -65;
        var playSound = options.playSound;
        var buffDuration = options.duration;

        var buffAlreadyExists = false;
        if (unit.buffs[id]) {
            buffAlreadyExists = true;
        }
        if (!buffAlreadyExists) {
            var buffObj = {
                removeBuffImage: function(options) {
                    unit.buffs[id].dobj.removeGleam();
                    gameUtils.detachSomethingFromBody(unit.buffs[id].dobj);
                    graphicsUtils.removeSomethingFromRenderer(unit.buffs[id].dobj);
                    mathArrayUtils.removeObjectFromArray(unit.buffs[id], unit.orderedBuffs);
                    var debuffAnim = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations2',
                        animationName: 'buffdestroy',
                        speed: 4,
                        transform: [unit.position.x + unit.buffs[id].offset.x, unit.position.y + unit.buffs[id].offset.y, 0.8, 0.8],
                        onCompleteExtension: function() {
                            unit.reorderBuffs();
                        }
                    });

                    graphicsUtils.addSomethingToRenderer(debuffAnim, 'stageTwo');
                    if (!options.detached) {
                        gameUtils.attachSomethingToBody({
                            something: debuffAnim,
                            body: unit.body,
                            offset: unit.buffs[id].offset,
                            deathPactSomething: true
                        });
                    }
                    debuffAnim.play();
                    gameUtils.doSomethingAfterDuration(unit.reorderBuffs, 200);
                    unit.buffs[id] = null;
                    delete unit.buffs[id];
                },
                id: id
            };

            if (!textureName) {
                textureName = 'TransparentSquare';
            }
            var dobj = graphicsUtils.addSomethingToRenderer(textureName, {
                tint: options.tint || 0xFFFFFF,
                where: 'stageTwo',
                scale: {
                    x: scale.x,
                    y: scale.y
                }
            });
            gameUtils.attachSomethingToBody({
                something: dobj,
                body: unit.body,
                offset: {
                    x: 0,
                    y: originalyOffset
                },
                deathPactSomething: true
            });
            buffObj.dobj = dobj;
            unit.buffs[id] = buffObj;
            unit.orderedBuffs.push(buffObj);
        }

        //reorder buffs (could be multiple images to show, let's lay them out nicely, rows of three)
        if (!unit.reorderBuffs) {
            var b1 = null;
            var b2 = null;
            var xSpacing = 32;
            var ySpacing = 32;
            unit.reorderBuffs = function() {
                if (unit.isDead) {
                    return;
                }
                unit.orderedBuffs.forEach((buff, i) => {
                    var attachmentTick = buff.dobj.bodyAttachmentTick;
                    var row = Math.floor(i / 3);
                    var yOffset = row * -ySpacing;
                    var col = i % 3;
                    var xOffset = 0;
                    if (col == 0) {
                        //start of a new row
                        b1 = buff;
                        b2 = null;
                    } else if (col == 1) {
                        xOffset = xSpacing / 2;
                        b1.dobj.bodyAttachmentTick.offset.x -= xSpacing / 2;
                        b2 = buff;
                    } else if (col == 2) {
                        xOffset = xSpacing;
                        b1.dobj.bodyAttachmentTick.offset.x -= xSpacing / 2;
                        b2.dobj.bodyAttachmentTick.offset.x -= xSpacing / 2;
                    }
                    buff.offset = {
                        x: xOffset,
                        y: originalyOffset + yOffset
                    };
                    attachmentTick.offset = buff.offset;
                });
            };
        }
        unit.reorderBuffs();

        //always play the buff create animation
        var buffAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'buffcreate',
            // reverse: true,
            speed: 1.00,
            transform: [unit.position.x, unit.position.y, 1.1, 1.1]
        });
        graphicsUtils.addSomethingToRenderer(buffAnim, 'stageTwo');
        graphicsUtils.addGleamToSprite({
            sprite: unit.buffs[id].dobj,
            duration: 650,
            gleamWidth: 10
        });
        gameUtils.attachSomethingToBody({
            something: buffAnim,
            body: unit.body,
            offset: unit.buffs[id].offset,
            deathPactSomething: true
        });
        buffAnim.play();

        //play sound
        if (playSound) {
            buffSound.play();
        }

        //if the same buff already exists, destroy previous timers etc
        var realizedBuff = unit.buffs[id];
        if (buffAlreadyExists) {
            realizedBuff.removeBuff({
                preserveImage: true
            });
            realizedBuff.removeBuff = null;
        }

        //apply the buff changes
        options.applyChanges.call(this);

        //setup cleanup of buff
        var eventRemoveHandlers = [];
        var removeAllHandlers = function() {
            eventRemoveHandlers.forEach((handler) => {
                handler();
            });
        };
        var mainCleanUp = function(cleanUpOptions) {
            cleanUpOptions = cleanUpOptions || {};

            //remove image (we'll preserve if it an incoming buff of the same type overrides it)
            if (!cleanUpOptions.preserveImage) {
                realizedBuff.removeBuffImage(cleanUpOptions);
            }

            // Matter.Events.trigger(unit, 'removeBuff', {buff: realizedBuff, continuing: cleanUpOptions.preserveImage});

            //remove associated events
            removeAllHandlers();

            //remove changes
            options.removeChanges();
        };
        if (buffDuration) {
            var timer = gameUtils.doSomethingAfterDuration(mainCleanUp, buffDuration, {
                executeOnNuke: true,
                timerName: this.unitId + id + 'buffRemove'
            });
        }
        if (!realizedBuff.removeBuff) {
            realizedBuff.removeBuff = function(cleanUpOptions) {
                //mainCleanUp
                mainCleanUp(cleanUpOptions);

                //invalidate running timer
                globals.currentGame.invalidateTimer(timer);
            };
        }

        //setup the events we'll be removed by
        var removeEvents = options.removeEvents || [{
                obj: globals.currentGame,
                eventName: 'VictoryDefeatSceneFadeIn'
            },
            {
                obj: this,
                eventName: 'death'
            },
            {
                obj: this,
                eventName: 'onremove'
            }
        ];
        removeEvents.forEach((re) => {
            var ret = gameUtils.matterOnce(re.obj, re.eventName, function() {
                realizedBuff.removeBuff();
            });
            eventRemoveHandlers.push(ret.removeHandler);
        });
    },

    removeBuff: function(buffId) {
        let buff = this.buffs[buffId];
        if(buff) {
            buff.removeBuff();
        }
    }
};

export default UnitBase;
