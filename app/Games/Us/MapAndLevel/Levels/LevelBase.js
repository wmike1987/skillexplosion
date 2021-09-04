import * as $ from 'jquery';
import * as Matter from 'matter-js';
import {
    globals,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import TileMapper from '@core/TileMapper.js';
import {
    Doodad
} from '@utils/Doodad.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import styles from '@utils/Styles.js';
import Scene from '@core/Scene.js';
import UnitSpawner from '@games/Us/UnitSpawner.js';
import EnemySetSpecifier from '@games/Us/MapAndLevel/EnemySetSpecifier.js';

var levelBase = {
    resetLevel: function() {
        this.enemySets.forEach(set => {
            set.fulfilled = false;
        });
    },

    enterLevel: function(options) {
        options = options || {};

        //set our random seed for which everything level-related will use
        mathArrayUtils.setRandomizerSeed(this.seed || null);

        //possible hijack the entry
        if (this.hijackEntry) {
            var res = this.hijackEntry();
            if (res) return;
        }

        //create the scene
        var scene = new Scene();

        //fill the scene
        this.fillLevelScene(scene);

        //transition to our new scene
        globals.currentGame.currentScene.transitionToScene({
            newScene: scene,
            centerPoint: this.mapNode.position,
            mode: options.mode || null,
            transitionLength: options.transitionLength || null,
            leftToRight: options.leftToRight
        });

        Matter.Events.trigger(globals.currentGame, 'EnterLevel', {
            level: this
        });

        globals.currentGame.removeAllLevelLocalEntities();

        if (options.customEnterLevel) {
            options.customEnterLevel(this);
        } else {
            this.mode.enter.call(this, scene);
        }
    },

    startLevelSpawn: function(options) {
        options = options || {};
        var level = this;
        var game = globals.currentGame;

        //start enemy spawn
        gameUtils.doSomethingAfterDuration(() => {
            graphicsUtils.floatText(".", gameUtils.getPlayableCenter(), {
                runs: 15,
                style: styles.titleOneStyle
            });
            game.heartbeat.play();
        }, 800);
        gameUtils.doSomethingAfterDuration(() => {
            graphicsUtils.floatText(".", gameUtils.getPlayableCenter(), {
                runs: 15,
                style: styles.titleOneStyle
            });
            game.unitSystem.unpause();
            game.heartbeat.play();
        }, 1600);
        gameUtils.doSomethingAfterDuration(() => {
            level.spawner.start();
            gameUtils.setCursorStyle('Main');
            graphicsUtils.floatText("Begin", gameUtils.getPlayableCenter(), {
                runs: 15,
                style: styles.titleOneStyle
            });
            game.heartbeat.play();

            if (!options.keepCurrentCollector) {
                game.shaneCollector.startNewCollector("Shane " + mathArrayUtils.getId());
                game.ursulaCollector.startNewCollector("Ursula " + mathArrayUtils.getId());
            }
            level.initializeWinLossCondition();
        }, 2400);
    },

    startPooling: function() {
        this.spawner = new UnitSpawner({enemySets: this.enemySets, seed: this.seed});
        this.spawner.startPooling();
    },

    getEntrySound: function() {
        return this.entrySound;
    },
    enemySets: [],

    init: function(type, worldSpecs, options) {
        //combine default options and passed in options
        Object.assign(this, {
            type: type,
            possibleModes: modes,
            mode: modes.SPAWN,
            outer: false,
            mapRef: options.mapRef,
            campLikeActive: false,
            entrySound: worldSpecs.entrySound,
            worldSpecs: Object.assign({}, worldSpecs),
            seed: Math.random()
        }, options.levelOptions || {});

        //set the tile tint
        this.tileTint = options.levelOptions.tileTint || (this.outer ? worldSpecs.acceptableTileTints[mathArrayUtils.getRandomElementOfArray(worldSpecs.outerTintIndexes)] :
            worldSpecs.acceptableTileTints[mathArrayUtils.getRandomElementOfArray(worldSpecs.innerTintIndexes)]);

        //set the enemy  def
        this.enemyDefs = Object.assign({}, worldSpecs.enemyDefs[type]);

        //hook to override defaults
        if (this.initExtension) {
            this.initExtension(type, worldSpecs, options);
        }

        //fulfill enemy sets
        if (this.enemyDefs) {
            this.enemySets = EnemySetSpecifier.create(this.enemyDefs);

            //propagate some attrs if defined on the enemyDef
            this.token = this.enemyDefs.token;
        }

        //create the map node
        var mapNode = this.createMapNode(options.mapNodeOptions);
        this.mapNode = mapNode; //add back reference

        var position = options.mapNodeOptions.position;
        if (this.manualNodePosition) {
            var returnedPosition = this.manualNodePosition(position);
            if (returnedPosition) {
                mapNode.setPosition(returnedPosition);
            }
        } else {
            mapNode.setPosition(position);
        }

        if (this.manualAddToGraph) {
            this.manualAddToGraph(this.mapRef.graph);
        }
    },

    isLevelConfigurable: function() {
        return this.campLikeActive;
    },

    fillLevelScene: function(scene) {
        //set the random seed

        //fill everything
        this.tileMap = TileMapper.produceTileMap({
            possibleTextures: this.worldSpecs.levelTiles,
            tileWidth: this.worldSpecs.tileSize,
            tileTint: this.tileTint
        });
        scene.add(this.tileMap);

        if (this.worldSpecs.decorateTerrain) {
            this.worldSpecs.decorateTerrain.call(this, scene, this.tileTint);
        }

        if (this.fillLevelSceneExtension) {
            this.fillLevelSceneExtension(scene);
        }
    },

    createMapNode: function(options) {
        options.levelDetails = this;
        return new MapNode(options);
    },

    createAugmentRack: function(scene, options) {
        options = options || {};

        //add gunrack
        var gunrackSprite = graphicsUtils.createDisplayObject('gunrack');
        this.gunrack = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 20,
            texture: [gunrackSprite],
            stage: 'stage',
            scale: {
                x: 1.0,
                y: 1.0
            },
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred',
            shadowScale: {
                x: 1,
                y: 1
            },
            shadowOffset: {
                x: -2,
                y: 15
            },
            position: {
                x: gameUtils.getCanvasCenter().x - 180 + 50 / 2.0,
                y: gameUtils.getPlayableCenter().y - 30 + 50 / 2.0
            }
        });
        scene.add(this.gunrack);

        var gunrackHoverTick = globals.currentGame.addTickCallback(function(event) {
            if (self.campLikeActive) return;
            if (Matter.Vertices.contains(this.gunrack.body.vertices, mousePosition)) {
                gunrackSprite.tint = 0xff33cc;
            } else {
                gunrackSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        var self = this;
        //Establish map click listeners
        var gunrackClickListener = globals.currentGame.addPriorityMouseDownEvent(function(event) {
            if (self.campLikeActive) return;
            if (event.which == 3) return; //don't allow right clicks
            var canvasPoint = {
                x: 0,
                y: 0
            };
            gameUtils.pixiPositionToPoint(canvasPoint, event);

            if (Matter.Vertices.contains(self.gunrack.body.vertices, canvasPoint) && !this.mapActive) {
                globals.currentGame.makeCurrentLevelConfigurable();
                globals.currentGame.unitSystem.unitPanel.refreshAugmentButton();
                globals.currentGame.soundPool.unlock1.play();
                globals.currentGame.map.removeAdrenalineBlock();
            }
        }.bind(globals.currentGame));

        scene.addCleanUpTask(() => {
            globals.currentGame.removePriorityMouseDownEvent(gunrackClickListener);
            globals.currentGame.removeTickCallback(gunrackHoverTick);
            this.gunrack = null;
        });
    },

    createMapTable: function(scene, options) {
        options = options || {};

        this.mapTableSprite = graphicsUtils.createDisplayObject('mapbox');
        var mapTable = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 30,
            texture: [this.mapTableSprite],
            stage: 'stage',
            scale: {
                x: 1.0,
                y: 1.0
            },
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred',
            shadowScale: {
                x: 1.0,
                y: 1.0
            },
            shadowOffset: {
                x: 0,
                y: 18
            },
            position: options.position || {
                x: gameUtils.getCanvasCenter().x + 130,
                y: gameUtils.getCanvasCenter().y - 150
            }
        });
        this.mapTable = mapTable;
        scene.add(mapTable);

        var mapHoverTick = globals.currentGame.addTickCallback(function(event) {
            if (!this.mapTableActive) return;
            if (Matter.Vertices.contains(mapTable.body.vertices, mousePosition)) {
                this.mapTableSprite.tint = 0xff33cc;
            } else {
                this.mapTableSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        var self = this;
        //Establish map click listeners
        var mapClickListener = globals.currentGame.addPriorityMouseDownEvent(function(event) {
            if (event.which == 3) return; //don't allow right clicks
            if (!self.mapTableActive) return;
            var canvasPoint = {
                x: 0,
                y: 0
            };
            gameUtils.pixiPositionToPoint(canvasPoint, event);

            if (Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive) {
                this.unitSystem.pause();
                this.map.show();
                this.mapActive = true;
            }
        }.bind(globals.currentGame));

        scene.add(function() {
            $('body').on('keydown.map', function(event) {
                var key = event.key.toLowerCase();
                if (key == 'escape' && this.mapActive) {
                    this.closeMap();
                }
            }.bind(globals.currentGame));
        });

        scene.addCleanUpTask(() => {
            globals.currentGame.removePriorityMouseDownEvent(mapClickListener);
            globals.currentGame.removeTickCallback(mapHoverTick);
            this.mapTableSprite = null;
            $('body').off('keydown.map');
        });
    },

    initializeWinLossCondition: function() {
        var winResult = 'win';
        var lossResult = 'loss';
        var game = globals.currentGame;

        var removeCurrentConditions = function() {
            game.removeTickCallback(winCondition);
            game.removeTickCallback(lossCondition);
        };

        //to-be called upon the win/loss conditions being fulfilled
        var winAndContinueTasks = function(options) {
            removeCurrentConditions.call(this);
            game.shaneCollector.stopCurrentCollector();
            game.ursulaCollector.stopCurrentCollector();
            this.spawner.cleanUp();

            //wait second then add space to continue button
            gameUtils.doSomethingAfterDuration(() => {
                this.spaceToContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {
                    where: 'hudText',
                    style: styles.escapeToContinueStyle,
                    anchor: {
                        x: 0.5,
                        y: 1
                    },
                    position: {
                        x: gameUtils.getPlayableWidth() - 210,
                        y: gameUtils.getPlayableHeight() - 20
                    }
                });
                this.spcaeFlashTimer = graphicsUtils.graduallyTint(this.spaceToContinue, 0xFFFFFF, 0x3183fe, 120, null, false, 3);
                game.currentScene.add(this.spaceToContinue);
                game.soundPool.positiveSound.play();

                //add space listener
                $('body').on('keydown.levelkeydown', function(event) {
                    var key = event.key.toLowerCase();
                    if (key == ' ') {
                        $('body').off('keydown.levelkeydown');
                        game.soundPool.sceneContinue.play();
                        this.spcaeFlashTimer.invalidate();
                        graphicsUtils.graduallyTint(this.spaceToContinue, 0xFFFFFF, 0x6175ff, 60, null, false, 3, function() {
                            options.onContinue();
                        });
                    }
                }.bind(this));
            }, 1000);
        }.bind(this);

        //to-be called upon the win/loss conditions being fulfilled
        var commonWinLossTasks = function() {
            globals.currentGame.unitSystem.pause();
            gameUtils.setCursorStyle('None');
            removeCurrentConditions.call(this);
            game.unitsInPlay.forEach((unit) => {
                unit.isSelectable = false;
                globals.currentGame.unitSystem.deselectUnit(unit);
            });
            game.shaneCollector.stopCurrentCollector();
            game.ursulaCollector.stopCurrentCollector();
            this.spawner.cleanUp();
        }.bind(this);

        /*
         * Win condition listener
         */
        this.endDelayInProgress = false;
        var winCondition = game.addTickCallback(function() {

            /*
             * See if our enemy sets have been fulfilled
             */
            var fulfilled = this.enemySets.every((eset) => {
                return eset.fulfilled;
            });

            //if they have been fulfilled, see if enemy units still exist
            var unitsOfOpposingTeamExist = false;

            //manual win flag for debugging
            if (!globals.currentGame.manualWin) {
                if (!fulfilled) return;

                if (game.unitsByTeam[game.enemyTeam] && game.unitsByTeam[game.enemyTeam].length > 0) {
                    unitsOfOpposingTeamExist = true;
                }
            }

            //win condition
            let winConditional = function() {
                return globals.currentGame.manualWin ||
                    (!this.endDelayInProgress &&
                        !unitsOfOpposingTeamExist &&
                        game.itemSystem.itemsOnGround.length == 0 &&
                        game.itemSystem.getDroppingItems().length == 0);
            }.bind(this);

            //if the win condition is met...
            if (winConditional()) {
                globals.currentGame.manualWin = false;
                this.endDelayInProgress = true;

                if (this.customWinBehavior) { //custom win behavior
                    removeCurrentConditions();
                    this.customWinBehavior();
                } else if (this.gotoMapOnWin) { //else goto map upon win
                    winAndContinueTasks({
                        onContinue: function() {
                            gameUtils.doSomethingAfterDuration(() => {
                                Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                                    result: winResult
                                });
                                Matter.Events.trigger(this, 'endLevelActions');
                                var sc = game.transitionToBlankScene();
                                game.map.show();
                                gameUtils.setCursorStyle('Main');
                                game.unitsInPlay.forEach((unit) => {
                                    gameUtils.moveUnitOffScreen(unit);
                                });
                                game.removeAllLevelLocalEntities();
                            }, 32);
                        }.bind(this)
                    });
                } else { //else do the default win behavior
                    winAndContinueTasks({
                        onContinue: function() {
                            gameUtils.doSomethingAfterDuration(() => {
                                globals.currentGame.togglePause();
                                gameUtils.doSomethingAfterDuration(() => {
                                    Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                                        result: winResult
                                    });

                                    var sc = game.gotoEndLevelScreen({
                                        shane: game.shaneCollector.getLastCollector(),
                                        ursula: game.ursulaCollector.getLastCollector()
                                    });
                                    Matter.Events.trigger(this, 'endLevelActions', {
                                        endLevelScene: sc
                                    });

                                    game.unitsInPlay.forEach((unit) => {
                                        unit.endLevelPosition = mathArrayUtils.clonePosition(unit.isDead ? unit.deathPosition : unit.position);
                                        gameUtils.moveUnitOffScreen(unit);
                                    });

                                    game.removeAllLevelLocalEntities();
                                    gameUtils.setCursorStyle('Main');
                                    globals.currentGame.togglePause();
                                }, 32, {
                                    trueTimer: true
                                });
                            }, 0);
                        }.bind(this)
                    });
                }
            }
        }.bind(this));


        /*
         * Loss condition
         */
        var lossCondition = game.addTickCallback(function() {
            if (!this.endDelayInProgress) {
                var stillAlive = game.unitsInPlay.some((unit) => {
                    return !unit.isDead;
                });
                if (stillAlive) return;
                this.endDelayInProgress = true;

                commonWinLossTasks({
                    result: lossResult
                });
                this.resetLevel();
                game.itemSystem.removeAllItemsOnGround(true);
                gameUtils.doSomethingAfterDuration(() => {
                    if (this.gotoMapOnWin) {
                        Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                            result: lossResult
                        });
                        game.map.revertHeadToPreviousLocationDueToDefeat();
                        game.removeAllLevelLocalEntities();
                        let enemies = gameUtils.getUnitEnemies(game.shane);
                        gameUtils.setCursorStyle('Main');
                        enemies.forEach((enemy) => {
                            game.removeUnit(enemy);
                        });
                        game.map.show();
                    } else {
                        game.unitsInPlay.forEach((unit) => {
                            unit.endLevelPosition = mathArrayUtils.clonePosition(unit.isDead ? unit.deathPosition : unit.position);
                        });
                        var continueOnly = game.map.lastNode.type == 'camp' ? true : false;
                        Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {
                            result: lossResult
                        });
                        game.map.revertHeadToPreviousLocationDueToDefeat();
                        var sc = game.gotoEndLevelScreen({
                            shane: game.shaneCollector.getLastCollector(),
                            ursula: game.ursulaCollector.getLastCollector(),
                        }, true, continueOnly);
                        game.removeAllLevelLocalEntities();
                        let enemies = gameUtils.getUnitEnemies(game.shane);
                        enemies.forEach((enemy) => {
                            game.removeUnit(enemy);
                        });
                    }
                }, 500);
            }
        }.bind(this));
    }
};

var modes = {
    SPAWN: {
        enter: function(scene) {
            var game = globals.currentGame;
            var level = this;
            //create new scene
            game.closeMap();
            Matter.Events.on(scene, 'initialize', function() {
                Matter.Events.trigger(game, 'enteringLevel', {
                    level: level
                });
                game.unitSystem.pause();
                gameUtils.setCursorStyle('None');
                var shaneStart = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                    x: -20
                });
                var ursulaStart = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                    x: 20
                });
                game.setUnit(game.shane, {
                    position: mathArrayUtils.clonePosition(shaneStart, game.offscreenStartLocation),
                    moveToCenter: true,
                    applyFatigue: true
                });
                game.setUnit(game.ursula, {
                    position: mathArrayUtils.clonePosition(ursulaStart, game.offscreenStartLocation),
                    moveToCenter: true,
                    applyFatigue: true
                });
                level.startLevelSpawn();
            });
            game.level += 1;
        }
    },
    CUSTOM: {
        enter: function(scene) {
            var game = globals.currentGame;
            var level = this;
            game.currentLevel = level;

            if (this.completeUponEntry) {
                level.mapNode.complete();
                gameUtils.matterOnce(game.map, 'showMap', () => {
                    level.mapNode.playCompleteAnimation(level.lesserSpin);
                });
            }
            game.closeMap();
            Matter.Events.on(scene, 'initialize', function() {
                Matter.Events.trigger(game, 'enteringLevel', {
                    level: level
                });
                level.onLevelPlayable(scene);
            });
        }
    },
};

export default levelBase;
