define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'unitcore/_Moveable', 'unitcore/_Attacker',
'usunits/Marine', 'usunits/EnemyMarine', 'usunits/Baneling', 'pixi-filters', 'utils/GameUtils', 'usunits/Medic', 'shaders/SimpleLightFragmentShader',
'shaders/CampfireShader', 'core/TileMapper', 'utils/Doodad', 'unitcore/ItemUtils', 'core/Scene', 'usunits/Critter', 'usunits/AlienGuard',
'usunits/Sentinel', 'shaders/ObjectSingleLightShader'],
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Marine, EnemyMarine, Baneling, filters, utils, Medic, lightShader, campfireShader, TileMapper,
    Doodad, ItemUtils, Scene, Critter, AlienGuard, Sentinel, ObjectSingleLightShader) {

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
        basicItems: ['JewelOfLife', 'RingOfThought', 'RingOfRenewal', 'SturdyCanteen', 'BootsOfHaste'],

        initExtension: function() {
            this.openmap = utils.getSound('openmap.wav', {volume: .15, rate: 1.0});
            this.entercamp = utils.getSound('entercamp.wav', {volume: .05, rate: .75});
            this.objectSingleLightShader = new PIXI.Filter(null, ObjectSingleLightShader, {
                lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
                flameVariation: 0.0
            });

            this.lightPower = 0.0;
            this.lightDirection = 1;
            this.lightRadius = 300;
            this.campfireShader = new PIXI.Filter(null, campfireShader, {
                lightOnePosition: {x: utils.getCanvasCenter().x, y: utils.getCanvasHeight()-(utils.getPlayableHeight()/2+30)},
                flameVariation: 0.0
            });
            this.campfireShader.myName = 'campfire';
            if(false) {
                this.renderer.layers.background.filters = [this.campfireShader];
                this.renderer.layers.stage.filters = [this.objectSingleLightShader];
                var flameTimer = currentGame.addTimer({
                    name: 'flame',
                    gogogo: true,
                    timeLimit: 80,
                    callback: function() {
                        if(!this.lightPower)
                        this.lightPower = .5;
                        this.lightPower += (.01+Math.random()*.015)*this.lightDirection;
                        if(this.lightPower < 0.5) {
                            this.lightDirection = 1;
                        } else if(this.lightPower > 1.0) {
                            this.lightDirection = -1;
                        }
                        this.campfireShader.uniforms.flameVariation = this.lightPower/1.0;
                        this.objectSingleLightShader.uniforms.flameVariation = this.lightPower/1.0;
                    }.bind(this)
                })

                this.campfireShader.uniforms.lightRadius = this.lightRadius;
                this.objectSingleLightShader.uniforms.lightRadius = this.lightRadius;
            }

            //nice grass tile width = 370
        },

        play: function(options) {
            this.initialCutScene();
            // this.initialLevel();
        },

        generateEnemyCampLayout: function() {
            var typeTokenMappings = {
                normal: 'MapGoldBattleToken',
                boss: 'MapRedBattleToken'
            }

            var nextLevelInitiated = false;
            var us = this;

            var mapNode = function(position) {
                //create next level options
                var nextLevelOptions = {
                    possibleTiles: [],
                    realTileWidth: 370,
                    enemySet: []
                }

                var grassTypes = ["Red", "Orange", "Yellow"]
                for(var i = 1; i < 7; i++) {
                    var gType = utils.getRandomElementOfArray(grassTypes);
                    nextLevelOptions.possibleTiles.push('LushGrass1/'+gType+'Grass'+i);
                }

                nextLevelOptions.enemySet.push({
                    constructor: Critter,
                    spawn: {total: 10 + utils.getRandomIntInclusive(1, 8), n: 1, hz: 1350, maxOnField: 1},
                    item: {type: 'basic', total: 2}
                })
                nextLevelOptions.enemySet.push({
                    constructor: Sentinel,
                    spawn: {total: 1 + utils.getRandomIntInclusive(1, 3), n: 1, hz: 9000, maxOnField: 1},
                })

                this.mapPosition = position;
                this.levelType = 'normal';
                this.levelOptions = nextLevelOptions;
                this.neighbors = [];
                this.displayObject = utils.createDisplayObject(typeTokenMappings[this.levelType], {position: this.mapPosition, scale: {x: .75, y: .75}});
                this.displayObject.interactive = true;

                this.displayObject.on('mouseover', function(event) {
                    this.displayObject.tint = 0x20cd2c;
                }.bind(this))
                this.displayObject.on('mouseout', function(event) {
                    this.displayObject.tint = 0xFFFFFF;
                }.bind(this))
                this.displayObject.on('mousedown', function(event) {
                    this.nextLevel(nextLevelOptions);
                }.bind(us))
            }

            var graph = [];

            var nodeBuffer = 100;
            for(var x = 0; x < 10; x++) {
                var position;
                var collision;
                do {
                    collision = false;
                    position = utils.getRandomPlacementWithinPlayableBounds(50);
                    for(let node of graph) {
                        if(utils.distanceBetweenPoints(node.mapPosition, position) < nodeBuffer) {
                            collision = true;
                            break;
                        }
                    }
                } while(collision)
                var node = new mapNode(position);
                graph.push(node);
            }

            return graph;
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
            // this.createBane(0);
            // this.createCritter(1);
            // this.createAlienGuard(1);
            // this.createSentinel(1);

            //create empty scene and transition to camp scene
            var campScene = this.createCampScene();
            this.currentScene.transitionToScene({newScene: campScene});
            this.currentScene = campScene;

            //move shane and urs into place when we're ready
            Matter.Events.on(campScene, 'initialize', function() {
                //play sound
                this.entercamp.play();
                this.shane.position = utils.getCanvasCenter();
                this.ursula.position = utils.getCanvasCenter();
                this.addUnit(this.shane);
                this.addUnit(this.ursula);
            }.bind(this))
        },

        gotoCamp: function() {
            var camp = this.createCampScene();
            this.currentScene.transitionToScene(camp);
            this.currentScene = camp;

            Matter.Events.on(camp, 'initialize', function() {
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
            }.bind(this))
        },

        createCampScene: function() {
            if(this.currentSpawner) {
                this.currentSpawner.cleanUp();
            }

            var campScene = new Scene();
            var tileWidth = this.tileSize;

            backgroundTiles = ['GrassAndRock1/Dirt/dirt_base'];
            var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth});
            campScene.add(tileMap);

            backgroundTiles = ['GrassAndRock1/Dirt/grass_top_level_1', 'GrassAndRock1/Dirt/grass_top_level_2', 'GrassAndRock1/Dirt/grass_top_level_3'];
            var tileMap2 = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth, alpha: .7});
            campScene.add(tileMap2);

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

            this.mapSprite = utils.createDisplayObject('MapBase', {where: 'foreground', position: utils.getPlayableCenter()});
            this.mapSprite.visible = false;
            campScene.add(this.mapSprite);

            //generate map graph
            this.graph = this.generateEnemyCampLayout();

            //establish map click listeners
            var mapClickListener = this.addPriorityMouseDownEvent(function(event) {
                var canvasPoint = {x: 0, y: 0};
                this.renderer.interaction.mapPositionToPoint(canvasPoint, event.clientX, event.clientY);

				if(Matter.Vertices.contains(mapTable.body.vertices, canvasPoint) && !this.mapActive) {
                    this.openmap.play();
                    this.mapSprite.visible = true;
                    this.unitSystem.pause();
                    this.graph.forEach(node => {
                        if(!node.displayObject.parent) {
                            utils.addSomethingToRenderer(node.displayObject, {where: 'hudNTwo'});
                            campScene.add(node.displayObject);
                        } else {
                            node.displayObject.visible = this.mapSprite.visible;
                        }
                    })
                    this.mapActive = true;
                }
            }.bind(this));

            $('body').on('keydown.map', function( event ) {
                var key = event.key.toLowerCase();
                if(key == 'escape' && this.mapSprite.visible) {
                    this.deactivateMap();
                }
            }.bind(this))
            campScene._clearExtension = function() {
                this.removeTickCallback(mapHoverTick);
                this.removePriorityMouseDownEvent(mapClickListener);
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

            //create next level options
            var nextLevelOptions = {
                possibleTiles: [],
                realTileWidth: 370,
                enemySet: []
            }

            for(var i = 1; i < 7; i++) {
                nextLevelOptions.possibleTiles.push('LushGrass1/YellowGrass'+i);
            }

            nextLevelOptions.enemySet.push({
                constructor: Critter,
                spawn: {total: 18, n: 1, hz: 1200, maxOnField: 1},
                item: {type: 'basic', total: 3}
            })

            var nextLevelInitiated = false;
            return campScene;
        },

        deactivateMap: function() {
            this.unitSystem.unpause();
            this.mapSprite.visible = false;
            this.mapActive = false;
            this.graph.forEach(node => {
                node.displayObject.visible = this.mapSprite.visible;
            })
        },

        /*
         * options:
         * possible tiles
         * enemy set
         */
        nextLevel: function(options) {

            this.levelState = options;

            this.deactivateMap();

            if(this.currentSpawner) {
                this.currentSpawner.cleanUp();
            }
            if(options.enemySet) {
                this.currentSpawner = this.createUnitSpawner(options.enemySet);
            }

            var nextLevelScene = this.createNextLevelScene(options);
            this.currentScene.transitionToScene(nextLevelScene);
            Matter.Events.on(nextLevelScene, 'initialize', function() {
                this.currentSpawner.initialize();
                //reset shane and urs
                this.resetUnit(this.shane);
                this.resetUnit(this.ursula);
            }.bind(this))
            this.currentScene = nextLevelScene;
            this.level += 1;

            var lossCondition = null;
            var winCondition = null;
            var winCondition = this.addTickCallback(function() {
                var enemySet = this.levelState.enemySet;
                enemySetsFulfilled = false;
                $.each(enemySet, function(i, enemy) {
                    enemySetsFulfilled = enemy.fulfilled;
                    return enemySetsFulfilled;
                })

                var unitsOfOpposingTeamExist = false;
                if(this.unitsByTeam[4] && this.unitsByTeam[4].length > 0) {
                    unitsOfOpposingTeamExist = true;
                }

                if(!unitsOfOpposingTeamExist && enemySetsFulfilled && this.itemSystem.itemsOnGround.length == 0 && this.itemSystem.getDroppingItems().length == 0) {
                    this.removeTickCallback(winCondition);
                    this.removeTickCallback(lossCondition);
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
             this.shane = Marine({team: this.playerTeam, name: 'Shane', dropItemsOnDeath: false});
             // this.shane2 = Marine({team: currentGame.playerTeam, name: 'Shane'});
             // this.addUnit(this.shane2);
             // this.shane2.position = utils.getCanvasCenter();
             return this.shane;
        },

        createUrsula: function() {
            this.ursula = Medic({team: this.playerTeam, name: 'Ursula', dropItemsOnDeath: false});
            this.ursula.idleCancel = true;
            return this.ursula;
        },

        //used just for shane/urs
        resetUnit: function(unit) {
            if(unit.isDead) {
                unit.revive();
            }
            unit.isTargetable = true;
            unit.position = utils.getCanvasCenter();
            unit.currentHealth = 1000;
            unit.currentEnergy = 1000;
            unit.canMove = true;
            unit.canAttack = true;
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
                if(autoHone)
                    guard.honeRange = 2000;
                utils.placeBodyJustOffscreen(guard, 'top');
                this.addUnit(guard, true);
                if(true) {
                    // ItemUtils.giveUnitItem({name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["SteadySyringe", "JewelOfLife", "MaskOfRage", "BootsOfHaste", "RingOfThought", "RingOfRenewal"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["MedalOfGrit"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["MedalOfMerit"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["SturdyCanteen"], unit: guard});
                }
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
                    var tree = new Doodad({collides: true, autoAdd: false, radius: 120, texture: 'Doodads/'+utils.getRandomElementOfArray(options.possibleTrees), stage: 'stageOne', scale: {x: 1.1, y: 1.1}, offset: {x: 0, y: -75}, sortYOffset: 75,
                    shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 4, y: 4}, shadowOffset: {x: -6, y: 20}, position: {x: x+(Math.random()*100 - 50), y: y+(Math.random()*80 - 40)}})
                    trees.push(tree);
                }
            }
            return trees;
        },

        createUnitSpawner: function(enemySet) {
            var spawner = {};
            spawner.id = utils.uuidv4();

            spawner.timers = [];

            var self = this;

            spawner.initialize = function() {
                $.each(enemySet, function(i, enemy) {
                    var total = 0;
                    var spawnTimer = currentGame.addTimer({
                        name: 'spawner' + i + spawner.id + enemy.type,
                        gogogo: true,
                        timeLimit: enemy.spawn.hz,
                        callback: function() {
                            if(enemy.fulfilled) return;
                            for(var x = 0; x < enemy.spawn.n; x++) {
                                var lastUnit = false;
                                if(total == (enemy.spawn.total-1)) lastUnit = true;
                                total++;

                                //Create unit
                                var newUnit = enemy.constructor({team: 4});
                                newUnit.body.collisionFilter.mask -= 0x0004; //subtract wall
                                newUnit.honeRange = 5000;
                                utils.placeBodyJustOffscreen(newUnit);

                                //Give item to unit if chosen
                                if(enemy.item && enemy.item.total > 0) {
                                    var giveItem = true;
                                    if(lastUnit) {
                                        giveItem = true;
                                    } else {
                                        giveItem = utils.flipCoin() && utils.flipCoin();
                                    }
                                    if(giveItem) {
                                        ItemUtils.giveUnitItem({gamePrefix: 'Us', name: utils.getRandomElementOfArray(self.basicItems), unit: newUnit});
                                        enemy.item.total--;
                                    }
                                }

                                if(lastUnit) {
                                    this.invalidated = true;
                                    enemy.fulfilled = true;
                                }
                                currentGame.addUnit(newUnit);
                            }
                        }
                    })
                    spawner.timers.push(spawnTimer);
                })
            }

            spawner.cleanUp = function() {
                currentGame.invalidateTimer(this.timers);
            }

            return spawner;
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
                width: 1200,
                height: 600, //600 playing area, 100 unit panel
                unitPanelHeight: 100,
                gravity: 0,
               };

    //game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

    return $.extend({}, CommonGameMixin, game);
})
