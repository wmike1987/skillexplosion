define(['jquery', 'matter-js', 'pixi', 'unitcore/_Moveable', 'unitcore/_Attacker', 'unitcore/IsoSpriteManager',
'utils/GameUtils', 'unitcore/UnitBase'],

    function($, Matter, PIXI, Moveable, Attacker, Iso, utils, ub) {

        /*
         *	This function creates a physics body and extends the basic unit functionality, moveable (optional), and attacking (optional) behavior and returns the unit
         *
         * options contains:
         * unit {}
         * moveable {}
         * attacker {}
         */
        function UnitConstructor(options) {

            //mixin the unit options into the unit base
            var newUnit = $.extend(true, {}, ub, options.unit);

            //extrapolate unit ability to key mappings
            newUnit.eventKeyMappings = {};
            newUnit.eventClickMappings = {};
            if(newUnit.abilities) {
                $.each(newUnit.abilities, function(i, ability) {
                    if(ability.type == 'key') {
                        newUnit.eventKeyMappings[ability.key] = ability.method;
                    } else if(ability.type == 'click') {
                        newUnit.eventClickMappings[ability.key] = ability.method;
                    }
                });
            }

            // create body
            var body = Matter.Bodies.circle(0, 0, options.radius, {
                restitution: .95,
                frictionAir: .9,
                mass: options.mass || 5,
                originalMass: options.mass || 5
            });

            body.drawWire = false;

            body.unit = newUnit; //reference to parent
            newUnit.body = body; //reference to body

            //Set infrastructure attributes
            if (options.renderChildren)
                newUnit.renderChildren = options.renderChildren;

            if (options.mainRenderSprite)
                newUnit.mainRenderSprite = options.mainRenderSprite;

            /*
             * We cycle through matter bodies rather than units in many places (PixiRenderer mainly),
             * so let's setup getters on a couple things to reference back to the unit so that we can effectively
             * access these from the body.
             */
            Object.defineProperty(body, 'isSelectable', {
                get: function() {
                    return this.unit.isSelectable;
                }
            });
            Object.defineProperty(body, 'isAttacker', {
                get: function() {
                    return this.unit.isAttacker;
                }
            });
            Object.defineProperty(body, 'isAttackable', {
                get: function() {
                    return this.unit.isAttacker;
                }
            });
            Object.defineProperty(body, 'isMoveable', {
                get: function() {
                    return this.unit.isMoveable;
                }
            });
            Object.defineProperty(body, 'isMoving', {
                get: function() {
                    return this.unit.isMoving;
                }
            });
            Object.defineProperty(body, 'isAttacking', {
                get: function() {
                    return this.unit.isAttacking;
                }
            });
            Object.defineProperty(body, 'isHoning', {
                get: function() {
                    return this.unit.isHoning;
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
            Object.defineProperty(body, 'isSoloMover', {
                set: function(v) {
                    this.unit.isSoloMover = v;
                }
            });
            Object.defineProperty(body, 'team', {
                get: function() {
                    return this.unit.team;
                }
            });
            Object.defineProperty(newUnit, 'position', {
                get: function() {
                    return this.body.position;
                }
            });
            Object.defineProperty(newUnit, 'id', {
                get: function() {
                    return this.body.id;
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

            //initialize any starting behavior
            newUnit.initUnit();

            return newUnit;
        }

        return UnitConstructor;
    }
)
