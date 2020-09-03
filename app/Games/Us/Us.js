define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'unitcore/_Moveable', 'unitcore/_Attacker',
'usunits/Marine', 'usunits/EnemyMarine', 'usunits/Eruptlet', 'pixi-filters', 'utils/GameUtils', 'usunits/Medic',
'shaders/CampfireAtNightShader', 'shaders/ValueShader', 'core/TileMapper', 'utils/Doodad', 'unitcore/ItemUtils', 'core/Scene', 'usunits/Critter', 'usunits/AlienGuard',
'usunits/Sentinel', 'games/Us/UnitPanel', 'games/Us/UnitSpawner', 'games/Us/UnitMenu', 'games/Us/Map'],
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Marine, EnemyMarine, Eruptlet, filters, utils, Medic, campfireShader, ValueShader,
    TileMapper, Doodad, ItemUtils, Scene, Critter, AlienGuard, Sentinel, unitpanel, UnitSpawner, unitMenu, Map) {

    var targetScore = 1;

    var game = {
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

            var colorGeometry = class ColorGeometry extends PIXI.Geometry
        	{
        		_buffer = PIXI.Buffer;
        		_indexBuffer = PIXI.Buffer;

        		constructor(_static = false)
        		{
        			super();

        			this._buffer = new PIXI.Buffer(null, _static, false);

        			this._indexBuffer = new PIXI.Buffer(null, _static, true);

                    var TYPES = PIXI.TYPES;
        			this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT)
        				.addAttribute('aTextureCoord', this._buffer, 2, false, TYPES.FLOAT)
        				.addAttribute('color', this._buffer, 2, true, TYPES.FLOAT)
        				.addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
        				.addIndex(this._indexBuffer);
        		}
        	}

            var colorGeo = new colorGeometry();
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
                    return (team != currentGame.playerTeam);
                }, null, function(unit) {
                    currentGame.removeUnit(unit);
                })

                //reset shane and urs
                this.resetUnit(this.shane);
                this.resetUnit(this.ursula);

                //setup light
                this.lightPower = 2.0;
                this.lightDirection = 1;
                this.lightRadius = 650;

                this.backgroundLightShader = new PIXI.Filter(null, campfireShader, {
                    lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
                    flameVariation: 0.0,
                    yOffset: 0.0,
                    red: 3.0,
                    green: 1.5,
                    blue: 1.5,
                    lightPower: 1.6,
                });

                var stageRed = 3.2;
                this.stageLightShader = new PIXI.Filter(null, campfireShader, {
                    lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
                    flameVariation: 0.0,
                    yOffset: 30.0,
                    red: stageRed,
                    green: 1.5,
                    blue: 0.8,
                    lightPower: 2.0,
                });
                this.treeShader = new PIXI.Filter(null, ValueShader, {
                    colors: [0.4, 0.4, 2.0]
                });
                this.treeShader.myName = 'treeShader';
                this.backgroundLightShader.myName = 'campfire';
                this.backgroundLightShader.uniforms.lightRadius = this.lightRadius;
                if(true) {
                    this.renderer.layers.background.filters = [this.backgroundLightShader];
                    this.renderer.layers.stage.filters = [this.stageLightShader];
                    this.renderer.layers.stageTwo.filters = [this.treeShader];
                    var flameTimer = currentGame.addTimer({
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

                            this.backgroundLightShader.uniforms.flameVariation = this.lightPower/1.0;
                            this.stageLightShader.uniforms.flameVariation = this.lightPower/1.0;
                            this.stageLightShader.uniforms.red = stageRed + this.lightPower;
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
            var gType = utils.getRandomElementOfArray(["Red", "Orange", "Yellow", "Teal"]);
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

            var boxes = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 50, texture: 'Boxes1',
                stage: 'stage', scale: {x: 1.5, y: 1.5}, offset: {x: 0, y: 0}, sortYOffset: 0,
                shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 0, y: 0}, shadowOffset: {x: 0, y: 10},
                position: {x: utils.getCanvasCenter().x-235, y: utils.getPlayableCenter().y}})
            campScene.add(boxes);

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

            var mapHoverTick = currentGame.addTickCallback(function(event) {
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
                enemySetsFulfilled = false;
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
             // ItemUtils.giveUnitItem({gamePrefix: "Us", name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: this.shane});
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

        createCritter: function(number, autoHone) {
            for(x = 0; x < number; x++) {
                //var tint = x%2==0 ? 0xff0000 : null;
                var critter = Critter({team: 4});
                critter.body.collisionFilter.mask -= 0x0004;
                if(autoHone)
                    critter.honeRange = 5000;
                critter.position = {x: 100, y: 100};
                this.addUnit(critter, true);
                if(true) {
                    ItemUtils.giveUnitItem({name: ["SturdyCanteen"], unit: critter});
                }
            }
        },

        createAlienGuard: function(number, autoHone) {
            for(x = 0; x < number; x++) {
                //var tint = x%2==0 ? 0xff0000 : null;
                var guard = AlienGuard({team: this.playerTeam});
                guard.position = utils.getPlayableCenter();
                this.addUnit(guard);
            }
        },

        createSentinel: function(number, autoHone) {
            for(x = 0; x < number; x++) {
                //var tint = x%2==0 ? 0xff0000 : null;
                var sentinel = Sentinel({team: 4});
                if(autoHone)
                    sentinel.honeRange = 1400;
                utils.placeBodyWithinRadiusAroundCanvasCenter(sentinel, 600, 400);
                this.addUnit(sentinel, true);
                if(true) {
                    // ItemUtils.giveUnitItem({name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["SteadySyringe", "JewelOfLife", "MaskOfRage", "BootsOfHaste", "RingOfThought", "RingOfRenewal"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["MedalOfGrit"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["MedalOfMerit"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["SturdyCanteen"], unit: sentinel});
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

    /*
     * Options to for the game starter
     */
    game.worldOptions = {
            //background: {image: 'Grass', scale: {x: 1.0, y: 1.0}},
                width: 1400, //1600
                height: 700, //800 playing area, 100 unit panel
                unitPanelHeight: 100,
                gravity: 0,
                unitPanelConstructor: unitpanel
               };

    //game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

    return $.extend({}, CommonGameMixin, game);
})
