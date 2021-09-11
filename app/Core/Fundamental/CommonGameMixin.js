import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import hs from '@utils/HS.js';
import * as h from 'howler';
import styles from '@utils/Styles.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import {
    UnitSystem,
    UnitSystemAssets
} from '@core/Unit/UnitSystem.js';
import Scene from '@core/Scene.js';
import ItemSystem from '@core/Unit/ItemSystem.js';
import CommonGameStarter from '@core/Fundamental/CommonGameStarter.js';
import {
    globals,
    keyStates,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import AssetLoader from '@core/Fundamental/AssetLoader.js';
import seedrandom from 'seedrandom';

/*
 * This module is meant to provide common, game-lifecycle functionality, utility functions, and matter.js/pixi objects to a specific game module
 */
var common = {

    /*
     * Defaults
     */
    victoryCondition: {
        type: 'timed',
        limit: 30
    },
    noBorder: false,
    noCeiling: false,
    noGround: false,
    noLeftWall: false,
    noRightWall: false,
    noClickIndicator: false,
    bypassPregame: false,
    hideScore: false,
    preGameLoadComplete: false,
    baseScoreText: "Score: ",
    baseWaveText: "Wave: ",
    score: 0,
    enableUnitSystem: false,
    clickAnywhereToStart: "Click anywhere to start",
    frames: 0,
    frameSecondCounter: 0,
    playerTeam: 100,
    enemyTeam: 77,
    neutralTeam: 49,
    lagCompensation: 2,
    pixiPaused: false,
    commonAssets: [{
        name: "CommonGameTextures",
        target: "Textures/CommonGameTextures.json"
    }],

    /*
     * Game lifecycle
     *
     * Load Game:
     * loadGame: called upon clicking the game link
     * commonGameInitialization: setup common attributes of the game
     *
     * Load Assets:
     * showLoadingScreen: a pre-init step which will show a splash screen which is meant to hide the loading of assets
     * loadAssets: load the games assets
     *
     * Initialize Game:
     * postLoadInit: initialize more complex game components (unit system etc)
     * preGame:      game state prior to playing the game, typically a 'click to proceed' screen. Calls preGameExtension().
     * startGame:    create game objects and game listeners (those that will be cleaned up after victory is satisfied)
     *               calls play() which is meant to be implemented by each individual game in which game-specific obj are created
     * endGame:      actions to take once victory is satisfied. Go to score screen, then reset game (call's start). Calls endGameExtension().
     * resetGame:    called after endGame is completed. Jumps to preGame. Calls resetGameExtension().
     */
    commonGameInitialization: function(options) {
        /*
         * Blow up options into properties
         */
        $.extend(this, options);

        /*
         * Create some other variables
         */
        this.tickCallbacks = [];
        this.vertexHistories = [];
        this.invincibleTickCallbacks = [];
        this.eventListeners = [];
        this.invincibleListeners = [];
        this.timers = {}; /* {name: string, timeLimit: double, callback: function} */
        this.mousePosition = mousePosition;
        this.debugObj = {};
        this.canvas = {
            width: gameUtils.getPlayableWidth(),
            height: gameUtils.getPlayableHeight()
        };
        this.canvasRect = this.canvasEl.getBoundingClientRect();
        this.justLostALife = 0;
        this.endGameSound = gameUtils.getSound('bells.wav', {
            volume: 0.05
        });
        this.loseLifeSound = gameUtils.getSound('loselife1.mp3', {
            rate: 1.4,
            volume: 5.0
        });
        this.s = {
            s: 0,
            t: 0,
            f: 0,
            w: 0,
            sl: 0
        };
        this.unitsByTeam = {};
        var is = this['incr' + 'ement' + 'Sco' + 're'].bind(this);

        //We'll attach a mousedown listener here which will execute before other listeners
        this.priorityMouseDownEvents = [];
        $('body').on('mousedown.priority', function(event) {
            $.each(this.priorityMouseDownEvents, function(index, f) {
                f(event);
            });
        }.bind(this));
        this.addPriorityMouseDownEvent = function(f) {
            this.priorityMouseDownEvents.push(f);
            return f;
        };
        this.removePriorityMouseDownEvent = function(f) {
            var index = this.priorityMouseDownEvents.indexOf(f);
            if (index > -1)
                this.priorityMouseDownEvents.splice(index, 1);
        };

        /*
         * register game loop pause behavior
         */
        this.gameLoop.onPause(() => {
            this.gameState = 'paused';
        });

        this.gameLoop.onResume(() => {
            this.gameState = 'playing';
        });

        this['incr' + 'ement' + 'Sco' + 're'] = function(value) {
            this.s.s += value * 77;
            this.s.t += value * 33;
            this.s.f += value * 55;
            if (this.wave) {
                this.s.w = this.wave.waveValue * 44;
                if (this.subLevel)
                    this.s.sl = this.subLevel;
            }
            is(value);
        }.bind(this);

        this.addEventListener('mousemove', function(event) {
            var rect = this.canvasEl.getBoundingClientRect();
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
            this.debugObj.playableCenterOffset = {
                x: this.mousePosition.x - gameUtils.getPlayableCenter().x,
                y: this.mousePosition.y - gameUtils.getPlayableCenter().y
            };
        }.bind(this), true, false);
    },

    showLoadingScreen: function() {
        //load splash screen asset first
        var loadingScreenAsset = this.loadingScreenAsset;
        var loader = AssetLoader.load(loadingScreenAsset);
        var loadingScreenShowingDeferred = $.Deferred();

        loader.loaderDeferred.done(() => {
            var titleScene = new Scene();
            this.currentScene = titleScene;

            var backgroundImage = this.getLoadingScreen();
            graphicsUtils.makeSpriteSize(backgroundImage, gameUtils.getCanvasWH());
            titleScene.add(backgroundImage);
            this.splashScreenText = graphicsUtils.addSomethingToRenderer("TEX+:Loading: ", {
                where: 'hudText',
                style: styles.titleOneStyle,
                x: this.canvas.width / 2,
                y: this.canvas.height * 3 / 4
            });
            titleScene.add(this.splashScreenText);
            titleScene.initializeScene();
            loadingScreenShowingDeferred.resolve();
        });

        return {
            splashScreenDeferred: loadingScreenShowingDeferred,
            loaderProgressFunction: function(loader) {
                this.setSplashScreenText("Loading: " + loader.percentDone + '%');
            }.bind(this),
            loadingTextUpdater: this.setSplashScreenText.bind(this)
        };
    },

    setSplashScreenText: function(value) {
        this.splashScreenText.text = value;
    },

    loadAssets: function() {
        return AssetLoader.load(this.totalAssets);
    },

    postLoadInit: function() {

        //enable unit and item systems
        if (this.enableUnitSystem) {
            // Create new unit system, letting it share some common game properties
            this.unitSystem = new UnitSystem(Object.assign({
                enablePathingSystem: this.enablePathingSystem
            }, {
                renderer: this.renderer,
                engine: this.engine,
                unitPanelConstructor: this.unitPanelConstructor
            }));
        }

        if (this.enableItemSystem) {
            // Create new item system
            this.itemSystem = new ItemSystem();
        }

        //track previous frame positions and attributes
        this.addTickCallback(function() {
            $.each(this.vertexHistories, function(index, body) {
                body.previousPosition = {
                    x: body.position.x,
                    y: body.position.y
                }; //used for interpolation in PixiRenderer
            });
        }.bind(this), true, 'beforeTick');

        //Vertice history function
        var maxLagToAccountFor = this.lagCompensation;
        this.addTickCallback(function() {
            $.each(this.vertexHistories, function(index, body) {
                //Veritices
                body.verticeCopy = mathArrayUtils.cloneVertices(body.vertices);
                if (!body.verticesCopy) {
                    body.verticesCopy = [];
                }
                body.verticesCopy.push(mathArrayUtils.cloneVertices(body.vertices));
                if (body.verticesCopy.length > maxLagToAccountFor) {
                    body.verticesCopy.shift();
                }

                //Positions
                body.positionCopy = {
                    x: body.position.x,
                    y: body.position.y
                };
                if (!body.positionsCopy) {
                    body.positionsCopy = [];
                }
                body.positionsCopy.push(mathArrayUtils.clonePosition(body.position));
                if (body.positionsCopy.length > maxLagToAccountFor) {
                    body.positionsCopy.shift();
                }

                //Parts
                if (!body.partsCopy) {
                    body.partsCopy = [];
                }
                body.partsCopy.push(mathArrayUtils.cloneParts(body.parts));
                if (body.partsCopy.length > maxLagToAccountFor) {
                    body.partsCopy.shift();
                }
            }.bind(this));
        }.bind(this), true, 'beforeTick');

        //debugging display objects
        this.lastDeltaText = graphicsUtils.addSomethingToRenderer("TEX+:" + 0 + " ms", 'hud', {
            x: 32,
            y: this.canvas.height - 15,
            style: styles.fpsStyle
        });
        this.fpsText = graphicsUtils.addSomethingToRenderer("TEX+:" + "0" + " fps", 'hud', {
            x: 27,
            y: this.canvas.height - 30,
            style: styles.fpsStyle
        });
        this.fpsText.persists = true;
        this.lastDeltaText.persists = true;
        this.addTickCallback(function(event) {
            this.lastDeltaText.text = this.engine.runner.deltaTime.toFixed(2) + "ms";
            this.frameSecondCounter += this.engine.runner.deltaTime;
            if (this.frameSecondCounter > 1000) {
                this.frameSecondCounter -= 1000;
                this.fpsText.text = this.frames + " fps";
                this.frames = 0;
            }
            this.frames += 1;
        }.bind(this), true, 'tick');

        //init fps to be off
        this.lastDeltaText.visible = false;
        this.fpsText.visible = false;

        //create paused game text and hide initially
        var pausedGameText = graphicsUtils.addSomethingToRenderer("TEX+:PAUSED", 'hud', {
            persists: true,
            style: styles.style,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        });
        pausedGameText.visible = false;

        //debugging key listeners
        $('body').on('keydown', function(event) {
            if (keyStates.Shift && keyStates.Control) {
                if (event.key == 'f' || event.key == 'F') {
                    this.lastDeltaText.visible = !this.lastDeltaText.visible;
                    this.fpsText.visible = !this.fpsText.visible;
                    if (this.renderer.stats.stats.dom.style.visibility != 'hidden') {
                        this.renderer.stats.stats.dom.style.visibility = 'hidden';
                    } else {
                        this.renderer.stats.stats.dom.style.visibility = 'visible';
                    }
                }
            }

            if (keyStates.Alt) {
                if (event.key == 's' || event.key == 'S') {
                    // if (this.unitSystem.selectedUnit) {
                    //     this.unitSystem.selectedUnit.giveEnergy(10);
                    // }
                    // this.map.addAdrenalineBlock();
                    graphicsUtils.applyGainAnimationToUnit(this.shane, 0x9b2ac9);

                    // if (this.gameState == 'paused') {
                    //     this.togglePause();
                    // } else {
                    //     gameUtils.executeSomethingNextFrame(() => {
                    //         this.togglePause();
                    //     });
                    // }
                }
            }

            if (keyStates.Alt) {
                if (event.key == 'w' || event.key == 'W') {
                    if(!this.whoaSprite) {
                        this.whoaSprite = graphicsUtils.addSomethingToRenderer('TEX+:wowowowowowow', {where: 'stage', style: styles.abilityText});
                        this.whoaSprite.position = {x: 100, y: 100};
                    } else {
                        this.whoaSprite.position.y += 0.5;
                    }
                    // this.addTickCallback(() => {
                    //     spr.position = this.mousePosition;
                    // });
                }
            }

            if (keyStates.Alt) {
                if (event.key == 'm' || event.key == 'M') {
                    console.info(this.mousePosition);
                }
            }

            if (keyStates.Control) {
                if (event.key == 'b' || event.key == 'B') {
                    if (this.transitionSprite) {
                        graphicsUtils.removeSomethingFromRenderer(this.transitionSprite);
                        this.transitionSprite = null;
                        return;
                    }
                    console.info(this.debugObj.playableCenterOffset);
                    this.map.addAdrenalineBlock();
                }
            }
        }.bind(this));

        //setup timing utility
        this.addTickCallback(function(event) {

            //Create a temp object so that there are no bad effects of invalidating a timer
            //from within another timer. I actually need to make sure this matters.
            var tempTimers = $.extend({}, this.timers);
            $.each(tempTimers, function(key, value) {

                //tick monitor is called whether or not the timer has stopped
                if (value.tickMonitor) {
                    value.tickMonitor(event.deltaTime);
                }

                //check to see if we have a pause condition
                var pauseFromCondition = false;
                if (value.pauseCondition) {
                    pauseFromCondition = value.pauseCondition();
                }

                //don't continue if we're in any of these states
                if (!value || value.done || value.paused || pauseFromCondition || value.invalidated || value.runs === 0) {
                    return;
                }

                //if the game is paused and we're not a true timing util, return
                if (this.gameState == 'paused' && !value.trueTimer) {
                    return;
                }

                //default values
                if (!value.timeElapsed) {
                    value.timeElapsed = 0;
                }
                if (!value.totalElapsedTime) {
                    value.totalElapsedTime = 0;
                }
                if (value.runs == 'gogogo') {
                    value.runs = null;
                    value.gogogo = true;
                }
                if (!value.runs) {
                    value.runs = 1;
                }

                //determine the active time limit
                if (value.skipToEnd) {
                    value.timeLimitOverride = 0.01;
                }
                value.activeTimeLimit = value.timeLimitOverride || value.timeLimit;

                //update timer state
                value.started = true;
                value.timeElapsed += event.deltaTime;
                value.totalElapsedTime += event.deltaTime;
                value.percentDone = Math.min(value.timeElapsed / value.activeTimeLimit, 1);
                value.totalPercentOfRunsDone = Math.min(value.currentRun / value.originalRuns, 1);

                //call tickback
                if (value.tickCallback) value.tickCallback(event.deltaTime);

                //call immediately, possibly with a delay
                if (value.immediateStart) {
                    var immediateDelay = value.immediateDelay || 0;
                    value.timeElapsed = value.activeTimeLimit - immediateDelay;
                    value.immediateStart = false;
                }

                //if we past our active time limit, execute the callbacks
                while (value.activeTimeLimit <= value.timeElapsed && value.runs > 0 && !value.invalidated) {
                    value.executeCallbacks();
                }
            }.bind(this));

            //setup timer victory condition
            if (this.victoryCondition.type == 'timed' && this.regulationPlay && this.regulationPlay.state() == 'pending') {
                this.timeLeft -= event.deltaTime;
                this.gameTime.text = parseInt(this.timeLeft / 1000);
                if (this.timeLeft)
                    if (this.gameTime.text == " ") this.gameTime.text = '0';
                if (this.timeLeft < 15000) {
                    this.gameTime.style = styles.redScoreStyle;
                } else {
                    this.gameTime.style = styles.scoreStyle;
                }
                if (this.timeLeft <= 1000) {
                    this.regulationPlay.resolve();
                }
            }

        }.bind(this), true);

        //frequency body remover, space out removing bodies from the Matter world
        var myGame = this;
        this.softRemover = {
            bodies: [],
            remove: function(body) {
                if (body.unit) {
                    Matter.Events.trigger(globals.currentGame.unitSystem, "removeUnitFromSelectionSystem", {
                        unit: body.unit
                    });
                }
                body.softRemove = true;
                body.collisionFilter = {
                    category: 0x0000,
                    mask: 0,
                    group: -1
                };
                this.bodies.push(body);
            },
            init: function() {
                this.myTick = Matter.Events.on(myGame.engine.runner, 'tick', function(event) {
                    var body = this.bodies.shift();
                    if (body) {
                        Matter.World.remove(myGame.world, [body]);
                    }
                }.bind(this));
            },
            cleanUp: function() {
                this.bodies = [];
            }
        };
        this.softRemover.init();

        if (this.initExtension) {
            this.initExtension();
        }
    },

    /*
     * Setup click-to-begin screen
     */
    preGame: function() {
        this.gameState = 'pregame';

        var onClick = null;
        if (this.preGameExtension) {
            onClick = this.preGameExtension() || function() {};
        } else {
            var startGameText = graphicsUtils.addSomethingToRenderer("TEX+:" + this.clickAnywhereToStart, 'hud', {
                style: styles.style,
                x: this.canvas.width / 2,
                y: this.canvas.height / 2
            });
            onClick = function() {
                graphicsUtils.removeSomethingFromRenderer(startGameText);
            };
        }

        //pregame deferred (proceed to startGame when clicked)
        var proceedPastPregame = $.Deferred();
        if (!this.bypassPregame) {
            let game = this;

            Matter.Events.on(this, 'preGameLoadComplete', () => {
                //once we complete the preload, wait a frame to create the mouse listener. Any events queued up during the preload
                //would immediately execute otherwise, and our goal is to ignore events entered during the preload, so we'll let the queue'd
                //events fire, then create the listener the next frame
                gameUtils.executeSomethingNextFrame(() => {
                    $(this.canvasEl).on('mouseup', $.proxy(function(event) {
                        $(this).off(event);
                        gameUtils.executeSomethingNextFrame(() => {
                            proceedPastPregame.resolve();
                            onClick();
                        }); //dissociate this mouseup event from any listeners setup during start game, it appears that listeners setup during an event get called during that event.
                    }, this));
                });
            });
        }

        //execute the pregame loading next frame so that we immediate display the splash screen
        gameUtils.executeSomethingNextFrame(() => {
            this._preGameLoad();
        });

        //used for other ways to enter a game
        if (this.alternatePregameSetup) {
            this.alternatePregameSetup(proceedPastPregame);
        }

        proceedPastPregame.done(this.startGame.bind(this));
    },

    _preGameLoad: function() {
        if (this.unitSystem) {
            this.unitSystem.initialize();
        }

        if (this.itemSystem) {
            this.itemSystem.initialize();
        }

        if (this.preGameLoadExtension) {
            this.preGameLoadExtension();
        }

        Matter.Events.trigger(this, 'preGameLoadComplete');
        this.preGameLoadComplete = true;
    },

    /*
     * Init various common game elements
     */
    startGame: function(options) {

        //disable right click during game
        $('body').on("contextmenu.common", function(e) {
            e.preventDefault();
        });

        //disable other default behaviors changing
        $('body').on("keydown.common", function(e) {
            if (e.key === 'Tab' || e.keyCode === 9 || e.key == 'Alt') {
                e.preventDefault();
            }
        });

        //disable default click action - double clicking selects page text
        $('#gameTheater').on('mousedown.prevent', (function(e) {
            e.preventDefault();
        }));

        //initialize any state needed for each period of play
        this._initStartGameState();

        //create border unless not wanted
        if (!this.noBorder) {
            var border = [];
            if (!this.noCeiling)
                border.push(Matter.Bodies.rectangle(this.canvas.width / 2, -5, this.canvas.width, 10, {
                    isStatic: true,
                    noWire: true
                }));
            if (!this.noGround)
                border.push(Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height + 25, this.canvas.width, 50, {
                    isStatic: true,
                    noWire: true
                }));
            if (!this.noLeftWall)
                border.push(Matter.Bodies.rectangle(-5, this.canvas.height / 2, 10, this.canvas.height, {
                    isStatic: true,
                    noWire: true
                }));
            if (!this.noRightWall)
                border.push(Matter.Bodies.rectangle(this.canvas.width + 5, this.canvas.height / 2, 10, this.canvas.height, {
                    isStatic: true,
                    noWire: true
                }));

            border.forEach(function(el, index) {
                el.collisionFilter.category = 0x0004;
            });
            this.addBodies(border);
        }

        //score overlay
        this.s = {
            s: 0,
            t: 0,
            f: 0
        };
        if (!this.hideScore) {
            this.score = graphicsUtils.addSomethingToRenderer("TEX+:" + this.baseScoreText, 'hud', {
                x: 5,
                y: 5,
                anchor: {
                    x: 0,
                    y: 0
                },
                style: styles.scoreStyle
            });
            this.score.persists = true;
            this.setScore(0);
        }

        //wave overlay
        if (this.showWave) {
            this.wave = graphicsUtils.addSomethingToRenderer("TEX+:" + this.baseWaveText, 'hud', {
                x: 5,
                y: 30,
                anchor: {
                    x: 0,
                    y: 0
                },
                style: styles.scoreStyle
            });
            this.wave.persists = true;
            this.setWave(0);
        }

        //timer overlay, if necessary
        if (!this.hideEndCondition) {
            if (this.victoryCondition.type == 'timed') {
                this.gameTime = graphicsUtils.addSomethingToRenderer("TEX+:" + this.victoryCondition.limit, 'hud', {
                    x: this.canvasRect.width / 2,
                    y: 5,
                    anchor: {
                        x: 0.5,
                        y: 0
                    },
                    style: styles.scoreStyle
                });
            } else if (this.victoryCondition.type == 'lives') {
                this.hudLives = graphicsUtils.addSomethingToRenderer("TEX+:" + "Lives: " + this.victoryCondition.limit, 'hud', {
                    x: this.canvasRect.width / 2,
                    y: 5,
                    anchor: {
                        x: 0.5,
                        y: 0
                    },
                    style: styles.scoreStyle
                });
            }
        }

        //call the game's play method
        this.play(options);
        this.gameState = 'playing';

        //create click indication listener
        if (!this.noClickIndicator) {
            var clickPointSprite = graphicsUtils.addSomethingToRenderer('MouseX', 'foreground', {
                x: -50,
                y: -50
            });
            clickPointSprite.scale.x = 0.25;
            clickPointSprite.scale.y = 0.25;
            this.addEventListener('mousedown', function(event) {
                clickPointSprite.position = {
                    x: event.data.global.x,
                    y: event.data.global.y
                };
            }.bind(this), false, true);
        }

        this.regulationPlay = $.Deferred();
        this.regulationPlay.done(this.endGame.bind(this));
    },

    _initStartGameState: function() {
        //init the start time
        this.timeLeft = (this.victoryCondition.limit + 1) * 1000;
        this.lives = this.victoryCondition.limit;
    },

    togglePause: function() {
        if (this.gameLoop.paused) {
            this.gameLoop.resume();
        } else {
            this.gameLoop.pause();
        }
    },

    endGame: function(options) {
        this.gameState = 'ending';
        this.endGameSound.play();
        this.nuke({
            savePersistables: true
        });

        //prompt for the score
        var scoreSubmission = $.Deferred();
        setTimeout(function() {
            this.scoreContainer = $('<div>').appendTo('#gameTheater');
            this.nameInput = $('<input>', {
                'class': 'nameInput'
            }).appendTo(this.scoreContainer);
            this.submitButton = $('<div>', {
                'class': 'submitButton'
            }).appendTo(this.scoreContainer).text('Submit').on('click', function() {
                $(this.scoreContainer).remove();
                scoreSubmission.resolve();
                hs.ps(this.gameName, $(this.nameInput).val(), this.score.scoreValue, this.s, this.showWave ? this.wave.waveValue : null, this.subLevel ? this.subLevel : null);
                gtag('event', 'submission', {
                    'event_category': 'score',
                    'event_label': this.gameName + " - " + $(this.nameInput).val() + " - " + this.score.scoreValue,
                });
            }.bind(this));

            this.continueButton = $('<div>', {
                'class': 'playAgainButton'
            }).appendTo(this.scoreContainer).text('Play Again').on('click', function() {
                $(this.scoreContainer).remove();
                scoreSubmission.resolve();
            }.bind(this));

            $(this.scoreContainer).css('position', 'absolute');
            $(this.scoreContainer).css('left', this.canvasRect.width / 2 - $(this.scoreContainer).width() / 2);
            $(this.scoreContainer).css('top', this.canvasRect.height / 2 - $(this.scoreContainer).height() / 2);
        }.bind(this), 500);

        if (this.endGameExtension)
            this.endGameExtension();

        //reset to beginning
        scoreSubmission.done(this.resetGame.bind(this));
    },

    addUnit: function(unit) {
        this.addBody(unit.body);
        this.addBody(unit.selectionBody);
        this.addBody(unit.selectionBodyBig);

        if (unit.animationSpecificBodies) {
            unit.animationSpecificBodies.forEach((body) => {
                this.addBody(body);
            });
        }

        //track the team this unit is on
        if (unit.team) {
            if (!this.unitsByTeam[unit.team]) {
                this.unitsByTeam[unit.team] = [unit];
            } else {
                this.unitsByTeam[unit.team].push(unit);
            }
        }

        //This is an important stage in a unit's lifecycle as it now has the initial set of renderChildren realized
        Matter.Events.trigger(unit, 'addUnit', {});

        //Trigger this from the game itself too
        Matter.Events.trigger(this, 'addUnit', {
            unit: unit
        });
    },

    removeUnit: function(unit) {
        Matter.Events.trigger(unit, "onremove", {});

        //clear slaves (deathPact())
        if (unit.slaves) {
            this.removeSlaves(unit.slaves);
        }

        //Handle unitsByTeam. Since unitsByTeam is a loopable datastructure let's grep instead of splice
        //(don't want to alter the array since we might be iterating over it)
        if (unit.team) {
            if (!this.unitsByTeam[unit.team]) { //this could happen if we try to remove a pooled unit but haven't added a unit of that team to the game yet
                this.unitsByTeam[unit.team] = [];
            }
            var bbtindex = this.unitsByTeam[unit.team].indexOf(unit);
            if (bbtindex > -1)
                this.unitsByTeam[unit.team] = $.grep(this.unitsByTeam[unit.team], function(obj, index) {
                    return index != bbtindex;
                });
        }
        this.removeBody(unit.body);
        Matter.Events.off(unit);
    },

    addItem: function(item) {
        this.itemSystem.registerItem(item);

        //This is an important stage in a unit's lifecycle as it now has the initial set of renderChildren realized
        Matter.Events.trigger(item, 'addItem', {});
    },

    removeItem: function(item) {
        //trigger remove event
        Matter.Events.trigger(item, "onremove", {});

        //clear events
        Matter.Events.off(item);

        //clear slaves
        if (item.slaves) {
            this.removeSlaves(item.slaves);
        }

        //remove item from item system
        this.itemSystem.removeItem(item);
    },

    addBody: function(body) {
        // //if we've added a unit, call down to its body
        // if(body.isUnit) {
        //     body = body.body;
        // }

        //This might have some performance impact... possibly will investigate
        if (body.idAdded) {
            console.warn("attempting to add already-added body");
            console.warn(body);
        }

        if (body.vertices)
            this.vertexHistories.push(body);

        //add to matter world
        Matter.World.add(this.world, body);
        body.isAdded = true;
    },

    removeBody: function(body, hardRemove) {

        //just in case?
        if (body.hasBeenRemoved) return;

        body.isSleeping = false;

        //trigger our own event
        Matter.Events.trigger(body, "onremove", {});

        //clear slaves (deathPact())
        if (body.slaves) {
            this.removeSlaves(body.slaves, hardRemove);
        }

        //turn off events on this body (probably doesn't actually matter since the events live of the object itself)
        Matter.Events.off(body);

        //remove body from world
        if (hardRemove) {
            Matter.World.remove(this.world, [body]);
        } else { //we're a soft remove
            this.softRemover.remove(body);
        }

        //clean up vertice history
        var index = this.vertexHistories.indexOf(body);
        if (index > -1)
            this.vertexHistories.splice(index, 1);

        //for internal use
        body.hasBeenRemoved = true;
    },

    removeBodies: function(bodies, hardRemove) {
        var copy = bodies.slice();
        $.each(copy, function(index, body) {
            this.removeBody(body, hardRemove);
        }.bind(this));
    },

    //This method has the heart but is poorly designed
    //Right now it'll support slaves which are units, bodies, tickCallbacks, timers, functions to execute, howerl sounds, and sprites
    removeSlaves: function(slaves, hardBodyRemove) {
        //Iterate over a copy since some of these cleanUp methods can remove slaves themselves. Namely the removeSomethingFrom
        //renderer method.
        var slaveCopy = [].concat(slaves);
        $.each(slaveCopy, function(index, slave) {
            if (slave.isUnit) {
                this.removeUnit(slave);
                //console.info("removing " + slave)
            } else if (slave.type == 'body') { //is body
                this.removeBody(slave, hardBodyRemove);
                // console.info("removing " + slave)
            } else if (slave.isTickCallback) {
                this.removeTickCallback(slave);
                // console.info("removing " + slave.slaveId)
            } else if (slave.isTimer) {
                this.invalidateTimer(slave);
                //console.info("removing " + slave)
            } else if (slave.slaves) {
                this.removeSlaves(slave.slaves, hardBodyRemove);
            } else if (slave instanceof Function) {
                //console.info("removing " + slave)
                slave();
            } else if (slave.unload) {
                // let's unload the sound, but it might be playing upon death, so let's wait then unload it
                gameUtils.doSomethingAfterDuration(() => {
                    slave.unload();
                }, 1500, {
                    executeOnNuke: true
                });
            } else if (slave.isSprite) {
                graphicsUtils.removeSomethingFromRenderer(slave);
            } else if (slave.constructor === PIXI.BitmapText || slave.constructor === PIXI.Text) {
                graphicsUtils.removeSomethingFromRenderer(slave);
            }
        }.bind(this));
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

        this.gameState = 'nuked';

        options = options || {};

        //re-enable right click
        $('body').off("contextmenu.common");

        //re-enable tab navigation
        $('body').off("keydown.common");

        //destroy mousedown priority listener
        $('body').off("mousedown.priority");

        //re-enable default click
        $('#gameTheater').off('mousedown.prevent');

        //Sometimes this could persist
        $(this.canvasEl).off("mouseup");

        if (this.nukeExtension) {
            this.nukeExtension(options);
        }

        Matter.Events.off(this);

        if (!this.world) return;

        //Remove units safely (removeUnit())
        var unitsToRemove = [];
        gameUtils.applyToUnitsByTeam(null, function(unit) {
            return unit;
        }, function(unit) {
            unitsToRemove.push(unit);
        }.bind(this));

        $.each(unitsToRemove, function(i, unit) {
            this.removeUnit(unit, true);
        }.bind(this));

        //Remove bodies safely (removeBodies())
        this.removeBodies(this.world.bodies, true);
        this.softRemover.cleanUp();

        //Clear the matter world (I cant recall if this is necessary)
        Matter.World.clear(this.world, false);

        //Clear the engine (clears broadphase state)
        Matter.Engine.clear(this.engine);

        //Clear the renderer, save persistables
        this.renderer.clear(options.noMercy, options.savePersistables);

        //Unload sounds we've created
        if (options.noMercy) {
            this.endGameSound.unload();
            this.loseLifeSound.unload();
        }

        //Clear listeners, save invincible listeners
        this.clearListeners(options.noMercy);
        this.clearTickCallbacks(options.noMercy);

        $.each(this.timers, function(i, timer) {
            if (timer && (!timer.persists || options.noMercy) && timer.executeOnNuke && timer.runs > 0) {
                timer.totallyDoneCallback();
            }
        }.bind(this));
        this.invalidateTimers(options.noMercy);

        //Clear vertice histories
        this.vertexHistories = [];

        //Clear body listeners if no mercy
        if (options.noMercy) {
            $('body').off();
        }

        //Clear unit system
        if (this.unitSystem) {
            this.unitSystem.cleanUp();
        }

        //Clear item system
        if (this.itemSystem) {
            this.itemSystem.cleanUp();
        }
    },

    resetGame: function() {
        if (this.score)
            graphicsUtils.removeSomethingFromRenderer(this.score);
        if (this.wave)
            graphicsUtils.removeSomethingFromRenderer(this.wave);
        if (this.resetGameExtension)
            this.resetGameExtension();

        this.preGame();
    },

    addTimer: function(timer) {
        this.timers[timer.name] = timer;
        timer.isTimer = true;
        timer.originalRuns = timer.runs;

        //add a reset method to the timer
        if (!timer.reset) timer.reset = timer.execute = function(options) {
            options = options || {};
            this.timeElapsed = 0;
            this.percentDone = 0;
            this.totalPercentOfRunsDone = 0;

            this.runs = timer.originalRuns;
            if (options.runs)
                this.runs = options.runs;
            if (this.resetExtension)
                this.resetExtension();
            this.done = false;
            this.started = false;
            this.paused = false;
            this.invalidated = false;
        };

        var game = this;
        timer.executeCallbacks = function() {
            if (this.runs > 0) {
                this.percentDone = 0;
                this.timeElapsed -= this.activeTimeLimit;
                this.currentRun = this.originalRuns - this.runs;
                if (this.callback) this.callback();
                if (!this.gogogo) {
                    this.runs--;
                }

                if (this.runs > 0) {
                    var callBackPaused = this.paused;
                    if (callBackPaused)
                        this.paused = true;
                }
                if (this.runs <= 0 || this.manualEndLife) {
                    this.done = true;
                    if (this.totallyDoneCallback) {
                        this.totallyDoneCallback.call(this);
                    }
                    if (this.killsSelf) {
                        game.invalidateTimer(this);
                    }
                }
            }
        };

        timer.invalidate = () => {
            this.invalidateTimer(timer);
        };

        return timer;
    },
    invalidateTimer: function(timer) {
        if (!timer || timer.invalidated) return;
        if ($.isArray(timer)) {
            $.each(timer, function(i, timer) {
                timer.invalidated = true;
                Matter.Events.trigger(timer, 'onInvalidate');
                delete this.timers[timer.name];
            }.bind(this));
        } else {
            timer.invalidated = true;
            Matter.Events.trigger(timer, 'onInvalidate');
            delete this.timers[timer.name];
        }
    },

    getTimer: function(timerName) {
        return this.timers[timerName];
    },

    invalidateTimers: function(clearPersistables) {
        $.each(this.timers, function(i, timer) {
            if (timer && !clearPersistables && timer.persists) return;
            this.invalidateTimer(timer);
        }.bind(this));
    },

    addLives: function(numberOfLives) {
        if (numberOfLives < 0) {
            this.loseLife();
            //shake life text
            self = this;
            this.addTimer({
                name: 'shakeLifeTimer',
                timeLimit: 48,
                runs: 12,
                callback: function() {
                    self.hudLives.position = {
                        x: self.hudLives.x + (this.runs % 2 == 0 ? 1 : -1) * 2,
                        y: self.hudLives.y
                    };
                    if (this.runs % 2 == 0) {
                        self.hudLives.style = styles.redScoreStyle;
                    } else {
                        self.hudLives.style = styles.scoreStyle;
                    }
                }
            });
        }

        this.lives = this.lives + numberOfLives;
        if (this.lives < 0) this.lives = 0;
        if (this.lives <= 0)
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
        this.timeLeft += amount;
    },

    /*
     * Event Utils
     */
    addListener: function(eventName, handler, invincible, isPixiInteractive) {
        var listener = {
            eventName: eventName,
            handler: handler
        };
        if (isPixiInteractive) {
            if (invincible)
                this.invincibleListeners.push(listener);
            else
                this.eventListeners.push(listener);
            this.renderer.interactiveObject.on(eventName, handler);
        } else {
            if (invincible)
                this.invincibleListeners.push(listener);
            else
                this.eventListeners.push(listener);
            this.canvasEl.addEventListener(eventName, handler);
        }
        return listener;
    },
    removeListener: function(listener) {
        if (this.eventListeners.indexOf(listener) > 0) {
            this.canvasEl.removeEventListener(this.eventListeners[this.eventListeners.indexOf(listener)].eventName, this.eventListeners[this.eventListeners.indexOf(listener)].handler);
            this.renderer.interactiveObject && this.renderer.interactiveObject.removeListener(this.eventListeners[this.eventListeners.indexOf(listener)].eventName, this.eventListeners[this.eventListeners.indexOf(listener)].handler);
            this.eventListeners.splice(this.eventListeners.indexOf(listener), 1);
        }
    },
    clearListeners: function(noMercy) {
        this.eventListeners.forEach(function(listener) {
            this.canvasEl.removeEventListener(listener.eventName, listener.handler);
            this.renderer.interactiveObject && this.renderer.interactiveObject.removeListener(listener.eventName, listener.handler);
        }.bind(this));
        this.eventListeners = [];

        if (noMercy) {
            this.invincibleListeners.forEach(function(listener) {
                this.canvasEl.removeEventListener(listener.eventName, listener.handler);
                this.renderer.interactiveObject && this.renderer.interactiveObject.removeListener(listener.eventName, listener.handler);
                //Matter.Events.off(this.engine, 'afterTick', callback);
            }.bind(this));
            this.invincibleListeners = [];
        }
    },
    addTickCallback: function(callback, invincible, eventName) {
        //make backwards compatible
        var options = {};
        if (mathArrayUtils.isObject(invincible)) {
            options = invincible;
        } else {
            options.invincible = invincible;
            options.eventName = eventName;
        }

        if (options.runImmediately) {
            callback(options.immediateOptions || {});
        }

        var self = this;
        var tickDeltaWrapper = function(event) {
            if (tickDeltaWrapper.removePending) return;
            if (options.invincible || (self.gameState == 'playing')) {
                callback(event);
            }
        };
        tickDeltaWrapper.isTickCallback = true;

        if (options.invincible)
            this.invincibleTickCallbacks.push(tickDeltaWrapper);
        else
            this.tickCallbacks.push(tickDeltaWrapper);
        Matter.Events.on(this.engine.runner, options.eventName || 'tick' /*'afterUpdate'*/ , tickDeltaWrapper);
        callback.tickDeltaWrapper = tickDeltaWrapper; //so we can turn this off with the original function
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
        if (!callback) return;

        if (callback.tickDeltaWrapper) {
            callback = callback.tickDeltaWrapper;
        }

        //remove from matter system
        Matter.Events.off(this.engine, callback);
        Matter.Events.off(this.engine.runner, callback);

        //remove from our internal lists here
        if (this.invincibleTickCallbacks.indexOf(callback) > -1) {
            this.invincibleTickCallbacks.splice(this.invincibleTickCallbacks.indexOf(callback), 1);
        }
        if (this.tickCallbacks.indexOf(callback) > -1) {
            this.tickCallbacks.splice(this.tickCallbacks.indexOf(callback), 1);
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

        if (noMercy) {
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

    loadGame: function() {
        this.totalAssets = this.assets.concat(this.commonAssets);
        if (this.enableUnitSystem) {
            this.totalAssets = this.totalAssets.concat(UnitSystemAssets);
        }
        CommonGameStarter(this);
        this.gameState = 'loading';
    }
};

//aliases
common.addTime = common.addToGameTimer;
common.addBodies = common.addBody;
common.listeners = common.eventListeners;
common.addEventListener = common.addListener;
common.removeEventListener = common.removeListener;
common.removeText = common.removeSprite;

// return common;
export {
    common as CommonGameMixin
};
