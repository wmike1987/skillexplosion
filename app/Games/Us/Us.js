import * as $ from 'jquery'
import * as Matter from 'matter-js'
import * as PIXI from 'pixi.js'
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Marine from '@games/Us/Units/Marine.js'
import Medic from '@games/Us/Units/Medic.js'
import campfireShader from '@shaders/CampfireAtNightShader.js'
import valueShader from '@shaders/ValueShader.js'
import TileMapper from '@core/TileMapper.js'
import Doodad from '@utils/Doodad.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import Scene from '@core/Scene.js'
import UnitPanel from '@games/Us/UnitPanel.js'
import UnitSpawner from '@games/Us/UnitSpawner.js'
import styles from '@utils/Styles.js'
import * as CampNoir from '@games/Us/Stages/CampNoir.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'
import EndLevelScreen from '@games/Us/Screens/EndLevelStatScreen.js'
import StatCollector from '@games/Us/StatCollector.js'
import UnitMenu from '@games/Us/UnitMenu.js'

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
    victoryCondition: {type: 'lives', limit: 3},
    enableUnitSystem: true,
    enablePathingSystem: true,
    enableItemSystem: true,
    noClickIndicator: true,
    hideScore: true,
    camps: [CampNoir],
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
        this.heartbeat = gameUtils.getSound('heartbeat.wav', {volume: .12, rate: .9});
        this.shaneCollector = new StatCollector({predicate: function(event) {
            if(event.performingUnit.name == 'Shane')
                return true;
        }, sufferingPredicate: function(event) {
            if(event.sufferingUnit.name == 'Shane')
                return true;
        }})

        this.ursulaCollector = new StatCollector({predicate: function(event) {
            if(event.performingUnit.name == 'Ursula') {
                return true;
            }
        }, sufferingPredicate: function(event) {
            if(event.sufferingUnit.name == 'Ursula') {
                return true;
            }
        }})

        Matter.Events.on(this, 'LevelLocalEntityCreated', function(event) {
            this.levelLocalEntities.push(event.entity);
        }.bind(this));
        Matter.Events.on(this, 'InitCurrentLevel', function(event) {
            this.initCurrentLevel();
        }.bind(this));
        Matter.Events.on(this, 'GoToCamp', function(event) {
            this.gotoCamp();
        }.bind(this));
        Matter.Events.on(this, 'InitAirDrop', function(event) {
            this.initAirDrop(event.node);
        }.bind(this));

        Matter.Events.on(this, 'TravelStarted', function(event) {
            this.shane.fatigue = 0;
            this.ursula.fatigue = 0;

            //figure out starting offset from which the chars will move into the center
            var headX = Math.abs(event.headVelocity.x);
            var headY = Math.abs(event.headVelocity.y);
            var buffer = 80;
            var xSteps = (gameUtils.getPlayableWidth()/2 + buffer)/headX;
            var ySteps = (gameUtils.getPlayableHeight()/2 + buffer)/headY;
            var xPos = 0;
            var yPos = 0;
            if(xSteps <= ySteps) {
                xPos = -event.headVelocity.x * xSteps;
                yPos = -event.headVelocity.y * xSteps;
            } else {
                xPos = -event.headVelocity.x * ySteps;
                yPos = -event.headVelocity.y * ySteps;
            }
            this.offscreenStartLocation = {x: xPos, y: yPos};

            //cleanup and reset the previous unit spawner
            var node = event.node;
            this.setCurrentLevel(node.levelDetails);
            this.fatigueTimer = this.addTimer({
                name: 'fatigueTimer',
                gogogo: true,
                timeLimit: 75,
                callback: function() {
                    this.shane.fatigue += 1;
                    this.ursula.fatigue += 1;
                    Matter.Events.trigger(this.map, 'SetFatigue', {amount: this.ursula.fatigue});
                    this.shane.fatigue = Math.min(99, this.shane.fatigue);
                    this.ursula.fatigue = Math.min(99, this.ursula.fatigue);
                }.bind(this)
            })
        }.bind(this));
        Matter.Events.on(this, 'TravelFinished', function(event) {
            this.invalidateTimer(this.fatigueTimer);
        }.bind(this));
    },

    play: function(options) {
        var dialogueScene = new Scene();
        dialogueScene.addBlackBackground();

        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Camp Noir", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "Ursula", text: "Shane, get up. Incoming message from Command...",
          picture: 'NewMessage.png', pictureWordTrigger: 'Incoming'});
        var a2 = new Dialogue({pauseAtPeriod: false, actor: "Shane", text: "Urs, it's... 3:00am. Those pencil pushers can wait until mor--", delayAfterEnd: 0,
          picture: '302.png', pictureWordTrigger: '3:00'});
        var a3 = new Dialogue({interrupt: true, actor: "Ursula", text: "It's from MacMurray...", picture: 'MacMurray.png', pictureWordTrigger: 'from'});
        var a4 = new Dialogue({actor: "Shane", text: "Christ... That can only mean--", delayAfterEnd: 0});
        var a5 = new Dialogue({interrupt: true, actor: "Ursula", text: "Beasts."});
        var a6 = new Dialogue({actor: "Shane", text: "Location?", delayAfterEnd: 500});
        var a7 = new Dialogue({actor: "Ursula", text: "Intel is being relayed. Get up, get your rifle.", picture: 'GrabRifleLighter.png', pictureWordTrigger: 'Get up', delayAfterEnd: 1200});
        var a8 = new Dialogue({actor: "Shane", text: "Is the coffee ready?", delayAfterEnd: 1500});

        var chain = new DialogueChain([title, a1, a2, a3, a4, a5, a6, a7, a8], {startDelay: 2000, done: function() {
            dialogueScene.add(graphicsUtils.addSomethingToRenderer("TEX+:ESC to continue", {where: 'hudText', style: styles.titleOneStyle, anchor: {x: 1, y: 1}, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}}));
        }});
        dialogueScene.add(chain);
        chain.play();
        this.currentScene.transitionToScene(dialogueScene);
        Matter.Events.on(this.currentScene, 'sceneFadeInDone', () => {
            $('body').on('keydown.uskeydown', function( event ) {
                var key = event.key.toLowerCase();
                if(key == 'escape') {
                    //clear dialogue and start initial level
                    this.initialLevel();
                    $('body').off('keydown.uskeydown');
                }
            }.bind(this))
        })
    },

    preGameExtension: function() {
        var titleScene = new Scene();
        this.currentScene = titleScene;
        var background = graphicsUtils.createDisplayObject('SplashColored', {where: 'hudText', anchor: {x: 0, y: 0}});
        var startGameText = graphicsUtils.addSomethingToRenderer("TEX+:Click To Begin", {where: 'hudText', style: styles.titleOneStyle, x: this.canvas.width/2, y: this.canvas.height*3/4});
        graphicsUtils.makeSpriteSize(background, gameUtils.getCanvasWH());
        titleScene.add(background);
        titleScene.add(startGameText);
        titleScene.initializeScene();
    },

    initialLevel: function() {
        //create our units
        this.createShane();
        this.createUrsula();
        this.addUnit(this.shane);
        this.addUnit(this.ursula);

        //create empty scene and transition to camp scene
        this.currentStage = this.camps[0];
        this.currentCamp = this.currentStage.campConstructor;

        //generate map
        this.map = this.currentStage.map.initializeMap();

        //for troubleshooting victory screen
        // this.gotoEndLevelScreen();
        this.gotoCamp();
    },

    gotoCamp: function() {
        var camp = new this.currentCamp;
        var cameScene = camp.initializeCamp();
        this.currentScene.transitionToScene(cameScene);
        Matter.Events.on(cameScene, 'afterSnapshotRender', () => {
            //we could have come to camp from the map, so make sure it's closed
            this.closeMap();
        })

        Matter.Events.on(cameScene, 'initialize', function() {
            //set camp active and trigger event
            this.campLikeActive = true;
            Matter.Events.trigger(this, 'enteringCamp');

            //remove enemy units
            gameUtils.applyToUnitsByTeam(function(team) {
                return (team != globals.currentGame.playerTeam);
            }, null, function(unit) {
                globals.currentGame.removeUnit(unit);
            })

            //reset shane and urs
            this.setUnit(this.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {y: 40})});
            this.setUnit(this.ursula, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {y: 40})});

            //clean up spawner if it exists
            if(this.currentSpawner) {
                this.currentSpawner.cleanUp();
            }
        }.bind(this))
    },

    gotoEndLevelScreen: function(collectors, defeat) {
        this.unitSystem.pause();
        this.unitSystem.deselectUnit(this.shane);
        this.unitSystem.deselectUnit(this.ursula);
        var vScreen = new EndLevelScreen({shane: this.shane, ursula: this.ursula}, collectors, {type: defeat ? 'defeat' : 'victory'});
        var vScene = vScreen.createScene({});
        this.currentScene.transitionToScene(vScene);

        var blankScene = new Scene();
        Matter.Events.on(this.currentScene, 'sceneFadeInDone', () => {
            $('body').on('keydown.uskeydown', function( event ) {
                var key = event.key.toLowerCase();
                if(key == 'escape') {
                    $('body').off('keydown.uskeydown');
                    this.map.show();
                    this.map.allowMouseEvents(false);
                    this.currentScene.transitionToScene({newScene: blankScene, fadeIn: true}); //show the map and transition to an empty scene
                }
            }.bind(this))
        })

        gameUtils.matterOnce(blankScene, 'sceneFadeInDone', () => {
            this.map.allowMouseEvents(true);
        })

        return vScene;
    },

    closeMap: function() {
        this.unitSystem.unpause();
        this.mapActive = false;
        this.map.hide();
    },

    setCurrentLevel: function(level) {
        this.currentLevelDetails = level;
        //if this level has enemies, start the pool as we travel
        if(this.currentLevelDetails.enemySets.length > 0) {
            this.currentSpawner = new UnitSpawner(this.currentLevelDetails.enemySets);
            this.currentSpawner.startPooling();
        }
    },

    initCurrentLevel: function() {
        //create new scene
        var nextLevelScene = this.createNextLevelTerrain(this.currentLevelDetails);
        this.currentScene.transitionToScene(nextLevelScene);
        this.campLikeActive = false;
        Matter.Events.on(nextLevelScene, 'afterSnapshotRender', function() {
            this.closeMap();
        }.bind(this))
        Matter.Events.on(nextLevelScene, 'initialize', function() {
            Matter.Events.trigger(this, 'enteringLevel');
            this.unitSystem.pause();
            gameUtils.setCursorStyle('None');
            var shaneStart = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {x: -20});
            var ursulaStart = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {x: 20});
            this.setUnit(this.shane, {position: mathArrayUtils.clonePosition(shaneStart, this.offscreenStartLocation), moveToCenter: true, applyFatigue: true});
            this.setUnit(this.ursula, {position: mathArrayUtils.clonePosition(ursulaStart, this.offscreenStartLocation), moveToCenter: true, applyFatigue: true});
            this.startEnemySpawn();
        }.bind(this))
        this.level += 1;
    },

    //the level parameter is optional
    startEnemySpawn: function(level) {
        if(level) {
            this.setCurrentLevel(level);
        }
        var game = this;
        gameUtils.doSomethingAfterDuration(() => {
            graphicsUtils.floatText(".", gameUtils.getPlayableCenter(), {runs: 15, style: styles.titleOneStyle});
            game.heartbeat.play();
        }, 800);
        gameUtils.doSomethingAfterDuration(() => {
            graphicsUtils.floatText(".", gameUtils.getPlayableCenter(), {runs: 15, style: styles.titleOneStyle});
            this.unitSystem.unpause();
            game.heartbeat.play();
        }, 1600);
        gameUtils.doSomethingAfterDuration(() => {
            this.currentSpawner.start();
            gameUtils.setCursorStyle('Main');
            graphicsUtils.floatText("Begin", gameUtils.getPlayableCenter(), {runs: 15, style: styles.titleOneStyle});
            game.heartbeat.play();
            this.shaneCollector.startNewCollector("Shane " + mathArrayUtils.getId());
            this.ursulaCollector.startNewCollector("Ursula " + mathArrayUtils.getId());
            this.initializeWinLossCondition();
        }, 2400);
    },

    initializeWinLossCondition: function() {
        //win/loss conditions
        var lossCondition = null;
        var winCondition = null;

        var removeCurrentConditions = function() {
            this.removeTickCallback(winCondition);
            this.removeTickCallback(lossCondition);
        }

        var commonWinLossTasks = function() {
            removeCurrentConditions.call(this);
            this.shaneCollector.stopCurrentCollector();
            this.ursulaCollector.stopCurrentCollector();
            this.currentSpawner.cleanUp();
            this.shane.canAttack = false;
            this.ursula.canAttack = false;
            this.shane.canMove = false;
            this.ursula.canMove = false;
            this.shane.isTargetable = false;
            this.ursula.isTargetable = false;
            Matter.Events.trigger(globals.currentGame, "VictoryOrDefeat");
        }

        this.endDelayInProgress = false;
        var winCondition = this.addTickCallback(function() {
            var fulfilled = this.currentLevelDetails.enemySets.every((eset) => {
                return eset.fulfilled;
            })
            if(!fulfilled) return;

            var unitsOfOpposingTeamExist = false;
            if(this.unitsByTeam[4] && this.unitsByTeam[4].length > 0) {
                unitsOfOpposingTeamExist = true;
            }

            if(!this.endDelayInProgress && !unitsOfOpposingTeamExist && this.itemSystem.itemsOnGround.length == 0 && this.itemSystem.getDroppingItems().length == 0) {
                this.endDelayInProgress = true;
                gameUtils.doSomethingAfterDuration(() => {
                    if(this.currentLevelDetails.customWinBehavior) {
                        removeCurrentConditions.call(this);
                        this.currentLevelDetails.customWinBehavior();
                    } else {
                        commonWinLossTasks.call(this);
                        var sc = this.gotoEndLevelScreen({shane: this.shaneCollector.getLastCollector(), ursula: this.ursulaCollector.getLastCollector()});
                        Matter.Events.trigger(this.currentLevelDetails, 'endLevelActions', {endLevelScene: sc});
                        gameUtils.matterOnce(sc, 'afterSnapshotRender', function() {
                            gameUtils.moveUnitOffScreen(this.shane);
                            gameUtils.moveUnitOffScreen(this.ursula);
                            this.removeAllLevelLocalEntities();
                        }.bind(this))
                    }
                }, 400);
            }
        }.bind(this))

        var lossCondition = this.addTickCallback(function() {
            if(!this.endDelayInProgress && this.shane.isDead && this.ursula.isDead) {
                this.endDelayInProgress = true;
                gameUtils.doSomethingAfterDuration(() => {
                    commonWinLossTasks.call(this);
                    this.currentLevelDetails.resetLevel();
                    this.itemSystem.removeAllItemsOnGround(true);
                    var sc = this.gotoEndLevelScreen({shane: this.shaneCollector.getLastCollector(), ursula: this.ursulaCollector.getLastCollector()}, true);
                    gameUtils.matterOnce(sc, 'afterSnapshotRender', function() {
                        this.removeAllLevelLocalEntities();
                        var enemies = gameUtils.getUnitEnemies(this.shane);
                        enemies.forEach((enemy) => {
                            this.removeUnit(enemy);
                        })
                        this.map.revertHeadToPreviousLocationDueToDefeat();
                    }.bind(this))
                }, 600);
            }
        }.bind(this))
    },

    initAirDrop: function(node) {
        this.currentLevelDetails = node.levelDetails;

        //mark node as completed
        node.complete();

        //camp-like area active
        this.campLikeActive = true;

        //create new scene
        var airDropScene = new Scene();

        //Init trees/doodads
        this.currentLevelDetails.createTerrain(airDropScene);
        this.currentLevelDetails.createTrees(airDropScene);
        this.currentScene.transitionToScene(airDropScene);

        Matter.Events.on(airDropScene, 'afterSnapshotRender', function() {
            this.closeMap();
        }.bind(this))
        Matter.Events.on(airDropScene, 'initialize', function() {
            Matter.Events.trigger(this, 'enteringLevel');
            this.currentLevelDetails.startAirDrop(airDropScene);
            this.setUnit(this.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), this.offscreenStartLocation), moveToCenter: true});
            this.setUnit(this.ursula, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), this.offscreenStartLocation), moveToCenter: true});
            var game = this;
        }.bind(this))
        this.level += 1;
    },

    removeAllEnemyUnits: function() {
        gameUtils.applyToUnitsByTeam(function(team) {
            return team != this.playerTeam;
        }.bind(this), null, function(unit) {
            this.removeUnit(unit);
        }.bind(this))
    },

    removeAllLevelLocalEntities: function() {
        this.levelLocalEntities.forEach((entity) => {
            if(entity.constructor.name == 'Sprite' || entity.constructor.name == 'Text' || entity.constructor.name == 'AnimatedSprite') {
                graphicsUtils.removeSomethingFromRenderer(entity);
            } else if(entity.type == 'body') {
                this.removeBody(entity);
            }
        })
        this.levelLocalEntities = [];
    },

    //Probably don't really need this anymore
    createNextLevelTerrain: function(levelObj) {
        var scene = new Scene();
        levelObj.createTerrain(scene);
        return scene;
    },

    createShane: function() {
         var s = Marine({team: this.playerTeam, name: 'Shane', dropItemsOnDeath: false, adjustHitbox: false});
         this.shane = s;
         // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["AwarenessTonic"], unit: this.shane});
         // ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["SereneStar"], unit: this.shane});
         ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["TechnologyKey"], unit: this.shane});
         // ItemUtils.dropItemAtPosition({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.shane, position: gameUtils.getCanvasCenter()});
         gameUtils.moveUnitOffScreen(this.shane);
         s.position = gameUtils.getPlayableCenter();
         // this.shane.damage = 10000;

         // var u = this.createUnit('Scout');
         // this.addUnit(u);
         // u.position = gameUtils.getPlayableCenter();

         return s;
    },

    createUrsula: function() {
        // this.ursula = Eruptlet({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        this.ursula = Medic({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["TechnologyKey"], unit: this.ursula});
        // this.ursula.idleCancel = true;
        gameUtils.moveUnitOffScreen(this.ursula);
        return this.ursula;
    },

    createUnit: function(constructorName) {
        var unit = UnitMenu[constructorName].c({team: this.playerTeam, name: mathArrayUtils.getId(), dropItemsOnDeath: false});
        gameUtils.moveUnitOffScreen(unit);
        return unit;
    },

    //used just for shane/urs
    setUnit: function(unit, options) {
        var options = options || {};
        var position = options.position;
        var moveToCenter = options.moveToCenter;

        if(unit.isDead) {
            unit.revive();
        }
        this.unitSystem.deselectUnit(unit);

        var centerX;
        if(unit.name == 'Shane') {
            centerX = -30;
            unit.position = position;
        } else {
            centerX = 30;
            unit.position = position;
        }

        unit.isTargetable = true;
        unit.canMove = true;
        unit.canAttack = true;
        if(moveToCenter) {
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
            unit.move(mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {x: centerX, y: 0}));
        } else {
            unit.stop();
        }

        unit.currentHealth = unit.maxHealth;
        unit.currentEnergy = unit.maxEnergy;

        //apply fatigue
        if(options.applyFatigue && unit.fatigue) {
            var healthPenalty = unit.fatigue*unit.maxHealth/100;
            var energyPenalty = unit.fatigue*unit.maxEnergy/100;
            unit.currentHealth -= healthPenalty;
            unit.currentEnergy -= energyPenalty;
        }

        if(unit.hideGrave)
            unit.hideGrave();
    },

    resetGameExtension: function() {
        this.level = 0;
    },

    nukeExtension: function() {
        $('body').off('keydown.us');
        $('body').off('keydown.map');
        if(this.currentScene) {
            this.currentScene.clear();
        }
        this.heartbeat.unload();
    }
}

game.assets = [
    {name: "BaseUnitAnimations1", target: "Textures/Us/BaseUnitAnimations1.json"},
    {name: "Marine", target: "Textures/Us/Marine.json"},
    {name: "MarineAnimations1", target: "Textures/Us/MarineAnimations1.json"},
    {name: "Medic", target: "Textures/Us/Medic.json"},
    {name: "MedicAnimations1", target: "Textures/Us/MedicAnimations1.json"},
    {name: "MedicAnimations2", target: "Textures/Us/MedicAnimations2.json"},
    {name: "Critter", target: "Textures/Us/Critter.json"},
    {name: "CritterAnimations1", target: "Textures/Us/CritterAnimations1.json"},
    {name: "Sentinel", target: "Textures/Us/Sentinel.json"},
    {name: "SentinelAnimations1", target: "Textures/Us/SentinelAnimations1.json"},
    {name: "Eruptlet", target: "Textures/Us/Eruptlet.json"},
    {name: "EruptletAnimations1", target: "Textures/Us/EruptletAnimations1.json"},
    {name: "Gargoyle", target: "Textures/Us/Gargoyle.json"},

    //items
    {name: "Items", target: "Textures/Us/Items.json"},
    {name: "ItemAnimations1", target: "Textures/Us/ItemAnimations1.json"},

    //generic textures and animations
    {name: "Utility0", target: "Textures/Us/Utility-0.json"},
    // {name: "Utility1", target: "Textures/Us/Utility2-0.json"},
    // {name: "Utility1", target: "Textures/Us/Utility-1.json"},
    {name: "UtilityAnimations1", target: "Textures/Us/UtilityAnimations1.json"},
    {name: "UtilityAnimations2", target: "Textures/Us/UtilityAnimations2.json"},

    {name: "Cinematic", target: "Textures/Us/Cinematic.json"},

    //terrain and doodads
    {name: "Terrain0", target: "Textures/Us/Terrain-0.json"},

    //spine assets
    {name: "marineN", target: "SpineAssets/Marine Exports/N/N.json"},
    {name: "marineNW", target: "SpineAssets/Marine Exports/NW/NW.json"},
    {name: "marineS", target: "SpineAssets/Marine Exports/S/S.json"},
    {name: "marineSW", target: "SpineAssets/Marine Exports/SW/SW.json"},
    {name: "marineW", target: "SpineAssets/Marine Exports/W/W.json"},

    {name: "medicN", target: "SpineAssets/Medic Exports/N/N.json"},
    {name: "medicNW", target: "SpineAssets/Medic Exports/NW/NW.json"},
    {name: "medicS", target: "SpineAssets/Medic Exports/S/S.json"},
    {name: "medicSW", target: "SpineAssets/Medic Exports/SW/SW.json"},
    {name: "medicW", target: "SpineAssets/Medic Exports/W/W.json"},

    {name: "critterN", target: "SpineAssets/Critter Exports/N/North.json"},
    {name: "critterNW",target: "SpineAssets/Critter Exports/NW/Northwest.json"},
    {name: "critterS", target: "SpineAssets/Critter Exports/S/South.json"},
    {name: "critterSW",target: "SpineAssets/Critter Exports/SW/SouthWest.json"},
    {name: "critterW", target: "SpineAssets/Critter Exports/W/West.json"},

    {name: "alienN", target: "SpineAssets/Alien Export/N/N.json"},
    {name: "alienNW", target: "SpineAssets/Alien Export/NW/NW.json"},
    {name: "alienS", target: "SpineAssets/Alien Export/S/S.json"},
    {name: "alienSW", target: "SpineAssets/Alien Export/SW/SW.json"},
    {name: "alienW", target: "SpineAssets/Alien Export/W/W.json"},

    {name: "pikemanN", target: "SpineAssets/Pikeman Exports/N/skeleton.json"},
    {name: "pikemanNW", target: "SpineAssets/Pikeman Exports/NW/skeleton.json"},
    {name: "pikemanS", target: "SpineAssets/Pikeman Exports/S/skeleton.json"},
    {name: "pikemanSW", target: "SpineAssets/Pikeman Exports/SW/skeleton.json"},
    {name: "pikemanW", target: "SpineAssets/Pikeman Exports/W/skeleton.json"},

]

export default $.extend({}, CommonGameMixin, game);
