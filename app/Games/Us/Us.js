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
} from '@utils/UtilityMenu.js';
import Marine from '@games/Us/Units/Marine.js';
import Medic from '@games/Us/Units/Medic.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import {
    Doodad
} from '@utils/Doodad.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {
    Scene
} from '@core/Scene.js';
import UnitPanel from '@games/Us/UnitPanel.js';
import UnitSpawner from '@games/Us/UnitSpawner.js';
import styles from '@utils/Styles.js';
import {
    campNoir
} from '@games/Us/Worlds/CampNoir.js';
import EndLevelScreenOverlay from '@games/Us/Screens/EndLevelStatScreenOverlay.js';
import {
    StatCollector
} from '@games/Us/StatCollector.js';
import UnitMenu from '@games/Us/UnitMenu.js';
import {
    ShaneIntro
} from '@games/Us/Dialogues/ShaneIntro.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import {
    RewardManager,
} from '@games/Us/RewardManager.js';

var targetScore = 1;

var game = {

    worldOptions: {
        //background: {image: 'Grass', scale: {x: 1.0, y: 1.0}},
        width: 1600, //1600
        height: 700, //800 playing area, 100 unit panel
        unitPanelHeight: 100,
        gravity: 0,
        unitPanelConstructor: UnitPanel
    },

    gameName: 'Us',
    level: 1,
    // victoryCondition: {type: 'timed', limit: 5},
    victoryCondition: {
        type: 'unlimited'
    },
    enableUnitSystem: true,
    enablePathingSystem: true,
    enableItemSystem: true,
    noClickIndicator: true,
    hideScore: true,
    currentWorldIndex: 0,
    currentPhase: 0,
    worlds: [campNoir],
    currentCamp: null,
    currentScene: null,
    showTips: true,
    showedTips: {},
    unitCorpseTime: 60000,

    //debug options
    goStraightToUrsulaTasks: false,
    mapTableAlwaysActive: true,

    initExtension: function() {
        this.heartbeat = gameUtils.getSound('heartbeat.wav', {
            volume: 0.12,
            rate: 0.9
        });
        this.flyoverSound = gameUtils.getSound('flyover.wav', {
            volume: 1.1,
            rate: 1.35
        });
        this.flyoverSoundQuiet = gameUtils.getSound('flyover.wav', {
            volume: 0.5,
            rate: 1.35
        });
        this.boxSound = gameUtils.getSound('criticalhit.wav', {
            volume: 0.15,
            rate: 0.65
        });
        this.reconfigureSound = gameUtils.getSound('wooshconfigure.wav', {
            volume: 0.05,
            rate: 1.25
        });

        this.levelLocalEntities = [];

        //conquer coords
        this.flagPosition = mathArrayUtils.clonePosition(gameUtils.getPlayableCenter(), {
            x: 150,
            y: 150
        });
        this.augmentRackPosition = {
            x: gameUtils.getCanvasCenter().x - 180 + 50 / 2.0,
            y: gameUtils.getPlayableCenter().y - 30 + 50 / 2.0
        };
        this.mapTablePosition = mathArrayUtils.roundPositionToWholeNumbers({
            x: gameUtils.getCanvasCenter().x + 130,
            y: gameUtils.getCanvasCenter().y - 150
        });

        //setup a common sound pool
        this.soundPool = {};
        this.soundPool.campMarch = gameUtils.getSound('music/campdiddy.mp3', {
            volume: 0.5,
            rate: 1.0
        });
        this.soundPool.campVamp = gameUtils.getSound('music/campdiddy2.mp3', {
            volume: 0.5,
            rate: 1.0
        });
        this.soundPool.stroll = gameUtils.getSound('music/peacefulstroll.mp3', {
            volume: 0.25,
            rate: 1.0
        });
        this.soundPool.fillerMovement = gameUtils.getSound('music/walkingvamp.mp3', {
            volume: 1.0,
            rate: 1.0
        });
        this.soundPool.mainMarch = gameUtils.getSound('music/march2.mp3', {
            volume: 0.5,
            rate: 1.0
        });
        this.soundPool.winVamp = gameUtils.getSound('music/winvamp.mp3', {
            volume: 0.1,
            rate: 1.0
        });
        this.soundPool.hecticLevelVamp = gameUtils.getSound('music/hectictimes1.mp3', {
            volume: 0.4,
            rate: 1.0
        });
        this.soundPool.sceneContinue = gameUtils.getSound('gunclick1.wav', {
            volume: 0.1,
            rate: 1.0
        });
        this.soundPool.sceneSwipe = gameUtils.getSound('dashsound2.wav', {
            volume: 0.03,
            rate: 1.0
        });
        this.soundPool.transitionOne = gameUtils.getSound('gentletransition.wav', {
            volume: 0.04,
            rate: 1.0
        });
        this.soundPool.transitionTwo = gameUtils.getSound('gentletransition.wav', {
            volume: 0.04,
            rate: 0.8
        });
        this.soundPool.positiveSound = gameUtils.getSound('positivevictorysound2.wav', {
            volume: 0.07,
            rate: 1.0
        });
        this.soundPool.positiveSoundFast = gameUtils.getSound('positivevictorysound2.wav', {
            volume: 0.07,
            rate: 1.5
        });
        this.soundPool.negativeSound = gameUtils.getSound('negative_sound.wav', {
            volume: 0.07,
            rate: 1.0
        });
        this.soundPool.negativeSound2 = gameUtils.getSound('negative_sound.wav', {
            volume: 0.07,
            rate: 1.5
        });
        this.soundPool.keypressSound = gameUtils.getSound('keypress1.wav', {
            volume: 0.15,
            rate: 1
        });
        this.soundPool.unlock1 = gameUtils.getSound('unlockability.wav', {
            volume: 0.12,
            rate: 1.2
        });
        this.soundPool.itemPlaceSound = gameUtils.getSound('itemplace.wav', {
            volume: 0.06,
            rate: 1
        });
        this.soundPool.itemChoose = gameUtils.getSound('itemplace.wav', {
            volume: 0.05,
            rate: 1.5
        });

        this.levelEntryMusic = [this.soundPool.mainMarch, this.soundPool.hecticLevelVamp];

        //next phase detector
        Matter.Events.on(this, 'nodeCompleted', function(event) {
            if (this.currentPhaseObj.nextPhase == 'allNodesComplete' && this.map.areAllNodesExceptCampCompleted() && !this.currentPhaseObj.alreadyClosed) {
                //manually enable the camp
                let campNode = this.map.findNodeById('camp');
                campNode.manualEnable = true;
                campNode.setCampTooltip('Camp available.');
                this.currentPhaseObj.alreadyClosed = true;

                //show stuff on the subsequent showMap event
                gameUtils.matterOnce(this, 'showMap', function(event) {
                    //if the current phase is a 'allNodesComplete' phase, look for this condition upon showMap
                    if (this.currentPhaseObj.onAllNodesComplete) {
                        this.currentPhaseObj.onAllNodesComplete();
                    }

                    //show arrow and then setup on-enter resets
                    var currentPhaseObj = this.currentPhaseObj;
                    let arrow = graphicsUtils.pointToSomethingWithArrow(campNode, -20, 0.5);
                    gameUtils.matterOnce(this, 'hideMap', function(event) {
                        graphicsUtils.removeSomethingFromRenderer(arrow);
                    });
                    campNode.levelDetails.oneTimeLevelPlayableExtension = function() {
                        campNode.manualEnable = false;
                        campNode.activeCampTooltipOverride = null;
                        if (currentPhaseObj.onEnterBehavior) {
                            currentPhaseObj.onEnterBehavior();
                        }

                        if (!currentPhaseObj.wrappedNextPhase) {
                            globals.currentGame.nextPhase();
                        } else {
                            currentPhaseObj.wrappedNextPhase();
                        }
                    };
                }.bind(this));
            }
        }.bind(this));


        Matter.Events.on(this, 'LevelLocalEntityCreated', function(event) {
            this.levelLocalEntities.push(event.entity);
        }.bind(this));

        Matter.Events.on(this, 'EnterLevel', function(event) {
            this.levelInPlay = true;
        }.bind(this));

        Matter.Events.on(this, 'TravelStarted', function(event) {
            this.levelInPlay = false;
        }.bind(this));

        Matter.Events.on(this, 'EmbarkOnOuting', function(event) {
            gameUtils.playAsMusic(mathArrayUtils.getRandomElementOfArray(this.levelEntryMusic));
        }.bind(this));

        Matter.Events.on(this, 'TravelStarted', function(event) {
            if (!event.node.levelDetails.isLevelNonConfigurable()) {
                gameUtils.playAsMusic(this.soundPool.fillerMovement);
            }
        }.bind(this));

        Matter.Events.on(this, 'TravelStarted', function(event) {
            this.unitsInPlay = [this.shane, this.ursula].filter((el) => {
                return el != null;
            });

            this.unitsInPlay.forEach((unit) => {
                unit.fatigue = event.startingFatigue || 0;
            });

            //figure out starting offset from which the chars will move into the center
            var headX = Math.abs(event.headVelocity.x);
            var headY = Math.abs(event.headVelocity.y);
            var buffer = 60;
            var xSteps = (gameUtils.getPlayableWidth() / 2 + buffer) / headX;
            var ySteps = (gameUtils.getPlayableHeight() / 2 + buffer) / headY;
            var xPos = 0;
            var yPos = 0;
            if (xSteps <= ySteps) {
                xPos = -event.headVelocity.x * xSteps;
                yPos = -event.headVelocity.y * xSteps;
            } else {
                xPos = -event.headVelocity.x * ySteps;
                yPos = -event.headVelocity.y * ySteps;
            }
            this.offscreenStartLocation = {
                x: xPos,
                y: yPos
            };

            //cleanup and reset the previous unit spawner
            var node = event.node;
            this.setCurrentLevel(node.levelDetails);
            let timeLimit = 75 + this.map.adrenaline * 22;
            this.fatigueTimer = this.addTimer({
                name: 'fatigueTimer',
                gogogo: true,
                timeLimit: timeLimit,
                callback: function() {
                    this.unitsInPlay.forEach((unit) => {
                        unit.fatigue += 1;
                    });
                    Matter.Events.trigger(this.map, 'SetFatigue', {
                        amount: this.unitsInPlay[0].fatigue
                    });
                    this.unitsInPlay.forEach((unit) => {
                        unit.fatigue = Math.min(99, unit.fatigue);
                    });
                }.bind(this)
            });
        }.bind(this));

        Matter.Events.on(globals.currentGame, 'TravelReset', function(event) {
            this.setCurrentLevel(event.resetToNode.levelDetails);
        }.bind(this));

        Matter.Events.on(this, 'travelFinished', function(event) {
            this.invalidateTimer(this.fatigueTimer);
        }.bind(this));

        Matter.Events.on(this, 'enterNight', function(event) {
            this.isNight = true;
            gameUtils.matterOnce(this, 'EnterLevel', function(event) {
                var lightObjs = graphicsUtils.enableLighting({r: 0.2, g: 0.2, b: 1.0, invertProgress: true});

                var progressTimer = globals.currentGame.addTimer({
                    name: 'nightFadeOutProgressTimer',
                    runs: 1,
                    timeLimit: 16000,
                    tickCallback: function(deltaTime) {
                        lightObjs.shader.uniforms.progress = this.percentDone;
                    },
                    totallyDoneCallback: function() {
                        lightObjs.disableFunc();
                    }
                });
            }.bind(this));
        }.bind(this));
    },

    play: function(options) {

        this.initNextMap();

        //debug option
        let skipIntro = false;

        if (!skipIntro) {
            var shaneIntro = new ShaneIntro({
                done: () => {
                    this.initShane();
                    if (this.goStraightToUrsulaTasks) {
                        this.currentWorld.gotoLevelById('camp');
                    } else {
                        this.currentWorld.gotoLevelById('shaneLearning');
                    }
                }
            });
            this.currentScene.transitionToScene(shaneIntro.scene);
            shaneIntro.play();
        } else {
            this.skipTutorial();
            this.currentWorld.gotoLevelById('camp');
        }

        //create the reward manager
        this.rewardManager = new RewardManager();

        //setup unit collector events
        Matter.Events.on(this, 'BeginPrimaryBattle', () => {
            this.shaneCollector.startNewCollector("Shane " + mathArrayUtils.getId());
            if (this.ursulaCollector) {
                this.ursulaCollector.startNewCollector("Ursula " + mathArrayUtils.getId());
            }
        });

        Matter.Events.on(this, 'BeginLevel', () => {
            this.rewardManager.startNewRewardCollector();
        });
    },

    getLoadingScreen: function() {
        var background = graphicsUtils.createDisplayObject('SplashColoredBordered', {
            where: 'hudText',
            anchor: {
                x: 0,
                y: 0
            }
        });

        graphicsUtils.makeSpriteSize(background, gameUtils.getCanvasWH());
        this.currentScene.add(background);

        return background;
    },

    preGameExtension: function() {
        this.setSplashScreenText('Initializing');

        gameUtils.matterOnce(this, 'preGameLoadComplete', () => {
            this.setSplashScreenText('Click anywhere to begin');
        });

        return () => {
            this.soundPool.sceneContinue.play();
        };
    },

    initNextMap: function() {
        this.currentWorld = this.worlds[this.currentWorldIndex++];
        this.currentWorld.initWorld();
        this.map = this.currentWorld.initializeMap();
        this.nextPhase({
            index: 0
        });
    },

    nextPhase: function(options) {
        options = options || {};

        var index = options.index;
        if (mathArrayUtils.isFalseNotZero(options.index)) {
            //if no index is given, goto next phase
            this.currentPhase += 1;
            index = this.currentPhase;
        } else {
            //else, go to specific phase
            this.currentPhase = index;
        }
        this.currentPhaseObj = this.currentWorld.phases[index](options) || {};
        if (!this.currentPhaseObj.bypassMapPhaseBehavior) {
            this.map.newPhase = true;
        }
        let campNode = this.map.findNodeById('camp');
        campNode.nightsLeft = 1;
    },

    initShane: function() {
        this.createShane();
        this.addUnit(this.shane);
    },

    initUrsula: function() {
        this.createUrsula();
        this.addUnit(this.ursula);
    },

    skipTutorial: function() {
        this.initShane();
        this.initUrsula();
        var camp = this.currentWorld.getLevelById('camp');
        this.showTips = false;
        camp.alreadyIntrod = true;
        camp.completedUrsulaTasks = true;

        this.nextPhase({
            skippedTutorial: true,
            index: 2
        });
        this.map.setHeadTokenPosition({
            node: this.map.findNodeById('camp')
        });
    },

    canShowTip: function(tipName, showTipToo) {
        var ret = this.showTips && !this.showedTips[tipName];
        if (showTipToo) {
            this.showedTips[tipName] = true;
        }

        return ret;
    },

    transitionToBlankScene: function(options) {
        options = options || {};
        var blankScene = new Scene();
        this.currentScene.transitionToScene({
            newScene: blankScene,
            fadeIn: true,
            mode: options.mode,
            transitionLength: options.transitionLength
        });
        return blankScene;
    },

    gotoEndLevelScreen: function(options) {
        var result, continueOnly;
        ({
            result,
            continueOnly
        } = options);

        this.unitSystem.pause();
        this.unitSystem.deselectUnit(this.shane);
        this.unitSystem.deselectUnit(this.ursula);

        //determine continue behavior
        var continueBehavior = function() {
            if (result == 'victory') {
                this.conquerScene({
                    scene: this.currentScene,
                    fadeIn: true
                });
                if (this.currentLevel.levelRedirect) {
                    this.currentLevel.levelRedirect.campLikeActive = true;
                } else {
                    this.currentLevel.campLikeActive = true;
                }
                this.unitSystem.unitPanel.refreshPassiveButton();
                vScene.clear();
            } else {
                this.currentScene.add(vScene);
                this.reconfigureAtCurrentLevel({
                    result: result,
                    revive: true
                });
            }
        }.bind(this);

        //but if the current node is camp, just enter camp
        if (this.map.currentNode.type == 'camp') {
            continueBehavior = function() {
                this.currentScene.add(vScene);
                this.currentWorld.gotoLevelById.call(this.currentWorld, 'camp');
            }.bind(this);
        }

        //create end level screen
        var vScreen = new EndLevelScreenOverlay({
            shane: this.shane,
            ursula: this.ursula,
        }, {
            type: result,
            done: continueBehavior,
            onlyContinueAllowed: continueOnly
        });
        var vScene = vScreen.initialize({});
        gameUtils.playAsMusic(this.soundPool.winVamp);

        this.shane.setHealth(this.shane.maxHealth, {
            silent: true
        });
        this.shane.setEnergy(this.shane.maxEnergy, {
            silent: true
        });
        this.ursula.setHealth(this.ursula.maxHealth, {
            silent: true
        });
        this.ursula.setEnergy(this.ursula.maxEnergy, {
            silent: true
        });

        return vScene;
    },

    conquerScene: function(options) {
        options = options || {};
        gameUtils.doSomethingAfterDuration(() => {
            game.shane.revive({
                health: 1,
                energy: 1
            });
            game.ursula.revive({
                health: 1,
                energy: 1
            });
        }, 500);

        var level = this.currentLevel;
        var game = this;
        var scene = options.scene;

        //create the map table
        var mapTable;
        if (!level.mapTableSprite) {
            mapTable = level.createMapTable(scene);
        }
        game.unitSystem.unpause();
        level.mapTableActive = true;

        //Decorate complete level with doodads
        var flag = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'FlagAnim',
            speed: 0.2,
            loop: true,
            transform: [0, 0, 1, 1]
        });

        flag.position = this.flagPosition;
        flag.play();
        var flagD = new Doodad({
            collides: true,
            autoAdd: false,
            radius: 5,
            drawWire: false,
            texture: [flag],
            stage: 'stage',
            scale: {
                x: 0.1,
                y: 0.1
            },
            shadowOffset: {
                x: -10,
                y: 30
            },
            shadowScale: {
                x: 0.7,
                y: 0.7
            },
            offset: {
                x: -0,
                y: -40
            },
            sortYOffset: 75,
            position: flag.position
        });
        scene.add(flagD);

        // var gunrack = level.createAugmentRack(scene);

        if (options.fadeIn) {
            graphicsUtils.fadeSpriteOverTime({
                sprite: mapTable.body.renderlings.mainData0,
                duration: 1000,
                fadeIn: true,
                nokill: true,
                makeVisible: true
            });

            // graphicsUtils.fadeSpriteOverTime({
            //     sprite: gunrack.body.renderlings.mainData0,
            //     duration: 1000,
            //     fadeIn: true,
            //     nokill: true,
            //     makeVisible: true
            // });

            graphicsUtils.fadeSpriteOverTime({
                sprite: flag,
                duration: 1000,
                fadeIn: true,
                nokill: true,
                makeVisible: true
            });
        }
    },

    reconfigureAtCurrentLevel: function(options) {
        options = options || {};

        var result = options.result;
        var revive = options.revive;
        var isVictory = options.result == 'victory';
        var game = this;

        game.reconfigureSound.play();
        this.currentLevel.enterLevel({
            customEnterLevel: function(level) {
                //set state of mind config only to be active
                level.campLikeActive = true;

                //set unit positions or revive
                if (!revive) {
                    game.setUnit(game.shane, {
                        position: game.shane.endLevelPosition,
                        moveToCenter: false,
                    });

                    game.setUnit(game.ursula, {
                        position: game.ursula.endLevelPosition,
                        moveToCenter: false,
                    });
                } else {
                    game.shane.grave.position = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                        x: -40,
                        y: 40
                    });
                    game.ursula.grave.position = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                        x: 40,
                        y: 40
                    });

                    gameUtils.doSomethingAfterDuration(() => {
                        game.shane.revive({
                            health: 1,
                            energy: 1
                        });
                        game.ursula.revive({
                            health: 1,
                            energy: 1
                        });
                    }, 500);
                }

                game.conquerScene({
                    scene: game.currentScene
                });
            },
            mode: 'SIDE',
            transitionLength: 1000,
            leftToRight: false
        });
    },

    closeMap: function() {
        this.unitSystem.unpause();
        this.mapActive = false;
        this.map.hide();
    },

    setCurrentLevel: function(level, poolingOptions) {
        this.currentLevel = level;
        //if this level has enemies, start the pool as we travel
        if (this.currentLevel.enemySets.length > 0) {
            this.currentLevel.startPooling(poolingOptions);
        }
    },

    isCurrentLevelConfigurable: function() {
        return this.currentLevel.campLikeActive;
    },

    isCurrentLevelSOMConfigurable: function() {
        return this.currentLevel.campLikeActiveSOM || this.currentLevel.campLikeActive;
    },

    isOutingInProgress: function() {
        return this.map.outingInProgress;
    },

    makeCurrentLevelConfigurable: function() {
        this.currentLevel.campLikeActive = true;
    },

    removeAllEnemyUnits: function() {
        gameUtils.applyToUnitsByTeam(function(team) {
            return team != this.playerTeam;
        }.bind(this), null, function(unit) {
            this.removeUnit(unit);
        }.bind(this));
    },

    removeAllLevelLocalEntities: function() {
        this.levelLocalEntities.forEach((entity) => {
            if (entity.type == 'body') {
                this.removeBody(entity);
            } else {
                graphicsUtils.removeSomethingFromRenderer(entity);
            }
        });
        this.levelLocalEntities = [];
    },

    //debug
    giveUnitItem: function(unit, itemName) {
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: [itemName], unit: unit});
    },

    createShane: function() {
        var s = Marine({
            team: this.playerTeam,
            name: 'Shane',
            dropItemsOnDeath: false,
            // adjustHitbox: false
        });
        this.shane = s;
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["Book"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["BlueVisor"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["PolarizedVisor"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["PictureOfTheMoon"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["SereneStar"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["PlatedPants"], unit: this.shane});
        // this.shane.dodge = 40;
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["ApolloMicrochip"], unit: this.shane});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});

        this.shaneCollector = new StatCollector({
            predicate: function(event) {
                if (event.performingUnit.name == 'Shane')
                    return true;
            },
            sufferingPredicate: function(event) {
                if (event.sufferingUnit.name == 'Shane')
                    return true;
            },
            unit: this.shane
        });
        this.shane.statCollector = this.shaneCollector;

        gameUtils.moveUnitOffScreen(this.shane);
        s.position = gameUtils.getPlayableCenter();

        return s;
    },

    createUrsula: function() {
        this.ursula = Medic({
            team: this.playerTeam,
            name: 'Ursula',
            dropItemsOnDeath: false
        });
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["SilverYinYang"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["GoldenYinYang"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["GoldenCompass"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RoseRing"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["EmeraldLocket"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RoseLocket"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RubyRing"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["JadeRing"], unit: this.ursula});
        // this.ursula.grit = 100;
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["SharpPictureOfTheMoon"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["BoxCutter"], unit: this.ursula});
        // this.ursula.idleCancel = true;

        this.ursulaCollector = new StatCollector({
            predicate: function(event) {
                if (event.performingUnit.name == 'Ursula') {
                    return true;
                }
            },
            sufferingPredicate: function(event) {
                if (event.sufferingUnit.name == 'Ursula') {
                    return true;
                }
            },
            unit: this.ursula
        });
        this.ursula.statCollector = this.ursulaCollector;

        gameUtils.moveUnitOffScreen(this.ursula);
        return this.ursula;
    },

    //used just for shane/urs
    setUnit: function(unit, options) {
        if (!unit) return;

        options = options || {};
        var position = options.position;
        var moveToCenter = options.moveToCenter;

        this.unitSystem.deselectUnit(unit);

        var centerX;
        if (unit.name == 'Shane') {
            centerX = -30;
            unit.position = position;
        } else {
            centerX = 30;
            unit.position = position;
        }

        unit.softRevive();
        unit.isDead = false;
        unit.isTargetable = true;
        unit.canMove = true;
        unit.canAttack = true;
        unit.isSelectable = true;

        if (moveToCenter) {
            unit.ignoreEnergyRegeneration = true;
            unit.ignoreHealthRegeneration = true;
            unit.body.collisionFilter.mask -= 0x0004;

            unit.showLifeBar();
            unit.showEnergyBar();
            unit.barsShowingOverride = true;
            gameUtils.doSomethingAfterDuration(() => {
                unit.barsShowingOverride = false;
                unit.showLifeBar(false);
                unit.showEnergyBar(false);
                unit.ignoreEnergyRegeneration = false;
                unit.ignoreHealthRegeneration = false;
            }, 1750);

            gameUtils.doSomethingAfterDuration(() => {
                unit.body.collisionFilter.mask += 0x0004;
            }, 2500);

            if (unit.name == 'Shane') {
                unit.attackMove(options.moveTo || mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                    x: centerX,
                    y: 0
                }));
            } else {
                unit.move(options.moveTo || mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                    x: centerX,
                    y: 0
                }));
            }
        } else {
            unit.stop(null, {basicStop: true});
        }

        unit.setHealth(unit.maxHealth);
        unit.setEnergy(unit.maxEnergy);

        //apply fatigue
        if (options.applyFatigue && unit.fatigue) {
            var healthPenalty = Math.max(0, (unit.fatigue - unit.fatigueReduction)) * unit.maxHealth / 100;
            var energyPenalty = Math.max(0, (unit.fatigue - unit.fatigueReduction)) * unit.maxEnergy / 100;
            unit.setHealth(unit.currentHealth - healthPenalty);
            unit.setEnergy(unit.currentEnergy - energyPenalty);
        }

        if (unit.hideGrave) {
            unit.hideGrave();
        }
    },

    flyover: function(done, options) {
        options = Object.assign({
            speed: 95,
            quiet: true
        }, options);
        var shadow = Matter.Bodies.circle(-4200, gameUtils.getCanvasHeight() / 2.0, 1, {
            restitution: 0.95,
            frictionAir: 0,
            mass: 1,
            isSensor: true
        });

        shadow.renderChildren = [{
            id: 'planeShadow',
            data: 'AirplaneShadow',
            scale: {
                x: 7,
                y: 7
            },
            anchor: {
                x: 0,
                y: 0.5
            },
            stage: "foreground",
        }];

        if (options.quiet) {
            this.flyoverSoundQuiet.play();
        } else {
            this.flyoverSound.play();
        }

        gameUtils.doSomethingAfterDuration(() => {
            this.addBody(shadow);
            gameUtils.sendBodyToDestinationAtSpeed(shadow, {
                x: gameUtils.getCanvasWidth() + 100,
                y: shadow.position.y
            }, options.speed, false, false, () => {
                this.removeBody(shadow);
                gameUtils.doSomethingAfterDuration(() => {
                    if (done) {
                        done();
                    }
                }, 150);
            });
        }, 200);
    },

    dustAndItemBox: function(options) {
        options = Object.assign({
            special: false,
            autoDestroyBox: false,
        }, options);

        let location = options.location;
        let item = options.item;
        let special = options.special;
        let smokeTint = options.smokeTint;

        //play animation
        var center = gameUtils.getPlayableCenter();
        var smokeAnimation = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'smokeimpact',
            speed: 0.375,
            transform: [location.x, location.y, -2, 2]
        });
        smokeAnimation.tint = smokeTint || 0x435a73;
        smokeAnimation.alpha = 0.6;
        smokeAnimation.sortYOffset = 50;
        graphicsUtils.addSomethingToRenderer(smokeAnimation, 'stage');
        smokeAnimation.play();

        var smokeAnimation2 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'smokeimpact',
            speed: 0.85,
            transform: [location.x, location.y, 3, 3]
        });
        smokeAnimation2.tint = smokeTint || 0x8e8e8e;
        smokeAnimation2.alpha = 0.25;
        smokeAnimation2.sortYOffset = 50;
        graphicsUtils.addSomethingToRenderer(smokeAnimation2, 'stage');
        smokeAnimation2.play();

        var smokeAnimation3 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'smokeimpact',
            speed: 0.8,
            transform: [location.x, location.y - 50, 2.5, 2]
        });
        smokeAnimation3.tint = 0x251f1e;
        smokeAnimation3.alpha = 0.5;
        smokeAnimation3.sortYOffset = 50;
        graphicsUtils.addSomethingToRenderer(smokeAnimation3, 'stage');
        smokeAnimation3.play();

        var items = mathArrayUtils.convertToArray(item);
        var randomDropLocation = false;
        if (items.length > 1) {
            randomDropLocation = true;
        }
        var box = UnitMenu.createUnit('DestructibleBox', {
            team: this.neutralTeam,
            special: special,
            forcedItemDropOffset: !randomDropLocation
        });

        items.forEach((item) => {
            if (item.itemClass) {
                ItemUtils.giveUnitItem({
                    gamePrefix: "Us",
                    itemClass: item.itemClass,
                    itemType: item.itemType,
                    unit: box,
                    immortal: true
                });
            } else {
                ItemUtils.giveUnitItem({
                    gamePrefix: "Us",
                    itemName: item,
                    unit: box,
                    immortal: true
                });
            }
        });
        globals.currentGame.addUnit(box);
        this.boxSound.play();
        box.position = mathArrayUtils.clonePosition(location, {
            y: -5
        });

        if (options.autoDestroyBox) {
            box.isTargetable = false;
            gameUtils.doSomethingAfterDuration(() => {
                box.sufferAttack(1000);
            }, 200);
        }
    },

    resetGameExtension: function() {
        this.level = 0;
    },

    nukeExtension: function() {
        $('body').off('keydown.us');
        $('body').off('keydown.map');
        if (this.currentScene) {
            this.currentScene.clear();
        }

        if (this.heartbeat) {
            this.heartbeat.unload();
            this.flyoverSound.unload();
            this.boxSound.unload();
            this.reconfigureSound.unload();
            mathArrayUtils.operateOnObjectByKey(this.soundPool, (key, value) => {
                value.unload();
            });
        }
    }
};

game.loadingScreenAsset = {
    name: "Splash",
    target: "Textures/Us/Splash.json"
};

game.assets = [{
        name: "BaseUnitAnimations1",
        target: "Textures/Us/BaseUnitAnimations1.json"
    },
    {
        name: "Marine",
        target: "Textures/Us/Marine.json"
    },
    {
        name: "MarineAnimations1",
        target: "Textures/Us/MarineAnimations1.json"
    },
    {
        name: "Medic",
        target: "Textures/Us/Medic.json"
    },
    {
        name: "MedicAnimations1",
        target: "Textures/Us/MedicAnimations1.json"
    },
    {
        name: "MedicAnimations2",
        target: "Textures/Us/MedicAnimations2.json"
    },
    {
        name: "Critter",
        target: "Textures/Us/Critter.json"
    },
    {
        name: "CritterAnimations1",
        target: "Textures/Us/CritterAnimations1.json"
    },
    {
        name: "Sentinel",
        target: "Textures/Us/Sentinel.json"
    },
    {
        name: "SentinelAnimations1",
        target: "Textures/Us/SentinelAnimations1.json"
    },
    {
        name: "Eruptlet",
        target: "Textures/Us/Eruptlet.json"
    },
    {
        name: "EruptletAnimations1",
        target: "Textures/Us/EruptletAnimations1.json"
    },
    {
        name: "Gargoyle",
        target: "Textures/Us/Gargoyle.json"
    },
    {
        name: "Spearman",
        target: "Textures/Us/Spearman.json"
    },
    {
        name: "SpearmanAnimations1",
        target: "Textures/Us/SpearmanAnimations1.json"
    },
    {
        name: "Ghost",
        target: "Textures/Us/Ghost.json"
    },

    //items
    {
        name: "Items",
        target: "Textures/Us/Items.json"
    },
    {
        name: "ItemAnimations1",
        target: "Textures/Us/ItemAnimations1.json"
    },

    //generic textures and animations
    {
        name: "Utility0",
        target: "Textures/Us/Utility-0.json"
    },
    // {name: "Utility1", target: "Textures/Us/Utility2-0.json"},
    // {name: "Utility1", target: "Textures/Us/Utility-1.json"},
    {
        name: "UtilityAnimations1",
        target: "Textures/Us/UtilityAnimations1.json"
    },
    {
        name: "UtilityAnimations2",
        target: "Textures/Us/UtilityAnimations2.json"
    },
    {
        name: "UtilityAnimations3",
        target: "Textures/Us/UtilityAnimations3.json"
    },

    {
        name: "Cinematic",
        target: "Textures/Us/Cinematic.json"
    },
    {
        name: "FlySwarmAnimations",
        target: "Textures/Us/FlySwarmAnimations.json"
    },

    //terrain and doodads
    {
        name: "Terrain0",
        target: "Textures/Us/Terrain-0.json"
    },
    {
        name: "TerrainAnimations",
        target: "Textures/Us/TerrainAnimations.json"
    },
    {
        name: "TerrainAnimations2",
        target: "Textures/Us/TerrainAnimations2.json"
    },

    //spine assets
    {
        name: "marineN",
        target: "SpineAssets/Marine Exports/N/N.json"
    },
    {
        name: "marineNW",
        target: "SpineAssets/Marine Exports/NW/NW.json"
    },
    {
        name: "marineS",
        target: "SpineAssets/Marine Exports/S/S.json"
    },
    {
        name: "marineSW",
        target: "SpineAssets/Marine Exports/SW/SW.json"
    },
    {
        name: "marineW",
        target: "SpineAssets/Marine Exports/W/W.json"
    },

    {
        name: "medicN",
        target: "SpineAssets/Medic Exports/N/N.json"
    },
    {
        name: "medicNW",
        target: "SpineAssets/Medic Exports/NW/NW.json"
    },
    {
        name: "medicS",
        target: "SpineAssets/Medic Exports/S/S.json"
    },
    {
        name: "medicSW",
        target: "SpineAssets/Medic Exports/SW/SW.json"
    },
    {
        name: "medicW",
        target: "SpineAssets/Medic Exports/W/W.json"
    },

    {
        name: "critterN",
        target: "SpineAssets/Critter Exports/N/North.json"
    },
    {
        name: "critterNW",
        target: "SpineAssets/Critter Exports/NW/Northwest.json"
    },
    {
        name: "critterS",
        target: "SpineAssets/Critter Exports/S/South.json"
    },
    {
        name: "critterSW",
        target: "SpineAssets/Critter Exports/SW/SouthWest.json"
    },
    {
        name: "critterW",
        target: "SpineAssets/Critter Exports/W/West.json"
    },

    {
        name: "alienN",
        target: "SpineAssets/Alien Export/N/N.json"
    },
    {
        name: "alienNW",
        target: "SpineAssets/Alien Export/NW/NW.json"
    },
    {
        name: "alienS",
        target: "SpineAssets/Alien Export/S/S.json"
    },
    {
        name: "alienSW",
        target: "SpineAssets/Alien Export/SW/SW.json"
    },
    {
        name: "alienW",
        target: "SpineAssets/Alien Export/W/W.json"
    },

    {
        name: "spearmanN",
        target: "SpineAssets/Spearman Exports/N/N.json"
    },
    {
        name: "spearmanNW",
        target: "SpineAssets/Spearman Exports/NW/NW.json"
    },
    {
        name: "spearmanS",
        target: "SpineAssets/Spearman Exports/S/S.json"
    },
    {
        name: "spearmanSW",
        target: "SpineAssets/Spearman Exports/SW/SW.json"
    },
    {
        name: "spearmanW",
        target: "SpineAssets/Spearman Exports/W/W.json"
    },

    {
        name: "apparitionAll",
        target: "SpineAssets/Apparition_Export/skeleton.json"
    },
];

export default function() {
    Object.assign(this, CommonGameMixin, game);
}
