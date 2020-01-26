/*
 * This module is meant to provide common, game-lifecycle functionality, utility functions, and matter.js/pixi objects to a specific game module
 */

define(['matter-js', 'pixi', 'jquery', 'utils/HS', 'howler', 'utils/Styles', 'utils/GameUtils', 'utils/UnitSystem'], function(Matter, PIXI, $, hs, h, styles, utils, UnitSystem) {

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
        unitSelectionSystem: false,
        clickAnywhereToStart: "Click anywhere to start",
        frames: 0,
        frameSecondCounter: 0,
        playerTeam: 100,

        /*
         * Game lifecycle
         *
         * init:      instance variables, setup listeners which will persist throughout the life of the canvas. Calls initExtension() which
         *            can be implemented by each specific game. Called once per lifetime of entire game by CommonGameStarter.
         * preGame:   game state prior to playing the game, typically a 'click to proceed' screen. Calls preGameExtension().
         * startGame: create game objects and game listeners (those that will be cleaned up after victory is satisfied)
         *            calls play() which is meant to be implemented by each individual game in which game-specific obj are created
         * endGame:   actions to take once victory is satisfied. Go to score screen, then reset game (call's start). Calls endGameExtension().
         * resetGame: called after endGame is completed. Jumps to preGame. Calls resetGameExtension().
         */
        init: function(options) {

            /*
             * Blow up options into properties
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
            this.endGameSound = utils.getSound('bells.wav', {volume: .05});
            this.loseLifeSound = utils.getSound('loselife1.mp3', {rate: 1.4, volume: 5.0});
            this.s = {s: 0, t: 0, f: 0, w: 0, sl: 0};
            var is = this['incr' + 'ement' + 'Sco' + 're'].bind(this);
            this.bodiesByTeam = {};

            /*
             * Incorporate UnitSystem if specified
             */
             if(this.enableUnitSystem) {
                 // Create new unit system, letting it share some common game properties
                 this.unitSystem = new UnitSystem(options);
             }

            //begin tracking body vertice histories
            this.addTickCallback(function() {
                $.each(this.verticeHistories, function(index, body) {
                    body.verticeCopy = utils.cloneVertices(body.vertices);
                    body.positionCopy = {x: body.position.x, y: body.position.y};
                    body.partsCopy = utils.cloneParts(body.parts);
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

            //fps (crtl + shift + f to toggle)
            this.lastDeltaText = utils.addSomethingToRenderer("TEXT:" + 0 + " ms", 'hud', {x: 32, y: this.canvas.height - 15, style: styles.fpsStyle});
            this.fpsText = utils.addSomethingToRenderer("TEXT:" + "0" + " fps", 'hud', {x: 27, y: this.canvas.height - 30, style: styles.fpsStyle});
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

            if(this.initExtension)
                this.initExtension();
        },

        /*
         * Setup click-to-begin screen
         */
        preGame: function() {

            this.gameState = "pregame";

            //animate the skill explosion website title
            animateTitle();

            //create 'click to begin' text
            var startGameText = utils.addSomethingToRenderer("TEXT:"+this.clickAnywhereToStart, 'hud', {style: styles.style, x: this.canvas.width/2, y: this.canvas.height/2});

            if(this.preGameExtension)
                this.preGameExtension();

            //pregame deferred (proceed to startGame when clicked)
            var proceedPastPregame = $.Deferred();
            if(!this.bypassPregame) {
                $(this.canvasEl).one("mouseup", $.proxy(function(event) {
                    utils.removeSomethingFromRenderer(startGameText);
                    setTimeout(() => proceedPastPregame.resolve(), 10); //dissociate this mouseup event from any listeners setup during startgame, it appears that listeners setup during an event get called during that event.
                }, this));
            }

            proceedPastPregame.done(this.startGame.bind(this));
        },

        /*
         * Init various common game elements
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
            $('#gameTheater').on('mousedown.prevent', (function(e){
                e.preventDefault();
            }));

            //initialize any state needed for each period of play
            this._initStartGameState();

            //create border unless not wanted
            if(!this.noBorder) {
                var border = [];
                if(!this.noCeiling)
                    border.push(Matter.Bodies.rectangle(this.canvas.width/2, -5, this.canvas.width, 10, { isStatic: true, noWire: true}));
                if(!this.noGround)
                    border.push(Matter.Bodies.rectangle(this.canvas.width/2, this.canvas.height+25, this.canvas.width, 50, { isStatic: true, noWire: true}));
                if(!this.noLeftWall)
                    border.push(Matter.Bodies.rectangle(-5, this.canvas.height/2, 10, this.canvas.height, { isStatic: true, noWire: true}));
                if(!this.noRightWall)
                    border.push(Matter.Bodies.rectangle(this.canvas.width+5, this.canvas.height/2, 10, this.canvas.height, { isStatic: true, noWire: true}));

                this.addBodies(border);
            }

            //score overlay
            this.s = {s: 0, t: 0, f: 0};
            if(!this.hideScore) {
                this.score = utils.addSomethingToRenderer("TEXT:" + this.baseScoreText, 'hud', {x: 5, y: 5, anchor: {x: 0, y: 0}, style: styles.scoreStyle});
                this.score.persists = true;
                this.setScore(0);
            }

            //wave overlay
            if(this.showWave) {
                this.wave = utils.addSomethingToRenderer("TEXT:" + this.baseWaveText, 'hud', {x: 5, y: 30, anchor: {x: 0, y: 0}, style: styles.scoreStyle});
                this.wave.persists = true;
                this.setWave(0);
            }

            //timer overlay, if necessary
            if(this.victoryCondition.type == 'timed') {
                this.gameTime = utils.addSomethingToRenderer("TEXT:" + this.victoryCondition.limit, 'hud', {x: this.canvasRect.width/2, y: 5, anchor: {x: .5, y: 0}, style: styles.scoreStyle});
            } else if (this.victoryCondition.type == 'lives') {
                this.hudLives = utils.addSomethingToRenderer("TEXT:" + "Lives: " + this.victoryCondition.limit, 'hud', {x: this.canvasRect.width/2, y: 5, anchor: {x: .5, y: 0}, style: styles.scoreStyle});
            }

            //call the game's play method
            this.play(options);
            this.gameState = "playing";

            //create click indication listener
            if(!this.noClickIndicator) {
                var clickPointSprite = utils.addSomethingToRenderer('MouseX', 'foreground', {x: -50, y: -50});
                clickPointSprite.scale.x = .25;
                clickPointSprite.scale.y = .25;
                this.addEventListener('mousedown', function(event) {
                    clickPointSprite.position = {x: event.data.global.x, y: event.data.global.y};
                }.bind(this), false, true);
            }

            //initialize unitSystem, this creates the selection box, dispatches unit events, etc
            if(this.unitSystem)
                this.unitSystem.initialize();

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
            this.endGameSound.play();
            this.nuke({savePersistables: true});

            //prompt for the score
            var scoreSubmission = $.Deferred();
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

        addUnit: function(unit, trackVerticeHistory) {
            this.addBody(unit.body, trackVerticeHistory);
            Matter.Events.trigger(unit, 'addUnit', {});
        },

        addBody: function(body, trackVerticeHistory) {
            //if we've added a unit, call down to its body
            if(body.isUnit) {
                body = body.body;
            }

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

        //This method has the heart but is poorly designed
        //Right now it'll support slaves which are units, bodies, tickCallbacks, timers, and finally functions to execute
        removeSlaves: function(slaves) {
            $.each(slaves, function(index, slave) {
                if(slave.isUnit) {
                    this.removeUnit(slave);
                    //console.info("removing " + slave)
                }
                else if(slave.render) {
                    this.removeBody(slave);
                    //console.info("removing " + slave)
                }
                else if(slave.isTickCallback) {
                    this.removeTickCallback(slave);
                    // console.info("removing " + slave.slaveId)
                }
                else if(slave.isTimer) {
                    this.invalidateTimer(slave);
                    //console.info("removing " + slave)
                }
                else if(slave instanceof Function) {
                    //console.info("removing " + slave)
                    slave();
                }
            }.bind(this));
        },

        removeUnit: function(unit) {
            Matter.Events.trigger(unit, "onremove", {});
            //clear slaves (deathPact())
            if(unit.slaves) {
                this.removeSlaves(unit.slaves);
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
                this.removeSlaves(body.slaves);
            }

            //turn off events on this body (probably doesn't actually matter since the events live of the object itself)
            Matter.Events.off(body);

            //remove body from world
            Matter.World.remove(this.world, [body]);

            //clean up vertice history
            var index = this.verticeHistories.indexOf(body);
            if(index > -1)
                this.verticeHistories.splice(index, 1);

            //Handle bodiesByTeam. Since bodiesByTeam is a loopable datastructure let's grep instead of splice
            //(don't want to alter the array since we might be iterating over it)
            if(body.team) {
                var bbtindex = this.bodiesByTeam[body.team].indexOf(body);
                if(bbtindex > -1)
                    this.bodiesByTeam[body.team] = $.grep(this.bodiesByTeam[body.team], function(obj, index) {
                            return index != bbtindex;
                    })
            }

            //clean up selection box data related to this body
            // if(this.selectionBox && body.isSelectable) {
            //     delete this.box.selectedBodies[body.id];
            //     delete this.box.pendingSelections[body.id];
            // }

            //for internal use
            body.hasBeenRemoved = true;
        },

        //apply something to bodies by team
        applyToBodiesByTeam: function(teamPredicate, bodyPredicate, f) {
            teamPredicate = teamPredicate || function(team) {return true};
            bodyPredicate = bodyPredicate || function(body) {return true};
            $.each(this.bodiesByTeam, function(i, team) {
                if(teamPredicate(i)) {
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

            //Remove units safely (removeUnit())
            var unitsToRemove = [];
            utils.applyToBodiesByTeam(null, function(body) {
                return body.unit;
            }, function(body) {
                unitsToRemove.push(body.unit);
            }.bind(this));

            $.each(unitsToRemove, function(i, unit) {
                this.removeUnit(unit);
            }.bind(this))

            //Remove bodies safely (removeBodies())
            this.removeBodies(this.world.bodies);

            //Clear the matter world (I cant recall if this is necessary)
            Matter.World.clear(this.world, false);

            //Clear the engine (clears broadphase state)
            Matter.Engine.clear(this.engine);

            //Clear the renderer, save persistables
            this.renderer.clear(options.noMercy, options.savePersistables);

            //Clear listeners, save invincible listeners
            this.clearListeners(options.noMercy);
            this.clearTickCallbacks(options.noMercy);
            this.invalidateTimers(options.noMercy);

            //Clear vertice histories
            this.verticeHistories = [];

            //Clear body listeners if no mercy
            if(options.noMercy) {
                $('body').off();
            }

            //Clear unit system
            if(this.unitSystem) {
                this.unitSystem.cleanUp();
            }
        },

        resetGame: function() {
            if(this.score)
                utils.removeSomethingFromRenderer(this.score);
            if(this.wave)
                utils.removeSomethingFromRenderer(this.wave);
            if(this.resetGameExtension)
                this.resetGameExtension();

            this.preGame();
        },

        addTimer: function(timer) {
            this.timers[timer.name] = timer;
            timer.isTimer = true;
            timer.originalRuns = timer.runs;

            //add a reset method to the timer
            if(!timer.reset) timer.reset = timer.execute = function(options) {
                var options = options || {};
                this.timeElapsed = 0;
                this.percentDone = 0;

                if(this.runs == 0)
                    this.runs = null;
                if(options.runs)
                    this.runs = options.runs;
                if(this.resetExtension)
                    this.resetExtension();
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
                if(lastTimestamp) {
                    deltaTime = event.timestamp - lastTimestamp;
                }
                else {
                    deltaTime = .1666;
                }
                lastTimestamp = event.timestamp;
                event.deltaTime = deltaTime;
                if(invincible || (self.gameState == 'playing'))
                    callback(event);
            }
            tickDeltaWrapper.isTickCallback = true;

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
    };

    //aliases
    common.addTime = common.addToGameTimer;
    common.addRunnerCallback = common.addTickCallback;
    common.removeRunnerCallback = common.removeTickCallback;
    common.addBodies = common.addBody;
    common.listeners = common.eventListeners;
    common.addEventListener = common.addListener;
    common.addTickListener = common.addTickCallback;
    common.removeEventListener = common.removeListener;
    common.removeText = common.removeSprite;

    return common;
})
