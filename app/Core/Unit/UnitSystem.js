define(['jquery', 'utils/GameUtils', 'matter-js', 'unitcore/UnitPanel', 'unitcore/UnitConfigurationPanel'], function($, utils, Matter, UnitPanel, UnitConfigurationPanel) {

    var unitSystem = function(properties) {

        //Share given properties
        $.extend(this, properties);

        this.initialize = function() {
            //just in case
            if(this.box)
                this.cleanUp();

            //create selection box rectangle
            this.box = Matter.Bodies.rectangle(-50, -50, 1, 1, {isSensor: true, isStatic: false});
            this.box.collisionFilter.category = 0x0002;
            this.box.toggleCollideAndHideNextFrame = function() {
                this.collisionFilter.category = 0x0000;
                utils.executeSomethingNextFrame(function() {
                    this.oneFrameOverrideInterpolation = true;
                    Matter.Body.setPosition(this, {x: -500, y: -1000});
                    this.collisionFilter.category = 0x0002;
                }.bind(this), 1)
            }
            this.box.permaPendingUnit = null;
            this.box.pendingSelections = {};
            this.box.renderChildren = [{id: 'box', data: 'TintableSquare', stage: 'stageOne', alpha: .4}];

            //other unit system variables
            this.selectedUnits = {};
            this.orderedUnits = [];

            //create UnitPanel
            this.unitPanel = new UnitPanel({
                systemRef: this,
                position: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight() - currentGame.worldOptions.unitPanelHeight/2}});
            this.unitPanel.initialize();

            //create UnitConfigurationPanel
            this.unitConfigurationPanel = new UnitConfigurationPanel()
            this.unitConfigurationPanel.initialize();

            //destination marker
            this.box.clickPointSprite = utils.addSomethingToRenderer('MouseXGreen', 'foreground', {x: -50, y: -50});
            this.box.clickPointSprite.scale.x = .25;
            this.box.clickPointSprite.scale.y = .25;

            //move, attack-move markers
            var moveMarkerScale = 1.2;
            var moveMarkerTimeLimit = 275;

            //move marker
            this.box.moveTargetSprite = utils.addSomethingToRenderer('MoveTarget', 'foreground', {x: -50, y: -50});
            this.box.moveTargetSprite.timer = currentGame.addTimer({name: 'moveTargetShrink', runs: 1, timeLimit: moveMarkerTimeLimit,
                tickCallback: function() {
                    this.box.moveTargetSprite.scale = {x: moveMarkerScale-this.box.moveTargetSprite.timer.percentDone*moveMarkerScale, y: moveMarkerScale-this.box.moveTargetSprite.timer.percentDone*moveMarkerScale};
            }.bind(this),
                resetExtension: function() {
                    this.box.moveTargetSprite.position = currentGame.mousePosition;
                    this.box.moveTargetSprite.scale = {x: moveMarkerScale, y: moveMarkerScale};
            }.bind(this)});
            utils.deathPact(this.box, this.box.moveTargetSprite.timer);


            //attack-move marker
            this.box.attackMoveTargetSprite = utils.addSomethingToRenderer('AttackTarget', 'foreground', {x: -50, y: -50});
            this.box.attackMoveTargetSprite.timer = currentGame.addTimer({name: 'attackMoveTargetShrink', runs: 1, timeLimit: moveMarkerTimeLimit,
                tickCallback: function() {
                    this.box.attackMoveTargetSprite.scale = {x: moveMarkerScale-this.box.attackMoveTargetSprite.timer.percentDone*moveMarkerScale, y: moveMarkerScale-this.box.attackMoveTargetSprite.timer.percentDone*moveMarkerScale};
            }.bind(this),
                resetExtension: function() {
                    this.box.attackMoveTargetSprite.position = currentGame.mousePosition;
                    this.box.attackMoveTargetSprite.scale = {x: moveMarkerScale, y: moveMarkerScale};
            }.bind(this)});
            utils.deathPact(this.box, this.box.attackMoveTargetSprite.timer);


            //ability marker
            var abilityMarkerScale = .7;
            var abilityMarkerTimeLimit = 200;
            this.box.abilityTargetSprite = utils.addSomethingToRenderer('AbilityTarget', 'foreground', {x: -50, y: -50});
            this.box.abilityTargetSprite.timer = currentGame.addTimer({name: 'abilityTargetShrink', runs: 1, timeLimit: abilityMarkerTimeLimit,
                tickCallback: function() {
                    this.box.abilityTargetSprite.scale = {x: abilityMarkerScale-this.box.abilityTargetSprite.timer.percentDone*abilityMarkerScale, y: abilityMarkerScale-this.box.abilityTargetSprite.timer.percentDone*abilityMarkerScale};
            }.bind(this),
                resetExtension: function() {
                    this.box.abilityTargetSprite.position = currentGame.mousePosition;
                    this.box.abilityTargetSprite.scale = {x: abilityMarkerScale, y: abilityMarkerScale};
            }.bind(this)});
            utils.deathPact(this.box, this.box.abilityTargetSprite.timer);

            //prevailing-unit visual indicator
            var prevailingTint = 0x86FF1B;
            this.prevailingUnitCircle = utils.addSomethingToRenderer('PrevailingUnitIndicator', 'stageNOne', {x: -50, y: -50, tint: prevailingTint});
            this.prevailingUnitCircle.timer = currentGame.addTimer({
                name: 'prevailingUnitFadeInOut',
                gogogo: true,
                timeLimit: 100,
                callback: function() {
                    if(this.prevailingUnitCircle.alpha <= .5) {
                        this.prevailingUnitCircle.alphaChange = .1;
                    }
                    if(this.prevailingUnitCircle.alpha >= 1) {
                        this.prevailingUnitCircle.alphaChange = -.015;
                    }

                    this.prevailingUnitCircle.alpha += this.prevailingUnitCircle.alphaChange;
                }.bind(this)
            });

            var unitSystem = this;

            Object.defineProperty(this, 'selectedUnit', {
                configurable: true,

                get: function(){
                    return this._selectedUnit;
                },

                set: function(value) {
                    if(!value) {
                        unitSystem.abilityDispatch = null;
                    }

                    if(this._selectedUnit) {
                        utils.detachSomethingFromBody(this.prevailingUnitCircle, this._selectedUnit);
                    }

                    this.prevailingUnitCircle.alpha = 1;

                    var fromUnit = this._selectedUnit || null;
                    this._selectedUnit = value;
                    var body = value ? value.body : null;

                    Matter.Events.trigger(unitSystem, 'prevailingUnitChange', {unit: value, fromUnit: fromUnit});

                    if(body) {
                        this.prevailingUnitCircle.scale = Matter.Vector.mult(body.renderlings.selected.scale, 1.1);
                        utils.attachSomethingToBody(this.prevailingUnitCircle, body, body.renderlings.selected.offset);
                    } else {
                        utils.detachSomethingFromBody(this.prevailingUnitCircle);
                        this.prevailingUnitCircle.position = utils.offScreenPosition();
                    }
                }
            });

            //update selected bodies upon body removal
            this.bodyRemoveCallback = Matter.Events.on(this.engine.world, 'afterRemove', function(event) {
                var removedBody = event.object[0];

                if(removedBody.unit) {
                    this.deselectUnit(removedBody.unit);
                }
            }.bind(this));

            this.manualRemoveCallback = Matter.Events.on(this, 'removeUnitFromSelectionSystem', function(event) {
                var removedUnit = event.unit;
                this.deselectUnit(removedUnit);
            }.bind(this));

            var originalX = 0;
            var originalY = 0;
            var scaleX = 1;
            var scaleY = 1;

            //transfer bodies from pending to selected
            var executeSelection = function() {

                //for convenience
                var pendingBodyCount = Object.keys(this.box.pendingSelections).length;
                var loneSoldier = null;
                if(pendingBodyCount == 1) {
                    loneSoldier = this.box.pendingSelections[(Object.keys(this.box.pendingSelections)[0])];
                }

                //if nothing pending, take no action
                if(pendingBodyCount == 0) {
                    return;
                }

                //group my units and enemy units
                var myUnits = {};
                var myEnemies = {};
                $.each(this.box.pendingSelections, function(key, obj) {
                    if(obj.team == currentGame.playerTeam) {
                        myUnits[key] = obj;
                    } else {
                        myEnemies[key] = obj;
                    }
                })

                //if we have any of our units pending, act upon them and disregard any enemy pending units
                var addingEnemies = false;
                if(Object.keys(myUnits).length > 0) {
                    this.box.pendingSelections = myUnits;
                    if(this.hasEnemySelected()) {
                        this.deselectUnit(this.selectedUnit);
                    }
                } else if(Object.keys(myEnemies).length > 0) {
                    //only allow one enemy unit to be selected
                    var highestPriorityEnemy = this.findHighestPriorityUnit(myEnemies);
                    this.box.pendingSelections = {};
                    this.box.pendingSelections[highestPriorityEnemy.unitId] = highestPriorityEnemy;
                    addingEnemies = true;
                }

                //handle shift functionality
                if(keyStates['Shift']) {
                    //If one, already-selected body is requested here, remove from selection
                    if(loneSoldier && ($.inArray(loneSoldier.unitId.toString(), Object.keys(this.selectedUnits)) > -1)) {
                        this.deselectUnit(loneSoldier);
                    }
                    else {
                        //If we have multiple things pending (from drawing a box) this will override the permaPendingUnit, unless permaPendingUnit was also selected in the box
                        //in which case we'll exclude it from the pending selections
                        if(this.box.permaPendingUnit && pendingBodyCount > 1 && this.box.selectionBoxActive && !this.box.boxContainsPermaPending) {
                            this.changeSelectionState(this.box.permaPendingUnit, 'selectionPending', false);
                            delete this.box.pendingSelections[this.box.permaPendingUnit.unitId]
                        }

                        //Add pending bodies to current selection, unless we have an enemy selected, in which case we'll deselect it
                        if(this.hasEnemySelected()) {
                            this.deselectUnit(this.selectedUnit);
                        } else if(this.hasMyUnitSelected() && addingEnemies) {
                            //else if we have one of our own units and we're adding enemy units, disregard this command
                            return;
                        }
                        $.extend(this.selectedUnits, this.box.pendingSelections)
                        this.updateOrderedUnits(this.selectedUnits);
                    }
                } else {
                    //Else create a brand new selection (don't add to current selection)
                    //If we have multiple things pending (from drawing a box) this will override the permaPendingUnit, unless permaPendingUnit was also selected in the box
                    if(this.box.permaPendingUnit && pendingBodyCount > 1 && this.box.selectionBoxActive && !this.box.boxContainsPermaPending) {
                        this.changeSelectionState(this.box.permaPendingUnit, 'selectionPending', false);
                        delete this.box.pendingSelections[this.box.permaPendingUnit.unitId]
                    }
                    this.changeSelectionState(this.selectedUnits, 'selected', false);
                    this.selectedUnits = $.extend({}, this.box.pendingSelections);
                    this.updateOrderedUnits(this.selectedUnits);
                }

                //if our selectedUnit doesn't exist, or doesn't exist within the new selection, we need to set it to something relevant
                if(!this.selectedUnit || !Object.keys(this.selectedUnits).includes(this.selectedUnit.unitId.toString())) {
                    this.selectedUnit = this.findHighestPriorityUnit(this.selectedUnits);
                }

                //Show group destination of selected
                var groupDestination = 0;
                $.each(this.selectedUnits, function(key, unit) {
                    if(groupDestination == 0) {
                        groupDestination = unit.attackMoveDestination || unit.destination;
                    } else if(unit.destination != groupDestination && unit.attackMoveDestination != groupDestination) {
                        groupDestination = null;
                    }
                });
                if(groupDestination) {
                    this.box.clickPointSprite.position = groupDestination;
                    if(this.rightClickIndicator)
                        this.rightClickIndicator.position = {x: -50, y: -50};
                } else {
                    this.box.clickPointSprite.position = {x: -50, y: -50};
                }

                //Update visuals
                this.changeSelectionState(this.box.pendingSelections, 'selectionPending', false);
                this.changeSelectionState(this.selectedUnits, 'selected', true);

                //Refresh state
                this.box.permaPendingUnit = null;
                this.box.pendingSelections = {};

                //Update selected attribute
                $.each(Matter.Composite.allBodies(this.renderer.engine.world), function(index, body) {
                    if(body.unit)
                        body.unit.isSelected = false;
                })

                $.each(this.selectedUnits, function(key, unit) {
                    unit.isSelected = true;
                })

                Matter.Events.trigger(this, 'executeSelection', {selectedUnits: this.selectedUnits, orderedSelection: this.orderedUnits});
                Matter.Events.trigger(this, 'selectedUnitsChange', {selectedUnits: this.selectedUnits, orderedSelection: this.orderedUnits});

            }.bind(this);

            //Mouse down event
            $('body').on('mousedown.unitSystem', function(event) {
                var canvasPoint = {x: 0, y: 0};
                this.renderer.interaction.mapPositionToPoint(canvasPoint, event.clientX, event.clientY);

                //Left click, used for both establishing a pending body and for attack-moving and dispatching events
                if(event.which == 1) {
                    this.box.mouseDown = true;
                    this.box.originalPoint = canvasPoint;

                    //find bodies under mouse, use the vertice history method if possible
                    var bodies = [];
                    if(currentGame.verticeHistories.length > 0) {
                        $.each(currentGame.verticeHistories, function(index, body) {
                            if(!body.verticeCopy) return;// || !body.isSelectable) return;
                            if(Matter.Vertices.contains(body.verticeCopy, this.box.originalPoint)) {
                                bodies.push(body);
                            }
                        }.bind(this));
                    } else {
                        bodies = Matter.Query.point(Matter.Composite.allBodies(this.renderer.engine.world), this.box.originalPoint);
                    }

                    var units = this.convertBodiesToSelectionEnabledUnits(bodies);

                    //Note: Mouse down should only select the front-most unit
                    //This is a perma body which we'll add to the pending selection, or we're trying to attack a singular target
                    var singleAttackTarget = null;
                    var yOfUnit = 0;
                    var lastChosenUnit = null;
                    $.each(units, function(key, unit) {
                        if(unit.isSelectable && !this.attackMove && !this.abilityDispatch) {
                            if(yOfUnit && yOfUnit >= unit.position.y) {
                                return;
                            }
                            yOfUnit = unit.position.y;

                            if(lastChosenUnit) {
                                delete this.box.pendingSelections[lastChosenUnit.unitId];
                                this.changeSelectionState(lastChosenUnit, 'selectionPending', false);
                            }
                            lastChosenUnit = unit;
                            this.changeSelectionState(unit, 'selectionPending', true);
                            this.box.pendingSelections[unit.unitId] = unit; //needed for a special case when the game starts - no longer need this (i think)
                            this.box.permaPendingUnit = unit;
                        } else if(this.attackMove && unit.isAttackable) {
                            singleAttackTarget = unit;
                        }
                    }.bind(this));

                    //Attacker functionality, dispatch attackMove
                    if(this.attackMove && !this.box.selectionBoxActive) {
                        this.box.invalidateNextMouseUp = true;
                        $.each(this.selectedUnits, function(key, unit) {
                            if(Object.keys(this.selectedUnits).length == 1)
                                unit.isSoloMover = true;
                            else
                                unit.isSoloMover = false;

                            if(unit.isAttacker) {
                                if(singleAttackTarget) {
                                    unit.attackSpecificTarget(canvasPoint, singleAttackTarget)
                                }
                                else {
                                    var e = {type: 'click', id: 'a', target: canvasPoint, unit: unit};
                                    Matter.Events.trigger(this, 'unitSystemEventDispatch', e)
                                    this.box.attackMoveTargetSprite.timer.execute({runs: 1});
                                }
                            } else if(unit.isMoveable) {
                                var e = {type: 'click', id: 'm', target: canvasPoint, unit: unit};
                                Matter.Events.trigger(this, 'unitSystemEventDispatch', e);
                            }
                        }.bind(this))
                        this.attackMove = false; //invalidate the key pressed state
                        return;
                    }

                    //Dispatch ability on this click
                    if(this.abilityDispatch) {
                        if(this.selectedUnit) {
                            if(this.selectedUnit.eventClickMappings[this.abilityDispatch]) {
                                this.box.invalidateNextMouseUp = true;
                                this.box.invalidateNextBox = true;
                                if(this.abilityDispatch == 'm') {
                                    $.each(this.selectedUnits, function(key, unit) {
                                        if(Object.keys(this.selectedUnits).length == 1)
                                            unit.isSoloMover = true;
                                        else
                                            unit.isSoloMover = false;

                                        if(unit.isMoveable) {
                                            var e = {type: 'click', id: 'm', target: canvasPoint, unit: unit};
                                            Matter.Events.trigger(this, 'unitSystemEventDispatch', e)
                                        }
                                    }.bind(this))
                                } else {
                                    var e = {type: 'click', id: this.abilityDispatch, target: canvasPoint, unit: this.selectedUnit};
                                    Matter.Events.trigger(this, 'unitSystemEventDispatch', e)
                                }
                                this.box.abilityTargetSprite.timer.execute({runs: 1});
                                this.abilityDispatch = false;
                                return;
                            }
                            this.abilityDispatch = false;
                        }
                    }

                    var pendingBodyCount = Object.keys(this.box.pendingSelections).length;
                    var loneSoldier = null;
                    if(pendingBodyCount == 1) {
                        loneSoldier = this.box.pendingSelections[(Object.keys(this.box.pendingSelections)[0])];
                    }

                    //handle control+click on mousedown (this is based on the sc2 controls)
                    if(keyStates['Control'] && !this.box.selectionBoxActive && pendingBodyCount == 1) {//handle control clicking
                        var likeTypes = $.each(Matter.Composite.allBodies(this.renderer.engine.world), function(index, body) {
                            if(body.unit) {
                                if(body.unit.unitType == loneSoldier.unitType) {
                                    this.box.pendingSelections[body.unit.unitId] = body.unit;
                                }
                            }
                        }.bind(this))

                        //immediately execute a selection (again, based on sc2 style)
                        executeSelection();
                        this.box.invalidateNextMouseUp = true; //after a control click, mouseup does not execute a selection (sc2)
                        this.box.invalidateNextBox = true;
                    }
                }

                //Right click - this should be modular in order to easily apply different right-click actions. On second thought, who the hell cares?
                if(event.which == 3 && !this.box.selectionBoxActive) {
                    //if we've pressed 'a' then right click, cancel the attack move and escape this flow
                    if(this.attackMove) {
                        this.attackMove = false;
                        this.box.invalidateNextBox = false;
                        return;
                    }

                    //Find bodies under mouse position, use vertice history if possible, and if there's a target
                    //underneath, dispatch an attack event.
                    var bodies = [];
                    if(currentGame.verticeHistories.length > 0) {
                        $.each(currentGame.verticeHistories, function(index, body) {
                            if(!body.verticeCopy) return;
                            if(Matter.Vertices.contains(body.verticeCopy, currentGame.mousePosition)) {
                                bodies.push(body);
                            }
                        }.bind(this));
                    } else {
                        bodies = Matter.Query.point(Matter.Composite.allBodies(this.renderer.engine.world), currentGame.mousePosition);
                    }

                    var units = this.convertBodiesToSelectionEnabledUnits(bodies);

                    var singleAttackTarget = null;
                    $.each(units, function(index, unit) {
                        if(unit.isAttackable) {
                            singleAttackTarget = unit;
                            return false; //break out of each loop
                        }
                    })

                    var attacking = false;
                    $.each(this.selectedUnits, function(key, unit) {
                        if(unit.isAttacker && singleAttackTarget && singleAttackTarget != unit && singleAttackTarget.team != unit.team) {
                            unit.attackSpecificTarget(canvasPoint, singleAttackTarget)
                            attacking = true;
                        }
                    })
                    if(attacking) return;

                    //Dispatch move event if we're not using right-click as a cancel
                    if(this.attackMove || this.abilityDispatch) {
                        this.abilityDispatch = false;
                        this.attackMove = false;
                    } else if(!this.hasEnemySelected()){
                        $.each(this.selectedUnits, function(key, unit) {
                            if(unit.isMoveable) {
                                var e = {type: 'click', id: 'm', target: canvasPoint, unit: unit};
                                Matter.Events.trigger(this, 'unitSystemEventDispatch', e)
                                this.box.moveTargetSprite.timer.execute({runs: 1});
                                if(Object.keys(this.selectedUnits).length == 1)
                                unit.isSoloMover = true;
                                else
                                unit.isSoloMover = false;
                            }
                        }.bind(this))
                    }
                }
            }.bind(this));

            $('body').on('mousemove.unitSystem', function(event) {
                if(this.box.mouseDown && this.box.renderlings && !this.box.invalidateNextBox) {
                    this.box.selectionBoxActive = true;
                    var newPoint = {x: 0, y: 0};
                    this.renderer.interaction.mapPositionToPoint(newPoint, event.clientX, event.clientY);
                    this.sizeBox(newPoint);
                }
            }.bind(this));

            $('body').on('mouseup.unitSystem', function(event) {
                if(event.which == 1) {
                    this.box.mouseDown = false;
                    if(!this.box.invalidateNextMouseUp) {
                        this.checkFinalBoxCollision();
                        executeSelection();
                    } else {
                        this.box.invalidateNextMouseUp = false;
                        this.box.invalidateNextBox = false
                    }

                    // Matter.Body.setPosition(this.box, {x: -500, y: -1000});
                    this.box.toggleCollideAndHideNextFrame();
                    this.box.selectionBoxActive = false;
                }
            }.bind(this));

            var lastScaleX = 1;
            var lastScaleY = 1;
            this.sizeBox = function(newPoint) {
                this.box.renderlings.box.scale.x = newPoint.x - this.box.originalPoint.x;
                this.box.renderlings.box.scale.y = newPoint.y - this.box.originalPoint.y;
                var newScaleX = (newPoint.x - this.box.originalPoint.x) || 1;
                var newScaleY = (newPoint.y - this.box.originalPoint.y) || 1;
                Matter.Body.scale(this.box, newScaleX/lastScaleX, newScaleY/lastScaleY); //scale to new value
                Matter.Body.setPosition(this.box, {x: newPoint.x - (newPoint.x - this.box.originalPoint.x)/2, y: newPoint.y - (newPoint.y - this.box.originalPoint.y)/2});
                lastScaleX = newScaleX;
                lastScaleY = newScaleY;
            };

            /*
             * On a mouseup event we need to do a final box/unit collision check before we execute the selection since
             * this collision check won't happen in a subsequent physics step (since our mouseup intention is to execute a selection).
             * In essence, without this, our box's final size (the size at mouseup time) will not have had a chance to collide with units.
             */
            var smallBoxThreshold = 3;
            this.checkFinalBoxCollision = function() {
                if(!this.box.selectionBoxActive) return;
                utils.applyToUnitsByTeam(null, function(unit) {
                    return unit.isSelectable;
                }, function(unit) {
                    var pendingBodyCount = Object.keys(this.box.pendingSelections).length;
                    if(unit.isMoving && (this.box.bounds.max.x-this.box.bounds.min.x < smallBoxThreshold
                        || this.box.bounds.max.y-this.box.bounds.min.y < smallBoxThreshold) && pendingBodyCount > 0)
                            return;

                    var collisionBody = null;
                    if(unit.isMoving) {
                        collisionBody = unit.smallerBody || this.selectionBody;
                    } else {
                        collisionBody = unit.selectionBody;
                    }
                    var collision = Matter.SAT.collides(this.box, collisionBody);

                    if(collision.collided) {
                        this.changeSelectionState(unit, 'selectionPending', true);
                        var unitAlreadyContainedInBox = false;
                        // Leaving here for now for debugging purposes in the future
                        // $.each(this.box.pendingSelections, function(key, obj) {
                        //     if(unit == obj) {
                        //         unitAlreadyContainedInBox = true;
                        //         console.info("unit already contained")
                        //     }
                        // })
                        // if(!unitAlreadyContainedInBox) {
                        //
                        //     console.info("this is doing something!")
                        // }
                        this.box.pendingSelections[unit.unitId] = unit;
                        if(unit == this.box.permaPendingUnit)
                            this.box.boxContainsPermaPending = true;
                    }
                }.bind(this))
            }

            Matter.Events.on(this.box, 'onCollideActive onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == this.box ? pair.pair.bodyA : pair.pair.bodyB;
                if(!otherBody.isSelectionBody) return;
                var otherUnit = otherBody.unit || {};
                var pendingBodyCount = Object.keys(this.box.pendingSelections).length;

                if(otherUnit.isMoving && (this.box.bounds.max.x-this.box.bounds.min.x < smallBoxThreshold || this.box.bounds.max.y-this.box.bounds.min.y < smallBoxThreshold) &&
                    pendingBodyCount > 0) return;

                if(!otherUnit.isMoving && !otherBody.isSmallerBody && otherUnit.isSelectable) {
                    this.changeSelectionState(otherUnit, 'selectionPending', true);
                    this.box.pendingSelections[otherUnit.unitId] = otherUnit;
                    if(otherUnit == this.box.permaPendingUnit)
                        this.box.boxContainsPermaPending = true;
                }

                if(otherBody.isSmallerBody && otherUnit.isMoving && otherUnit.isSelectable) {
                    this.changeSelectionState(otherUnit, 'selectionPending', true);
                    this.box.pendingSelections[otherUnit.unitId] = otherUnit;
                    if(otherUnit == this.box.permaPendingUnit)
                        this.box.boxContainsPermaPending = true;
                }
            }.bind(this));

            Matter.Events.on(this.box, 'onCollideEnd', function(pair) {
                var otherBody = pair.pair.bodyB == this.box ? pair.pair.bodyA : pair.pair.bodyB;
                var otherUnit = otherBody.unit || {};
                if(!otherUnit.isMoving && otherUnit.isSelectable && otherUnit != this.box.permaPendingUnit && !otherBody.isSmallerBody) {
                    this.changeSelectionState(otherUnit, 'selectionPending', false);
                    delete this.box.pendingSelections[otherUnit.unitId];
                }
                if(otherBody.isSmallerBody && otherUnit.isSelectable && otherUnit.isMoving && otherUnit != this.box.permaPendingUnit) {
                    this.changeSelectionState(otherUnit, 'selectionPending', false);
                    delete this.box.pendingSelections[otherUnit.unitId];
                }
                if((otherBody.isSmallerBody && otherUnit == this.box.permaPendingUnit && otherUnit.isSelectable) ||
                    otherUnit.isSelectable && otherUnit == this.box.permaPendingUnit)
                {
                        this.box.boxContainsPermaPending = false;
                }
            }.bind(this));

            //Mouse hover
            var pastHoveredUnitsHover = [];
            currentGame.addTickCallback(function(event) {
                if(!this.box.selectionBoxActive) {

                    //if we have a perma, we won't act on hovering pending selections, so break here
                    if(this.box.permaPendingUnit) return;

                    this.box.pendingSelections = {};

                    //find bodies under mouse which are selectable, use the vertice history method if possible
                    var bodies = [];
                    if(currentGame.verticeHistories.length > 0) {
                        $.each(currentGame.verticeHistories, function(index, body) {
                            if(!body.verticeCopy) return;
                            if(Matter.Vertices.contains(body.verticeCopy, currentGame.mousePosition)) {
                                bodies.push(body);
                            }
                        }.bind(this));
                    } else {
                        bodies = Matter.Query.point(Matter.Composite.allBodies(this.renderer.engine.world), currentGame.mousePosition);
                    }

                    var units = this.convertBodiesToSelectionEnabledUnits(bodies);

                    //reset past, non-perma bodies we were hovering over previously
                    $.each(pastHoveredUnitsHover, function(index, unit) {
                        this.changeSelectionState(unit, 'selectionPending', false);
                    }.bind(this))

                    //set state of bodies under our mouse and identify them as pastHoveredUnitsHover for the next tick
                    //Note: this should only allow the front-most unit to be selected
                    pastHoveredUnitsHover = [];
                    var yOfUnit = 0;
                    var lastChosenUnit = null;
                    $.each(units, function(index, unit) {
                        if(!unit.isSelectable) return;
                        if(yOfUnit && yOfUnit >= unit.position.y) {
                            return;
                        }

                        if(lastChosenUnit) {
                            delete this.box.pendingSelections[lastChosenUnit.unitId];
                            this.changeSelectionState(lastChosenUnit, 'selectionPending', false);
                        }
                        lastChosenUnit = unit;
                        yOfUnit = unit.position.y;
                        this.box.pendingSelections[unit.unitId] = unit;
                        this.changeSelectionState(unit, 'selectionPending', true);
                        pastHoveredUnitsHover = [unit];
                    }.bind(this))

                    if(!this.attackMove && !this.abilityDispatch) {
                        if(units.length > 0) {
                            utils.setCursorStyle('server:OverUnitCursor.png', '16 16');
                        } else if(utils.isPositionWithinPlayableBounds(currentGame.mousePosition)){
                            utils.setCursorStyle('server:MainCursor.png');
                        }
                    }
                }
            }.bind(this));

            //Dispatch hovering event to units
            var pastHoveredUnits = [];
            currentGame.addTickCallback(function(event) {

                //Find bodies under mouse position, use vertice history if possible
                var bodies = [];
                if(currentGame.verticeHistories.length > 0) {
                    $.each(currentGame.verticeHistories, function(index, body) {
                        if(!body.verticeCopy) return;
                        if(Matter.Vertices.contains(body.verticeCopy, currentGame.mousePosition)) {
                            bodies.push(body);
                        }
                    }.bind(this));
                } else {
                    bodies = Matter.Query.point(Matter.Composite.allBodies(this.renderer.engine.world), currentGame.mousePosition);
                }

                var units = this.convertBodiesToSelectionEnabledUnits(bodies);

                //will only dispatch hover to the front-most unit
                var frontMostUnit = null;
                $.each(units, function(index, unit) {
                    if(!frontMostUnit) {
                        frontMostUnit = unit;
                    }
                    else {
                        if(frontMostUnit.position.y < unit.position.y) {
                            frontMostUnit = unit;
                        }
                    }
                })

                if(pastHoveredUnits.length > 0) {
                    $.each(pastHoveredUnits, function(i, unit) {
                        unit.unhover();
                    })
                }
                if(frontMostUnit) {
                    pastHoveredUnits = [frontMostUnit];
                    frontMostUnit.hover({team: currentGame.playerTeam});
                }
            }.bind(this))

            /*
             * Change cursor style, set attackMove state
             * Dispatch events
             */
             this.attackMove = false;
             Object.defineProperty(this, 'attackMove', {set: function(value) {
                 this._attackMove = value;
                 if(value) {
                     utils.setCursorStyle('server:AttackCursor.png');
                 }
                 else {
                     utils.setCursorStyle('server:MainCursor.png');
                 }
             }.bind(this), get: function() {
                 return this._attackMove;
             }});

             //'A' or 'a' dispatch (reserved for attack/move)
             $('body').on('keydown.unitSystem', function( event ) {
                 if(event.key == 'X' || event.key == 'x') {
                     if(keyStates['Control']) {
                         if(this.selectedUnit) {
                             this.selectedUnit.sufferAttack(1000);
                         }
                     }
                 }

                 if(this.hasEnemySelected()) return;
                 if(event.key == 'a' || event.key == 'A') {
                     $.each(this.selectedUnits, function(prop, unit) {
                         if(unit.isAttacker) {
                             if(!this.box.selectionBoxActive) {
                                 this.box.invalidateNextBox = true;
                                 this.attackMove = true;
                             }
                         }
                     }.bind(this))
                 }
             }.bind(this));

             //dispatch generic key events
             $('body').on('keydown.unitSystem', function( event ) {
                 var key = event.key.toLowerCase();
                 if(key == 'escape') {
                     this.abilityDispatch = false;
                     this.attackMove = false;
                     return;
                 }

                 //if we're a reserved key, do nothing
                 if(key == 'shift' || key == 'tab' || key =='alt' || key == 'a') return;

                 //if we have an enemy selected, do nothing
                 if(this.hasEnemySelected()) return;

                 //if we don't have a selected unit, just return
                 if(Object.keys(this.selectedUnits).length == 0) return;

                 //set ability dispatch and possibly abandon a pending attack move
                 this.abilityDispatch = event.key.toLowerCase();
                 this.attackMove = false

                 //if we're s or h, dispatch to all selected units, this is a special case
                 if(this.abilityDispatch == 's' || this.abilityDispatch == 'h') {
                     $.each(this.selectedUnits, function(key, unit) {
                         var e = {type: 'key', id: this.abilityDispatch, target: currentGame.mousePosition, unit: unit};
                         Matter.Events.trigger(this, 'unitSystemEventDispatch', e)
                     }.bind(this))
                     this.abilityDispatch = null;
                 } else if(this.selectedUnit) {
                     //else if we have a selected unit, see if we can dispatch this immediately (key event) or prep for the click dispatch
                     if(this.selectedUnit.eventKeyMappings[this.abilityDispatch]) {
                         var e = {type: 'key', id: this.abilityDispatch, target: currentGame.mousePosition, unit: this.selectedUnit};
                         Matter.Events.trigger(this, 'unitSystemEventDispatch', e)
                         this.abilityDispatch = null;
                     } else if(this.selectedUnit.eventClickMappings[this.abilityDispatch]){
                         utils.setCursorStyle('server:TargetCursor.png');
                     } else { //the selected unit cannot handle the event
                         this.abilityDispatch = null;
                     }
                 }
             }.bind(this));

            //toggle life bars with Alt
            $('body').on('keydown.unitSystem', function( event ) {
                 if(event.key == 'Alt') {
                     utils.applyToUnitsByTeam(function() {return true}, function(unit) {return unit}, function(unit) {
                         unit.showingBarsWithAlt = true;
                         unit.showLifeBar(true);
                         unit.showEnergyBar(true);
                     })
                 }
            }.bind(this));

            //cycle through selected units, changing the prevailing-unit
            $('body').on('keydown.unitSystem', function( event ) {
                 if(event.key == 'Tab') {
                     this.abilityDispatch = null;
                     this.annointNextPrevailingUnit();
                 }
            }.bind(this));

            //This is used when tabbing through the list, but also when a unit is removed. In the case of a remove,
            //this is run before the unit is removed so that we can identify where in line the body was.
            this.annointNextPrevailingUnit = function(options) {
                var options = options || {};
                var selectedUnitCount = Object.keys(this.selectedUnits).length;
                var annointNextUnit = false;
                var firstUnit = null;
                this.abilityDispatch = null;

                //Figure out the next unit
                if(!selectedUnitCount) {
                    this.selectedUnit = null;
                    return;
                } else if(selectedUnitCount == 1) {
                    if(options.onRemove)
                        this.selectedUnit = null;
                    return;
                } else {
                    $.each(this.orderedUnits, function(i, unit) {
                        //mark the first body
                        if(!firstUnit) {
                            firstUnit = unit;
                        }
                        //we found the currently selected body!
                        if(this.selectedUnit.unitId == unit.unitId) {
                            annointNextUnit = true;
                        } else if(annointNextUnit) {
                            //we are the next body!
                            annointNextUnit = false;
                            this.selectedUnit = unit;
                            return;
                        }
                    }.bind(this))

                    //if we get here and annointNextUnit is true, it means we were at the end and we can assume we should cycle
                    if(annointNextUnit)
                        this.selectedUnit = firstUnit;
                }
            }.bind(this),

            $('body').on('keyup.unitSystem', function( event ) {
                if(event.key == 'Alt') {
                    utils.applyToUnitsByTeam(function() {return true}, function(unit) {return unit}, function(unit) {
                         unit.showingBarsWithAlt = false;
                         unit.showLifeBar(false);
                         unit.showEnergyBar(false);
                     })
             }
            }.bind(this));

            currentGame.addBody(this.box);
        };

        this.deselectUnit = function(unit) {
            //Re-assign the selected unit if needed
            if(this.selectedUnit == unit) {
                this.annointNextPrevailingUnit({onRemove: true});
            }

            //remove body from these data structures
            delete this.selectedUnits[unit.unitId];
            this.updateOrderedUnits(this.selectedUnits);
            delete this.box.pendingSelections[unit.unitId];
            this.changeSelectionState(unit, 'selected', false);
            Matter.Events.trigger(this, 'selectedUnitsChange', {selectedUnits: this.selectedUnits, orderedSelection: this.orderedUnits});
        };

        this.hasEnemySelected = function() {
            if(this.selectedUnit)
                return this.selectedUnit.team != currentGame.playerTeam;
        };

        this.hasMyUnitSelected = function() {
            if(this.selectedUnit)
                return this.selectedUnit.team == currentGame.playerTeam;
        }

        this.updateOrderedUnits = function(selectedUnits) {
            this.orderedUnits = $.grep(this.orderedUnits, function(ounit) {
                var found = false;
                $.each(selectedUnits, function(key, unit) {
                    if(unit && unit == ounit)
                        found = true;
                })
                return found;
            })

            $.each(selectedUnits, function(key, unit) {
                if(!unit) return;
                if(!this.orderedUnits.includes(unit)) {
                    this.orderedUnits.push(unit);
                }
            }.bind(this))

        }.bind(this);

        this.findHighestPriorityUnit = function(units) {
            var priorityUnit = units[Object.keys(units)[0]];

            $.each(units, function(i, unit) {
                if(!priorityUnit) {
                    priorityUnit = unit;
                } else {
                    if(unit.priority > priorityUnit.priority) {
                        priorityUnit = unit;
                    }
                }
            })

            return priorityUnit;
        }

        //common method for changing the selection state (and visuals) of a group of bodies
        this.changeSelectionState = function(units, state, newValue) {
            if(units.renderlings && units.renderlings[state]) { //if we were supplied just one unit
                if(units.isSelectable)
                    units.renderlings[state].visible = newValue;
            }
            else { //we have many
                $.each(units, function(key, unit) {
                    if(unit != null && unit.isSelectable && unit.renderlings && unit.renderlings[state])
                        unit.renderlings[state].visible = newValue;
                })
            }
        };

        /*
         * Cleanup any listeners we've created
         */
        this.cleanUp = function() {

            //clear unit system events
            Matter.Events.off(this);

            //cleanup box stuff
            if(this.box) {
                Matter.Events.off(this.box);
                Matter.Events.off(this.engine.world, this.bodyRemoveCallback)
                Matter.Events.off(this, this.manualRemoveCallback)
                currentGame.removeBody(this.box);
                this.box = null;
            }

            //cleanup tick callback
            if(this.movePrevailingUnitCircleTick) {
                currentGame.removeTickCallback(this.movePrevailingUnitCircleTick);
            }

            //cleanup unit panel
            if(this.unitPanel)
                this.unitPanel.cleanUp();

            //and the unit configuration panel
            if(this.unitConfigurationPanel)
                this.unitConfigurationPanel.cleanUp();

            //don't hold onto any bodies
            this.selectedUnits = {};
            this.orderedUnits = [];

            //kill this timer
            if(this.prevailingUnitCircle && this.prevailingUnitCircle.timer) {
                currentGame.invalidateTimer(this.prevailingUnitCircle.timer);
            }

            //clear jquery events
            $('body').off('mousedown.unitSystem');
            $('body').off('mousemove.unitSystem');
            $('body').off('mouseup.unitSystem');
            $('body').off('keydown.unitSystem');
            $('body').off('keyup.unitSystem');
            $('body').off('keypress.unitSystem');
        },

        //return units attached to the main selection body
        this.convertBodiesToSelectionEnabledUnits = function(bodies) {
            bodies = $.grep(bodies, function(body) {
                return body.isSelectionBody && !body.isSmallerBody;
            })

            bodies = $.map(bodies, function(body) {
                return body.unit;
            })

            return bodies;
        }
    }

    return unitSystem;
})
