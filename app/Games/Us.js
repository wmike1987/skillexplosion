define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'unitcore/_Moveable', 'unitcore/_Attacker',
'units/Marine', 'units/Baneling', 'pixi-filters', 'utils/GameUtils', 'units/Medic', 'shaders/SimpleLightFragmentShader',
'core/TileMapper', 'utils/Doodad', 'unitcore/ItemUtils', 'core/Scene'],
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Marine, Baneling, filters, utils, Medic, lightShader, TileMapper,
    Doodad, ItemUtils, Scene) {

    var targetScore = 1;

    var game = {
        gameName: 'Us',
        level: 1,
        // victoryCondition: {type: 'timed', limit: 5},
        victoryCondition: {type: 'lives', limit: 5},
        enableUnitSystem: true,
        enableItemSystem: true,
        noClickIndicator: true,
        tileSize: 225,
        currentScene: null,

        initExtension: function() {
            //wave begin sound
            this.nextWave = utils.getSound('rush1.wav');

            //blow up sound
            this.pop = utils.getSound('pop1.wav');

            //create blue glow filter
            this.simpleLightShader = new PIXI.Filter(null, lightShader, {
                lightOnePosition: {x: -10000.0, y: -10000.0},
                lightTwoPosition: {x: -10000.0, y: -10000.0},
                stageResolution: utils.getCanvasWH()
            });
            //currentGame.renderer.background.filters = [this.simpleLightShader];

            //nice grass tile width = 370
            // utils.addAmbientLightsToBackground([0x660000, 0x00cc44, 0x660066, 0x00cc44, 0x660000, 0x660000, 0x4d79ff], null, .3);
            //create some Doodads
            // var tree1 = new Doodad({collides: true, radius: 20, texture: 'avgoldtree1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: -75}, sortYOffset: 75,
            // shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 2, y: 2}, shadowOffset: {x: -6, y: 20}})
        },

        play: function(options) {
            this.initialLevel();
        },

        initialLevel: function() {
            //create our units
            this.createShane();
            this.createUrsula();
            this.createBane(3);

            //create empty scene and transition to camp scene
            this.currentScene = new Scene(); //empty scene
            var campScene = this.createCampScene();
            this.currentScene.transitionToScene({newScene: campScene});
            this.currentScene = campScene;

            //move shane and urs into place when we're ready
            Matter.Events.on(campScene, 'initialize', function() {
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

            backgroundTiles = ['Dirt/dirt_base'];
            var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth});
            campScene.add(tileMap);

            backgroundTiles = ['Dirt/grass_top_level_1', 'Dirt/grass_top_level_2', 'Dirt/grass_top_level_3'];
            var tileMap2 = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth, alpha: .7});
            campScene.add(tileMap2);

            var l1 = utils.createAmbientLights([0x080C09, 0x080C09, 0x080C09, 0x080C09, 0x080C09], 'foreground', .55);
            campScene.add(l1);
            var l2 = utils.createAmbientLights([0x0E5B05, 0x03491B, 0x0E5B05, 0x03491B, 0x0E5B05], 'backgroundOne', .6);
            campScene.add(l2);

            var treeOptions = {};
            treeOptions.start = {x: 0, y: 0};
            treeOptions.width = 300;
            treeOptions.height = utils.getPlayableHeight()+50;
            treeOptions.density = .3;
            treeOptions.possibleTrees = ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5'];//, 'avgoldtree6', 'avgreentree1', 'avgreentree2', 'avgreentree3', 'avgreentree4', 'avgreentree5'];
            // campScene.add(this.fillAreaWithTrees(treeOptions));

            var mapTable = new Doodad({collides: true, autoAdd: false, radius: 35, texture: 'TableWithMap', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: 0}, sortYOffset: 0,
                shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 2, y: 2}, shadowOffset: {x: 0, y: 20}, position: {x: utils.getCanvasCenter().x+150, y: utils.getPlayableHeight()-250}})
            campScene.add(mapTable);

            var equipStation = new Doodad({collides: true, autoAdd: false, radius: 35, texture: 'smallcactus1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 10, y: -38}, sortYOffset: 35,
                shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 2, y: 2}, shadowOffset: {x: 0, y: 20}, position: {x: utils.getCanvasCenter().x-150, y: utils.getPlayableHeight()-280}})
            campScene.add(equipStation);

            treeOptions.start = {x: utils.getPlayableWidth()-200, y: 0};
            // campScene.add(this.fillAreaWithTrees(treeOptions));

            var bush = new Doodad({collides: true, autoAdd: false, radius: 20, texture: 'avsmallbush1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: 0}, sortYOffset: 0,
                shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -6, y: 10}, position: {x: utils.getCanvasCenter().x, y: utils.getPlayableHeight()-40}})
            campScene.add(bush);

            //create next level options
            var nextLevelOptions = {
                possibleTiles: [],
                realTileWidth: 370,
                enemySet: []
            }

            for(var i = 1; i < 7; i++) {
                nextLevelOptions.possibleTiles.push('YellowGrass'+i);
            }

            nextLevelOptions.enemySet.push({
                constructor: Baneling,
                spawn: {total: 103, n: 3, hz: 2000, maxOnField: 5},
                item: {type: 'basic', total: 3}
            });

            var nextLevelInitiated = false;
            Matter.Events.on(bush.body, 'onCollide', function(pair) {
                if(!nextLevelInitiated) {
                    var otherBody = pair.pair.bodyB == bush.body ? pair.pair.bodyA : pair.pair.bodyB;
                    if(otherBody.unit) {
                        this.nextLevel(nextLevelOptions);
                        nextLevelInitiated = true;
                    }
                }
            }.bind(this));

            Matter.Events.on(equipStation.body, 'onCollide', function(pair) {
                var otherBody = pair.pair.bodyB == equipStation.body ? pair.pair.bodyA : pair.pair.bodyB;
                if(otherBody.unit) {
                    this.unitSystem.unitConfigurationPanel.showForUnit(otherBody.unit);
                }
            }.bind(this));

            return campScene;
        },

        /*
         * options:
         * possible tiles
         * enemy set
         */
        nextLevel: function(options) {

            this.levelState = options;

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

                if(!unitsOfOpposingTeamExist && enemySetsFulfilled) {
                    this.removeTickCallback(winCondition);
                    this.gotoCamp();
                }
            }.bind(this))

            var lossCondition = this.addTickCallback(function() {
                if(this.shane.isDead && this.ursula.isDead) {
                    this.removeTickCallback(lossCondition);
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
             this.shane = Marine({team: this.playerTeam, name: 'Shane'});
             // this.shane2 = Marine({team: currentGame.playerTeam, name: 'Shane'});
             // this.addUnit(this.shane2);
             // this.shane2.position = utils.getCanvasCenter();
             return this.shane;
        },

        createUrsula: function() {
            this.ursula = Medic({team: this.playerTeam, name: 'Ursula'});
            return this.ursula;
        },

        //used just for shane/urs
        resetUnit: function(unit) {
            unit.isDead = false;
            unit.isAttackable = true;
            unit.position = utils.getCanvasCenter();
            unit.currentHealth = 1000;
            unit.currentEnergy = 1000;
        },

        createBane: function(number, autoHone) {
            for(x = 0; x < number; x++) {
                //var tint = x%2==0 ? 0xff0000 : null;
                var bane = Baneling({team: 4, isSelectable: false});
                if(autoHone)
                    bane.honeRange = 1400;
                utils.placeBodyWithinRadiusAroundCanvasCenter(bane, 600, 400);
                this.addUnit(bane, true);
                if(true) {
                    ItemUtils.giveUnitItem({name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["SteadySyringe", "JewelOfLife", "MaskOfRage", "BootsOfHaste", "RingOfThought", "RingOfRenewal"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["MedalOfGrit"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["MedalOfMerit"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["SteadySyringe"], unit: bane});
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
                    var tree = new Doodad({collides: true, autoAdd: false, radius: 120, texture: utils.getRandomElementOfArray(options.possibleTrees), stage: 'stage', scale: {x: 1.1, y: 1.1}, offset: {x: 0, y: -75}, sortYOffset: 75,
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
                            for(var x = 0; x < enemy.spawn.n; x++) {
                                if(total >= enemy.spawn.total) {
                                    this.invalidated = true;
                                    enemy.fulfilled = true;
                                    return;
                                }
                                newUnit = enemy.constructor({team: 4, isSelectable: false});
                                ItemUtils.giveUnitItem({name: ["SteadySyringe", "JewelOfLife", "MaskOfRage", "BootsOfHaste", "RingOfThought", "RingOfRenewal"], unit: newUnit});
                                ItemUtils.giveUnitItem({name: ["SereneStar"], unit: newUnit});

                                utils.placeBodyWithinRadiusAroundCanvasCenter(newUnit, 800, 600);
                                newUnit.honeRange = 1400;
                                total++;
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
        }
    }

    /*
     * Options to for the game starter
     */
    game.worldOptions = {
            //background: {image: 'Grass', scale: {x: 1.0, y: 1.0}},
                width: 1200,
                height: 600, //600 playing area, 200 unit panel
                unitPanelHeight: 100,
                gravity: 0,
               };

    //game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

    return $.extend({}, CommonGameMixin, game);
})
