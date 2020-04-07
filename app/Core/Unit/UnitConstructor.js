define(['jquery', 'matter-js', 'pixi', 'unitcore/_Moveable', 'unitcore/_Attacker', 'unitcore/IsoSpriteManager',
'utils/GameUtils', 'unitcore/UnitBase', 'items/EmptySlot'],

    function($, Matter, PIXI, Moveable, Attacker, Iso, utils, unitBase, EmptySlot) {

        /*
         *  This module aims to assemble all the pieces of a unit. It creates a new object, mixes the specific unit-options with the unitBase, then:
         *	Creates a physics body and extends the basic unit functionality, moveable (optional), and attacking (optional) behavior.
         *  Builds the event click and event key mapping objects from more user-friendly ability and command specs.
         *  Finally, it returns the unit.
         * options contains:
         * unit {}
         * moveable {}
         * attacker {}
         */
        function UnitConstructor(options) {

            var originalUnit = {unitId: utils.uuidv4()};
            if(options.givenUnitObj) {
                options.givenUnitObj.unitId = originalUnit.unitId;
                originalUnit = options.givenUnitObj;
            }

            //mixin the unit options into the unit base
            var newUnit = $.extend(true, originalUnit, unitBase, options.unit);

            //death pact slaves
            if(options.slaves) {
                $.each(options.slaves, function(i, sound) {
                    utils.deathPact(newUnit, sound);
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
                    if(ability.manualHandling) return;
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
                                return enabled;
                            }],
                            //defaults the pre exec interceptor to subtract energy and run any cost function on the ability
                            preExecuteInterceptors: [function() {
                                newUnit.currentEnergy -= (ability.energyCost || 0);
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
                                return enabled;
                            }],
                            preExecuteInterceptors: [function() {
                                newUnit.currentEnergy -= (ability.energyCost || 0);
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

            // create collision body
            var body = Matter.Bodies.circle(0, 0, options.radius, {
                restitution: .95,
                frictionAir: .9,
                mass: options.mass || 5,
                originalMass: options.mass || 5
            });
            // body.drawWire = true;
            body.collisionFilter.mask -= 0x0002;
            body.unit = newUnit; //reference to parent

            // create selection body
            var selectionBody = Matter.Bodies.rectangle(5, 5, options.hitboxWidth || 20, options.hitboxHeight || 20, {
                isSensor: true,
            });
            selectionBody.isSelectionBody = true;
            selectionBody.noWire = true;
            selectionBody.collisionFilter.mask = 0x0002;
            selectionBody.unit = newUnit;
            selectionBody.wwidth = options.hitboxWidth || 20,
            selectionBody.hheight = options.hitboxHeight || 20,
            utils.attachSomethingToBody(selectionBody, body, {x: 0, y: -8});
            utils.deathPact(newUnit, selectionBody);

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
            Object.defineProperty(newUnit, 'isSleeping', {
                get: function() {
                    return this.body.isSleeping;
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
            newUnit.emptyRegularSlots = [];
            for(var i = 0; i < newUnit.currentItems.length; i++) {
                var item = EmptySlot();
                item.icon.tooltipObj.disabled = true;
                item.currentSlot = {location: newUnit.currentItems, index: i, active: true, slotDef: item, type: 'common'}
                newUnit.emptyRegularSlots.push(item);
                newUnit.currentItems[i] = item;
            }

            //start with blank items
            newUnit.emptySpecialtySlots = [];
            for(var i = 0; i < newUnit.currentSpecialtyItems.length; i++) {
                var item = EmptySlot();
                item.icon.tooltipObj.disabled = true;
                item.currentSlot = {location: newUnit.currentSpecialtyItems, index: i, active: true, slotDef: item, type: newUnit.unitType}
                newUnit.emptySpecialtySlots.push(item);
                newUnit.currentSpecialtyItems[i] = item;
            }

            //start with blank items
            newUnit.emptyBackpackSlots = [];
            for(var i = 0; i < newUnit.currentBackpack.length; i++) {
                var item = EmptySlot();
                item.icon.tooltipObj.disabled = true;
                item.currentSlot = {location: newUnit.currentBackpack, index: i, active: false, slotDef: item, type: 'universal'}
                newUnit.emptyBackpackSlots.push(item);
                newUnit.currentBackpack[i] = item;
            }

            //initialize any starting behavior
            newUnit.initUnit();

            return newUnit;
        }

        return UnitConstructor;
    }
)
