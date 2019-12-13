/*
 * This module is meant to provide common, game-lifecycle functionality, utility functions, and matter.js/pixi objects to a specific game module
 */

define(['matter-js', 'pixi', 'jquery', 'utils/HS', 'howler', 'particles', 'utils/Styles'], function(Matter, PIXI, $, hs, h, particles, styles) {

    var praiseWords = ["GREAT", "EXCELLENT", "NICE", "WELL DONE", "AWESOME"];

    var common = {

        /*
         * Defaults
         */
        victoryCondition: {type: 'timed', limit: 30},
        noBorder: false,
        noCeiling: false,
        noGround: false,
        noLeftWall: false,
        noRightWall: false,
        noClickIndicator: false,
        bypassPregame: false,
        hideScore: false,
        baseScoreText: "Score: ",
        baseWaveText: "Wave: ",
        score: 0,
        selectionBox: false,
        clickAnywhereToStart: "Click anywhere to start",
        frames: 0,
        frameSecondCounter: 0,

        /*
         * Main game flow, lifecycle
         *
         * init:      instance variables, setup listeners which will persist throughout the life of the canvas. Calls initExtension() which
                      can be implemented by each specific game. Called once per lifetime of entire game by CommonGameStarter.

         * preGame:   game state prior to playing the game, typically a 'click to proceed' screen. Calls preGameExtension().
         * startGame: create game objects and game listeners (those that will be cleaned up after victory is satisfied)
         *            calls play() which is meant to be implemented by each individual game in which game-specific obj are created
         * endGame:   actions to take once victory is satisfied. Go to score screen, then reset game (call's start). Calls endGameExtension().
         * resetGame: called after endGame is completed. Jumps to preGame. Calls resetGameExtension().
         */
        init: function(options) {

            /*
             * blow up options into properties
             */
            $.extend(this, options);

            /*
             * create some other variables
             */
            this.tickCallbacks = [],
            this.verticeHistories = [],
            this.invincibleTickCallbacks = [],
            this.eventListeners = [],
            this.invincibleListeners = [],
            this.timers = {}, /* {name: string, timeLimit: double, callback: function} */
            this.mousePosition = {x: 0, y: 0},
            this.canvas = {width: options.canvasWidth, height: options.canvasHeight};
            this.canvasRect = this.canvasEl.getBoundingClientRect();
            this.justLostALife = 0;
            this.endGameSound = this.getSound('bells.wav', {volume: .05});
            this.loseLifeSound = this.getSound('loselife1.mp3', {rate: 1.4, volume: 5.0});
            this.s = {s: 0, t: 0, f: 0, w: 0, sl: 0};
            var is = this['incr' + 'ement' + 'Sco' + 're'].bind(this);
            this.bodiesByTeam = {};

            //begin tracking body vertice histories
            this.addTickCallback(function() {
                $.each(this.verticeHistories, function(index, body) {
                    body.verticeCopy = this.cloneVertices(body.vertices);
                    body.positionCopy = {x: body.position.x, y: body.position.y};
                    body.partsCopy = this.cloneParts(body.parts);
                }.bind(this))
            }.bind(this), true, 'beforeUpdate');

            this['incr' + 'ement' + 'Sco' + 're'] = function(value) {
                this.s.s += value*77;
                this.s.t += value*33;
                this.s.f += value*55;
                if(this.wave) {
                    this.s.w = this.wave.waveValue * 44;
                    if(this.subLevel)
                        this.s.sl = this.subLevel;
                }
                is(value);
            }.bind(this);

            Object.defineProperty(this, 'leftDown', { get: function() {
                    return window.mouseStates.leftDown;
                }
            });


            //mouse position
            this.addEventListener('mousemove', function(event) {
                this.mousePosition.x = event.data.global.x;
                this.mousePosition.y = event.data.global.y;
            }.bind(this), true, true);

            //track bodies and sort by teams
            Matter.Events.on(this.engine.world, 'afterAdd', function(event) {
                //console.info(event);
            });

            Matter.Events.on(this.engine.world, 'afterRemove', function(event) {
                //console.info(event);
            });

            //fps (crtl + shift + f to toggle)
            this.lastDeltaText = this.addSomethingToRenderer("TEXT:" + 0 + " ms", 'hud', {x: 32, y: this.canvas.height - 15, style: styles.fpsStyle});
            this.fpsText = this.addSomethingToRenderer("TEXT:" + "0" + " fps", 'hud', {x: 27, y: this.canvas.height - 30, style: styles.fpsStyle});
            this.fpsText.persists = true;
            this.lastDeltaText.persists = true;
            this.addTickCallback(function(event) {
                this.lastDeltaText.text = event.deltaTime.toFixed(2) + "ms";
                this.frameSecondCounter += event.deltaTime;
                if(this.frameSecondCounter > 1000) {
                    this.frameSecondCounter -= 1000;
                    this.fpsText.text = this.frames + " fps";
                    this.frames = 0;
                }
                this.frames += 1;
            }.bind(this), true);

            //init fps to be off
            this.lastDeltaText.visible = false;
            this.fpsText.visible = false;

            $('body').on('keydown', function( event ) {
                if(keyStates['Shift'] && keyStates['Control']) {
                    if(event.key == 'f' || event.key == 'F') {
                        this.lastDeltaText.visible = !this.lastDeltaText.visible;
                        this.fpsText.visible = !this.fpsText.visible;
                    }
                }

            }.bind(this));

            //setup timing utility
            this.addTickCallback(function(event) {

                $.each(this.timers, function(key, value) {

                    if(!value) return;

                    if(value.done || value.paused || value.invalidated || value.runs === 0) return;

                    if(!value.timeElapsed) value.timeElapsed = 0;
                    if(!value.runs) value.runs = value.gogogo ? 999999 : 1;

                    value.started = true;
                    value.timeElapsed += event.deltaTime;
                    value.percentDone = Math.min(value.timeElapsed/value.timeLimit, 1);

                    if(value.tickCallback) value.tickCallback(event.deltaTime);
                    if(value.immediateStart) {
                        value.timeElapsed = value.timeLimit;
                        value.immediateStart = false;
                    }

                    while(value.timeLimit <= value.timeElapsed && value.runs > 0) {
                        if(value.runs > 0) {
                            value.percentDone = 0;
                            value.timeElapsed -= value.timeLimit;
                            if(value.callback) value.callback();
                            value.runs--;

                            if(value.runs > 0) {
                                var callBackPaused = value.paused;
                                if(callBackPaused)
                                    value.paused = true;
                            }
                            else {
                                value.done = true;
                                if(value.totallyDoneCallback) value.totallyDoneCallback.call(value);
                                if(value.killsSelf) this.invalidateTimer(value); //I don't think this really does anything
                            }
                        }
                    }
                }.bind(this));

                //setup timer victory condition
                if(this.victoryCondition.type == 'timed' && this.regulationPlay && this.regulationPlay.state() == 'pending') {
                    this.timeLeft -= event.deltaTime;
                    this.gameTime.text = parseInt(this.timeLeft/1000);
                    if(this.timeLeft)
                    if(this.gameTime.text == " ") this.gameTime.text = '0';
                    if(this.timeLeft < 15000) {
                        this.gameTime.style = styles.redScoreStyle;
                    } else {
                        this.gameTime.style = styles.scoreStyle;
                    }
                    if(this.timeLeft <= 1000) {
                        this.regulationPlay.resolve();
                    }
                }

            }.bind(this), true);

            //This was in case I wanted to use the engine.afterTick event instead of the runner.after tick event for general tick callbacks, given that
            //the renderer uses the engine.tick even. The order of matter events is runner.tick then engine.tick, one implication
            //of this is that some ticks will occur before the body has realized it's renderlings. So ticks should not assume anything
            //about any bodies it references.
//          if(!this.engine.runner.events) {
//              this.engine.runner.events = {}
//          }

            //customizable init game state call
            if(this.initExtension)
                this.initExtension();
        },

        /*
         * setup click-to-begin screen
         */
        preGame: function() {

            //global function - whatever
            animateTitle();

            this.gameState = "pregame";
            var startGameText = this.addSomethingToRenderer("TEXT:"+this.clickAnywhereToStart, 'hud', {style: styles.style, x: this.canvas.width/2, y: this.canvas.height/2});

            //customizable pre game call
            if(this.preGameExtension)
                this.preGameExtension();

            //pregame deferred
            var proceedPastPregame = $.Deferred();
            if(!this.bypassPregame) {
                $(this.canvasEl).one("mouseup", $.proxy(function(event) {
                    this.removeSomethingFromRenderer(startGameText);
                    setTimeout(() => proceedPastPregame.resolve(), 10); //dissociate this mouseup event from any listeners setup during startgame, it appears that listeners setup during an event get called during that event.
                }, this));
            }

            proceedPastPregame.done(this.startGame.bind(this));
        },

        /*
         * init various common game elements
         */
        startGame: function(options) {

            //disable right click during game
            $('body').on("contextmenu.common", function(e){
                e.preventDefault();
            });

            //disable other default behaviors changing
            $('body').on("keydown.common", function(e){
                if(e.key === 'Tab' || e.keyCode === 9 || e.key == 'Alt') {
                    e.preventDefault();
                }
            });

            //disable default click action - double clicking selects page text
            $('#gameTheater').on('mousedown.prevent', (function(e){ e.preventDefault(); }));

            //initialize any state needed for each period of play
            this._initStartGameState();

            //create the bounds unless not wanted
            if(!this.noBorder) {
                var border = [];
                if(!this.noCeiling)
                    border.push(Matter.Bodies.rectangle(this.canvas.width/2, -5, this.canvas.width, 10, { isStatic: true}));
                if(!this.noGround)
                    border.push(Matter.Bodies.rectangle(this.canvas.width/2, this.canvas.height+25, this.canvas.width, 50, { isStatic: true}));
                if(!this.noLeftWall)
                    border.push(Matter.Bodies.rectangle(-5, this.canvas.height/2, 10, this.canvas.height, { isStatic: true}));
                if(!this.noRightWall)
                    border.push(Matter.Bodies.rectangle(this.canvas.width+5, this.canvas.height/2, 10, this.canvas.height, { isStatic: true}));

                this.addBodies(border);
            }

            //score overlay
            this.s = {s: 0, t: 0, f: 0};
            if(!this.hideScore) {
                this.score = this.addSomethingToRenderer("TEXT:" + this.baseScoreText, 'hud', {x: 5, y: 5, anchor: {x: 0, y: 0}, style: styles.scoreStyle});
                this.score.persists = true;
                this.setScore(0);
            }

            //wave overlay
            if(this.showWave) {
                this.wave = this.addSomethingToRenderer("TEXT:" + this.baseWaveText, 'hud', {x: 5, y: 30, anchor: {x: 0, y: 0}, style: styles.scoreStyle});
                this.wave.persists = true;
                this.setWave(0);
            }

            //timer, if necessary
            if(this.victoryCondition.type == 'timed') {
                this.gameTime = this.addSomethingToRenderer("TEXT:" + this.victoryCondition.limit, 'hud', {x: this.canvasRect.width/2, y: 5, anchor: {x: .5, y: 0}, style: styles.scoreStyle});
            } else if (this.victoryCondition.type == 'lives') {
                this.hudLives = this.addSomethingToRenderer("TEXT:" + "Lives: " + this.victoryCondition.limit, 'hud', {x: this.canvasRect.width/2, y: 5, anchor: {x: .5, y: 0}, style: styles.scoreStyle});
            }

            //call the game's play method
            this.play(options);
            this.gameState = "playing";

            //create click indication listener
            if(!this.noClickIndicator) {
                var clickPointSprite = this.addSomethingToRenderer(this.texture('MouseX'), 'foreground', {x: -50, y: -50});
                clickPointSprite.scale.x = .25;
                clickPointSprite.scale.y = .25;
                this.addEventListener('mousedown', function(event) {
                    clickPointSprite.position = {x: event.data.global.x, y: event.data.global.y};
                }.bind(this), false, true);
            }

            //create right click indication listener
            if(!this.noRightClickIndicator) {
                var clickPointSprite = this.addSomethingToRenderer(this.texture('MouseX'), 'foreground', {x: -50, y: -50});
                clickPointSprite.scale.x = .25;
                clickPointSprite.scale.y = .25;
                this.rightClickIndicator = clickPointSprite;
                this.addEventListener('rightdown', function(event) {
                    clickPointSprite.position = {x: event.data.global.x, y: event.data.global.y};
                    if(this.selectionBox)
                        this.box.clickPointSprite.position = {x: -50, y: -50};
                }.bind(this), false, true);
            }

            //enable selection box - should think about breaking this into another file for better readability
            if(this.selectionBox) {

                this.attackMove = false;
                Object.defineProperty(this, 'attackMove', {set: function(value) {
                    this._attackMove = value;
                    if(value) {
                        this.setCursorStyle('crosshair');
                    }
                    else
                        this.setCursorStyle('auto');
                }.bind(this), get: function() {
                    return this._attackMove;
                }});

                //call attack move, this is a special event reserved for attack moving
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

                //dispatch key events
                $('body').on('keydown.selectionBox', function( event ) {
                    if(this.selectedUnit && this.selectedUnit.unit.keyMappings[event.key]) {
                        this.abilityDispatch = event.key;
                    }
                }.bind(this));

                //toggle life bars
                $('body').on('keydown.selectionBox', function( event ) {
                    if(event.key == 'Alt') {
                        this.applyToBodiesByTeam(function() {return true}, function(body) {return body.unit}, function(body) {
                                var unit = body.unit;
                                unit.renderlings['healthbarbackground'].visible = true;
                                unit.renderlings['healthbar'].visible = true;
                            })
                    }
                }.bind(this));

                $('body').on('keyup.selectionBox', function( event ) {
                    if(event.key == 'Alt') {
                        this.applyToBodiesByTeam(function() {return true}, function(body) {return body.unit}, function(body) {
                                var unit = body.unit;
                                unit.renderlings['healthbarbackground'].visible = false;
                                unit.renderlings['healthbar'].visible = false;
                            })
                    }
                }.bind(this));

                $('body').on('keydown.selectionBox', function( event ) {
                    if(event.key == 's' || event.key == 'S') {
                        $.each(this.box.selectedBodies, function(prop, obj) {
                            if(obj.isMoveable) {
                                obj.unit.stop();
                            }
                        }.bind(this))
                    }
                }.bind(this));

                //create rectangle
                this.box = Matter.Bodies.rectangle(-50, -50, 1, 1, {isSensor: true, isStatic: false});
                this.box.collisionFilter.category = 0x0002;
                this.box.selectedBodies = {};
                this.box.permaPendingBody = null;
                this.box.pendingSelections = {};
                this.box.renderChildren = [{id: 'box', data: this.texture('BlueTransparency')}];

                //destination marker
                this.box.clickPointSprite = this.addSomethingToRenderer(this.texture('MouseXGreen'), 'foreground', {x: -50, y: -50});
                this.box.clickPointSprite.scale.x = .25;
                this.box.clickPointSprite.scale.y = .25;

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
                    var loneSoldier;
                    if(pendingBodyCount == 1) {
                        loneSoldier = this.box.pendingSelections[parseInt(Object.keys(this.box.pendingSelections)[0])];
                    }
                    else {
                        loneSoldier = null;
                    }

                    //if nothing pending, take no action
                    if(pendingBodyCount == 0) {
                        return;
                    }

                    //handle shift functionality
                    if(keyStates['Shift']) {
                        //if one, already-selected body is requested here, remove from selection
                        if(loneSoldier && ($.inArray(loneSoldier.id.toString(), Object.keys(this.box.selectedBodies)) > -1)) {
                            changeSelectionState(loneSoldier, 'selected', false);
                            delete this.box.selectedBodies[loneSoldier.id];
                        }
                        else { //else add to current selection
                            //if we have multiple things selected (from drawing a box) this will override the permaPendingBody, unless permaPendingBody was also selected in the box
                            if(this.box.permaPendingBody && pendingBodyCount > 1 && this.box.selectionBoxActive && !this.box.boxContainsPermaPending) {
                                changeSelectionState(this.box.permaPendingBody, 'selectionPending', false);
                                delete this.box.pendingSelections[this.box.permaPendingBody.id]
                            }
                            $.extend(this.box.selectedBodies, this.box.pendingSelections)
                        }
                    } else { //else create a brand new selection (don't add to current selection)
                        //if we have multiple things selected (from drawing a box) this will override the permaPendingBody, unless permaPendingBody was also selected in the box
                        if(this.box.permaPendingBody && pendingBodyCount > 1 && this.box.selectionBoxActive && !this.box.boxContainsPermaPending) {
                            changeSelectionState(this.box.permaPendingBody, 'selectionPending', false);
                            delete this.box.pendingSelections[this.box.permaPendingBody.id]
                        }
                        changeSelectionState(this.box.selectedBodies, 'selected', false);
                        this.box.selectedBodies = $.extend({}, this.box.pendingSelections);
                    }

                    //asssign the selected unit
                    if(Object.keys(this.box.selectedBodies).length > 0) {
                        this.selectedUnit = this.box.selectedBodies[Object.keys(this.box.selectedBodies)[0]];
                    }

                    //show group destination of selected
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

                    //update visuals
                    changeSelectionState(this.box.pendingSelections, 'selectionPending', false);
                    changeSelectionState(this.box.selectedBodies, 'selected', true);

                    //update state
                    this.box.permaPendingBody = null;
                    this.box.pendingSelections = {};

                    //update selected attribute
                    $.each(Matter.Composite.allBodies(this.renderer.engine.world), function(index, body) {
                        body.isSelected = false;
                    })

                    $.each(this.box.selectedBodies, function(key, body) {
                        body.isSelected = true;
                    })

                }.bind(this);

                //attach mouse events to body (whole page) so that the selection box will support mouse events off-canvas
                $('body').on('mousedown.selectionBox', function(event) {
                    var canvasPoint = {x: 0, y: 0};
                    var specifiedAttackTarget = null;
                    this.renderer.interaction.mapPositionToPoint(canvasPoint, event.clientX, event.clientY);

                    //left click
                    if(event.which == 1) {

                        this.box.mouseDown = true;
                        this.box.originalPoint = canvasPoint;

                        //find bodies under mouse, use the vertice history method if possible
                        var bodies = [];
                        if(this.verticeHistories.length > 0) {
                            $.each(this.verticeHistories, function(index, body) {
                                if(!body.verticeCopy) return;// || !body.isSelectable) return;
                                if(Matter.Vertices.contains(body.verticeCopy, this.box.originalPoint)) {
                                    bodies.push(body);
                                }
                            }.bind(this));
                        } else {
                            bodies = Matter.Query.point(Matter.Composite.allBodies(this.renderer.engine.world), this.box.originalPoint);
                        }

                        //this is a perma body which we'll add to the pending selection, or we're trying to attack a singular target
                        var singleAttackTarget = null;
                        $.each(bodies, function(key, body) {
                            if(body.isSelectable && !this.attackMove) {
                                this.box.pendingSelections[body.id] = body; //needed for a special case when the game starts - no longer need this (i think)
                                changeSelectionState(body, 'selectionPending', true);
                                this.box.permaPendingBody = body;
                            } else if(this.attackMove && body.isAttackable) {
                                singleAttackTarget = body;
                            }
                        }.bind(this));

                        //attacker functionality
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
                                        body.unit.attackMove(canvasPoint);
                                    }
                                } else if(body.isMoveable) {
                                    body.unit.groupRightClick(canvasPoint);
                                }
                            }.bind(this))
                            this.attackMove = false; //invalidate the key pressed state

                            return;
                        }

                        if(this.abilityDispatch) {
                            if(this.selectedUnit.unit.keyMappings[this.abilityDispatch]) {
                                this.selectedUnit.unit.keyMappings[this.abilityDispatch].call(this.selectedUnit.unit, canvasPoint);
                                this.abilityDispatch = false;
                            }
                        }

                        var pendingBodyCount = Object.keys(this.box.pendingSelections).length;
                        var loneSoldier;
                        if(pendingBodyCount == 1) {
                            loneSoldier = this.box.pendingSelections[parseInt(Object.keys(this.box.pendingSelections)[0])];
                        }
                        else {
                            loneSoldier = null;
                        }
                        //handle control+click on mousedown (this is based on the sc2 controls)
                        if(keyStates['Control'] && !this.box.selectionBoxActive && pendingBodyCount == 1) {//handle control clicking
                            var likeTypes = $.each(Matter.Composite.allBodies(this.renderer.engine.world), function(index, body) {
                                if(body.typeId == loneSoldier.typeId) {
                                    this.box.pendingSelections[body.id] = body;
                                }
                            }.bind(this))

                            //immediately execute a selection (again, based on sc2 style)
                            executeSelection();
                            this.box.invalidateNextMouseUp = true; //after a control click, mouseup does not execute a selection (sc2)
                            this.box.invalidateNextBox = true;
                        }
                    }

                    //right click - this should be modular in order to easily apply different right-click actions
                    if(event.which == 3 && !this.box.selectionBoxActive) {
                        //if we've pressed 'a' then right click, cancel the attack move and escape this flow
                        if(this.attackMove) {
                            this.attackMove = false;
                            this.box.invalidateNextBox = false;
                            return;
                        }

                        $.each(this.box.selectedBodies, function(key, body) {
                            if(body.isMoveable) {
                                body.unit.groupRightClick(canvasPoint);
                                if(Object.keys(this.box.selectedBodies).length == 1)
                                    body.isSoloMover = true;
                                else
                                    body.isSoloMover = false;
                                /*var velocityVector = Matter.Vector.sub(canvasPoint, body.position);
                                var velocityScale = body.moveSpeed/Matter.Vector.magnitude(velocityVector);
                                Matter.Body.setVelocity(body, Matter.Vector.mult(velocityVector, velocityScale));*/
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

                //mouse hover
                var pastHoveredBodies = [];
                this.addTickCallback(function(event) {
                    if(!this.box.selectionBoxActive) {
                        //if we have a perma, we won't act on hovering pending selections, so break here
                        if(this.box.permaPendingBody) return;

                        this.box.pendingSelections = {};

                        //find bodies under mouse which are selectable, use the vertice history method if possible
                        var bodies = [];
                        if(this.verticeHistories.length > 0) {
                            $.each(this.verticeHistories, function(index, body) {
                                if(!body.verticeCopy) return;
                                if(Matter.Vertices.contains(body.verticeCopy, this.mousePosition)) {
                                    bodies.push(body);
                                }
                            }.bind(this));
                        } else {
                            bodies = Matter.Query.point(Matter.Composite.allBodies(this.renderer.engine.world), this.mousePosition);
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

                this.addBody(this.box);
            }

            this.regulationPlay = $.Deferred();
            this.regulationPlay.done(this.endGame.bind(this));
        },

        _initStartGameState: function() {
            //init the start time
            this.timeLeft = (this.victoryCondition.limit+1)*1000;
            this.lives = this.victoryCondition.limit;
        },

        endGame: function(options) {
            this.gameState = "ending";
            this.nuke({savePersistables: true});
            var scoreSubmission = $.Deferred();

            this.endGameSound.play();

            if(this.selectionBox) {

            }

            //prompt for the score
            setTimeout(function(){
                this.scoreContainer = $('<div>').appendTo('#gameTheater');
                this.nameInput = $('<input>', {'class': 'nameInput'}).appendTo(this.scoreContainer);
                this.submitButton = $('<div>', {'class': 'submitButton'}).appendTo(this.scoreContainer).text('Submit').on('click', function() {
                    $(this.scoreContainer).remove();
                    scoreSubmission.resolve();
                    hs.ps(this.gameName, $(this.nameInput).val(), this.score.scoreValue, this.s, this.showWave ? this.wave.waveValue : null, this.subLevel ? this.subLevel : null);
                    gtag('event', 'submission', {
                      'event_category' : 'score',
                      'event_label' : this.gameName + " - " + $(this.nameInput).val() + " - " + this.score.scoreValue,
                    });
                }.bind(this));

                this.continueButton= $('<div>', {'class': 'playAgainButton'}).appendTo(this.scoreContainer).text('Play Again').on('click', function() {
                    $(this.scoreContainer).remove();
                    scoreSubmission.resolve();
                }.bind(this));

                $(this.scoreContainer).css('position', 'absolute')
                $(this.scoreContainer).css('left', this.canvasRect.left + this.canvasRect.width/2-$(this.scoreContainer).width()/2);
                $(this.scoreContainer).css('top', this.canvasRect.top + this.canvasRect.height/2 - $(this.scoreContainer).height()/2);
            }.bind(this), 500);

            if(this.endGameExtension)
                this.endGameExtension();

            //reset to beginning
            scoreSubmission.done(this.resetGame.bind(this));
        },

        /*
         * Utilities
         */

        addUnit: function(unit, trackVerticeHistory) {
            this.addBody(unit.body, trackVerticeHistory);
            Matter.Events.trigger(unit, 'addUnit', {});
        },

        addBody: function(body, trackVerticeHistory) {

            //if we've added a unit, call down to its body
            if(body.isUnit) {
                body = body.body;
            }

            //init these damn things, is there a better way?
            /*if(body._initAttacker) {
                body._initAttacker();
            }

            if(body.moveableInit) {
                body.moveableInit();
            }*/

            //track the team this unit is on
            if(body.team) {
                if(!this.bodiesByTeam[body.team]) {
                    this.bodiesByTeam[body.team] = [body];
                } else {
                    this.bodiesByTeam[body.team].push(body);
                }
            }

            if(trackVerticeHistory)
                this.verticeHistories.push(body);

            //add to matter world
            Matter.World.add(this.world, body);
        },

        removeBodies: function(bodies) {
            var copy = bodies.slice();
            $.each(copy, function(index, body) {
                this.removeBody(body);
            }.bind(this))
        },

        removeUnit: function(unit) {
            Matter.Events.trigger(unit, "onremove", {});
            //clear slaves (deathPact())
            if(unit.slaves) {
                $.each(unit.slaves, function(index, slave) {
                    if(slave.isUnit)
                        this.removeUnit(slave);
                    else if(!$.isFunction(slave))
                        this.removeBody(slave);
                    else
                        this.removeTickCallback(slave);
                }.bind(this));
            }
            this.removeBody(unit.body);
            Matter.Events.off(unit);
        },

        removeBody: function(body) {

            //just in case?
            if(body.hasBeenRemoved) return;

            //trigger our own event
            Matter.Events.trigger(body, "onremove", {});

            //clear slaves (deathPact())
            if(body.slaves) {
                $.each(body.slaves, function(index, slave) {
                    this.removeBody(slave);
                }.bind(this));
            }

            //turn off events on this body (probably doesn't actually matter since the events live of the object itself)
            Matter.Events.off(body);

            //remove body from world
            Matter.World.remove(this.world, [body]);

            //clean up vertice history and bodiesByTeam
            var index = this.verticeHistories.indexOf(body);
            if(index > -1)
                this.verticeHistories.splice(index, 1);

            if(body.team) {
                var bbtindex = this.bodiesByTeam[body.team].indexOf(body);
                if(bbtindex > -1)
                    this.bodiesByTeam[body.team].splice(bbtindex, 1);
            }

            //clean up selection box data related to this body
            if(this.selectionBox && body.isSelectable) {
                delete this.box.selectedBodies[body.id];
                delete this.box.pendingSelections[body.id];
            }

            //for internal use
            body.hasBeenRemoved = true;
        },

        //apply something to bodies by team
        applyToBodiesByTeam: function(teamPredicate, bodyPredicate, f) {
            teamPredicate = teamPredicate || true;
            bodyPredicate = bodyPredicate || true;
            $.each(this.bodiesByTeam, function(i, team) {
                if(teamPredicate(team)) {
                    $.each(team, function(i, body) {
                        if(bodyPredicate(body)) {
                            f(body);
                        }
                    })
                }
            })
        },

        /*
         * Method to...
         * Clean up unwanted DOM/pixi-interactive listeners
         * Clean up unwanted Matter listeners (tick callbacks)
         * Remove all bodies from the matter world
         * Clear the matter engine (I think this zeroes-out collision state)
         * Clear unwanted timers
         * Clear (and destroy) unwanted Pixi objects
         * With options.noMercy=true, everything dies, otherwise objs with a 'persists' attribute will survive
         */
        nuke: function(options) {

            options = options || {};

            //re-enable right click
            $('body').off("contextmenu.common");

            //re-enable tab navigation
            $('body').off("keydown.common");

            //re-enable default click
            $('#gameTheater').off('mousedown.prevent');

            if(this.nukeExtension) {
                this.nukeExtension(options);
            }

            if(!this.world) return;

            //remove bodies safely
            this.removeBodies(this.world.bodies);
            Matter.World.clear(this.world, false);

            //clear the engine (clears broadphase state)
            Matter.Engine.clear(this.engine);

            //clear the renderer
            this.renderer.clear(options.noMercy, options.savePersistables);

            this.clearListeners(options.noMercy);
            this.clearTickCallbacks(options.noMercy);
            this.invalidateTimers(options.noMercy);
            this.verticeHistories = [];

            if(options.noMercy) {
                $('body').off();
            }

            if(this.selectionBox) {
                if(this.box) {
                    Matter.Events.off(this.box, 'onCollide');
                    this.box = null;
                }
                $('body').off('mousedown.selectionBox');
                $('body').off('mousemove.selectionBox');
                $('body').off('mouseup.selectionBox');
                $('body').off('keydown.selectionBox');
                $('body').off('keyup.selectionBox');
                $('body').off('keypress.selectionBox'); //remove if games seem normal
            }
        },

        distanceBetweenBodies: function(bodyA, bodyB) {
            var a = bodyA.position.x - bodyB.position.x;
            var b = bodyA.position.y - bodyB.position.y;
            return Math.sqrt(a*a + b*b);
        },

        resetGame: function() {
            if(this.score)
                this.removeSomethingFromRenderer(this.score);
            if(this.wave)
                this.removeSomethingFromRenderer(this.wave);
            if(this.resetGameExtension)
                this.resetGameExtension();

            this.preGame();
        },

        //need to redesign this method, it's so confusingly dumb
        getAnimation: function(baseName, transform, speed, where, playThisManyTimes, rotation, body, numberOfFrames, startFrameNumber, bufferUnderTen) {
            var frames = [];
            var numberOfFrames = numberOfFrames || PIXI.Loader.shared[baseName+'FrameCount'] || 10;
            var startFrame = (startFrameNumber == 0 ? 0 : startFrameNumber || 1);
            for(var i = startFrame; i < startFrame + numberOfFrames; i++) {
                try {
                    var j = i;
                    if(bufferUnderTen && j < 10)
                        j = "0" + j;
                    frames.push(PIXI.Texture.from(baseName+j+'.png'));
                } catch(err) {
                    try {
                            frames.push(PIXI.Texture.from(baseName+i+'.jpg'));
                        } catch(err) {
                            break;
                    }
                }
            }

            var anim = new PIXI.AnimatedSprite(frames);
            anim.onComplete = function() {
                this.removeSomethingFromRenderer(anim)
            }.bind(this);
            anim.persists = true;
            anim.setTransform.apply(anim, transform);
            anim.animationSpeed = speed;
            anim.loop = playThisManyTimes < 0;

            if(rotation)
                anim.rotation = rotation;

            if(playThisManyTimes && playThisManyTimes > 0) {
                var origOnComplete = anim.onComplete;
                playThisManyTimes -= 1;
                anim.onComplete = function() {
                    if(playThisManyTimes) {
                        anim.gotoAndPlay(0);
                        playThisManyTimes--;
                    } else {
                        origOnComplete.call(anim);
                    }
                }
            }

            //if body is given, let's apply the same anchor to this animation
            var options = {};
            if(body) {
                options.anchor = {};
                options.anchor.x = body.render.sprite.xOffset;
                options.anchor.y = body.render.sprite.yOffset;
            }

            this.addSomethingToRenderer(anim, where, options);
            return anim;
        },

        /*
         * options {
         *  numberOfFrames
         *  startFrameNumber
         *  baseName
         *  bufferUnderTen
         *  transform
         *  speed
         *  playThisManyTimes
         *  rotation
         *  body
         *  where
         *  onComplete
         */
        getAnimationB: function(options) {
            var frames = [];
            var anim = null;
            if(options.numberOfFrames) {
                var numberOfFrames = options.numberOfFrames || PIXI.Loader.shared[options.baseName+'FrameCount'] || 10;
                var startFrame = (options.startFrameNumber == 0 ? 0 : options.startFrameNumber || 1);
                for(var i = startFrame; i < startFrame + numberOfFrames; i++) {
                    try {
                        var j = i;
                        if(options.bufferUnderTen && j < 10)
                            j = "0" + j;
                        frames.push(PIXI.Texture.from(options.baseName+j+'.png'));
                    } catch(err) {
                        try {
                                frames.push(PIXI.Texture.from(options.baseName+i+'.jpg'));
                            } catch(err) {
                                break;
                        }
                    }
                }
                anim = new PIXI.AnimatedSprite(frames);
            } else {
                anim = new PIXI.AnimatedSprite(PIXI.Loader.shared.resources[options.spritesheetName].spritesheet.animations[options.animationName]);
            }


            anim.onComplete = function() { //default onComplete function
                this.removeSomethingFromRenderer(anim)
            }.bind(this);
            anim.persists = true;
            anim.setTransform.apply(anim, options.transform || [-1000, -1000]);
            anim.animationSpeed = options.speed;
            anim.loop = options.playThisManyTimes == 'loop';
            anim.playThisManyTimes = options.playThisManyTimes;
            anim.currentPlayCount = options.playThisManyTimes;

            if(options.rotation)
                anim.rotation = options.rotation;

            if(!anim.loop && anim.currentPlayCount && anim.currentPlayCount > 0) {
                anim.onManyComplete = anim.onComplete; //default to remove the animation
                anim.onComplete = function() { //override onComplete to countdown the specified number of times
                    if(anim.currentPlayCount) {
                        console.info(anim.currentPlayCount);
                        anim.gotoAndPlay(0);
                        anim.currentPlayCount--;
                    } else {
                        anim.onManyComplete.call(anim);
                    }
                }
            }

            //if body is given, let's apply the same anchor to this animation
            var rendOptions = {};
            if(options.body) {
                rendOptions.anchor = {};
                rendOptions.anchor.x = options.body.render.sprite.xOffset;
                rendOptions.anchor.y = options.body.render.sprite.yOffset;
            }

            this.addSomethingToRenderer(anim, options.where, rendOptions);
            return anim;
        },


        addTimer: function(timer) {
            this.timers[timer.name] = timer;
            timer.originalRuns = timer.runs;

            //add a reset method to the timer
            if(!timer.reset) timer.reset = timer.execute = function() {
                this.timeElapsed = 0;
                this.percentDone = 0;

                if(this.runs == 0)
                    this.runs = null;
                this.done = false;
                this.started = false;
                this.paused = false;
                this.invalidated = false;
            }

            return timer;
        },
        invalidateTimer: function(timer) {
            if(!timer) return;
            timer.invalidated = true;
            delete this.timers[timer.name];
        },
        addToTimer: function(timer, amount) {
            timer.timeElapsed -= amount;
        },
        getTimer: function(timerName) {
            return this.timers[timerName];
        },
        invalidateTimers: function(clearPersistables) {
            $.each(this.timers, function(i, timer) {
                if(timer && !clearPersistables && timer.persists) return;
                this.invalidateTimer(timer);
            }.bind(this));
        },

        //https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors - with some modifications
        shadeBlendConvert: function(p, from, to) {
            if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
            if(!this.sbcRip)this.sbcRip=function(d){
                var l=d.length,RGB=new Object();
                if(l>9){
                    d=d.split(",");
                    if(d.length<3||d.length>4)return null;//ErrorCheck
                    RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
                }else{
                    if(l==8||l==6||l<4)return null; //ErrorCheck
                    if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
                    d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
                }
                return RGB;}
            var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=this.sbcRip(from),t=this.sbcRip(to);
            if(!f||!t)return null; //ErrorCheck
            if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
            else return (0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2]));
        },

        addLives: function(numberOfLives) {
            if(numberOfLives < 0) {
                this.loseLife();
                //shake life text
                self = this;
                this.addTimer({name: 'shakeLifeTimer', timeLimit: 48, runs: 12, callback: function() {
                    self.hudLives.position = {x: self.hudLives.x + (this.runs%2==0 ? 1 : -1)*2, y: self.hudLives.y};
                    if(this.runs%2==0) {
                        self.hudLives.style = styles.redScoreStyle;
                    } else {
                        self.hudLives.style = styles.scoreStyle;
                    }
                }})
            }

            this.lives = this.lives + numberOfLives;
            if(this.lives < 0) this.lives = 0;
            if(this.lives <= 0)
                this.regulationPlay.resolve();
            this.hudLives.text = "Lives: " + this.lives;
        },
        loseLife: function() {
            this.loseLifeSound.play();
            var self = this;
            var runs = 8;
            var timer = this.getTimer('lifeFlash');
        },
        addToGameTimer: function(amount) { //in millis
            this.timeLeft  += amount;
        },

        /*
         * Event Utils
         */
        addListener: function(eventName, handler, invincible, isPixiInteractive) {
            var listener = {eventName: eventName, handler: handler};
            if(isPixiInteractive) {
                if(invincible)
                    this.invincibleListeners.push(listener);
                else
                    this.eventListeners.push(listener);
                this.renderer.interactiveObject.on(eventName, handler);
            } else {
                if(invincible)
                    this.invincibleListeners.push(listener);
                else
                    this.eventListeners.push(listener);
                this.canvasEl.addEventListener(eventName, handler);
            }
            return listener;
        },
        removeListener: function(listener) {
            if(this.eventListeners.indexOf(listener) > 0)
                this.canvasEl.removeEventListener(this.eventListeners[this.eventListeners.indexOf(listener)].eventName, this.eventListeners[this.eventListeners.indexOf(listener)].handler);
                this.renderer.interactiveObject && this.renderer.interactiveObject.removeListener(this.eventListeners[this.eventListeners.indexOf(listener)].eventName, this.eventListeners[this.eventListeners.indexOf(listener)].handler);
                this.eventListeners.splice(this.eventListeners.indexOf(listener), 1);
        },
        clearListeners: function(noMercy) {
            this.eventListeners.forEach(function(listener) {
                this.canvasEl.removeEventListener(listener.eventName, listener.handler);
                this.renderer.interactiveObject && this.renderer.interactiveObject.removeListener(listener.eventName, listener.handler);
            }.bind(this));
            this.eventListeners = [];

            if(noMercy) {
                this.invincibleListeners.forEach(function(listener) {
                    this.canvasEl.removeEventListener(listener.eventName, listener.handler);
                    this.renderer.interactiveObject && this.renderer.interactiveObject.removeListener(listener.eventName, listener.handler);
                    //Matter.Events.off(this.engine, 'afterTick', callback);
                }.bind(this));
                this.invincibleListeners = [];
            }
        },
        addTickCallback: function(callback, invincible, eventName) {
            var deltaTime = 0, lastTimestamp = 0;
            var self = this;
            var tickDeltaWrapper = function(event) {
                if(tickDeltaWrapper.removePending) return;
                deltaTime = event.timestamp - lastTimestamp;
                lastTimestamp = event.timestamp;
                event.deltaTime = deltaTime;
                if(invincible || (self.gameState == 'playing'))
                    callback(event);
            }

            if(invincible)
                this.invincibleTickCallbacks.push(tickDeltaWrapper);
            else
                this.tickCallbacks.push(tickDeltaWrapper);
            Matter.Events.on(this.engine.runner, eventName || 'afterTick', tickDeltaWrapper);
            return tickDeltaWrapper; //return so you can turn this off if needed
        },

        /*
         * We need to remove the callback from the matter.event system (just stored on the object itself, actually),
         * but I also want to invalidate the callback at this moment.
         * Not doing so creates a confusing phenomen whereby a callback could be triggered after
         * the remove() if we're in the same tick as the remove(). One would expect that the remove() call would
         * prevent all subsequent invocations of the callback().
         */
        removeTickCallback: function(callback) {
            //remove from matter system
            Matter.Events.off(this.engine, callback);
            Matter.Events.off(this.engine.runner, callback);

            //remove from our internal lists here
            if(this.invincibleTickCallbacks.indexOf(callback) > -1) {
                this.invincibleTickCallbacks.splice(this.invincibleTickCallbacks.indexOf(callback), 1)
            }
            if(this.tickCallbacks.indexOf(callback) > -1) {
                this.tickCallbacks.splice(this.tickCallbacks.indexOf(callback), 1)
            }

            //invalidate per the comment above, preventing a confusing phenomenom
            callback.removePending = true;
        },
        clearTickCallbacks: function(noMercy) {
            this.tickCallbacks.forEach(function(callback) {
                Matter.Events.off(this.engine, callback); //clearing listeners on the engine too (despite being deprecated) since the matter-collision-plugin listens on the engine
                Matter.Events.off(this.engine.runner, callback);
            }.bind(this));
            this.tickCallbacks = [];

            if(noMercy) {
                this.invincibleTickCallbacks.forEach(function(callback) {
                    Matter.Events.off(this.engine, callback);
                    Matter.Events.off(this.engine.runner, callback);
                }.bind(this));
                this.invincibleTickCallbacks = [];
            }
        },

        /*
         * Renderer utils
         */
        addSomethingToRenderer: function(something, where, options) {
            if($.type(where) == 'object') {
                options = where;
                where = null;
            }
            options = options || {};

            something = this.renderer.itsMorphinTime(something, options);
            if(options.position) {
                options.x = options.position.x;
                options.y = options.position.y;
            }

            if(options.filter) {
                options.filter.uniforms.mouse = {x: 50, y: 50};
                options.filter.uniforms.resolution = {x: this.canvas.width, y: this.canvas.height};
                something.filters = [options.filter];
            }
            if(options.height)
                something.height = options.height;
            if(options.width)
                something.width = options.width;
            if(options.x)
                something.position.x = options.x;
            if(options.y)
                something.position.y = options.y;
            if(options.scale)
                something.scale = options.scale;
            if(options.anchor) {
                something.anchor = options.anchor;
            } else {
                something.anchor = {x: .5, y: .5};
            }
            if(options.tint)
                something.tint = options.tint;
            if(options.rotation)
                something.rotation = options.rotation;

            this.renderer.addToPixiStage(something, where);
            return something;
        },
        removeSomethingFromRenderer: function(something, where) {
            where = where || something.myLayer || 'stage';
            this.renderer.removeFromPixiStage(something, where);
        },

        /*
         * Texture Util
         */
        getPreloadedTexture: function(name) {
            //return PIXI.loader.resources[name].texture;
            return name;
        },

         /*
          * Score Utils
          */
        incrementScore: function(value) {
            this.score.scoreValue += value;
            this.score.text = this.baseScoreText + this.score.scoreValue;
        },
        setScore: function(value) {
            this.score.scoreValue = value;
            this.score.text = this.baseScoreText + this.score.scoreValue;
        },
        setWave: function(value) {
            this.wave.waveValue = value;
            this.wave.text = this.baseWaveText + this.wave.waveValue + (this.subLevel ? "." + this.subLevel : "");
        },
        setSubLevel: function(value) {
            this.subLevel = value;
            this.setWave(this.wave.waveValue);
        },
        getScore: function() {
            return this.score.scoreValue;
        },

        scaleBody: function(body, x, y) {
            Matter.Body.scale(body, x, y);
            body.render.sprite.xScale *= x;
            body.render.sprite.yScale *= y;

            //if we're flipping just by 1 axis, we need to reverse the vertices to maintain clockwise ordering
            if(x*y < 0) {
                $.each(body.parts, function(i, part) {
                    part.vertices.reverse();
                });
            }
        },

        bodyRanOffStage: function(body) {
            if(body.velocity.x < 0 && body.bounds.max.x < 0)
                return true;
            if(body.velocity.x > 0 && body.bounds.min.x > this.canvasEl.getBoundingClientRect().width)
                return true;
            if(body.velocity.y > 0 && body.bounds.min.y > this.canvasEl.getBoundingClientRect().height)
                return true;
            if(body.velocity.y < 0 && body.bounds.max.y < 0)
                return true;
        },

        isSpriteBelowStage: function(sprite) {
            var deletePointAdjustment = sprite.anchor.x * sprite.height;
            if(sprite.position.y - deletePointAdjustment > this.canvas.height)
                return true;
            return false;
        },

        calculateRandomPlacementForBodyWithinCanvasBounds: function(body, neatly) {
            var placement = {};
            var bodyWidth = (body.bounds.max.x - body.bounds.min.x);
            var XRange = Math.floor(this.getCanvasWidth()/bodyWidth);
            var bodyHeight = (body.bounds.max.y - body.bounds.min.y);
            var YRange = Math.floor(this.getCanvasHeight()/bodyHeight);
            var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
            var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
            if(neatly) {
                var Xtile = this.getIntBetween(0, XRange-1);
                var Ytile = this.getIntBetween(0, YRange-1);
                placement.x = Xtile*bodyWidth + bodyHalfWidth;
                placement.y = Ytile*bodyHeight + bodyHalfHeight;
            } else {
                placement.x = Math.random() * (this.canvasEl.getBoundingClientRect().width - bodyHalfWidth*2) + bodyHalfWidth;
                placement.y = Math.random() * (this.canvasEl.getBoundingClientRect().height - bodyHalfHeight*2) + bodyHalfHeight;
            }

            return placement;
        },

        placeBodyWithinCanvasBounds: function(body) {
            //if we've added a unit, call down to its body
            if(body.isUnit) {
                body = body.body;
            }
            var placement = {};
            var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
            var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
            placement.x = Math.random() * (this.canvasEl.getBoundingClientRect().width - bodyHalfWidth*2) + bodyHalfWidth;
            placement.y = Math.random() * (this.canvasEl.getBoundingClientRect().height - bodyHalfHeight*2) + bodyHTalfHeight;
            Matter.Body.setPosition(body, placement);
            return placement;
        },

        placeBodyWithinRadiusAroundCanvasCenter: function(body, radius) {
            //if we've added a unit, call down to its body
            if(body.isUnit) {
                body = body.body;
            }
            var placement = {};
            var bodyHalfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
            var bodyHalfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
            canvasCenter = this.getCanvasCenter();
            placement.x = canvasCenter.x-radius + (Math.random() * (radius*2 - bodyHalfWidth*2) + bodyHalfWidth);
            placement.y = canvasCenter.y-radius + (Math.random() * (radius*2 - bodyHalfHeight*2) + bodyHalfHeight);
            Matter.Body.setPosition(body, placement);
            return placement;
        },

        isoDirectionBetweenPositions: function(v1, v2) {

            var angle = Matter.Vector.angle({x: 0, y: 0}, Matter.Vector.sub(v2, v1));
            var dir = null;
            if(angle >= 0) {
                if(angle < Math.PI/8) {
                    dir = 'right';
                } else if(angle < Math.PI*3/8) {
                    dir = 'downRight';
                } else if(angle < Math.PI*5/8) {
                    dir = 'down';
                } else if(angle < Math.PI*7/8){
                    dir = 'downLeft';
                } else {
                    dir = 'left';
                }
            } else {
                if(angle > -Math.PI/8) {
                    dir = 'right';
                } else if(angle > -Math.PI*3/8) {
                    dir = 'upRight';
                } else if(angle > -Math.PI*5/8) {
                    dir = 'up';
                } else if(angle > -Math.PI*7/8){
                    dir = 'upLeft';
                } else {
                    dir = 'left';
                }
            }
            return dir;
        },

        getCanvasCenter: function() {
          return {x: this.canvasEl.getBoundingClientRect().width/2, y: this.canvasEl.getBoundingClientRect().height/2};
        },

        getCanvasHeight: function() {
          return this.canvasEl.getBoundingClientRect().height;
        },

        getCanvasWidth: function() {
          return this.canvasEl.getBoundingClientRect().width;
        },

        getSound: function(name, options) {
            options = options || {};
            options.src = '/app/Sounds/' + name;
            return new h.Howl(options);
        },

        //1, 4 return an int in (1, 2, 3, 4)
        getRandomIntInclusive: function(low, high) {
            return Math.floor(Math.random() * (high-low+1) + low);
        },

        cloneVertices: function(vertices) {
            var newVertices = [];
            $.each(vertices, function(index, vertice) {
                newVertices.push({x: vertice.x, y: vertice.y})
            })
            return newVertices;
        },

        cloneParts: function(parts) {
            var newParts = [];
            $.each(parts, function(index, part) {
                newParts.push({vertices: this.cloneVertices(part.vertices)});
            }.bind(this))
            return newParts;
        },

        floatSprite: function(sprite) {
            sprite.alpha = 1.4;
            this.addTimer({name: this.uuidv4(), timeLimit: 16, runs: 34, callback: function() {
                sprite.position.y -= 1;
                sprite.alpha -= 1.4/34;
            }, totallyDoneCallback: function() {
                this.removeSomethingFromRenderer(sprite, 'foreground');
            }.bind(this)})
        },

        floatText: function(text, position, options) {
            options = options || {};
            if(options.textSize) {
                var newStyle = $.extend({}, styles.style, {fontSize: options.textSize})
            } else {
                newStyle = styles.style;
            }
            var startGameText = this.addSomethingToRenderer("TEXT:"+text, 'hud', {style: options.style || newStyle, x: this.canvas.width/2, y: this.canvas.height/2});
            startGameText.position = position;
            startGameText.alpha = 1.4;
            this.addTimer({name: this.uuidv4(), timeLimit: 32, runs: options.runs || 30, callback: function() {
                if(!options.stationary) {
                    startGameText.position.y -= 1;
                }
                startGameText.alpha -= 1.4/(options.runs || 34);
            }, totallyDoneCallback: function() {
                this.removeSomethingFromRenderer(startGameText, 'hud');
                if(options.deferred) options.deferred.resolve()
            }.bind(this)})
        },

        praise: function(options) {
            if(!options) {
                options = {style: styles.praiseStyle}
            } else if (!options.style) {
                options.style = styles.praiseStyle;
            }
            var praiseWord = praiseWords[this.getIntBetween(0, praiseWords.length-1)] + "!";
            this.floatText(praiseWord, options.position || this.getCanvasCenter(), options);
        },

        uuidv4: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        setCursorStyle: function(style) {
            $('*').css('cursor', style);
        },

        //death pact currently supports other units, bodies, and tick callbacks
        deathPact: function(master, slave) {
            if(!master.slaves)
                master.slaves = [];
            master.slaves.push(slave);
        },

        createParticleEmitter: function(where, config) {
            // Create a new emitter
            var emitter = new PIXI.particles.Emitter(

                // The PIXI.Container to put the emitter in
                // if using blend modes, it's important to put this
                // on top of a bitmap, and not use the root stage Container
                where,

                // The collection of particle images to use
                [PIXI.Texture.fromImage('https://skillexplosion.com/app/Textures/particle.png')],

                // Emitter configuration, edit this to change the look
                // of the emitter
                config
            );

            // Calculate the current time
            var elapsed = Date.now();

            // Update function every frame - though it seems we don't need this when doing playOnceAndDestroy()
            emitter.startUpdate = function(){

                // Update the next frame
                requestAnimationFrame(emitter.startUpdate);

                var now = Date.now();

                // The emitter requires the elapsed
                // number of seconds since the last update
                emitter.update((now - elapsed) * 0.001);
                elapsed = now;
            };

            // Start emitting
            emitter.emit = false;

            return emitter;
        },

        //method to normalize setting a matter js body
        setVelocity: function(body, velocity) {
            //normalize to 16.6666 ms per frame
            var normalizedVelocity = (this.engine.delta / (1000/60)) * velocity;
            Matter.Body.setVelocity(body, normalizedVelocity);
        },

        signalNewWave: function(wave, deferred) {
            this.floatText("Wave: " + wave, this.getCanvasCenter(), {runs: 100, stationary: true, style: styles.newWaveStyle, deferred: deferred});
        },

        flipCoin: function() {
            return Math.random() > .5;
        },

        rgbToHex: function (red, green, blue) {
          var r = Number(Math.floor(red)).toString(16);
          if (r.length < 2) {
               r = "0" + r;
          }

          var g = Number(Math.floor(green)).toString(16);
          if (g.length < 2) {
               g = "0" + g;
          }

          var b = Number(Math.floor(blue)).toString(16);
          if (b.length < 2) {
               b = "0" + b;
          }

          return "0x" + r + g + b;
      },
    };

    //aliases
    common.addTime = common.addToGameTimer;
    common.texture = common.getPreloadedTexture;
    common.addRunnerCallback = common.addTickCallback;
    common.removeRunnerCallback = common.removeTickCallback;
    common.addBodies = common.addBody;
    common.listeners = common.eventListeners;
    common.addEventListener = common.addListener;
    common.addTickListener = common.addTickCallback;
    common.removeEventListener = common.removeListener;
    common.removeText = common.removeSprite;
    common.offStage = common.bodyRanOffStage;
    common.getIntBetween = common.getRandomIntInclusive;

    return common;
})
