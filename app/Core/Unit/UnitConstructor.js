import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Moveable from '@core/Unit/_Moveable.js'
import Attacker from '@core/Unit/_Attacker.js'
import Iso from '@core/Unit/IsoSpriteManager.js'
import UnitBase from '@core/Unit/UnitBase.js'
import EmptySlot from '@core/Unit/EmptySlot.js'

/*
 *  This module aims to assemble all the fundamental pieces of a unit. It creates a new object, mixes the specific unit-options with the UnitBase, then:
 *	Creates a physics body and extends the basic unit functionality, moveable (optional), and attacking (optional) behavior.
 *  Builds the event click and event key mapping objects from more user-friendly ability and command specs.
 *  Finally, it returns the unit.
 *  options contains:
 *  unit {}
 *  moveable {}
 *  attacker {}
 */
function UnitConstructor(options) {

    //use the given object as our base -- "unitObj"
    var unitObj = options.givenUnitObj || {};
    Object.assign(unitObj, {unitId: mathArrayUtils.uuidv4()}) //add in a unit id

    //mixin the unit options into the unit base then into the unit object
    var unitBase = $.extend(true, {}, UnitBase);
    var newUnit = Object.assign(unitObj, unitBase, options.unit);

    //add passives (and probably abilities in the future to slaves)
    if(newUnit.passiveAbilities) {
        options.slaves = options.slaves.concat(newUnit.passiveAbilities);
    }

    if(newUnit.abilities) {
        options.slaves = options.slaves.concat(newUnit.abilities);
    }

    //death pact slaves
    if(options.slaves) {
        $.each(options.slaves, function(i, sound) {
            gameUtils.deathPact(newUnit, sound);
        })
    }

    //add default enabler to abilities
    if(newUnit.abilities) {
        $.each(newUnit.abilities, function(i, ability) {
            ability.enablers = ability.enablers || [];
            ability.enablers.push(function() {
                return (!ability.energyCost || newUnit.currentEnergy >= ability.energyCost);
            })
        }.bind(this))
    }

    //extrapolate unit ability to key mappings
    newUnit.eventKeyMappings = {};
    newUnit.eventClickMappings = {};
    if(newUnit.abilities) {
        $.each(newUnit.abilities, function(i, ability) {
            if(ability.manualDispatch) return;
            if(ability.type == 'key') {
                newUnit.eventKeyMappings[ability.key] = {
                    method: ability.method,
                    predicates: [function() {
                        var enabled = true;
                        if(ability.enablers) {
                            $.each(ability.enablers, function(i, enabler) {
                                enabled = enabler();
                                return enabled;
                            })
                        }
                        if(ability.manuallyEnabled) {
                            return true;
                        }
                        return enabled;
                    }],
                    //defaults the pre exec interceptor to subtract energy and run any cost function on the ability
                    preExecuteInterceptors: [function() {
                        if(!ability.byPassEnergyCost) {
                            newUnit.currentEnergy -= (ability.energyCost || 0);
                        }
                        if(ability.costs) {
                            ability.costs.forEach(cost => {
                                cost();
                            });
                        }
                    }]
                }
                if(ability.predicates) {
                    $.each(ability.predicates, function(i, predicate) {
                        newUnit.eventKeyMappings[ability.key].predicates.push(predicate);
                    })
                }
            } else if(ability.type == 'click') {
                newUnit.eventClickMappings[ability.key] = {
                    method: ability.method,
                    predicates: [function() {
                        var enabled = true;
                        if(ability.enablers) {
                            $.each(ability.enablers, function(i, enabler) {
                                enabled = enabler();
                                return enabled;
                            })
                        }
                        if(ability.manuallyEnabled) {
                            return true;
                        }
                        return enabled;
                    }],
                    preExecuteInterceptors: [function() {
                        if(!ability.byPassEnergyCost) {
                            newUnit.currentEnergy -= (ability.energyCost || 0);
                        }
                        if(ability.costs) {
                            ability.costs.forEach(cost => {
                                cost();
                            });
                        }
                    }]
                }
                if(ability.predicates) {
                    $.each(ability.predicates, function(i, predicate) {
                        newUnit.eventClickMappings[ability.key].predicates.push(predicate);
                    })
                }
            }
        });
    }

    //**********************
    // create collision body
    //**********************
    var body = Matter.Bodies.circle(0, 0, options.radius, {
        restitution: .95,
        frictionAir: .9,
        mass: options.mass || 5,
        originalMass: options.mass || 5
    });
    // body.drawWire = true;
    body.collisionFilter.mask -= 0x0002;
    body.unit = newUnit; //reference to parent

    //**************************************************************
    // create selection body, or use the collision body if specified
    //**************************************************************
    var selectionBody = null;
    if(newUnit.useCollisionBodyAsSelectionBody) {
        selectionBody = Matter.Bodies.circle(0, 0, options.radius, {
            isSensor: true
        });

        selectionBody.rradius = options.radius;
        selectionBody.unit = newUnit; //reference to parent
    } else {
        selectionBody = Matter.Bodies.rectangle(5, 5, newUnit.hitboxWidth || 20, newUnit.hitboxHeight || 20, {
            isSensor: true,
        });
        selectionBody.wwidth = newUnit.hitboxWidth || 20;
        selectionBody.hheight = newUnit.hitboxHeight || 20;
    }

    selectionBody.collisionFilter.mask = 0x0002;
    selectionBody.isSelectionBody = true;
    selectionBody.unit = newUnit;
    selectionBody.noWire = !newUnit.adjustHitbox;
    gameUtils.attachSomethingToBody({something: selectionBody, body: body, offset: {x: 0, y: newUnit.hitboxYOffset != null ? newUnit.hitboxYOffset : -8}});
    gameUtils.deathPact(newUnit, selectionBody);

    //back references
    newUnit.body = body;
    newUnit.selectionBody = selectionBody;

    //Set infrastructure attributes
    if (options.renderChildren)
        newUnit.renderChildren = options.renderChildren;

    if (options.mainRenderSprite)
        newUnit.mainRenderSprite = options.mainRenderSprite;

    /*
     * Convenience getters to access certain properties from the unit's body and vice-versa
     */
    newUnit._defense = newUnit.defense;
    Object.defineProperty(newUnit, 'defense', {
        get: function() {
            return this._defense;
        },
        set: function(value) {
            this._defense = Math.max(0, value);
        }
    });

    Object.defineProperty(newUnit, 'isSleeping', {
        get: function() {
            return this.body.isSleeping;
        },
        set: function(v) {
            this.body.isSleeping = v;
        }
    });
    Object.defineProperty(body, 'renderlings', {
        get: function() {
            return this.unit.renderlings;
        },
        set: function(v) {
            this.unit.renderlings = v
        }
    });
    Object.defineProperty(body, 'renderChildren', {
        get: function() {
            return this.unit.renderChildren;
        }
    });
    Object.defineProperty(body, 'destination', {
        get: function() {
            return this.unit.destination;
        }
    });
    Object.defineProperty(newUnit, 'position', {
        get: function() {
            return this.body.position;
        },
        set: function(value) {
            Matter.Body.setPosition(this.body, value);
        },
        configurable: true
    });
    Object.defineProperty(body, 'visible', {
        get: function() {
            return this.unit.visible;
        }
    });

    // mixin moveable and its given properties
    if (options.moveable) {
        $.extend(newUnit, Moveable);
        $.extend(newUnit, options.moveable);
        Matter.Events.on(newUnit, 'addUnit', function() {
            newUnit.moveableInit();
        })
    }

    // mixin attacker and its given properties
    if (options.attacker) {
        $.extend(newUnit, Attacker);
        $.extend(newUnit, options.attacker);
        Matter.Events.on(newUnit, 'addUnit', function() {
            newUnit.initAttacker();
        })
    }

    // associate an iso manager if desired
    if (newUnit.isoManaged) {
        newUnit.isoManager = new Iso({
            unit: newUnit
        });
    }

    //Fill inventory with empty items which represent empty slots
    if(newUnit.itemsEnabled) {
        newUnit.emptyRegularSlots = [];
        for(var i = 0; i < newUnit.currentItems.length; i++) {
            var item = EmptySlot('Item Slot', 'Holds a regular item.');
            item.currentSlot = {location: newUnit.currentItems, index: i, active: true, slotDef: item, type: 'common'}
            newUnit.emptyRegularSlots.push(item);
            newUnit.currentItems[i] = item;
        }

        //start with blank items
        newUnit.emptySpecialtySlots = [];
        for(var i = 0; i < newUnit.currentSpecialtyItems.length; i++) {
            var item = EmptySlot('Specialty Slot', 'Holds a specialty item.');
            item.currentSlot = {location: newUnit.currentSpecialtyItems, index: i, active: true, slotDef: item, type: newUnit.unitType}
            newUnit.emptySpecialtySlots.push(item);
            newUnit.currentSpecialtyItems[i] = item;
        }

        //start with blank items
        newUnit.emptyBackpackSlots = [];
        for(var i = 0; i < newUnit.currentBackpack.length; i++) {
            var item = EmptySlot('Backpack Slot', 'Holds any item. Item is not active.');
            item.currentSlot = {location: newUnit.currentBackpack, index: i, active: false, slotDef: item, type: 'universal'}
            newUnit.emptyBackpackSlots.push(item);
            newUnit.currentBackpack[i] = item;
        }
    }

    //initialize any starting behavior
    newUnit.initUnit();

    return newUnit;
}

export default UnitConstructor;
