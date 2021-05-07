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
import Marine from '@games/Us/Units/Marine.js';
import Medic from '@games/Us/Units/Medic.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import Doodad from '@utils/Doodad.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Scene from '@core/Scene.js';
import UnitPanel from '@games/Us/UnitPanel.js';
import UnitSpawner from '@games/Us/UnitSpawner.js';
import styles from '@utils/Styles.js';
import {
    campNoir
} from '@games/Us/Worlds/CampNoir.js';
import EndLevelScreen from '@games/Us/Screens/EndLevelStatScreen.js';
import StatCollector from '@games/Us/StatCollector.js';
import UnitMenu from '@games/Us/UnitMenu.js';

import {
    ShaneIntro
} from '@games/Us/Dialogues/ShaneIntro.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';

var targetScore = 1;

var game = {

    worldOptions: {
        //background: {image: 'Grass', scale: {x: 1.0, y: 1.0}},
        width: 1400, //1600
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
    worlds: [campNoir],
    levelLocalEntities: [],
    currentCamp: null,
    currentScene: null,
    itemClasses: {
        worn: ['RingOfThought', 'RingOfRenewal', 'SturdyCanteen', 'BootsOfHaste', 'PepPill'],
        rugged: ['SteadySyringe', 'MaskOfRage', 'RuggedCanteen', 'RichPepPill', 'MedalOfGrit', 'MedalOfMerit'],
        burnished: ['SereneStar'],
        gleaming: ['GleamingCanteen'],
        other: ['TechnologyKey'],
    },

    initExtension: function() {
        this.heartbeat = gameUtils.getSound('heartbeat.wav', {
            volume: 0.12,
            rate: 0.9
        });
        this.flyoverSound = gameUtils.getSound('flyover.wav', {volume: 4.0, rate: 1.0});

        this.shaneCollector = new StatCollector({
            predicate: function(event) {
                if (event.performingUnit.name == 'Shane')
                    return true;
            },
            sufferingPredicate: function(event) {
                if (event.sufferingUnit.name == 'Shane')
                    return true;
            }
        });

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
            }
        });

        Matter.Events.on(this, 'LevelLocalEntityCreated', function(event) {
            this.levelLocalEntities.push(event.entity);
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
            this.fatigueTimer = this.addTimer({
                name: 'fatigueTimer',
                gogogo: true,
                timeLimit: 75,
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
        Matter.Events.on(this, 'travelFinished', function(event) {
            this.invalidateTimer(this.fatigueTimer);
        }.bind(this));
    },

    play: function(options) {

        this.initNextMap();
        this.initShane();
        // var shaneIntro = new ShaneIntro({
        //     done: () => {
        //         // this.postInit();
        //         this.initShane();
        //     }
        // });
        // this.currentScene.transitionToScene(shaneIntro.scene);
        // shaneIntro.play();

        // this.postInit();

        this.gotoLevelById('camp');
        return;
        var dialogueScene = new Scene();
        dialogueScene.addBlackBackground();

        //begin dialogue
        var title = new Dialogue({
            blinkLastLetter: false,
            title: true,
            text: "Camp Noir",
            delayAfterEnd: 2000
        });
        var a1 = new Dialogue({
            actor: "Ursula",
            text: "Shane, get up. Incoming message from Command...",
            picture: 'NewMessage.png',
            pictureWordTrigger: 'Incoming'
        });
        var a2 = new Dialogue({
            pauseAtPeriods: false,
            actor: "Shane",
            text: "Urs, it's... 3:00am. Those pencil pushers can wait until mor--",
            delayAfterEnd: 0,
            picture: '302.png',
            pictureWordTrigger: '3:00'
        });
        var a3 = new Dialogue({
            interrupt: true,
            actor: "Ursula",
            text: "It's from MacMurray...",
            picture: 'MacMurray.png',
            pictureWordTrigger: 'from'
        });
        var a4 = new Dialogue({
            actor: "Shane",
            text: "Christ... That can only mean--",
            delayAfterEnd: 0
        });
        var a5 = new Dialogue({
            interrupt: true,
            actor: "Ursula",
            text: "Beasts."
        });
        var a6 = new Dialogue({
            actor: "Shane",
            text: "Location?",
            delayAfterEnd: 500
        });
        var a7 = new Dialogue({
            actor: "Ursula",
            text: "Intel is being relayed. Get up, get your rifle.",
            picture: 'GrabRifleLighter.png',
            pictureWordTrigger: 'Get up',
            delayAfterEnd: 1200
        });
        var a8 = new Dialogue({
            actor: "Shane",
            text: "Is the coffee ready?",
            delayAfterEnd: 1500
        });

        var chain = new DialogueChain([title, a1, a2, a3, a4, a5, a6, a7, a8], {
            startDelay: 2000,
            done: function() {
                dialogueScene.add(graphicsUtils.addSomethingToRenderer("TEX+:ESC to continue", {
                    where: 'hudText',
                    style: styles.titleOneStyle,
                    anchor: {
                        x: 1,
                        y: 1
                    },
                    position: {
                        x: gameUtils.getPlayableWidth() - 20,
                        y: gameUtils.getCanvasHeight() - 20
                    }
                }));
            }
        });
        dialogueScene.add(chain);
        chain.play();
        this.currentScene.transitionToScene(dialogueScene);
        Matter.Events.on(this.currentScene, 'sceneFadeInDone', () => {
            $('body').on('keydown.uskeydown', function(event) {
                var key = event.key.toLowerCase();
                if (key == ' ') {
                    //clear dialogue and start initial level
                    this.postInit();
                    $('body').off('keydown.uskeydown');
                }
            }.bind(this));
        });
    },

    preGameExtension: function() {
        var titleScene = new Scene();
        this.currentScene = titleScene;
        var background = graphicsUtils.createDisplayObject('SplashColored', {
            where: 'hudText',
            anchor: {
                x: 0,
                y: 0
            }
        });
        var startGameText = graphicsUtils.addSomethingToRenderer("TEX+:Click To Begin", {
            where: 'hudText',
            style: styles.titleOneStyle,
            x: this.canvas.width / 2,
            y: this.canvas.height * 3 / 4
        });
        graphicsUtils.makeSpriteSize(background, gameUtils.getCanvasWH());
        titleScene.add(background);
        titleScene.add(startGameText);
        titleScene.initializeScene();
    },

    initNextMap: function() {
        this.currentWorld = this.worlds[this.currentWorldIndex++];
        this.map = this.currentWorld.initializeMap();
        this.currentWorld.phaseOne();
    },

    initShane: function() {
        this.createShane();
        this.addUnit(this.shane);
    },

    initUrsula: function() {
        this.createUrsula();
        this.addUnit(this.ursula);
    },

    postInit: function() {
        //create empty scene and transition to camp scene

        //for troubleshooting victory screen
        // this.gotoEndLevelScreen();
        this.initNextMap();
        this.createShane();
        this.addUnit(this.shane);
        this.createUrsula();
        this.addUnit(this.ursula);
    },

    gotoLevelById: function(id) {
        var level = this.map.findLevelById(id);
        level.enterLevel();
    },

    transitionToBlankScene: function() {
        var blankScene = new Scene();
        this.currentScene.transitionToScene({
            newScene: blankScene,
            fadeIn: true
        });
        return blankScene;
    },

    gotoEndLevelScreen: function(collectors, defeat) {
        this.unitSystem.pause();
        this.unitSystem.deselectUnit(this.shane);
        this.unitSystem.deselectUnit(this.ursula);
        var vScreen = new EndLevelScreen({
            shane: this.shane,
            ursula: this.ursula
        }, collectors, {
            type: defeat ? 'defeat' : 'victory'
        });
        var vScene = vScreen.createScene({});
        this.currentScene.transitionToScene(vScene);

        var escapeBehavior = function() {
            this.map.show();
            this.map.allowMouseEvents(false);
            this.currentScene.transitionToScene({
                newScene: blankScene,
                fadeIn: true
            });
        }.bind(this);

        var handler = gameUtils.matterOnce(globals.currentGame, "TravelReset", function(event) {
            if (event.resetToNode.type == 'camp') {
                escapeBehavior = this.gotoLevelById.bind(this, 'camp');
            }
        }.bind(this));

        var blankScene = new Scene();
        Matter.Events.on(this.currentScene, 'sceneFadeInDone', () => {
            $('body').on('keydown.uskeydown', function(event) {
                var key = event.key.toLowerCase();
                if (key == ' ') {
                    $('body').off('keydown.uskeydown');
                    escapeBehavior();
                }
                handler.removeHandler();
            }.bind(this));
        });

        gameUtils.matterOnce(blankScene, 'sceneFadeInDone', () => {
            this.map.allowMouseEvents(true);
        });

        return vScene;
    },

    closeMap: function() {
        this.unitSystem.unpause();
        this.mapActive = false;
        this.map.hide();
    },

    setCurrentLevel: function(level) {
        this.currentLevel = level;
        //if this level has enemies, start the pool as we travel
        if (this.currentLevel.enemySets.length > 0) {
            this.currentSpawner = new UnitSpawner(this.currentLevel.enemySets);
            this.currentSpawner.startPooling();
        }
    },

    isCurrentLevelConfigurable: function() {
        return this.currentLevel.campLikeActive;
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
            if (entity.constructor.name == 'Sprite' || entity.constructor.name == 'Text' || entity.constructor.name == 'AnimatedSprite') {
                graphicsUtils.removeSomethingFromRenderer(entity);
            } else if (entity.type == 'body') {
                this.removeBody(entity);
            }
        });
        this.levelLocalEntities = [];
    },

    createShane: function() {
        var s = Marine({
            team: this.playerTeam,
            name: 'Shane',
            dropItemsOnDeath: false,
            adjustHitbox: false
        });
        this.shane = s;
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["AwarenessTonic"], unit: this.shane});
        ItemUtils.giveUnitItem({
            gamePrefix: "Us",
            itemName: ["AwarenessTonic"],
            unit: this.shane
        });
        ItemUtils.giveUnitItem({
            gamePrefix: "Us",
            itemName: ["SereneStar"],
            unit: this.shane
        });
        ItemUtils.giveUnitItem({
            gamePrefix: "Us",
            itemName: ["TechnologyKey"],
            unit: this.shane
        });
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["AjaMicrochip"], unit: this.shane});
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["Book"], unit: this.shane});
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["GreenMicrochip"], unit: this.shane});
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["JaggedMicrochip"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["TechnologyKey"], unit: this.shane});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["TechnologyKey"], unit: this.shane});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
        // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});

        gameUtils.moveUnitOffScreen(this.shane);
        s.position = gameUtils.getPlayableCenter();
        // this.shane.damage = 10000;

        // var u = this.createUnit('Ghost');
        // this.addUnit(u);
        // var p = this.createUnit('DestructibleBox', this.neutralTeam);
        //
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RingOfThought"], unit: p});
        // this.addUnit(p);
        // u.position = mathArrayUtils.clonePosition(gameUtils.getPlayableCenter(), {x: 100});
        // p.position = {x: 300, y: 300};

        return s;
    },

    createUrsula: function() {
        // this.ursula = Eruptlet({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        this.ursula = Medic({
            team: this.playerTeam,
            name: 'Ursula',
            dropItemsOnDeath: false
        });
        // ItemUtils.giveUnitItem({
        //     gamePrefix: "Us",
        //     itemName: ["TechnologyKey"],
        //     unit: this.ursula
        // });
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["TechnologyKey"], unit: this.ursula});
        // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["TechnologyKey"], unit: this.ursula});
        // this.ursula.idleCancel = true;
        gameUtils.moveUnitOffScreen(this.ursula);
        return this.ursula;
    },

    //used just for shane/urs
    setUnit: function(unit, options) {
        if (!unit) return;

        options = options || {};
        var position = options.position;
        var moveToCenter = options.moveToCenter;

        if (unit.isDead) {
            unit.revive();
        }
        this.unitSystem.deselectUnit(unit);

        var centerX;
        if (unit.name == 'Shane') {
            centerX = -30;
            unit.position = position;
        } else {
            centerX = 30;
            unit.position = position;
        }

        unit.isTargetable = true;
        unit.canMove = true;
        unit.canAttack = true;
        if (moveToCenter) {
            unit.ignoreEnergyRegeneration = true;
            unit.ignoreHealthRegeneration = true;
            unit.body.collisionFilter.mask -= 0x0004;
            unit.showLifeBar();
            unit.showEnergyBar();
            gameUtils.doSomethingAfterDuration(() => {
                unit.body.collisionFilter.mask += 0x0004;
                unit.showLifeBar(false);
                unit.showEnergyBar(false);
                unit.ignoreEnergyRegeneration = false;
                unit.ignoreHealthRegeneration = false;
            }, 2400);
            unit.move(options.moveTo || mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {
                x: centerX,
                y: 0
            }));
        } else {
            unit.stop();
        }

        unit.currentHealth = unit.maxHealth;
        unit.currentEnergy = unit.maxEnergy;

        //apply fatigue
        if (options.applyFatigue && unit.fatigue) {
            var healthPenalty = unit.fatigue * unit.maxHealth / 100;
            var energyPenalty = unit.fatigue * unit.maxEnergy / 100;
            unit.currentHealth -= healthPenalty;
            unit.currentEnergy -= energyPenalty;
        }

        if (unit.hideGrave)
            unit.hideGrave();
    },

    flyover: function(done) {
        var shadow = Matter.Bodies.circle(-2500, gameUtils.getCanvasHeight()/2.0, 1, {
          restitution: 0.95,
          frictionAir: 0,
          mass: 1,
          isSensor: true
        });

        shadow.renderChildren = [{
          id: 'planeShadow',
          data: 'AirplaneShadow',
          scale: {x: 7, y: 7},
          anchor: {x: 0, y: 0.5},
          stage: "foreground",
        }];
        this.addBody(shadow);
        this.flyoverSound.play();
        gameUtils.sendBodyToDestinationAtSpeed(shadow, {x: gameUtils.getCanvasWidth() + 100, y: shadow.position.y}, 24, false, false, () => {
            this.removeBody(shadow);
            if(done) {
                done();
            }
        });
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

        if(this.heartbeat) {
            this.heartbeat.unload();
            this.flyoverSound.unload();
        }
    }
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

    //terrain and doodads
    {
        name: "Terrain0",
        target: "Textures/Us/Terrain-0.json"
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

export default $.extend({}, CommonGameMixin, game);
