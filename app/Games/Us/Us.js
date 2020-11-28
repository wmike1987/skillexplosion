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
import VictoryScreen from '@games/Us/Screens/VictoryScreen.js'
import StatCollector from '@games/Us/StatCollector.js'
// import DefeatScreen from '@games/Us/Screens/DefeatScreen.js'

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
    enableItemSystem: true,
    noClickIndicator: true,
    camps: [CampNoir],
    currentCamp: null,
    currentScene: null,
    itemClasses: {
        worn: ['RingOfThought', 'RingOfRenewal', 'SturdyCanteen', 'BootsOfHaste', 'PepPill'],
        rugged: ['SteadySyringe', 'MaskOfRage', 'RuggedCanteen', 'RichPepPill', 'MedalOfGrit', 'MedalOfMerit'],
        burnished: ['SereneStar'],
        gleaming: ['GleamingCanteen'],
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
            dialogueScene.add(graphicsUtils.addSomethingToRenderer("TEXT:ESC to continue", {where: 'hudText', style: styles.titleOneStyle, anchor: {x: 1, y: 1}, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}}));
        }});
        dialogueScene.add(chain);
        chain.play();
        this.currentScene.transitionToScene(dialogueScene);
        Matter.Events.on(this.currentScene, 'sceneFadeDone', () => {
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
        var startGameText = graphicsUtils.addSomethingToRenderer("TEXT:Click To Begin", {where: 'hudText', style: styles.titleOneStyle, x: this.canvas.width/2, y: this.canvas.height*3/4});
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
        this.currentCamp = this.currentStage.camp;

        //for troubleshooting victory screen
        // this.gotoVictoryScreen();
        this.gotoCamp();

        //generate map
        this.map = this.currentStage.map.initializeMap();
    },

    gotoCamp: function() {
        var camp = this.currentCamp.initializeCamp();
        this.currentScene.transitionToScene(camp);
        this.unitSystem.unpause();

        Matter.Events.on(camp, 'initialize', function() {
            //set camp active and trigger event
            this.campActive = true;
            Matter.Events.trigger(this, 'enteringCamp');

            //remove enemy units
            gameUtils.applyToUnitsByTeam(function(team) {
                return (team != globals.currentGame.playerTeam);
            }, null, function(unit) {
                globals.currentGame.removeUnit(unit);
            })

            //reset shane and urs
            this.resetUnit(this.shane, {yoffset: 30});
            this.resetUnit(this.ursula, {yoffset: 30});

            //clean up spawner if it exists
            if(this.currentSpawner) {
                this.currentSpawner.cleanUp();
            }
        }.bind(this))
    },

    gotoVictoryScreen: function(collectors) {
        this.unitSystem.pause();
        var vScreen = new VictoryScreen({shane: this.shane, ursula: this.ursula}, collectors);
        var vScene = vScreen.createScene({});
        this.currentScene.transitionToScene(vScene);
        Matter.Events.on(this.currentScene, 'sceneFadeDone', () => {
            $('body').on('keydown.uskeydown', function( event ) {
                var key = event.key.toLowerCase();
                if(key == 'escape') {

                    //clear dialogue and start initial level
                    $('body').off('keydown.uskeydown');
                    this.gotoCamp();
                }
            }.bind(this))
        })
    },

    gotoDefeatScreen: function() {

    },

    deactivateMap: function() {
        this.unitSystem.unpause();
        this.mapActive = false;
        this.map.hide();
    },

    initLevel: function(node) {
        this.deactivateMap();
        this.currentLevelDetails = node.levelDetails;

        if(this.currentSpawner) {
            this.currentSpawner.cleanUp();
        }

        if(this.currentLevelDetails) {
            this.currentSpawner = new UnitSpawner(this.currentLevelDetails.enemySets);
        }

        //reset any unfulfilled enemy states
        this.currentLevelDetails.resetLevel();


        //create new scene
        var nextLevelScene = this.createNextLevelScene(this.currentLevelDetails);
        this.campActive = false;
        this.currentScene.transitionToScene(nextLevelScene);
        Matter.Events.on(nextLevelScene, 'initialize', function() {
            Matter.Events.trigger(this, 'enteringLevel');
            this.resetUnit(this.shane, {yoffset: gameUtils.getCanvasHeight()/2, moveToCenter: true});
            this.resetUnit(this.ursula, {yoffset: gameUtils.getCanvasHeight()/2, moveToCenter: true});
            var game = this;
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.floatText(".", gameUtils.getPlayableCenter(), {runs: 15, style: styles.titleOneStyle});
                game.heartbeat.play();
            }, 800);
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.floatText(".", gameUtils.getPlayableCenter(), {runs: 15, style: styles.titleOneStyle});
                game.heartbeat.play();
            }, 1600);
            gameUtils.doSomethingAfterDuration(() => {
                this.currentSpawner.initialize();
                graphicsUtils.floatText("Begin", gameUtils.getPlayableCenter(), {runs: 15, style: styles.titleOneStyle});
                game.heartbeat.play();
                this.shaneCollector.startNewCollector("Shane " + mathArrayUtils.getId());
                this.ursulaCollector.startNewCollector("Ursula " + mathArrayUtils.getId());
            }, 2400);
        }.bind(this))
        this.level += 1;

        //win/loss conditions
        var lossCondition = null;
        var winCondition = null;
        var winCondition = this.addTickCallback(function() {
            var enemySetsFulfilled = false;
            $.each(this.currentLevelDetails.enemySets, function(i, enemy) {
                enemySetsFulfilled = enemy.fulfilled;
                return enemySetsFulfilled;
            })
            if(!enemySetsFulfilled) return;

            var unitsOfOpposingTeamExist = false;
            if(this.unitsByTeam[4] && this.unitsByTeam[4].length > 0) {
                unitsOfOpposingTeamExist = true;
            }

            if(!unitsOfOpposingTeamExist && enemySetsFulfilled && this.itemSystem.itemsOnGround.length == 0 && this.itemSystem.getDroppingItems().length == 0) {
                this.removeTickCallback(winCondition);
                this.removeTickCallback(lossCondition);
                node.isCompleted = true;
                this.shaneCollector.stopCurrentCollector();
                this.ursulaCollector.stopCurrentCollector();
                // this.gotoCamp();
                this.gotoVictoryScreen({shane: this.shaneCollector.getLastCollector(), ursula: this.ursulaCollector.getLastCollector()});
                this.resetUnit(this.shane);
                this.resetUnit(this.ursula);
            }
        }.bind(this))

        var lossCondition = this.addTickCallback(function() {
            if(this.shane.isDead && this.ursula.isDead) {
                this.removeTickCallback(lossCondition);
                this.removeTickCallback(winCondition);
                this.itemSystem.removeAllItemsOnGround(true);
                this.shaneCollector.stopCurrentCollector();
                this.ursulaCollector.stopCurrentCollector();
                this.gotoDefeatScreen();
                this.resetUnit(this.shane);
                this.resetUnit(this.ursula);
                // this.gotoCamp();
            }
        }.bind(this))
    },

    createNextLevelScene: function(levelObj) {
        var scene = new Scene();
        levelObj.createTerrain(scene);
        return scene;
    },

    createShane: function() {
         this.shane = Marine({team: this.playerTeam, name: 'Shane', dropItemsOnDeath: false, adjustHitbox: false});
         //this.shane.noIdle = true;
         // this.shane = Marine({team: this.playerTeam, name: 'Shane', dropItemsOnDeath: false});
         ItemUtils.giveUnitItem({gamePrefix: "Us", name: ["MedalOfGrit"], unit: this.shane});
         gameUtils.moveUnitOffScreen(this.shane);
         return this.shane;
    },

    createUrsula: function() {
        // this.ursula = Eruptlet({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        this.ursula = Medic({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        // this.ursula.idleCancel = true;
        gameUtils.moveUnitOffScreen(this.ursula);
        return this.ursula;
    },

    //used just for shane/urs
    resetUnit: function(unit, options) {
        var options = options || {};
        var yoffset = options.yoffset || 0;
        var moveToCenter = options.moveToCenter;

        if(unit.isDead) {
            unit.revive();
        }
        this.unitSystem.deselectUnit(unit);

        unit.isTargetable = true;
        var centerX;
        if(unit.name == 'Shane') {
            centerX = -30;
            unit.position = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {x: centerX, y: yoffset});;
        } else {
            centerX = 30;
            unit.position = mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {x: centerX, y: yoffset});
        }

        if(moveToCenter) {
            this.unitSystem.pause();
            unit.body.collisionFilter.mask -= 0x0004;
            gameUtils.setCursorStyle('None');
            gameUtils.doSomethingAfterDuration(() => {
                unit.body.collisionFilter.mask += 0x0004;
                this.unitSystem.unpause();
                gameUtils.setCursorStyle('Main');
            }, 2400);
            unit.move(mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {x: centerX, y: 0}));
        } else {
            unit.stop();
        }

        unit.currentHealth = unit.maxHealth;
        unit.currentEnergy = unit.maxEnergy;
        unit.canMove = true;
        unit.canAttack = true;
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

]

export default $.extend({}, CommonGameMixin, game);
