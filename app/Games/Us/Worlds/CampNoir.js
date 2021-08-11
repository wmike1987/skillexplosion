import * as $ from 'jquery';
import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import {
    CommonGameMixin
} from '@core/Fundamental/CommonGameMixin.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import {Doodad} from '@utils/Doodad.js';
import Scene from '@core/Scene.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Map from '@games/Us/MapAndLevel/Map/Map.js';
import {
    CampNoirIntro
} from '@games/Us/Dialogues/CampNoirIntro.js';
import {
    CampNoirStart
} from '@games/Us/Dialogues/CampNoirStart.js';
import {
    UrsulaTasks
} from '@games/Us/Dialogues/Plain/UrsulaTasks.js';

var tileSize = 225;
var innerIndex = 0;
var outerIndex = 1;
var acceptableTileTints = [0xff9e9e, 0x7848ee];
var acceptableOrnamentTints = [0xffab7a, 0xad850b];
var acceptableFlowerTints = [0xf78d8d, 0x9f9f9f];
var getLevelTiles = function() {
    var backgroundTiles = [];
    for (var i = 1; i <= 6; i++) {
        var j = i;
        backgroundTiles.push('FrollGround/Dirt' + j);
    }
    return backgroundTiles;
};

var possibleTrees = ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5', 'avgoldtree6'];

//this camp object is used for the camp level type
var camp = {
    intro: CampNoirIntro,

    initExtension: function() {
        this.noZones = [{
                center: gameUtils.getPlayableCenter(),
                radius: 300
            },
            {
                center: gameUtils.getPlayableCenterPlus({
                    x: -150,
                    y: -150
                }),
                radius: 200
            }
        ];
    },

    initSounds: function() {
        this.entercamp = gameUtils.getSound('entercamp.wav', {
            volume: 0.05,
            rate: 0.75
        });
    },

    cleanUpSounds: function() {
        this.entercamp.unload();
    },

    getPossibleTrees: function() {
        return possibleTrees;
    },

    getCampObjects: function() {
        var objs = [];
        var tent = new Doodad({
            drawWire: false,
            bodyScale: {
                y: 0.35
            },
            collides: true,
            autoAdd: false,
            radius: 120,
            texture: ['Tent'],
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
                x: 0,
                y: 0
            },
            shadowOffset: {
                x: 0,
                y: 10
            },
            position: {
                x: gameUtils.getCanvasCenter().x - 150,
                y: gameUtils.getPlayableHeight() - 500
            }
        });
        objs.push(tent);

        var sleepingbags = new Doodad({
            drawWire: false,
            collides: false,
            autoAdd: false,
            radius: 15,
            texture: 'SleepingBags',
            stage: 'stage',
            scale: {
                x: 1.4,
                y: 1.4
            },
            offset: {
                x: 0,
                y: 0
            },
            sortYOffset: -99999,
            shadowIcon: 'IsoShadowBlurred',
            shadowScale: {
                x: 0,
                y: 0
            },
            shadowOffset: {
                x: 0,
                y: 10
            },
            position: {
                x: gameUtils.getCanvasCenter().x + 150,
                y: gameUtils.getPlayableHeight() - 350
            }
        });
        objs.push(sleepingbags);

        var gunrack = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 10,
            texture: 'gunrack',
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
                x: gameUtils.getCanvasCenter().x - 180,
                y: gameUtils.getPlayableCenter().y - 30
            }
        });
        objs.push(gunrack);

        return objs;
    },

    //This one is a little complicated since there are so many ways to enter camp noir
    onLevelPlayable: function(scene) {
        if (this.mapTableFalseSetting) {
            this.mapTableActive = false;
        } else {
            this.mapTableActive = true;
        }

        if(false) {
            this.mapTableActive = true;
        }

        //we want to nudge the player to the map if we're entering camp noir proper for the first time.
        //But not during ursula tasks and not quite during the skipped tutorial since we have a slight delay
        //before we want to nudge the player when they skip
        if (this.completedUrsulaTasks && !this.skippedTutorial && !this.mapTableNudge) {
            this.mapTableNudge = true;
            var arrow = graphicsUtils.pointToSomethingWithArrow(this.mapTable, -20, 0.5);
            gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                graphicsUtils.removeSomethingFromRenderer(arrow);
            });
        }

        if (!this.completedUrsulaTasks) {
            this.mapTableActive = false;
            globals.currentGame.shane.isSelectable = false;
            if (!globals.currentGame.ursula) {
                globals.currentGame.initUrsula();
                globals.currentGame.ursula.position = {
                    x: 800,
                    y: 350
                };
            }
            this.completedUrsulaTasks = true;
            var ursTasks = new UrsulaTasks(scene);
            ursTasks.play();
            globals.currentGame.shane.setHealth(50);
            globals.currentGame.shane.ignoreHealthRegeneration = true;
            globals.currentGame.shane.position = {
                x: 400,
                y: 400
            };
        }

        if (this.oneTimeLevelPlayableExtension) {
            this.oneTimeLevelPlayableExtension();
            this.oneTimeLevelPlayableExtension = null;
        }
    }
};

var enemyDefs = {
    learning: {
        enemySets: [{
            type: 'Critter',
            amount: 3,
            atATime: 1,
            hz: 3500
        }]
    },
    learningSentinel: {
        enemySets: [{
            type: 'Critter',
            amount: 1,
            atATime: 1,
            hz: 3500
        }, {
            type: 'Sentinel',
            amount: 1,
            atATime: 1,
            hz: 4500
        }]
    },
    basic: {
        token: 'default',
        enemySets: [{
            type: 'Critter',
            amount: [2, 3, 4],
            atATime: 2,
            hz: 4000
        }, {
            type: 'Sentinel',
            amount: [1, 2],
            atATime: 1,
            hz: 4500
        }]
    },
    basicHard: {
        token: 'hard',
        enemySets: [{
            type: 'Critter',
            amount: [2, 3, 4],
            atATime: 2,
            hz: 4000
        }, {
            type: 'Sentinel',
            amount: [1, 2],
            atATime: 1,
            hz: 4500,
            item: {
                total: 1,
                className: 'worn',
                classType: 'item'
            },
        }, {
            type: 'Gargoyle',
            amount: [2],
            initialDelay: 8000,
            atATime: 1,
            hz: 5000
        }]
    },
    outerBasic: {
        token: 'outerNormal',
        enemySets: [{
            type: 'Critter',
            amount: 12,
            atATime: 2,
            hz: 4000
        }, {
            type: 'Sentinel',
            amount: 3,
            atATime: 1,
            hz: 4000
        }]
    },
    easyGargs: {
        token: 'hard',
        enemySets: [{
            item: {
                total: 1,
                className: 'worn',
                classType: 'item'
            },
            type: 'Gargoyle',
            amount: [4, 5],
            atATime: 1,
            hz: 2500
        }]
    },
    outerHardened: {
        enemySets: [{
            type: 'Gargoyle',
            amount: 8,
            atATime: 1,
            hz: 2500
        }]
    },
    mobs: {
        enemySets: [{
            type: 'Eruptlet',
            amount: 20,
            atATime: 3,
            hz: 4000
        }]
    },
    outerMobs: {
        enemySets: [{
            type: 'Eruptlet',
            amount: 50,
            atATime: 10,
            hz: 4000
        }, {
            type: 'Sentinel',
            amount: 3,
            atATime: 1,
            hz: 6000
        }]
    },
    easySentinels: {
        token: 'hard',
        enemySets: [{
            item: {
                total: 1,
                className: 'worn',
                classType: 'item'
            },
            type: 'Sentinel',
            amount: [4, 5],
            atATime: 2,
            hz: 5200
        }]
    },
    easySentinelsNoItem: {
        token: 'hard',
        enemySets: [{
            type: 'Sentinel',
            amount: [4, 5],
            atATime: 2,
            hz: 5200
        }]
    },
    outerSentinels: {
        enemySets: [{
            type: 'Sentinel',
            amount: 10,
            atATime: 2,
            hz: 5000
        }]
    },
};

//phase one is shane intro
var phaseOne = function() {
    var firstLevelPosition = {
        x: 200,
        y: 180
    };
    this.map.addMapNode('camp', {
        levelOptions: {
            levelId: 'camp',
            camp: camp,
            tileTint: 0xFFFFFF
        },
        mapNodeOptions: {
            noSpawnGleam: true,
            manualDisable: true
        }
    });
    var learningNode = this.map.addMapNode('shaneLearning', {
        position: firstLevelPosition,
        levelOptions: {
            levelId: 'shaneLearning',
            tileTint: 0xad850b
        },
        mapNodeOptions: {
            noSpawnGleam: true
        }
    });
    this.map.setHeadToken('shaneOnly');
    this.map.setHeadTokenPosition({
        node: learningNode
    });
    this.map.addMapNode('learning', {
        position: mathArrayUtils.clonePosition(firstLevelPosition, {
            x: 145,
            y: 50
        }),
        levelOptions: {
            levelId: 'learning1',
            gotoMapOnWin: true
        },
        mapNodeOptions: {
            noSpawnGleam: true
        }
    });
    this.map.addMapNode('learning', {
        position: mathArrayUtils.clonePosition(firstLevelPosition, {
            x: 82,
            y: 165
        }),
        levelOptions: {
            levelId: 'learning2',
            gotoMapOnWin: true
        },
        mapNodeOptions: {
            noSpawnGleam: true
        }
    });
    this.map.addMapNode('learningSentinel', {
        position: mathArrayUtils.clonePosition(firstLevelPosition, {
            x: 280,
            y: 150
        }),
        levelOptions: {
            gotoMapOnWin: true
        },
        mapNodeOptions: {
            noSpawnGleam: true
        }
    });

    var winCount = 0;
    this.counterFunction = function(event) {
        if (event.result == 'win') {
            winCount += 1;
            if (winCount == 3) {
                let campNode = this.map.findNodeById('camp');
                campNode.manualDisable = false;
                campNode.manualEnable = true;
                campNode.activeCampTooltipOverride = 'Camp available.';

            }
        }
    };
    Matter.Events.on(globals.currentGame, "VictoryOrDefeat", this.counterFunction);

    return {
        nextPhase: 'manual',
        bypassMapPhaseBehavior: true
    };
};

//phase two is the "first" phase, it includes the starting dialog
var phaseTwo = function(options) {
    globals.currentGame.map.setHeadToken('headtoken');
    Matter.Events.off(globals.currentGame, "VictoryOrDefeat", this.counterFunction);
    let campNode = this.map.findNodeById('camp');
    campNode.activeCampTooltipOverride = null;
    campNode.manualDisable = false;
    campNode.manualEnable = false;
    options = options || {};
    var world = this;
    var startDialogue = new CampNoirStart({
        done: () => {
            var campLevel = world.gotoLevelById('camp');
            world.map.clearAllNodesExcept('camp');
            world.map.addMapNode('basic');
            world.map.addMapNode('basic');
            world.map.addMapNode('basic');
            world.map.addMapNode('basic');
            world.map.addMapNode('basicHard', {
                levelOptions: {
                    token: 'hard'
                }
            });
            world.map.addMapNode('multiLevel', {
                levelOptions: {
                    enemyDefList: ['basic', 'basic', 'basic']
                }
            });
            // world.map.addMapNode('easySentinels', {
            //     levelOptions: {
            //         token: 'hard'
            //     }
            // });
            // world.map.addMapNode('airDropStation');
            world.map.addMapNode('airDropStation', {
                levelOptions: {
                    // prereqCount: 0
                }
            });
            world.map.addMapNode('airDropSpecialStation', {
                levelOptions: {
                    // prereqCount: 0,
                    selectionOptions: ItemUtils.getRandomItemsFromClass('worn', 'specialtyItem', 3)
                }
            });
            if (options.skippedTutorial) {
                campLevel.skippedTutorial = true;
                campLevel.mapTableFalseSetting = true;
                var a1 = new Dialogue({
                    actor: "MacMurray",
                    text: "Air drop incoming, I take it you know what to do...",
                    backgroundBox: true,
                    delayAfterEnd: 1500
                });
                var chain = new DialogueChain([a1], {
                    startDelay: 1500,
                    done: function() {
                        chain.cleanUp();
                        gameUtils.doSomethingAfterDuration(() => {
                            globals.currentGame.flyover(() => {
                                globals.currentGame.dustAndItemBox(gameUtils.getPlayableCenterPlus({
                                    x: 200,
                                    y: 120
                                }), ['BasicMicrochip', 'Book'], true);
                                globals.currentGame.dustAndItemBox(gameUtils.getPlayableCenterPlus({
                                    x: 200,
                                    y: 50
                                }), [{
                                    className: 'worn'
                                }, {
                                    className: 'worn'
                                }]);
                                gameUtils.doSomethingAfterDuration(() => {
                                    campLevel.mapTableFalseSetting = false;
                                    campLevel.mapTableActive = true;
                                    var arrow = graphicsUtils.pointToSomethingWithArrow(campLevel.mapTableSprite, -20, 0.5);
                                    gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                                        graphicsUtils.removeSomethingFromRenderer(arrow);
                                    });
                                }, 3000);
                            });
                        }, 250);
                    }
                });
                chain.play();
            }
        }
    });
    globals.currentGame.currentScene.transitionToScene(startDialogue.scene);
    startDialogue.play();

    return {
        nextPhase: 'allNodesComplete',
        onEnterBehavior: function() {
            globals.currentGame.flyover(() => {
                globals.currentGame.dustAndItemBox(gameUtils.getPlayableCenterPlus({
                    x: 200,
                    y: 120
                }), ['BasicMicrochip', 'Book'], true);
            });
        }
    };
};

var phaseThree = function() {
    this.map.clearAllNodesExcept('camp');
    this.map.addMapNode('basic');
    this.map.addMapNode('basic');
    this.map.addMapNode('airDropStation', {
        levelOptions: {
            // prereqCount: 0
        }
    });
    this.map.addMapNode('basic');
    this.map.addMapNode('basic');
    this.map.addMapNode('easySentinels');
    this.map.addMapNode('airDropStation', {
        levelOptions: {
            // prereqCount: 0
        }
    });

    //outer
    let outerParam = {
        levelOptions: {
            outer: true,
        }
    };
    this.map.addMapNode('outerBasic', outerParam);
    this.map.addMapNode('outerBasic', outerParam);
    this.map.addMapNode('outerBasic', outerParam);
    this.map.addMapNode('outerBasic', outerParam);
    this.map.addMapNode('outerBasic', outerParam);
    this.map.addMapNode('outerBasic', outerParam);
};

//this defines the camp noir world
var campNoir = {
    worldSpecs: {
        enemyDefs: enemyDefs,
        tileSize: tileSize,
        acceptableTileTints: acceptableTileTints,
        innerTintIndexes: [0],
        outerTintIndexes: [1],
        levelTiles: getLevelTiles(),
        possibleTrees: possibleTrees,
        decorateTerrain: function(scene, tint) {
            var ornamentTiles = [];
            var ornamentTint = acceptableOrnamentTints[acceptableTileTints.indexOf(tint)];
            for (var i = 0; i <= 7; i++) {
                ornamentTiles.push('FrollGround/DesertFlower' + i);
            }
            this.ornamentMap = TileMapper.produceTileMap({
                possibleTextures: ornamentTiles,
                tileWidth: tileSize,
                noScale: true,
                hz: 0.4,
                where: 'stage',
                r: 1,
                tileTint: ornamentTint,
                noZones: this.noZones,
                seed: this.ornamentMap ? this.ornamentMap.seed : null
            });

            var flowerTint = acceptableFlowerTints[acceptableTileTints.indexOf(tint)];
            var animationOrnamentTiles = [];
            for (var j = 0; j < 6; j++) {

                let randomSpeed = 0.02 + Math.random() * 0.07;
                let r = 'a';
                if (j > 1) {
                    r = 'b';
                }
                if (j > 3) {
                    r = 'c';
                }
                animationOrnamentTiles.push({
                    animationName: 'grassanim' + r,
                    spritesheetName: 'TerrainAnimations',
                    speed: randomSpeed
                });

                if (Math.random() > 0.3) {
                    animationOrnamentTiles.push({
                        animationName: 'floweranim' + r,
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed
                    });
                }
            }
            this.animatedOrnamentMap = TileMapper.produceTileMap({
                possibleTextures: animationOrnamentTiles,
                tileWidth: tileSize,
                noScale: true,
                hz: 0.15,
                where: 'stage',
                r: 1,
                tileTint: flowerTint,
                noZones: this.noZones,
                seed: this.animatedOrnamentMap ? this.animatedOrnamentMap.seed : null
            });

            scene.add(this.ornamentMap);
            scene.add(this.animatedOrnamentMap);
            var l1 = gameUtils.createAmbientLights([0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303], 'backgroundOne', 0.2);
            scene.add(l1);
        }
    },

    phases: [],
    initWorld: function(options) {
        this.phases.push(phaseOne.bind(this));
        this.phases.push(phaseTwo.bind(this));
        this.phases.push(phaseThree.bind(this));
    },

    getLevelById: function(id) {
        return this.map.findLevelById(id);
    },

    gotoLevelById: function(id) {
        var level = this.map.findLevelById(id);
        level.enterLevel();
        return level;
    },

    initializeMap: function() {
        this.map = new Map(this.worldSpecs);
        return this.map;
    },
};


export {
    campNoir
};
