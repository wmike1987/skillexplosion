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
import Doodad from '@utils/Doodad.js';
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

    enterLevel: function() {
        if (this.hijackEntry) {
            var res = this.hijackEntry();
            if (res) return;
        }

        var scene = new Scene();
        this.fillLevelScene(scene);

        globals.currentGame.currentScene.transitionToScene({
            newScene: scene,
            centerPoint: this.mapNode.position
        });
        Matter.Events.trigger(globals.currentGame, 'EnterLevel', {
            level: this
        });
        this.mode.enter.call(this, scene);
    },

    startLevelSpawn: function() {
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
            game.shaneCollector.startNewCollector("Shane " + mathArrayUtils.getId());
            game.ursulaCollector.startNewCollector("Ursula " + mathArrayUtils.getId());
            level.initializeWinLossCondition();
        }, 2400);
    },

    startPooling: function() {
        this.spawner = new UnitSpawner(this.enemySets);
        this.spawner.startPooling();
    },

    getEntrySound: function() {
        return this.entrySound;
    },
    enemySets: [],

    init: function(type, worldSpecs, options) {
        Object.assign(this, options || {});

        //defaults
        this.type = type;
        this.possibleModes = modes;
        this.mode = modes.SPAWN;
        this.campLikeActive = false;
        this.worldSpecs = Object.assign({}, worldSpecs);
        this.entrySound = worldSpecs.entrySound;
        this.tileTint = this.tileTint || mathArrayUtils.getRandomElementOfArray(worldSpecs.acceptableTileTints);

        //copy the enemy defs
        this.enemyDefs = Object.assign({}, worldSpecs.enemyDefinitions[type]);

        //hook to override defaults
        if (this.initExtension) {
            this.initExtension(type, worldSpecs, options);
        }

        //fulfill enemy sets
        if(this.enemyDefs) {
            this.enemySets = EnemySetSpecifier.create(this.enemyDefs);

            //propagate some attrs if defined on the enemyDef
            this.token = this.enemyDefs.token;
        }
    },

    isLevelConfigurable: function() {
        return this.campLikeActive;
    },

    fillLevelScene: function(scene) {
        var tileMap = TileMapper.produceTileMap({
            possibleTextures: this.worldSpecs.levelTiles,
            tileWidth: this.worldSpecs.tileSize,
            tileTint: this.tileTint,
        });
        scene.add(tileMap);

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
                x: gameUtils.getCanvasCenter().x - 130,
                y: gameUtils.getPlayableHeight() - 190
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
            $('body').off('keydown.map');
        });
    },

    initializeWinLossCondition: function() {
        var game = globals.currentGame;

        var removeCurrentConditions = function() {
            game.removeTickCallback(winCondition);
            game.removeTickCallback(lossCondition);
        };

        var commonWinLossTasks = function(options) {
            globals.currentGame.unitSystem.pause();
            gameUtils.setCursorStyle('None');
            removeCurrentConditions.call(this);
            game.unitsInPlay.forEach((unit) => {
                // unit.canAttack = false;
                // unit.canMove = false;
                unit.isSelectable = false;
                globals.currentGame.unitSystem.deselectUnit(unit);
            });
            game.shaneCollector.stopCurrentCollector();
            game.ursulaCollector.stopCurrentCollector();
            this.spawner.cleanUp();
            gameUtils.doSomethingAfterDuration(() => {
                Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat", {result: options.result});
            }, 0, {
                trueTimer: true
            });
        }.bind(this);

        this.endDelayInProgress = false;
        var winCondition = game.addTickCallback(function() {
            var fulfilled = this.enemySets.every((eset) => {
                return eset.fulfilled;
            });
            if (!fulfilled) return;

            var unitsOfOpposingTeamExist = false;
            if (game.unitsByTeam[game.enemyTeam] && game.unitsByTeam[game.enemyTeam].length > 0) {
                unitsOfOpposingTeamExist = true;
            }

            if (!this.endDelayInProgress && !unitsOfOpposingTeamExist && game.itemSystem.itemsOnGround.length == 0 && game.itemSystem.getDroppingItems().length == 0) {
                this.endDelayInProgress = true;
                if (this.customWinBehavior) {
                    removeCurrentConditions();
                    this.customWinBehavior();
                } else if (this.gotoMapOnWin) {
                    commonWinLossTasks({result: 'win'});
                    gameUtils.doSomethingAfterDuration(() => {
                        Matter.Events.trigger(this, 'endLevelActions');
                        var sc = game.transitionToBlankScene();
                        game.map.show();
                        gameUtils.setCursorStyle('Main');
                        game.unitsInPlay.forEach((unit) => {
                            gameUtils.moveUnitOffScreen(unit);
                        });
                        game.removeAllLevelLocalEntities();
                    }, 500);
                } else {
                    commonWinLossTasks({result: 'win'});
                    gameUtils.doSomethingAfterDuration(() => {
                        globals.currentGame.togglePause();
                        gameUtils.doSomethingAfterDuration(() => {
                            var sc = game.gotoEndLevelScreen({
                                shane: game.shaneCollector.getLastCollector(),
                                ursula: game.ursulaCollector.getLastCollector()
                            });
                            Matter.Events.trigger(this, 'endLevelActions', {
                                endLevelScene: sc
                            });
                            game.unitsInPlay.forEach((unit) => {
                                gameUtils.moveUnitOffScreen(unit);
                            });
                            game.removeAllLevelLocalEntities();
                            gameUtils.setCursorStyle('Main');
                            globals.currentGame.togglePause();
                        }, 100, {
                            trueTimer: true
                        });
                    }, 500);
                }
            }
        }.bind(this));

        var lossCondition = game.addTickCallback(function() {
            if (!this.endDelayInProgress) {
                var stillAlive = game.unitsInPlay.some((unit) => {
                    return !unit.isDead;
                });
                if (stillAlive) return;
                this.endDelayInProgress = true;

                commonWinLossTasks({result: 'loss'});
                this.resetLevel();
                game.itemSystem.removeAllItemsOnGround(true);
                gameUtils.doSomethingAfterDuration(() => {
                    if (this.gotoMapOnWin) {
                        game.map.revertHeadToPreviousLocationDueToDefeat();
                        game.removeAllLevelLocalEntities();
                        let enemies = gameUtils.getUnitEnemies(game.shane);
                        gameUtils.setCursorStyle('Main');
                        enemies.forEach((enemy) => {
                            game.removeUnit(enemy);
                        });
                        game.map.show();
                    } else {
                        game.map.revertHeadToPreviousLocationDueToDefeat();
                        var sc = game.gotoEndLevelScreen({
                            shane: game.shaneCollector.getLastCollector(),
                            ursula: game.ursulaCollector.getLastCollector()
                        }, true);
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
