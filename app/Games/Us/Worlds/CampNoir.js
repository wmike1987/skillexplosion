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
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import valueShader from '@shaders/ValueShader.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import {
    Doodad
} from '@utils/Doodad.js';
import {
    Scene
} from '@core/Scene.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Map from '@games/Us/MapAndLevel/Map/Map.js';
import {
    CampNoirIntro
} from '@games/Us/Dialogues/CampNoirIntro.js';
import {
    CampNoirTrueStart
} from '@games/Us/Dialogues/CampNoirTrueStart.js';
import {
    UrsulaTasks
} from '@games/Us/Dialogues/Plain/UrsulaTasks.js';
import {
    MapLearning
} from '@games/Us/Dialogues/Plain/MapLearning.js';
import {
    DoodadFactory
} from '@games/Us/Doodads/DoodadFactory.js';

var tileSize = 225;
var acceptableTileTints = [0xff9e9e, 0x6253B7]; //0xe59ab6
var borderTints = [0xFC00FF, 0xBB5633];
var rockTints = [0xffcccc, 0xe59ab6];
var treeTints = [0xC9A771, 0xC398FB];
var acceptableOrnamentTints = [0xffab7a, 0xB5584F];
var acceptableFlowerTints = [0xf78d8d, 0x754FB5];
var ambientLightTints = [
    [0x000000, 0x163c1b, 0x000000, 0x06300f, 0x000000, 0x550000, 0x000000, 0x06300f, 0x550000],
    [0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303, 0x4a0206, 0x610303]
];
var flowerAnimsSortYOffset = 10;
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
                radius: 150
            },
            {
                center: gameUtils.getPlayableCenterPlus({
                    x: -150,
                    y: -150
                }),
                radius: 200
            },
            {
                center: {
                    x: 940,
                    y: 275
                },
                radius: 40
            },
            {
                center: {
                    x: 1030,
                    y: 355
                },
                radius: 75
            },
            {
                center: {
                    x: 260,
                    y: 300
                },
                radius: 45
            },
            {
                center: {
                    x: 100,
                    y: 345
                },
                radius: 55
            },
            {
                center: {
                    x: 315,
                    y: 220
                },
                radius: 55
            },
            {
                center: {
                    x: 1100,
                    y: 220
                },
                radius: 55
            },
            {
                center: {
                    x: 880,
                    y: 136
                },
                radius: 35
            },
            {
                center: {
                    x: 770,
                    y: 136
                },
                radius: 35
            },
            {
                center: {
                    x: 974,
                    y: 161
                },
                radius: 35
            },
            {
                center: {
                    x: 824,
                    y: 146
                },
                radius: 35
            },
            {
                center: {
                    x: 925,
                    y: 146
                },
                radius: 35
            },
            {
                center: {
                    x: 1034,
                    y: 184
                },
                radius: 35
            },
            {
                center: {
                    x: 195,
                    y: 285
                },
                radius: 50
            }
        ];

        this.enterMusic = globals.currentGame.soundPool.campVamp;
    },

    initSounds: function() {},

    cleanUpSounds: function() {},

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
                x: gameUtils.getCanvasCenter().x + 225,
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

        var fencef1 = new Doodad({
            drawWire: false,
            bodyScale: {
                y: 0.5,
                x: 2.2
            },
            bodyRotate: 12.1,
            collides: true,
            autoAdd: false,
            radius: 60,
            texture: ['tripleFencef'],
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
                x: 150,
                y: 300
            }
        });
        objs.push(fencef1);

        var fencef2 = new Doodad({
            drawWire: false,
            bodyScale: {
                y: 0.5,
                x: 2.2
            },
            bodyRotate: 12.1,
            collides: true,
            autoAdd: false,
            radius: 60,
            texture: ['tripleFencef'],
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
                x: 375,
                y: 180
            }
        });
        objs.push(fencef2);

        var fenceh1 = new Doodad({
            drawWire: false,
            bodyScale: {
                y: 0.1
            },
            collides: true,
            autoAdd: false,
            radius: 120,
            texture: ['tripleFenceh'],
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
                x: 600,
                y: 120
            }
        });
        objs.push(fenceh1);

        var fenceh2 = new Doodad({
            drawWire: false,
            bodyScale: {
                y: 0.1
            },
            collides: true,
            autoAdd: false,
            radius: 120,
            texture: ['tripleFenceh'],
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
                x: 830,
                y: 120
            }
        });
        objs.push(fenceh2);

        var fenceb1 = new Doodad({
            drawWire: false,
            bodyScale: {
                y: 0.1,
                x: 1.2
            },
            bodyRotate: -12.1,
            collides: true,
            autoAdd: false,
            radius: 120,
            texture: ['tripleFenceb'],
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
                x: 1057,
                y: 184
            }
        });
        objs.push(fenceb1);

        var tripleTire1 = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 22,
            texture: ['tripletire'],
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
                x: 260,
                y: 300
            }
        });
        objs.push(tripleTire1);

        var singleTire1 = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 10,
            texture: ['singletire'],
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
                x: 935,
                y: 170
            }
        });
        objs.push(singleTire1);

        var singleTire2 = new Doodad({
            drawWire: false,
            collides: true,
            autoAdd: false,
            radius: 10,
            texture: ['singletire'],
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
                x: 490,
                y: 365
            }
        });
        objs.push(singleTire2);

        return objs;
    },

    //This one is a little complicated since there are so many ways to enter camp noir
    onLevelPlayable: function(scene) {
        if (this.mapTableFalseOverride) {
            this.mapTableActive = false;
        } else {
            this.mapTableActive = true;
        }

        //debug setting
        if (globals.currentGame.mapTableAlwaysActive) {
            this.mapTableActive = true;
        }

        //If we haven't completed ursula tasks, init ursula's tasks
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


var easyFlyObj = {
    type: 'DamageFlySwarm',
    amount: [2],
    trivial: true,
    atATime: 2,
    initialDelay: 0.1,
    hz: 1500
};

var generalFlyObj = {
    type: 'DamageFlySwarm',
    amount: [5],
    trivial: true,
    atATime: 2,
    initialDelay: 0.1,
    hz: 1500
};

var hardFlyObj = {
    type: 'DamageFlySwarm',
    amount: [10],
    trivial: true,
    atATime: 2,
    initialDelay: 0.1,
    hz: 1500
};

var ultraHardFlyObj = {
    type: 'DamageFlySwarm',
    amount: [44],
    trivial: true,
    atATime: 4,
    initialDelay: 0.1,
    hz: 1800
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
    learningWithUrsula: {
        enemySets: [{
            type: 'Critter',
            amount: 5,
            atATime: 2,
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
    learningSentinelWithUrsula: {
        enemySets: [{
            type: 'Critter',
            amount: 4,
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
            },
            easyFlyObj
        ]
    },
    basic2: {
        token: 'default',
        enemySets: [{
                type: 'Sentinel',
                amount: [1],
                atATime: 1,
                hz: 4500
            },
            {
                type: 'Gargoyle',
                amount: [2],
                atATime: 1,
                initialDelay: 6500,
                hz: 4500
            },
            easyFlyObj
        ]
    },
    basic3: {
        token: 'default',
        enemySets: [{
                type: 'Rammian',
                amount: [3, 4],
                atATime: 1,
                hz: 4500
            },
            easyFlyObj
        ]
    },
    basicHunter: {
        enemySets: [{
                type: 'Hunter',
                amount: [2],
                atATime: 2,
                hz: 4000
            }, {
                type: 'Critter',
                amount: [3, 4],
                atATime: 1,
                hz: 3000
            },
            easyFlyObj
        ]
    },
    basicHard: {
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
        }, {
            type: 'Gargoyle',
            amount: [2],
            initialDelay: 6500,
            atATime: 1,
            hz: 5000
        }, generalFlyObj]
    },
    basicHard2: {
        enemySets: [{
            type: 'Critter',
            amount: [2, 3],
            atATime: 2,
            hz: 4000
        }, {
            type: 'Sentinel',
            amount: [3, 4],
            atATime: 1,
            hz: 4500
        }, {
            type: 'Gargoyle',
            amount: [1],
            initialDelay: 6500,
            atATime: 1,
            hz: 5000
        }, generalFlyObj]
    },
    basicHard3: {
        enemySets: [{
            type: 'Critter',
            amount: [3, 4],
            atATime: 1,
            hz: 2800
        }, {
            type: 'Sentinel',
            amount: [3, 4],
            atATime: 1,
            hz: 4500
        }, {
            type: 'Eruptlet',
            amount: [12, 13, 14],
            initialDelay: 4000,
            atATime: 3,
            hz: 4000
        }, generalFlyObj]
    },
    basicHard4: {
        enemySets: [{
            type: 'Sentinel',
            amount: [5, 6],
            atATime: 2,
            hz: 5000
        }, ultraHardFlyObj]
    },
    rammians: {
        enemySets: [{
            type: 'Rammian',
            amount: [7, 8],
            atATime: 2,
            hz: 8000
        }, hardFlyObj]
    },
    mobRammians: {
        enemySets: [{
            type: 'Rammian',
            amount: [5, 6],
            atATime: 2,
            hz: 8500
        }, {
            type: 'Eruptlet',
            amount: 25,
            atATime: 5,
            hz: 3800
        }, hardFlyObj]
    },
    hardGargs: {
        enemySets: [{
            type: 'Critter',
            amount: 22,
            atATime: 3,
            hz: 5000
        }, {
            type: 'Gargoyle',
            amount: [6],
            atATime: 2,
            hz: 14000
        }, hardFlyObj]
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
            amount: 4,
            atATime: 1,
            hz: 4000
        }, hardFlyObj]
    },
    outerBasicTwo: {
        token: 'outerNormal',
        enemySets: [{
            type: 'Critter',
            amount: 12,
            atATime: 2,
            hz: 4000
        }, {
            type: 'Hunter',
            amount: 3,
            atATime: 1,
            hz: 4000
        }, hardFlyObj]
    },
    outerBasicThree: {
        token: 'outerNormal',
        enemySets: [{
            type: 'Critter',
            amount: 15,
            atATime: 2,
            hz: 4000
        }, {
            type: 'Rammian',
            amount: 3,
            atATime: 1,
            hz: 4000
        }, hardFlyObj]
    },
    outerHardOne: {
        token: 'outerNormal',
        enemySets: [{
            type: 'Critter',
            amount: [7, 8],
            atATime: 1,
            hz: 3000
        }, {
            type: 'Rammian',
            amount: 3,
            initialDelay: 5000,
            atATime: 1,
            hz: 5000
        }, {
            type: 'Hunter',
            amount: 2,
            initialDelay: 15000,
            atATime: 2,
            hz: 5000
        }, hardFlyObj]
    },
    outerHardTwo: {
        token: 'outerNormal',
        enemySets: [{
            type: 'Critter',
            amount: 12,
            atATime: 2,
            hz: 4000
        }, {
            type: 'Hunter',
            amount: 2,
            atATime: 1,
            initialDelay: 3000,
            hz: 4500
        }, {
            type: 'Sentinel',
            amount: 1,
            atATime: 1,
            hz: 4000
        }, hardFlyObj]
    },
    outerHardThree: {
        token: 'outerNormal',
        enemySets: [{
            type: 'Critter',
            amount: 30,
            atATime: 6,
            hz: 6000
        }, ultraHardFlyObj]
    },
    easyGargs: {
        token: 'hard',
        enemySets: [{
            type: 'Gargoyle',
            amount: [5, 6],
            atATime: 1,
            hz: 2250
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
            amount: 35,
            atATime: 5,
            hz: 3800
        }, {
            type: 'Hunter',
            amount: 2,
            initialDelay: 5000,
            atATime: 1,
            hz: 8000
        }, hardFlyObj]
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

    //play training session music
    gameUtils.matterOnce(globals.currentGame, 'TravelStarted', () => {
        gameUtils.playAsMusic(globals.currentGame.soundPool.mainMarch);
    });

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
            isSupplyDropEligible: false,
            noSmokePit: true,
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
            gotoMapOnWin: true,
            trainingLevel: true,
            isSupplyDropEligible: false,
            noSmokePit: true,
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
            gotoMapOnWin: true,
            trainingLevel: true,
            isSupplyDropEligible: false,
            noSmokePit: true,
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
            gotoMapOnWin: true,
            trainingLevel: true,
            isSupplyDropEligible: false,
            noSmokePit: true,
        },
        mapNodeOptions: {
            noSpawnGleam: true
        }
    });

    var winCount = 0;
    this.counterFunction = function(event) {
        if (event.result == 'victory') {
            winCount += 1;
            if (winCount == 3) {
                let campNode = this.map.findNodeById('camp');
                campNode.manualDisable = false;
                campNode.manualEnable = true;
                campNode.activeCampTooltipOverride = 'Camp available.';
                Matter.Events.off(globals.currentGame, "VictoryOrDefeat", this.counterFunction);
            }
        }
    };
    Matter.Events.on(globals.currentGame, "VictoryOrDefeat", this.counterFunction);

    return {
        nextPhase: 'manual',
        bypassMapPhaseBehavior: true
    };
};

var phaseOneAndAHalf = function(options) {

    Matter.Events.off(globals.currentGame, "VictoryOrDefeat", this.counterFunction);

    let campNode = this.map.findNodeById('camp');
    this.map.setHeadToken('headtoken');
    this.map.setHeadTokenPosition({
        node: campNode
    });
    campNode.manualDisable = false;
    campNode.manualEnable = false;
    this.map.clearAllNodesExcept('camp');
    var l1 = this.map.addMapNode('learningWithUrsula');
    var l2 = this.map.addMapNode('learningWithUrsula');
    var l3 = this.map.addMapNode('learningWithUrsula');
    var ls1 = this.map.addMapNode('learningSentinelWithUrsula', {
        levelOptions: {
            token: 'hard',
            itemClass: 'book'
        }
    });

    return {
        nextPhase: 'allNodesComplete',
        onAllNodesComplete: function() {
            campNode.levelDetails.oneTimeNoResetIndicator = true;
        },
        onEnterBehavior: function() {
            var a1 = new Dialogue({
                actor: "MacMurray",
                text: "Get some rest, I'll be in touch...",
                backgroundBox: true,
                letterSpeed: 50,
                delayAfterEnd: 2500,
            });
            var chain = new DialogueChain([a1], {
                startDelay: 1500,
                cleanUpOnDone: true
            });
            globals.currentGame.currentScene.add(chain);
            chain.play();
        },
        wrappedNextPhase: function() {
            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.nextPhase();
            }, 5500);
        }
    };
};

//phase two is the "first" phase, it includes the starting dialog
var phaseTwo = function(options) {
    globals.currentGame.map.setHeadToken('headtoken');
    let campNode = this.map.findNodeById('camp');
    campNode.activeCampTooltipOverride = null;
    campNode.manualDisable = false;
    campNode.manualEnable = false;
    options = options || {};
    var world = this;
    let basicList = ['basic', 'basic2', 'basic3'];
    var startDialogue = new CampNoirTrueStart({
        done: () => {
            var campLevel = world.gotoLevelById('camp');
            world.map.clearAllNodesExcept('camp');
            world.map.addMapNode('basicHunter', {
                levelOptions: {
                    nodeTitle: "Hunter's Camp",
                    token: 'hard',
                    itemClass: 'worn',
                }
            });
            world.map.addMapNode('basic');
            world.map.addMapNode(mathArrayUtils.getRandomElementOfArray(basicList));
            world.map.addMapNode(mathArrayUtils.getRandomElementOfArray(basicList));
            world.map.addMapNode(mathArrayUtils.getRandomElementOfArray(basicList));

            var basicHardChoice = mathArrayUtils.getRandomElementOfArray(['basicHard', 'basicHard2', 'basicHard3', 'basicHard4']);
            world.map.addMapNode(basicHardChoice, {
                levelOptions: {
                    nodeTitle: 'Mega Den',
                    token: 'hard',
                    itemClass: 'worn',
                    outer: true
                }
            });

            world.map.addMapNode('multiLevel', {
                levelOptions: {
                    enemyDefList: [mathArrayUtils.getRandomElementOfArray(basicList), mathArrayUtils.getRandomElementOfArray(basicList), mathArrayUtils.getRandomElementOfArray(basicList)],
                    itemClass: 'stimulant',
                }
            });

            world.map.addMapNode('airDropStation', {
                levelOptions: {
                    prereqCount: 1,
                    itemClass: 'stimulant',
                    itemType: 'item'
                }
            });
            world.map.addMapNode('airDropStation', {
                levelOptions: {
                    prereqCount: 3,
                    itemClass: 'worn',
                    itemType: 'specialtyItem',
                    uniqueItem: true,
                    regularTokenName: 'AirDropSpecialToken',
                    specialTokenName: 'AirDropSpecialTokenGleam'
                }
            });
            if (options.skippedTutorial) {
                campLevel.skippedTutorial = true;
                campLevel.mapTableFalseOverride = true;
                var a1 = new Dialogue({
                    actor: "MacMurray",
                    text: "Air drop incoming, I take it you know what to do...",
                    letterSpeed: 45,
                    backgroundBox: true,
                    delayAfterEnd: 750
                });
                var chain = new DialogueChain([a1], {
                    startDelay: 1500,
                    done: function() {
                        chain.cleanUp();
                        gameUtils.doSomethingAfterDuration(() => {
                            globals.currentGame.flyover(() => {
                                globals.currentGame.dustAndItemBox({
                                    location: gameUtils.getPlayableCenterPlus({
                                        x: 200,
                                        y: 120
                                    }),
                                    item: ['BasicMicrochip', 'Book', {
                                        itemClass: 'worn',
                                        itemType: 'specialtyItem'
                                    }],
                                    special: true
                                });
                                globals.currentGame.dustAndItemBox({
                                    location: gameUtils.getPlayableCenterPlus({
                                        x: 200,
                                        y: 50
                                    }),
                                    item: [{
                                        itemClass: 'worn'
                                    }, {
                                        itemClass: 'stimulant'
                                    }, {
                                        itemClass: 'lightStimulant'
                                    }, {
                                        itemClass: 'lightStimulant'
                                    }, {
                                        itemClass: 'lightStimulant'
                                    }, ]
                                });
                                gameUtils.doSomethingAfterDuration(() => {
                                    campLevel.mapTableFalseOverride = false;
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
            } else {
                //give the first specialty item
                var s1 = new Dialogue({
                    actor: "MacMurray",
                    text: "Things look dire. I'm sending over a specialty item to help. Good luck...",
                    pauseAfterWord: {
                        duration: 1000,
                        word: 'help.'
                    },
                    letterSpeed: 45,
                    backgroundBox: true,
                    delayAfterEnd: 4500
                });

                s1.onFullyShown = function() {
                    globals.currentGame.flyover(() => {
                        globals.currentGame.dustAndItemBox({
                            location: gameUtils.getPlayableCenterPlus({
                                x: 200,
                                y: 120
                            }),
                            item: [{
                                itemClass: 'worn',
                                itemType: 'specialtyItem'
                            }],
                            special: true
                        });
                    });
                };

                var s2 = new Dialogue({
                    text: "Specialty items are either red or green. Red specialty items are equippable by Shane.",
                    isInfo: true,
                    backgroundBox: true,
                    delayAfterEnd: 500
                });

                var s3 = new Dialogue({
                    text: "Green specialty items are equippable by Ursula.",
                    isInfo: true,
                    backgroundBox: true,
                    delayAfterEnd: 4500
                });

                var schain = new DialogueChain([s1, s2, s3], {
                    startDelay: 1500,
                    cleanUpOnDone: true,
                });
                schain.play();
            }
        }
    });

    globals.currentGame.currentScene.transitionToScene(startDialogue.scene);
    startDialogue.play();

    return {
        nextPhase: 'allNodesComplete',
        onEnterBehavior: function() {
            var a1 = new Dialogue({
                actor: "MacMurray",
                text: "You're still alive... Unfortunately it's getting hotter.",
                backgroundBox: true,
                letterSpeed: 30,
            });

            var a2 = new Dialogue({
                actor: "MacMurray",
                text: "Radar shows an increased enemy presence... resupply incoming...",
                backgroundBox: true,
                continuation: true,
                letterSpeed: 30,
                delayAfterEnd: 1000,
            });
            var self = this;
            var chain = new DialogueChain([a1, a2], {
                startDelay: 750,
                cleanUpOnDone: true
            });
            globals.currentGame.currentScene.add(chain);
            chain.play();
            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.flyover(() => {
                    globals.currentGame.dustAndItemBox({
                        location: gameUtils.getPlayableCenterPlus({
                            x: 200,
                            y: 120
                        }),
                        item: ['BasicMicrochip', 'Book'],
                        special: true
                    });
                });
            }, 2000);
        }
    };
};

var phaseThree = function() {
    this.map.clearAllNodesExcept('camp');
    this.map.addMapNode('basic');
    this.map.addMapNode('basic');
    this.map.addMapNode('airDropStation', {
        levelOptions: {
            prereqCount: 2,
            itemClass: 'worn'
        }
    });
    this.map.addMapNode('basic');
    this.map.addMapNode('basic');
    this.map.addMapNode('easySentinels');

    //outer
    let outerParam = {
        levelOptions: {
            outer: true,
        }
    };

    //right levels
    this.map.addMapNode('outerBasic', Object.assign(outerParam, {
        positionOptions: {
            minX: gameUtils.getCanvasCenter().x
        }
    }));
    this.map.addMapNode('outerBasic', Object.assign(outerParam, {
        positionOptions: {
            minX: gameUtils.getCanvasCenter().x
        }
    }));
    this.map.addMapNode('outerBasicTwo', Object.assign(outerParam, {
        positionOptions: {
            minX: gameUtils.getCanvasCenter().x
        }
    }));

    //left levels
    this.map.addMapNode('outerBasicThree', Object.assign(outerParam, {
        positionOptions: {
            maxX: gameUtils.getCanvasCenter().x
        }
    }));
    this.map.addMapNode('outerHardTwo', {
        levelOptions: {
            outer: true,
            token: 'outerHard',
            itemClass: 'stimulant',
        },
        positionOptions: {
            maxX: gameUtils.getCanvasCenter().x
        }
    });
    this.map.addMapNode('mobs', {
        levelOptions: {
            outer: true,
            token: 'mobs',
            itemClass: 'stimulant',
            positionOptions: {
                maxX: gameUtils.getCanvasCenter().x
            }
        }
    });

    this.map.addMapNode('outerHardOne', {
        levelOptions: {
            token: 'outerHard',
            itemClass: 'book'
        }
    });

    //air drops
    this.map.addMapNode('airDropStation', {
        levelOptions: {
            outer: true,
            bridge: true
            // prereqCount: 0
        },
        positionOptions: {
            maxX: gameUtils.getCanvasCenter().x
        }
    });

    this.map.addMapNode('airDropStation', {
        levelOptions: {
            prereqCount: 3,
            itemClass: 'worn',
            itemType: 'specialtyItem',
            uniqueItem: true,
            regularTokenName: 'AirDropSpecialToken',
            specialTokenName: 'AirDropSpecialTokenGleam'
        },
    });

    this.map.addMapNode('airDropStation', {
        levelOptions: {
            outer: true,
            prereqCount: 3,
            itemClass: 'rugged',
            itemType: 'specialtyItem',
            uniqueItem: true,
            regularTokenName: 'AirDropSpecialToken',
            specialTokenName: 'AirDropSpecialTokenGleam'
        },
        positionOptions: {
            minX: gameUtils.getCanvasCenter().x,
            maxY: gameUtils.getCanvasCenter().y + 50,
            minY: gameUtils.getCanvasCenter().y - 50,
        }
    });

    this.map.addMapNode('multiLevel', {
        levelOptions: {
            outer: true,
            enemyDefList: ['rammians', 'easyGargs', 'outerBasic'],
            itemClass: 'rugged',
            itemType: 'microchip'
        }
    });

    return {
        nextPhase: 'allNodesComplete',
        onEnterBehavior: function() {
            var a1 = new Dialogue({
                actor: "MacMurray",
                text: "Serious camps have been identified... incoming...",
                backgroundBox: true,
                letterSpeed: 30,
                delayAfterEnd: 1000,
            });
            var self = this;
            var chain = new DialogueChain([a1], {
                startDelay: 750,
                cleanUpOnDone: true
            });
            globals.currentGame.currentScene.add(chain);
            chain.play();
            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.flyover(() => {
                    globals.currentGame.dustAndItemBox({
                        location: gameUtils.getPlayableCenterPlus({
                            x: 200,
                            y: 120
                        }),
                        item: ['Book', 'Book'],
                        special: true
                    });
                });
            }, 2000);
        }
    };
};

var finalPhase = function() {
    this.map.clearAllNodesExcept('camp');
    this.map.addMapNode('basic');
    this.map.addMapNode('basic');

    var decision = mathArrayUtils.flipCoin();
    var positionOp = {
        minX: gameUtils.getCanvasCenter().x
    };
    var otherPositionOp = {
        maxX: gameUtils.getCanvasCenter().x
    };
    if (decision) {
        positionOp = {
            maxX: gameUtils.getCanvasCenter().x
        };
        otherPositionOp = {
            minX: gameUtils.getCanvasCenter().x
        };
    }

    //air drops
    this.map.addMapNode('airDropStation', {
        levelOptions: {
            outer: true,
            bridge: true
            // prereqCount: 0
        },
        positionOptions: {
            maxX: gameUtils.getCanvasCenter().x
        }
    });

    this.map.addMapNode('multiLevel', {
        levelOptions: {
            outer: true,
            enemyDefList: ['rammians', 'hardGargs', 'mobs'],
            itemClass: 'worn',
            itemType: 'microchip',
        },
        positionOptions: positionOp
    });


    var outerHards = ['outerHardOne', 'outerHardTwo', 'outerHardThree'];
    this.map.addMapNode('multiLevel', {
        levelOptions: {
            outer: true,
            enemyDefList: [mathArrayUtils.getRandomElementOfArray(outerHards), mathArrayUtils.getRandomElementOfArray(outerHards), mathArrayUtils.getRandomElementOfArray(outerHards)],
            itemClass: 'book',
        },
        positionOptions: otherPositionOp
    });

    var basicHards = ['basicHard', 'basicHard2', 'basicHard3', 'basicHard4'];

    this.map.addMapNode(mathArrayUtils.getRandomElementOfArray(basicHards), {
        levelOptions: {
            nodeTitle: 'Camp',
            token: 'hard',
            outer: true
        }
    });

    this.map.addMapNode(mathArrayUtils.getRandomElementOfArray(basicHards), {
        levelOptions: {
            nodeTitle: 'Camp',
            token: 'hard',
            outer: true
        }
    });

    this.map.addMapNode(mathArrayUtils.getRandomElementOfArray(basicHards), {
        levelOptions: {
            nodeTitle: 'Camp',
            token: 'hard',
            outer: true
        }
    });

    this.map.addMapNode('multiLevel', {
        levelOptions: {
            outer: true,
            enemyDefList: [mathArrayUtils.getRandomElementOfArray(outerHards), mathArrayUtils.getRandomElementOfArray(outerHards), 'mobRammians', mathArrayUtils.getRandomElementOfArray(outerHards)],
            itemClass: 'rugged',
        },
        positionOptions: otherPositionOp
    });

    return {
        nextPhase: 'allNodesComplete',
        onEnterBehavior: function() {
            var a1 = new Dialogue({
                actor: "MacMurray",
                text: "Great job...",
                backgroundBox: true,
                letterSpeed: 30,
                delayAfterEnd: 1000,
            });
            var self = this;
            var chain = new DialogueChain([a1], {
                startDelay: 750,
                cleanUpOnDone: true
            });
            globals.currentGame.currentScene.add(chain);
            chain.play();
        }
    };
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

        //gets applied per level
        decorateTerrain: function(scene, tint) {
            //various tints
            var tIndex = acceptableTileTints.indexOf(tint);
            var ornamentTiles = [];
            var ornamentTint = acceptableOrnamentTints[tIndex];

            //Add doodads to non camp levels
            var noZones = this.noZones || [];

            //create rock doodads
            let rock1 = SceneryUtils.createRock({
                names: ['Rock2'],
                tint: rockTints[tIndex]
            });
            let rock2 = SceneryUtils.createRock({
                names: ['Rock2a'],
                tint: rockTints[tIndex]
            });
            let rock3 = SceneryUtils.createRock({
                names: ['Rock2b'],
                tint: rockTints[tIndex]
            });

            if (!this.isCampProper) {
                var numberOfRocks = 3;

                var createRock = function() {
                    var rock = SceneryUtils.createRock({
                        tint: rockTints[tIndex],
                        collidableRocks: true,
                    });
                    rock.setPosition(gameUtils.getRandomPlacementWithinPlayableBounds({
                        buffer: 80,
                        useUpcomingSceneNoZones: true,
                        noZones: noZones
                    }));
                    scene.add(rock);
                };
                mathArrayUtils.repeatXTimes(createRock, numberOfRocks);

                //desert flower map
                for (let i = 0; i <= 5; i++) {
                    ornamentTiles.push('FrollGround/DesertFlower' + i);
                }
                var decoratedTiles = {
                    tint: ornamentTint,
                    scale: {
                        x: mathArrayUtils.getRandomNumberBetween(0.75, 1),
                        y: mathArrayUtils.getRandomNumberBetween(0.75, 1)
                    },
                    randomHFlip: true,
                    possibleTextures: ornamentTiles
                };

                var rockContainer = SceneryUtils.decorateTerrain({
                    possibleDoodads: [rock1, rock2, rock3, rock1, rock2, rock3],
                    possibleTextures: decoratedTiles,
                    tileWidth: tileSize,
                    hz: 0.3,
                    where: 'stage',
                    groupings: {
                        hz: 0.5,
                        possibleAmounts: [3, 4, 5]
                    },
                    r: 1,
                    noZones: noZones
                });
                scene.add(rockContainer);

                var tree = SceneryUtils.createTree({
                    tint: treeTints[tIndex]
                });
                tree.unique = true;
                tree.groupingOptions = {
                    priority: 1
                };
                tree.reallyTry = true;
                tree.borderBuffer = true;

                var tree2 = SceneryUtils.createTree({
                    tint: treeTints[tIndex],
                });
                tree2.unique = true;
                tree2.groupingOptions = {
                    priority: 1
                };
                tree2.borderBuffer = true;

                //add smokey pit and tent
                if (!this.noSmokePit) {
                    var tentDoodad = DoodadFactory.createDoodad({
                        menuItem: 'enemyTent1',
                        tint: rockTints[tIndex],
                        doodadScale: this.outer ? 1.0 : 0.75,
                    });
                    tentDoodad.unique = true;

                    var trough1 = DoodadFactory.createDoodad({
                        menuItem: 'waterTrough',
                        tint: treeTints[tIndex]
                    });
                    trough1.unique = true;
                    trough1.groupingOptions = {
                        priority: 1,
                        min: 110,
                        max: 150,
                    };

                    var trough2 = DoodadFactory.createDoodad({
                        menuItem: 'waterTrough',
                        tint: treeTints[tIndex]
                    });
                    trough2.unique = true;
                    trough2.groupingOptions = {
                        priority: 3,
                        min: 110,
                        max: 150,
                    };

                    if (!this.outer) {
                        trough1 = null;
                        trough2 = null;
                    }

                    var enemyPost4 = DoodadFactory.createDoodad({
                        menuItem: 'enemyPost1',
                        tint: treeTints[tIndex]
                    });
                    enemyPost4.unique = true;
                    enemyPost4.groupingOptions = {
                        priority: 2,
                        min: 70,
                        max: 90,
                    };
                    this.tent = SceneryUtils.decorateTerrain({
                        possibleDoodads: [tentDoodad, trough1, trough2, enemyPost4, tree, tree2, {
                                textureName: 'bullets',
                                randomHFlip: true,
                                where: 'backgroundOne',
                                unique: true,
                                groupingOptions: {
                                    priority: 2
                                }
                            }, {
                                textureName: 'CampDoodads/CritterFootprint',
                                randomScale: {
                                    min: 0.8,
                                    max: 1.0
                                },
                                groupingOptions: {
                                    min: 200,
                                    max: 400
                                },
                                alpha: 0.75,
                                randomHFlip: true,
                                rotate: 'random',
                                where: 'stageNTwo'
                            }, {
                                textureName: 'CampDoodads/CritterFootprint2',
                                randomScale: {
                                    min: 0.8,
                                    max: 1.0
                                },
                                groupingOptions: {
                                    min: 80,
                                    max: 200
                                },
                                alpha: 0.75,
                                randomHFlip: true,
                                rotate: 'random',
                                where: 'stageNTwo'
                            }, {
                                textureName: 'CampDoodads/bootprops',
                                randomScale: {
                                    min: 0.8,
                                    max: 1.0
                                },
                                randomHFlip: true,
                                unique: true,
                                where: 'stage',
                                groupingOptions: {
                                    priority: 3,
                                    min: 80,
                                    max: 100
                                }
                            }, {
                                textureName: 'CampDoodads/Bench1',
                                randomScale: {
                                    min: 0.8,
                                    max: 1.0
                                },
                                randomHFlip: true,
                                unique: true,
                                where: 'stage',
                                groupingOptions: {
                                    priority: 3,
                                    min: 100,
                                    max: 150
                                }
                            },
                            /*{
                                                       textureName: 'CampDoodads/MiniTent1',
                                                       randomScale: {
                                                           min: 0.8,
                                                           max: 1.0
                                                       },
                                                       randomHFlip: true,
                                                       unique: true,
                                                       where: 'stage',
                                                       groupingOptions: {
                                                           priority: 3,
                                                           min: 200,
                                                           max: 300
                                                       },
                                                       loneNZRadius: 80
                                                   }, */
                            {
                                textureName: 'CampDoodads/BarrelTrash1',
                                randomScale: {
                                    min: 0.8,
                                    max: 1.0
                                },
                                randomHFlip: true,
                                unique: true,
                                where: 'stage',
                                groupingOptions: {
                                    priority: 3,
                                    min: 100,
                                    max: 150
                                }
                            }, {
                                textureName: 'CampDoodads/CritterFootprint3',
                                randomScale: {
                                    min: 0.8,
                                    max: 1.0
                                },
                                groupingOptions: {
                                    min: 80,
                                    max: 200
                                },
                                alpha: 0.75,
                                randomHFlip: true,
                                rotate: 'random',
                                where: 'stageNTwo'
                            }
                        ],
                        tileWidth: tileSize,
                        maxNumber: 1,
                        buffer: 180,
                        hz: 1.0,
                        groupings: {
                            center: tentDoodad,
                            hz: 1.0,
                            possibleAmounts: [7 + this.totalEnemies],
                            scalar: {
                                min: 120,
                                max: 200
                            }
                        },
                        where: 'stageNOne',
                        r: 1,
                        noZones: noZones
                    });
                    scene.add(this.tent);

                    var tentPosition = this.tent.list[0].position;

                    var rockPitDoodad = DoodadFactory.createDoodad({
                        menuItem: 'rockPit',
                        tint: rockTints[tIndex]
                    });
                    rockPitDoodad.unique = true;

                    var enemyPost = DoodadFactory.createDoodad({
                        menuItem: 'enemyPost1',
                        tint: treeTints[tIndex]
                    });
                    enemyPost.unique = true;
                    enemyPost.groupingOptions = {
                        priority: 1,
                        min: 70,
                        max: 90,
                    };

                    var enemyPost2 = DoodadFactory.createDoodad({
                        menuItem: 'enemyPost2',
                        tint: treeTints[tIndex]
                    });
                    enemyPost2.unique = true;
                    enemyPost2.groupingOptions = {
                        priority: 1,
                        min: 70,
                        max: 90,
                    };

                    var enemyPost3 = DoodadFactory.createDoodad({
                        menuItem: 'enemyPost2',
                        tint: treeTints[tIndex],
                        preventDuplicateDoodad: enemyPost2
                    });
                    enemyPost3.unique = true;
                    enemyPost3.groupingOptions = {
                        priority: 1,
                        min: 70,
                        max: 90,
                    };

                    var log1 = DoodadFactory.createDoodad({
                        menuItem: 'sidewaysLog1',
                        tint: treeTints[tIndex]
                    });
                    log1.unique = true;
                    log1.groupingOptions = {
                        priority: 0,
                        rotateTowardCenter: true,
                        min: 75,
                        max: 80
                    };

                    var basicPitArray = [rockPitDoodad, rock1, rock2, rock3, enemyPost, enemyPost2, enemyPost3, log1, log1];
                    if (this.outer) {
                        var amountOver = Math.min(4, this.totalEnemies - 4);
                        mathArrayUtils.repeatXTimes(() => {
                            let ep = DoodadFactory.createDoodad({
                                menuItem: 'enemyPost2',
                                tint: treeTints[tIndex],
                                preventDuplicateDoodad: basicPitArray
                            });
                            ep.unique = true;
                            ep.groupingOptions = {
                                priority: 1,
                                min: 70,
                                max: 115,
                            };
                            basicPitArray.push(ep);
                        }, amountOver);
                    }

                    this.pit = SceneryUtils.decorateTerrain({
                        possibleDoodads: basicPitArray.concat([{
                            textureName: 'bullets',
                            where: 'backgroundOne',
                            randomHFlip: true,
                            // unique: true,
                            randomScale: {
                                min: 0.8,
                                max: 1.0
                            }
                        }, {
                            textureName: 'CampDoodads/CritterFootprint',
                            randomScale: {
                                min: 0.8,
                                max: 1.0
                            },
                            groupingOptions: {
                                min: 80,
                                max: 600
                            },
                            alpha: 0.75,
                            randomHFlip: true,
                            rotate: 'random',
                            where: 'stageNTwo'
                        }, {
                            textureName: 'CampDoodads/CritterFootprint2',
                            randomScale: {
                                min: 0.8,
                                max: 1.0
                            },
                            groupingOptions: {
                                min: 80,
                                max: 400
                            },
                            alpha: 0.75,
                            randomHFlip: true,
                            rotate: 'random',
                            where: 'stageNTwo'
                        }, {
                            textureName: 'CampDoodads/CritterFootprint3',
                            randomScale: {
                                min: 0.8,
                                max: 1.0
                            },
                            groupingOptions: {
                                min: 80,
                                max: 400
                            },
                            alpha: 0.75,
                            randomHFlip: true,
                            rotate: 'random',
                            where: 'stageNTwo'
                        }, {
                            textureName: 'CampDoodads/CritterFootprint5',
                            randomScale: {
                                min: 0.8,
                                max: 1.0
                            },
                            groupingOptions: {
                                min: 80,
                                max: 400
                            },
                            alpha: 0.75,
                            randomHFlip: true,
                            rotate: 'random',
                            where: 'stageNTwo'
                        }]),
                        tileWidth: tileSize,
                        maxNumber: 1,
                        nonTilePosition: true,
                        explicitPosition: () => {
                            return gameUtils.getRandomPositionWithinRadiusAroundPoint({
                                point: tentPosition,
                                minRadius: 175,
                                maxRadius: 225,
                                withinPlayableBounds: true,
                                playableBoundBuffer: 90
                            });
                        },
                        buffer: 100,
                        hz: 1.0,
                        groupings: {
                            center: rockPitDoodad,
                            hz: 1.0,
                            possibleAmounts: [8 + this.totalEnemies * 2],
                            scalar: {
                                min: 75,
                                max: 115
                            }
                        },
                        where: 'stageNOne',
                        r: 1,
                        noZones: noZones
                    });
                    scene.add(this.pit);

                    var pitPosition = this.pit.list[0].position;

                    //other footprints
                    this.footprints = SceneryUtils.decorateTerrain({
                        possibleTextures: ['CampDoodads/CritterFootprint',
                            'CampDoodads/CritterFootprint2',
                            'CampDoodads/CritterFootprint3',
                            'CampDoodads/CritterFootprint4',
                            'CampDoodads/CritterFootprint5',
                            'CampDoodads/CritterFootprint6'
                        ],
                        tileWidth: 150,
                        hz: 0.5,
                        maxNumber: 5,
                        alpha: 0.85,
                        where: 'stageNOne',
                        rotate: 'random',
                        r: 1,
                    });
                    scene.add(this.footprints);
                }
            } else {
                var numberOfRocks2 = 10;
                var createRock3 = function() {
                    var rock = SceneryUtils.createRock({
                        names: ['Rock2', 'Rock2a', 'Rock2b'],
                        tint: rockTints[tIndex]
                    });
                    rock.setPosition(gameUtils.getRandomPlacementWithinPlayableBounds({
                        buffer: 80,
                        useUpcomingSceneNoZones: true,
                        noZones: noZones,
                        doodad: rock
                    }));
                    scene.add(rock);
                };

                mathArrayUtils.repeatXTimes(createRock3, numberOfRocks2);
            }

            //crag map
            ornamentTiles = [];
            for (let i = 1; i <= 4; i++) {
                ornamentTiles.push('FrollGround/Ornament' + i);
            }
            var decoratedCrag = {
                possibleTextures: ornamentTiles,
                tint: 0x4f2b00,
                scale: {
                    x: 0.75,
                    y: 0.75
                },
                sortYOffset: -100,
                randomHFlip: true,
                unique: true,
            };

            this.cragMap = SceneryUtils.decorateTerrain({
                possibleTextures: decoratedCrag,
                tileWidth: tileSize,
                maxNumber: 3,
                where: 'stageNOne',
                r: 1,
                noZones: noZones
            });

            //animated stuff map
            var flowerTint = acceptableFlowerTints[acceptableTileTints.indexOf(tint)];
            var animationOrnamentTiles = [];
            for (var j = 0; j < 8; j++) {

                let randomSpeed = mathArrayUtils.getRandomNumberBetween(0.15, 0.35);
                let randomScale = mathArrayUtils.getRandomNumberBetween(0.65, 1);
                let randomGrassSpeed = mathArrayUtils.getRandomNumberBetween(0.02, 0.09);
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
                    speed: randomGrassSpeed
                });

                if (Math.random() > 0.30) {
                    animationOrnamentTiles.push({
                        animationName: 'FlowerAnimsOrange',
                        spritesheetName: 'TerrainAnimations',
                        playDelay: Math.random() * 400,
                        speed: randomSpeed,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                        sortYOffset: flowerAnimsSortYOffset,
                        decorate: function(anim) {
                            graphicsUtils.addShadowToSprite({
                                sprite: anim,
                                alpha: 0.5,
                                offset: {
                                    x: 0,
                                    y: 10 * randomScale
                                },
                                size: {
                                    x: 24,
                                    y: 8
                                }
                            });
                        }
                    });
                }

                if (Math.random() > 0.4) {
                    animationOrnamentTiles.push({
                        animationName: 'FlowerAnimsBlue',
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed,
                        playDelay: Math.random() * 400,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                        sortYOffset: flowerAnimsSortYOffset,
                        decorate: function(anim) {
                            graphicsUtils.addShadowToSprite({
                                sprite: anim,
                                alpha: 0.5,
                                offset: {
                                    x: 0,
                                    y: 10 * randomScale
                                },
                                size: {
                                    x: 24,
                                    y: 8
                                }
                            });
                        }
                    });
                }

                if (Math.random() > 0.3) {
                    animationOrnamentTiles.push({
                        animationName: 'GrassAnimsBlue',
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                    });
                }

                if (Math.random() > 0.3) {
                    animationOrnamentTiles.push({
                        animationName: 'GrassAnimsOrange',
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                    });
                }

                if (Math.random() > 0.3) {
                    animationOrnamentTiles.push({
                        animationName: 'GrassAnimsPink',
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                    });
                }

                if (Math.random() > 0.3) {
                    animationOrnamentTiles.push({
                        animationName: 'FlowerAnimsTeal',
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                        sortYOffset: flowerAnimsSortYOffset,
                        decorate: function(anim) {
                            graphicsUtils.addShadowToSprite({
                                sprite: anim,
                                alpha: 0.5,
                                offset: {
                                    x: 0,
                                    y: 10 * randomScale
                                },
                                size: {
                                    x: 24,
                                    y: 8
                                }
                            })
                        }
                    });
                }

                if (Math.random() > 0.3) {
                    animationOrnamentTiles.push({
                        animationName: 'FlowerAnimsYellow',
                        spritesheetName: 'TerrainAnimations',
                        speed: randomSpeed,
                        scale: {
                            x: randomScale,
                            y: randomScale
                        },
                        sortYOffset: flowerAnimsSortYOffset,
                        decorate: function(anim) {
                            graphicsUtils.addShadowToSprite({
                                sprite: anim,
                                alpha: 0.5,
                                offset: {
                                    x: 0,
                                    y: 10 * randomScale
                                },
                                size: {
                                    x: 24,
                                    y: 8
                                }
                            });
                        }
                    });
                }
            }

            var myTileSize = tileSize / 1.2;
            var myHz = 0.75;
            if (!this.isCampProper) {
                myTileSize = tileSize;
                myHz = 0.3;
            }
            this.animatedOrnamentMap = SceneryUtils.decorateTerrain({
                possibleTextures: animationOrnamentTiles.concat([rock1, rock2, rock3]),
                tileWidth: myTileSize,
                noScale: true,
                hz: myHz,
                groupings: {
                    hz: 0.4,
                    possibleAmounts: [2, 3, 4, 5, 6],
                    scalar: 20
                },
                where: 'stage',
                r: 1,
                tint: flowerTint,
                noZones: noZones,
                seed: this.animatedOrnamentMap ? this.animatedOrnamentMap.seed : null
            });

            // scene.add(this.desertFlowerMap);
            scene.add(this.cragMap);
            scene.add(this.animatedOrnamentMap);

            var l1 = gameUtils.createAmbientLights({
                hexColorArray: ambientLightTints[tIndex >= 0 ? tIndex : 0],
                where: 'backgroundOne',
                intensity: 0.20,
                rotate: !this.isCampProper,
                rotateSpeed: 5
            });
            var lborder = gameUtils.createAmbientLightBorder(borderTints[tIndex], 'backgroundOne', 0.65);
            scene.add(l1);
            scene.add(lborder);
        }
    },

    phases: [],
    initWorld: function(options) {
        this.phases.push(phaseOne.bind(this));
        this.phases.push(phaseOneAndAHalf.bind(this));
        this.phases.push(phaseTwo.bind(this));
        this.phases.push(phaseThree.bind(this));
        this.phases.push(finalPhase.bind(this));
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
