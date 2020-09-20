import * as $ from 'jquery'
import * as Matter from 'matter-js'
import * as PIXI from 'pixi.js'
import {CommonGameMixin} from '@core/CommonGameMixin.js'
import {globals} from '@core/GlobalState.js'
import utils from '@utils/GameUtils.js'
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
import unitMenu from '@games/Us/UnitMenu.js'
import Map from '@games/Us/Map.js'

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
    tileSize: 225,
    currentScene: null,
    itemClasses: {
        worn: ['RingOfThought', 'RingOfRenewal', 'SturdyCanteen', 'BootsOfHaste', 'PepPill'],
        rugged: ['SteadySyringe', 'MaskOfRage', 'RuggedCanteen', 'RichPepPill', 'MedalOfGrit', 'MedalOfMerit'],
        burnished: ['SereneStar'],
        gleaming: ['GleamingCanteen'],
    },

    initExtension: function() {
        this.openmap = utils.getSound('openmap.wav', {volume: .15, rate: 1.0});
        this.entercamp = utils.getSound('entercamp.wav', {volume: .05, rate: .75});
    },

    play: function(options) {
        this.initialCutScene();
    },

    initialCutScene: function() {
        this.currentScene = new Scene(); //empty scene to transition from
        var cutScene = new Scene();
        var background = utils.createDisplayObject('SplashRed', {where: 'hudTwo', anchor: {x: 0, y: 0}});
        utils.makeSpriteSize(background, utils.getCanvasWH());
        cutScene.add(background);

        this.currentScene.transitionToScene({newScene: cutScene});
        this.currentScene = cutScene;

        $('body').on('keydown.us', function( event ) {
            var key = event.key.toLowerCase();
            if(key == 'escape') {
                this.initialLevel();
                $('body').off('keydown.us');
            }
        }.bind(this))
    },

    initialLevel: function() {
        //create our units
        this.createShane();
        this.createUrsula();
        this.addUnit(this.shane);
        this.addUnit(this.ursula);

        //create empty scene and transition to camp scene
        var camp = this.gotoCamp();

        //generate map
        this.map = new Map({});
    },

    gotoCamp: function() {
        var camp = this.createCampScene();
        this.currentScene.transitionToScene(camp);
        this.currentScene = camp;

        Matter.Events.on(camp, 'initialize', function() {
            //set camp active and trigger event
            this.campActive = true;
            Matter.Events.trigger(this, 'enteringCamp');

            //play sound
            this.entercamp.play();

            //clear enemies
            utils.applyToUnitsByTeam(function(team) {
                return (team != globals.currentGame.playerTeam);
            }, null, function(unit) {
                globals.currentGame.removeUnit(unit);
            })

            //reset shane and urs
            this.resetUnit(this.shane);
            this.resetUnit(this.ursula);

            //setup light
            this.lightPower = 2.0;
            this.lightDirection = 1;
            this.lightRadius = 650;

            var backgroundRed = 5.0;
            this.backgroundLightShader = new PIXI.Filter(null, campfireShader, {
                lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
                flameVariation: 0.0,
                yOffset: 0.0,
                red: backgroundRed,
                green: 1.2,
                blue: 1.5,
                lightPower: 2.0,
            });

            var stageRed = 5.2;
            this.stageLightShader = new PIXI.Filter(null, campfireShader, {
                lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
                flameVariation: 0.0,
                yOffset: 30.0,
                red: stageRed,
                green: 1.5,
                blue: 0.8,
                lightPower: 1.6,
            });
            this.treeShader = new PIXI.Filter(null, valueShader, {
                colors: [0.4, 0.4, 2.0]
            });
            this.treeShader.myName = 'treeShader';
            this.backgroundLightShader.myName = 'campfire';
            this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
            if(true) {
                this.renderer.layers.background.filters = [this.backgroundLightShader];
                this.renderer.layers.stage.filters = [this.stageLightShader];
                this.renderer.layers.stageTwo.filters = [this.treeShader];
                var flameTimer = globals.currentGame.addTimer({
                    name: 'flame',
                    gogogo: true,
                    timeLimit: 100,
                    callback: function() {
                        //Reverse light direction over time
                        if(!this.lightPower)
                            this.lightPower = 0.0;
                        this.lightPower += (.02+Math.random()*.045)*this.lightDirection;
                        if(this.lightPower < 0.0) {
                            this.lightDirection = 1;
                        } else if(this.lightPower > 1.0) {
                            this.lightDirection = -1;
                        }

                        this.backgroundLightShader.uniforms.flameVariation = this.lightPower;
                        this.stageLightShader.uniforms.flameVariation = this.lightPower;
                        this.backgroundLightShader.uniforms.red = backgroundRed + this.lightPower/2;
                        this.stageLightShader.uniforms.red = stageRed + this.lightPower*1.0;
                    }.bind(this)
                })

                this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
                this.stageLightShader.uniforms.lightRadius = this.lightRadius;
            }
        }.bind(this))

        return camp;
    },

    createCampScene: function() {
        if(this.currentSpawner) {
            this.currentSpawner.cleanUp();
        }

        var campScene = new Scene();
        var tileWidth = this.tileSize;

        var backgroundTiles = [];
        var gType = utils.getRandomElementOfArray(["Green"]);
        for(var i = 1; i < 7; i++) {
            backgroundTiles.push('LushGrass1/'+gType+'Grass'+i);
        }
        var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth, realTileWidth: 370});
        campScene.add(tileMap);

        // backgroundTiles = ['GrassAndRock1/Dirt/grass_top_level_1', 'GrassAndRock1/Dirt/grass_top_level_2', 'GrassAndRock1/Dirt/grass_top_level_3'];
        // var tileMap2 = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth, alpha: .7});
        // campScene.add(tileMap2);

        var l1 = utils.createAmbientLights([0x080C09, 0x080C09, 0x080C09, 0x080C09, 0x080C09], 'backgroundOne', .5);
        campScene.add(l1);
        var l2 = utils.createAmbientLights([0x0E5B05, 0x03491B, 0x0E5B05, 0x03491B, 0x0E5B05], 'backgroundOne', .6);
        // campScene.add(l2);

        var treeOptions = {};
        treeOptions.start = {x: 0, y: 0};
        treeOptions.width = 300;
        treeOptions.height = utils.getPlayableHeight()+50;
        treeOptions.density = .3;
        treeOptions.possibleTrees = ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5', 'avgoldtree6']//, 'avgreentree1', 'avgreentree2', 'avgreentree3', 'avgreentree4', 'avgreentree5'];
        campScene.add(this.fillAreaWithTrees(treeOptions));

        var tent = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 120, texture: ['Tent'], stage: 'stage',
            scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 30}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: utils.getCanvasCenter().x-150, y: utils.getPlayableHeight()-500}})
        campScene.add(tent);

        var sleepingbags = new Doodad({drawWire: false, collides: false, autoAdd: false, radius: 15, texture: 'SleepingBags',
            stage: 'stage', scale: {x: 1.4, y: 1.4}, offset: {x: 0, y: 0}, sortYOffset: -99999,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
            position: {x: utils.getCanvasCenter().x+150, y: utils.getPlayableHeight()-350}})
        campScene.add(sleepingbags);

        // var dtable = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 30, texture: 'dinnertable',
        //     stage: 'stage', scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
        //     shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
        //     position: {x: utils.getCanvasCenter().x-235, y: utils.getPlayableCenter().y}})
        // campScene.add(dtable);

        var gunrack = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 10, texture: 'gunrack',
            stage: 'stage', scale: {x: 1.0, y: 1.0}, offset: {x: 0, y: 0}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -2, y: 15},
            position: {x: utils.getCanvasCenter().x-180, y: utils.getPlayableCenter().y-30}})
        campScene.add(gunrack);

        var flag = utils.getAnimationB({
            spritesheetName: 'UtilityAnimations2',
            animationName: 'wflag',
            speed: .2,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flag.play();
        var flag = new Doodad({collides: true, autoAdd: false, radius: 20, texture: [flag], stage: 'stage',
            scale: {x: 1, y: 1}, shadowOffset: {x: 0, y: 30}, shadowScale: {x: .7, y: .7}, offset: {x: 0, y: 0}, sortYOffset: 35,
            position: {x: utils.getCanvasCenter().x+50, y: utils.getCanvasCenter().y-175}})
        campScene.add(flag);

        var mapTableSprite = utils.createDisplayObject('MapTable');
        var mapTable = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 30, texture: [mapTableSprite], stage: 'stage',
            scale: {x: 1.2, y: 1.2}, offset: {x: 0, y: 0}, sortYOffset: 0,
            shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.3, y: 1.3}, shadowOffset: {x: 0, y: 15},
            position: {x: utils.getCanvasCenter().x-130, y: utils.getPlayableHeight()-190}})
        campScene.add(mapTable);

        var mapHoverTick = globals.currentGame.addTickCallback(function(event) {
            if(Matter.Vertices.contains(mapTable.body.vertices, this.mousePosition)) {
                mapTableSprite.tint = 0xff33cc;
            } else {
                mapTableSprite.tint = 0xFFFFFF;
            }
        }.bind(this));

        //establish map click listeners
        var mapClickListener = this.addPriorityMouseDownEvent(function(event) {
            var canvasPoint = {x: 0, y: 0};
            this.renderer.interaction.mapPositionToPoint(canvasPoint, event.clientX, event.clientY);

			if(Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive && this.campActive) {
                this.openmap.play();
                this.unitSystem.pause();
                this.map.show();
                this.mapActive = true;
            }
        }.bind(this));

        $('body').on('keydown.map', function( event ) {
            var key = event.key.toLowerCase();
            if(key == 'escape' && this.mapActive) {
                this.deactivateMap();
            }
        }.bind(this))

        campScene._clearExtension = function() {
            this.removeTickCallback(mapHoverTick);
            this.removePriorityMouseDownEvent(mapClickListener);
            this.renderer.layers.background.filters = [];
            this.renderer.layers.stage.filters = [];
            this.renderer.layers.stageTwo.filters = [];
            this.map.hide();
            $('body').off('mousedown.map');
            $('body').off('keydown.map');
        }.bind(this);

        var fireAnimation = utils.getAnimationB({
			spritesheetName: 'UtilityAnimations2',
			animationName: 'campfire',
			speed: .75,
            loop: true,
			transform: [0, 0, 1.2, 1.3]
		});
        fireAnimation.where = 'stageOne';
        fireAnimation.play();
        var campfire = new Doodad({collides: true, autoAdd: false, radius: 40, texture: [fireAnimation, {doodadData: 'Logs', offset: {x: 2, y: 0}}], stage: 'stageNOne',
            scale: {x: 1.4, y: 1.4}, shadowOffset: {x: 0, y: 25}, shadowScale: {x: 1.3, y: 1.3}, offset: {x: 0, y: 0}, sortYOffset: 35,
            position: {x: utils.getCanvasCenter().x, y: utils.getCanvasCenter().y-40}})
        campScene.add(campfire);
        this.campfire = campfire;

        treeOptions.start = {x: utils.getPlayableWidth()-200, y: 0};
        campScene.add(this.fillAreaWithTrees(treeOptions));

        var nextLevelInitiated = false;
        return campScene;
    },

    deactivateMap: function() {
        this.unitSystem.unpause();
        this.mapActive = false;
        this.map.hide();
    },

    /*
     * options:
     * possible tiles
     * enemy set
     */
    nextLevel: function(node) {
        this.currentLevelDetails = node.levelDetails;

        if(this.currentSpawner) {
            this.currentSpawner.cleanUp();
        }
        if(this.currentLevelDetails) {
            this.currentSpawner = new UnitSpawner(this.currentLevelDetails.enemySets);
        }

        //reset any unfulfilled enemy states
        this.currentLevelDetails.resetLevel();

        this.deactivateMap();

        //create new scene
        var nextLevelScene = this.createNextLevelScene(this.currentLevelDetails);
        this.campActive = false;
        this.currentScene.transitionToScene(nextLevelScene);
        Matter.Events.on(nextLevelScene, 'initialize', function() {
            Matter.Events.trigger(this, 'enteringLevel');
            this.currentSpawner.initialize();
            this.resetUnit(this.shane);
            this.resetUnit(this.ursula);
        }.bind(this))
        this.currentScene = nextLevelScene;
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
                this.gotoCamp();
            }
        }.bind(this))

        var lossCondition = this.addTickCallback(function() {
            if(this.shane.isDead && this.ursula.isDead) {
                this.removeTickCallback(lossCondition);
                this.itemSystem.removeAllItemsOnGround(true);
                this.removeTickCallback(winCondition);
                this.gotoCamp();
            }
        }.bind(this))
    },

    createNextLevelScene: function(options) {
        var nextLevel = new Scene();

        //new tile map
        var tileMap = TileMapper.produceTileMap({possibleTextures: options.possibleTiles, tileWidth: this.tileSize, realTileWidth: options.realTileWidth});
        nextLevel.add(tileMap.tiles)

        //new lights
        var l1 = utils.createAmbientLights([0x0E5B05, 0x03491B, 0x0E5B05, 0x03491B, 0x0E5B05], 'backgroundOne', .6);
        nextLevel.add(l1);

        return nextLevel;
    },

    createShane: function() {
         this.shane = Marine({team: this.playerTeam, name: 'Shane', dropItemsOnDeath: false, adjustHitbox: false});
         //this.shane.noIdle = true;
         // this.shane = Marine({team: this.playerTeam, name: 'Shane', dropItemsOnDeath: false});
         ItemUtils.giveUnitItem({gamePrefix: "Us", name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: this.shane});
         utils.moveUnitOffScreen(this.shane);
         return this.shane;
    },

    createUrsula: function() {
        // this.ursula = Eruptlet({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        this.ursula = Medic({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
        // this.ursula.idleCancel = true;
        utils.moveUnitOffScreen(this.ursula);
        return this.ursula;
    },

    //used just for shane/urs
    resetUnit: function(unit) {
        if(unit.isDead) {
            unit.revive();
        }
        unit.isTargetable = true;
        if(unit.name == 'Shane') {
            unit.position = utils.clonePosition(utils.getCanvasCenter(), {x: -20, y: 0});;
        } else {
            unit.position = utils.clonePosition(utils.getCanvasCenter(), {x: 20, y: 0});
        }
        unit.currentHealth = unit.maxHealth;
        unit.currentEnergy = unit.maxEnergy;
        unit.canMove = true;
        unit.canAttack = true;
        if(unit.hideGrave)
            unit.hideGrave();
        unit.stop();
    },

    createBane: function(number, autoHone) {
        for(x = 0; x < number; x++) {
            //var tint = x%2==0 ? 0xff0000 : null;
            var bane = Baneling({team: this.playerTeam});
            if(autoHone)
                bane.honeRange = 1400;
            bane.damage = 20;
            utils.placeBodyWithinRadiusAroundCanvasCenter(bane, 600, 400);
            this.addUnit(bane, true);
            if(true) {
                // ItemUtils.giveUnitItem({name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: bane});
                // ItemUtils.giveUnitItem({name: ["SteadySyringe", "JewelOfLife", "MaskOfRage", "BootsOfHaste", "RingOfThought", "RingOfRenewal"], unit: bane});
                // ItemUtils.giveUnitItem({name: ["MedalOfGrit"], unit: bane});
                // ItemUtils.giveUnitItem({name: ["MedalOfMerit"], unit: bane});
                ItemUtils.giveUnitItem({name: ["SturdyCanteen"], unit: bane});
            }
        }
    },

    /* options
     * start {x: , y: }
     * width, height
     * density (0-1)
     * possibleTrees []
     */
    fillAreaWithTrees: function(options) {
        var trees = [];
        for(var x = options.start.x; x < options.start.x+options.width; x+=(220-options.density*200)) {
            for(var y = options.start.y; y < options.start.y+options.height; y+=(220-options.density*200)) {
                var tree = new Doodad({collides: true, autoAdd: false, radius: 120, texture: 'Doodads/'+utils.getRandomElementOfArray(options.possibleTrees), stage: 'stageTwo', scale: {x: 1.1, y: 1.1}, offset: {x: 0, y: -75}, sortYOffset: 75,
                shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 4, y: 4}, shadowOffset: {x: -6, y: 20}, position: {x: x+(Math.random()*100 - 50), y: y+(Math.random()*80 - 40)}})
                trees.push(tree);
            }
        }
        return trees;
    },

    resetGameExtension: function() {
        this.level = 0;
    },

    nukeExtension: function() {
        $('body').off('keydown.us');
        $('body').off('keydown.map');
        this.openmap.unload();
        this.entercamp.unload();
        if(this.currentScene) {
            this.currentScene.clear();
        }
    }
}

game.assets = [
    {name: "BaseUnit", target: "Textures/Us/BaseUnit.json"},
    {name: "BaseUnitAnimations1", target: "Textures/Us/BaseUnitAnimations1.json"},
    {name: "Marine", target: "Textures/Us/Marine.json"},
    {name: "MarineAnimations1", target: "Textures/Us/MarineAnimations1.json"},
    {name: "Medic", target: "Textures/Us/Medic.json"},
    {name: "MedicAnimations1", target: "Textures/Us/MedicAnimations1.json"},
    {name: "MedicAnimations2", target: "Textures/Us/MedicAnimations2.json"},
    {name: "Baneling", target: "Textures/Us/Baneling.json"},
    {name: "BanelingAnimations1", target: "Textures/Us/BanelingAnimations1.json"},
    {name: "Critter", target: "Textures/Us/Critter.json"},
    {name: "Sentinel", target: "Textures/Us/Sentinel.json"},
    {name: "Eruptlet", target: "Textures/Us/Eruptlet.json"},

    //items
    {name: "Items", target: "Textures/Us/Items.json"},
    {name: "ItemAnimations1", target: "Textures/Us/ItemAnimations1.json"},

    //generic textures and animations
    {name: "Utility0", target: "Textures/Us/Utility-0.json"},
    {name: "Utility1", target: "Textures/Us/Utility-1.json"},
    {name: "UtilityAnimations1", target: "Textures/Us/UtilityAnimations1.json"},
    {name: "UtilityAnimations2", target: "Textures/Us/UtilityAnimations2.json"},

    //terrain and doodads
    {name: "Terrain0", target: "Textures/Us/Terrain-0.json"},
    {name: "Terrain1", target: "Textures/Us/Terrain-1.json"},

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
