define(['jquery', 'utils/GameUtils', 'matter-js'], function($, utils, Matter) {

    var unitSystem = function(properties) {
        $.extend(this, properties);
        this.initialize = function() {
            //create rectangle
            this.box = Matter.Bodies.rectangle(-50, -50, 1, 1, {isSensor: true, isStatic: false});
            this.box.collisionFilter.category = 0x0002;
            this.box.selectedBodies = {};
            this.box.permaPendingBody = null;
            this.box.pendingSelections = {};
            this.box.renderChildren = [{id: 'box', data: 'SelectionBox'}];

            //destination marker
            this.box.clickPointSprite = utils.addSomethingToRenderer('MouseXGreen', 'foreground', {x: -50, y: -50});
            this.box.clickPointSprite.scale.x = .25;
            this.box.clickPointSprite.scale.y = .25;

            //update selected bodies upon body removal
            this.bodyRemoveCallback = Matter.Events.on(this.engine.world, 'afterRemove', function(event) {

                var removedBody = event.object[0];

                //remove body from these data structures
                if(removedBody.isSelectable) {
                    delete this.box.selectedBodies[removedBody.id];
                    delete this.box.pendingSelections[removedBody.id];
                }

                //Re-assign the selected unit
                if(Object.keys(this.box.selectedBodies).length > 0) {
                    this.selectedUnit = this.box.selectedBodies[Object.keys(this.box.selectedBodies)[0]];
                } else {
                    this.selectedUnit = null;
                }
            }.bind(this));

            var originalX = 0;
            var originalY = 0;
            var scaleX = 1;
            var scaleY = 1;
            var lastScaleX = 1;
            var lastScaleY = 1;

            //common method for changing the selection state (and visuals) of a group of bodies
            var changeSelectionState = function(bodies, state, newValue) {
                if(bodies.isSelectable && bodies.renderlings && bodies.renderlings[state]) //if we were supplied just one body
                    bodies.renderlings[state].visible = newValue;
                else { //we have many
                    $.each(bodies, function(key, body) {
                        if(body != null && body.isSelectable && body.renderlings && body.renderlings[state])
                            body.renderlings[state].visible = newValue;
                    })
                }
            };

            //transfer bodies from pending to selected
            var executeSelection = function() {

                //for convenience
                var pendingBodyCount = Object.keys(this.box.pendingSelections).length;
                var loneSoldier = null;
                if(pendingBodyCount == 1) {
                    loneSoldier = this.box.pendingSelections[parseInt(Object.keys(this.box.pendingSelections)[0])];
                }

                //if nothing pending, take no action
                if(pendingBodyCount == 0) {
                    return;
                }

                //handle shift functionality
                if(keyStates['Shift']) {
                    //If one, already-selected body is requested here, remove from selection
                    if(loneSoldier && ($.inArray(loneSoldier.id.toString(), Object.keys(this.box.selectedBodies)) > -1)) {
                        changeSelectionState(loneSoldier, 'selected', false);
                        delete this.box.selectedBodies[loneSoldier.id];
                    }
                    else {
                        //If we have multiple things pending (from drawing a box) this will override the permaPendingBody, unless permaPendingBody was also selected in the box
                        //in which case we'll exclude it from the pending selections
                        if(this.box.permaPendingBody && pendingBodyCount > 1 && this.box.selectionBoxActive && !this.box.boxContainsPermaPending) {
                            changeSelectionState(this.box.permaPendingBody, 'selectionPending', false);
                            delete this.box.pendingSelections[this.box.permaPendingBody.id]
                        }

                        //Add pending bodies to current selection
                        $.extend(this.box.selectedBodies, this.box.pendingSelections)
                    }
                } else {
                    //Else create a brand new selection (don't add to current selection)
                    //If we have multiple things pending (from drawing a box) this will override the permaPendingBody, unless permaPendingBody was also selected in the box
                    if(this.box.permaPendingBody && pendingBodyCount > 1 && this.box.selectionBoxActive && !this.box.boxContainsPermaPending) {
                        changeSelectionState(this.box.permaPendingBody, 'selectionPending', false);
                        delete this.box.pendingSelections[this.box.permaPendingBody.id]
                    }
                    changeSelectionState(this.box.selectedBodies, 'selected', false);
                    this.box.selectedBodies = $.extend({}, this.box.pendingSelections);
                }

                //Assign the selected unit
                if(Object.keys(this.box.selectedBodies).length > 0) {
                    this.selectedUnit = this.box.selectedBodies[Object.keys(this.box.selectedBodies)[0]];
                }

                //Show group destination of selected
                var groupDestination = 0;
                $.each(this.box.selectedBodies, function(key, body) {
                    if(groupDestination == 0) {
                        groupDestination = body.attackMoveDestination || body.destination;
                    } else if(body.destination != groupDestination && body.attackMoveDestination != groupDestination) {
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
                changeSelectionState(this.box.pendingSelections, 'selectionPending', false);
                changeSelectionState(this.box.selectedBodies, 'selected', true);

                //Refresh state
                this.box.permaPendingBody = null;
                this.box.pendingSelections = {};

                //Update selected attribute
                $.each(Matter.Composite.allBodies(this.renderer.engine.world), function(index, body) {
                    body.isSelected = false;
                })

                $.each(this.box.selectedBodies, function(key, body) {
                    body.isSelected = true;
                })

            }.bind(this);

            //Mouse down event
            $('body').on('mousedown.selectionBox', function(event) {
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

                    //This is a perma body which we'll add to the pending selection, or we're trying to attack a singular target
                    var singleAttackTarget = null;
                    $.each(bodies, function(key, body) {
                        if(body.isSelectable && !this.attackMove) {
                            changeSelectionState(body, 'selectionPending', true);
                            this.box.pendingSelections[body.id] = body; //needed for a special case when the game starts - no longer need this (i think)
                            this.box.permaPendingBody = body;
                        } else if(this.attackMove && body.isAttackable) {
                            singleAttackTarget = body.unit;
                        }
                    }.bind(this));

                    //Attacker functionality, dispatch attackMove
                    if(this.attackMove && !this.box.selectionBoxActive) {
                        this.box.invalidateNextMouseUp = true;
                        $.each(this.box.selectedBodies, function(key, body) {
                            if(Object.keys(this.box.selectedBodies).length == 1)
                                body.isSoloMover = true;
                            else
                                body.isSoloMover = false;

                            if(body.isAttacker) {
                                if(singleAttackTarget) {
                                    body.unit.attackSpecificTarget(canvasPoint, singleAttackTarget)
                                }
                                else {
                                    body.unit.handleEvent({type: 'click', id: 'attackMove', target: canvasPoint})
                                }
                            } else if(body.isMoveable) {
                                body.unit.handleEvent({type: 'click', id: 'move', target: canvasPoint})
                            }
                        }.bind(this))
                        this.attackMove = false; //invalidate the key pressed state

                        return;
                    }

                    var pendingBodyCount = Object.keys(this.box.pendingSelections).length;
                    var loneSoldier = null;
                    if(pendingBodyCount == 1) {
                        loneSoldier = this.box.pendingSelections[parseInt(Object.keys(this.box.pendingSelections)[0])];
                    }

                    //handle control+click on mousedown (this is based on the sc2 controls)
                    if(keyStates['Control'] && !this.box.selectionBoxActive && pendingBodyCount == 1) {//handle control clicking
                        var likeTypes = $.each(Matter.Composite.allBodies(this.renderer.engine.world), function(index, body) {
                            if(body.unit) {
                                if(body.unit.unitType == loneSoldier.unit.unitType) {
                                    this.box.pendingSelections[body.id] = body;
                                }
                            }
                        }.bind(this))

                        //immediately execute a selection (again, based on sc2 style)
                        executeSelection();
                        this.box.invalidateNextMouseUp = true; //after a control click, mouseup does not execute a selection (sc2)
                        this.box.invalidateNextBox = true;
                    }

                    //Dispatch ability on this click
                    if(this.abilityDispatch) {
                        if(this.selectedUnit) {
                            this.selectedUnit.unit.handleEvent({type: 'click', id: this.abilityDispatch, target: canvasPoint});
                            this.abilityDispatch = false;
                        }
                    }
                }

                //Right click - this should be modular in order to easily apply different right-click actions
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

                    var singleAttackTarget = null;
                    $.each(bodies, function(index, body) {
                        if(body.isAttackable) {
                            singleAttackTarget = body.unit;
                            return false; //break out of each loop
                        }
                    })

                    var attacking = false;
                    $.each(this.box.selectedBodies, function(key, body) {
                        if(body.isAttacker && singleAttackTarget) {
                            body.unit.attackSpecificTarget(canvasPoint, singleAttackTarget)
                            attacking = true;
                        }
                    })
                    if(attacking) return;

                    //Dispatch move event
                    $.each(this.box.selectedBodies, function(key, body) {
                        if(body.isMoveable) {
                            body.unit.handleEvent({type: 'click', id: 'move', target: canvasPoint})
                            // body.unit.groupRightClick(canvasPoint);
                            if(Object.keys(this.box.selectedBodies).length == 1)
                                body.isSoloMover = true;
                            else
                                body.isSoloMover = false;
                        }
                    }.bind(this))
                }
            }.bind(this));

            $('body').on('mousemove.selectionBox', function(event) {
                if(this.box.mouseDown && this.box.renderlings && !this.box.invalidateNextBox) {
                    this.box.selectionBoxActive = true;
                    var newPoint = {x: 0, y: 0};
                    this.renderer.interaction.mapPositionToPoint(newPoint, event.clientX, event.clientY);
                    this.box.renderlings.box.scale.x = newPoint.x - this.box.originalPoint.x;
                    this.box.renderlings.box.scale.y = newPoint.y - this.box.originalPoint.y;
                    var newScaleX = (newPoint.x - this.box.originalPoint.x) || 1;
                    var newScaleY = (newPoint.y - this.box.originalPoint.y) || 1;
                    Matter.Body.scale(this.box, newScaleX/lastScaleX, newScaleY/lastScaleY); //scale to new value
                    Matter.Body.setPosition(this.box, {x: newPoint.x - (newPoint.x - this.box.originalPoint.x)/2, y: newPoint.y - (newPoint.y - this.box.originalPoint.y)/2});
                    lastScaleX = newScaleX;
                    lastScaleY = newScaleY;
                }
            }.bind(this));

            $('body').on('mouseup.selectionBox', function(event) {
                if(event.which == 1) {
                    this.box.mouseDown = false;
                    Matter.Body.setPosition(this.box, {x: -500, y: -1000});
                    if(!this.box.invalidateNextMouseUp) {
                        executeSelection();
                    } else {
                        this.box.invalidateNextMouseUp = false;
                        this.box.invalidateNextBox = false
                    }
                    this.box.selectionBoxActive = false;
                }
            }.bind(this));

            Matter.Events.on(this.box, 'onCollideActive', function(pair) {
                var otherBody = pair.pair.bodyB == this.box ? pair.pair.bodyA : pair.pair.bodyB;
                if(otherBody.isMoving && this.box.bounds.max.x-this.box.bounds.min.x < 25 && this.box.bounds.max.y-this.box.bounds.min.y < 25) return;
                if(!otherBody.isMoving && otherBody.isSelectable) {
                    changeSelectionState(otherBody, 'selectionPending', true);
                    this.box.pendingSelections[otherBody.id] = otherBody;
                    if(otherBody == this.box.permaPendingBody)
                        this.box.boxContainsPermaPending = true;
                }
                if(otherBody.isSmallerBody && otherBody.unit.isMoving && otherBody.unit.isSelectable) {
                    changeSelectionState(otherBody.unit, 'selectionPending', true);
                    this.box.pendingSelections[otherBody.unit.body.id] = otherBody.unit.body;
                    if(otherBody.unit.body == this.box.permaPendingBody)
                        this.box.boxContainsPermaPending = true;
                }
            }.bind(this));

            Matter.Events.on(this.box, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == this.box ? pair.pair.bodyA : pair.pair.bodyB;
                if(otherBody.isMoving && this.box.bounds.max.x-this.box.bounds.min.x < 25 && this.box.bounds.max.y-this.box.bounds.min.y < 25) return;
                if(!otherBody.isMoving && otherBody.isSelectable) {
                    changeSelectionState(otherBody, 'selectionPending', true);
                    this.box.pendingSelections[otherBody.id] = otherBody;
                    if(otherBody == this.box.permaPendingBody)
                        this.box.boxContainsPermaPending = true;
                }
                if(otherBody.isSmallerBody && otherBody.unit.isMoving && otherBody.unit.isSelectable) {
                    changeSelectionState(otherBody.unit, 'selectionPending', true);
                    this.box.pendingSelections[otherBody.unit.body.id] = otherBody.unit.body;
                    if(otherBody.unit.body == this.box.permaPendingBody)
                        this.box.boxContainsPermaPending = true;
                }
            }.bind(this));

            Matter.Events.on(this.box, 'onCollideEnd', function(pair) {
                var otherBody = pair.pair.bodyB == this.box ? pair.pair.bodyA : pair.pair.bodyB;
                if(!otherBody.isMoving && otherBody.isSelectable && otherBody != this.box.permaPendingBody) {
                    changeSelectionState(otherBody, 'selectionPending', false);
                    delete this.box.pendingSelections[otherBody.id];
                }
                if(otherBody.isSmallerBody && otherBody.unit.isMoving && otherBody.unit.body != this.box.permaPendingBody) {
                    changeSelectionState(otherBody.unit, 'selectionPending', false);
                    delete this.box.pendingSelections[otherBody.unit.body.id];
                }
                if((otherBody.isSmallerBody && otherBody.unit.body == this.box.permaPendingBody && otherBody.unit.isSelectable) ||
                    otherBody.isSelectable && otherBody == this.box.permaPendingBody)
                {
                        this.box.boxContainsPermaPending = false;
                }
            }.bind(this));

            //Mouse hover
            var pastHoveredBodies = [];
            currentGame.addTickCallback(function(event) {
                if(!this.box.selectionBoxActive) {

                    //if we have a perma, we won't act on hovering pending selections, so break here
                    if(this.box.permaPendingBody) return;

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

                    bodies = $.grep(bodies, function(body, index) {
                        return body.isSelectable;
                    })

                    //reset past, non-perma bodies we were hovering over previously
                    $.each(pastHoveredBodies, function(index, body) {
                        changeSelectionState(body, 'selectionPending', false);
                    }.bind(this))

                    //set state of bodies under our mouse and identify them as pastHoveredBodies for the next tick
                    pastHoveredBodies = [];
                    $.each(bodies, function(index, body) {
                        this.box.pendingSelections[body.id] = body;
                        changeSelectionState(body, 'selectionPending', true);
                        pastHoveredBodies.push(body);
                    }.bind(this))
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

                var units = $.grep(bodies, function(body, index) {
                    return body.unit;
                })

                $.each(pastHoveredUnits, function(i, unit) {
                    unit.unhover();
                })
                pastHoveredUnits = [];
                $.each(units, function(i, body) {
                    if(body.unit.hover)
                        body.unit.hover({team: currentGame.playerTeam});
                    pastHoveredUnits.push(body.unit);
                }.bind(this))
            }.bind(this))

            /*
             * Change cursor style, set attackMove state
             * Dispatch events
             */
             this.attackMove = false;
             Object.defineProperty(this, 'attackMove', {set: function(value) {
                 this._attackMove = value;
                 if(value) {
                     utils.setCursorStyle('crosshair');
                 }
                 else
                     utils.setCursorStyle('auto');
             }.bind(this), get: function() {
                 return this._attackMove;
             }});

             //A or a dispatch (reserved)
             $('body').on('keydown.selectionBox', function( event ) {
                 if(event.key == 'a' || event.key == 'A') {
                     $.each(this.box.selectedBodies, function(prop, obj) {
                         if(obj.isAttacker) {
                             if(!this.box.selectionBoxActive) {
                                 this.box.invalidateNextBox = true;
                                 this.attackMove = true;
                             }
                         }
                     }.bind(this))
                 }
             }.bind(this));

             //S or s dispatch (reserved)
              $('body').on('keydown.selectionBox', function( event ) {
                  if(event.key == 's' || event.key == 'S') {
                      $.each(this.box.selectedBodies, function(prop, obj) {
                          if(obj.isMoveable) {
                              obj.unit.stop();
                          }
                      }.bind(this))
                  }
              }.bind(this));

             //dispatch generic key events
             $('body').on('keydown.selectionBox', function( event ) {
                     this.abilityDispatch = event.key.toLowerCase();
                     // if(this.selectedUnit)
                     //    this.selectedUnit.unit.handleEvent({type: 'key', id: this.abilityDispatch, target: currentGame.mousePosition});
                     $.each(this.box.selectedBodies, function(prop, obj) {
                         obj.unit.handleEvent({type: 'key', id: this.abilityDispatch, target: currentGame.mousePosition});
                     }.bind(this))
             }.bind(this));

             //toggle life bars with Alt
             $('body').on('keydown.selectionBox', function( event ) {
                 if(event.key == 'Alt') {
                     utils.applyToBodiesByTeam(function() {return true}, function(body) {return body.unit}, function(body) {
                             var unit = body.unit;
                             unit.renderlings['healthbarbackground'].visible = true;
                             unit.renderlings['healthbar'].visible = true;
                         })
                 }
             }.bind(this));

             $('body').on('keyup.selectionBox', function( event ) {
                 if(event.key == 'Alt') {
                     utils.applyToBodiesByTeam(function() {return true}, function(body) {return body.unit}, function(body) {
                             var unit = body.unit;
                             unit.renderlings['healthbarbackground'].visible = false;
                             unit.renderlings['healthbar'].visible = false;
                         })
                 }
             }.bind(this));

            currentGame.addBody(this.box);
        }

        this.cleanUp = function() {
            //since box is a body, this will be removed and matter events disconnected by the common game nuke method, but it's nice to cleanup our responsibility anyway
            if(this.box) {
                Matter.Events.off(this.box);
                Matter.Events.off(this.engine.world, this.bodyRemoveCallback)
                this.box = null;
            }
            $('body').off('mousedown.selectionBox');
            $('body').off('mousemove.selectionBox');
            $('body').off('mouseup.selectionBox');
            $('body').off('keydown.selectionBox');
            $('body').off('keyup.selectionBox');
            $('body').off('keypress.selectionBox');
        }
    }

    return unitSystem;
})
