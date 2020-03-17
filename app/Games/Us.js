define(['jquery', 'matter-js', 'pixi', 'core/CommonGameMixin', 'unitcore/_Moveable', 'unitcore/_Attacker',
'units/Marine', 'units/Baneling', 'pixi-filters', 'utils/GameUtils', 'units/Medic', 'shaders/SimpleLightFragmentShader',
'core/TileMapper', 'utils/Doodad', 'unitcore/ItemUtils'],
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Marine, Baneling, filters, utils, Medic, lightShader, TileMapper, Doodad, ItemUtils) {

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
        scene: {
            objs: [],
            add: function(objOrArray) {
                if(!$.isArray(objOrArray)) {
                    objOrArray = [objOrArray];
                }
                $.merge(this.objs, objOrArray);
            },
            clear: function() {
                $.each(this.objs, function(i, obj) {
                    if(obj.cleanUp) {
                        obj.cleanUp();
                    } else {
                        utils.removeSomethingFromRenderer(obj);
                    }
                })
                this.objs = [];
            }
        },

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

            // this.createCamp();
        },

        play: function(options) {
            this.initialLevel();
            // this.nextLevel();

            // var tree1 = new Doodad({drawWire: false, collides: true, radius: 20, texture: 'skelly', stage: 'stage', scale: {x: .3, y: .3}, offset: {x: 0, y: -50}, sortYOffset: 75, shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -6, y: 0}})

            // var tree1 = new Doodad({drawWire: false, collides: true, radius: 20, texture: 'avsnowtree7', stage: 'stage', scale: {x: 1, y: 1}, offset: {x: -6, y: -55}, sortYOffset: 75, shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 2, y: 2}, shadowOffset: {x: 2, y: 28}})

            /*
             * Create banes
             */
            this.addTimer({name: 'newbane', gogogo: true, timeLimit: 5000, callback: function() {
                // this.createBane(2, true);
            }.bind(this)});
        },

        initialLevel: function() {
            this.createCamp();
            this.createMarine(1);
            this.createMedic(1);
        },

        createCamp: function() {
            var tileWidth = this.tileSize;

            backgroundTiles = ['Dirt/dirt_base'];
            var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth});
            tileMap.initialize({where: 'background'});
            this.scene.add(tileMap.tiles);

            backgroundTiles = ['Dirt/grass_top_level_1', 'Dirt/grass_top_level_2', 'Dirt/grass_top_level_3'];
            var tileMap2 = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: tileWidth});
            tileMap2.initialize({where: 'background'});
            this.scene.add(tileMap2.tiles);

            var l1 = utils.addAmbientLightsToBackground([0x080C09, 0x080C09, 0x080C09, 0x080C09, 0x080C09], 'foreground', .55);
            this.scene.add(l1);
            var l2 = utils.addAmbientLightsToBackground([0x0E5B05, 0x03491B, 0x0E5B05, 0x03491B, 0x0E5B05], 'backgroundOne', .6);
            this.scene.add(l2);

            var treeOptions = {};
            treeOptions.start = {x: 0, y: 0};
            treeOptions.width = 300;
            treeOptions.height = utils.getPlayableHeight()+50;
            treeOptions.density = .65;
            treeOptions.possibleTrees = ['avgoldtree1', 'avgoldtree2', 'avgoldtree3', 'avgoldtree4', 'avgoldtree5', 'avgoldtree6', 'avgreentree1', 'avgreentree2', 'avgreentree3', 'avgreentree4', 'avgreentree5'];
            this.fillAreaWithTrees(treeOptions)

            treeOptions.start = {x: utils.getPlayableWidth()-250, y: 0};
            this.fillAreaWithTrees(treeOptions)

            var bush = new Doodad({collides: true, radius: 20, texture: 'avsmallbush1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: 0}, sortYOffset: 0,
            shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -6, y: 10}, position: {x: utils.getCanvasCenter().x, y: utils.getPlayableHeight()-40}})
            this.scene.add(bush);

            var nextLevelOptions = {
                possibleTiles: [],
                enemySet: {}
            }
            for(var i = 1; i < 7; i++) {
                nextLevelOptions.possibleTiles.push('YellowGrass'+i);
            }

            var nextLevelInitiated = false;
            Matter.Events.on(bush.body, 'onCollide', function(pair) {
                if(!nextLevelInitiated) {
                    var otherBody = pair.pair.bodyB == bush.body ? pair.pair.bodyA : pair.pair.bodyB;
                    if(otherBody.unit) {
                        this.nextLevel(nextLevelOptions);
                    }
                    nextLevelInitiated = true;
                }
            }.bind(this));
        },

        /* options
         * start {x: , y: }
         * width, height
         * density (0-1)
         * possibleTrees []
         */
        fillAreaWithTrees: function(options) {
            for(var x = options.start.x; x < options.start.x+options.width; x+=(220-options.density*200)) {
                for(var y = options.start.y; y < options.start.y+options.height; y+=(220-options.density*200)) {
                    var tree = new Doodad({collides: true, radius: 20, texture: utils.getRandomElementOfArray(options.possibleTrees), stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: -75}, sortYOffset: 75,
                    shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 2, y: 2}, shadowOffset: {x: -6, y: 20}, position: {x: x+(Math.random()*100 - 50), y: y+(Math.random()*80 - 40)}})
                    this.scene.add(tree);
                }
            }
        },

        /*
         * options:
         * possible tiles
         * enemy set
         */
        nextLevel: function(options) {
            this.engageSceneTransition(this.createNextLevelScene.bind(this, options));
        },

        createNextLevelScene: function(options) {
            //clear scene
            this.scene.clear();

            //new tile map
            var tileMap = TileMapper.produceTileMap({possibleTextures: options.possibleTiles, tileWidth: this.tileSize, realTileWidth: 370});
            tileMap.initialize({where: 'background'});
            this.scene.add(tileMap.tiles)

            //new lights
            var l2 = utils.addAmbientLightsToBackground([0x0E5B05, 0x03491B, 0x0E5B05, 0x03491B, 0x0E5B05], 'backgroundOne', .6);
            this.scene.add(l2);

            //create enemies
            this.createBane(10);
        },

        engageSceneTransition: function(callback) {
            this.tint = utils.addSomethingToRenderer('TintableSquare', 'hudText');
            utils.makeSpriteSize(this.tint, utils.getCanvasWH());
            this.tint.position = utils.getCanvasCenter();
            this.tint.tint = 0x000000;
            this.tint.alpha = 0;
            var tintRuns = 20;
            currentGame.addTimer({name: 'tint', runs: tintRuns, timeLimit: 50, killsSelf: true, callback: function() {
                this.tint.alpha += 1/tintRuns;
            }.bind(this), totallyDoneCallback: function() {
                callback();
                currentGame.addTimer({name: 'untint', runs: tintRuns, timeLimit: 50, killsSelf: true, callback: function() {
                    this.tint.alpha -= 1/tintRuns;
                }.bind(this)})
            }.bind(this)});

        },

        createMarine: function(number) {
            for(x = 0; x < number; x++) {
                var marine = Marine({team: currentGame.playerTeam, name: 'Shane'});
                marine.typeId = 34;
                marine.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(marine, 4);
                this.addUnit(marine, true);
                this.marine = marine;
            }
        },

        createMedic: function(number) {
            for(x = 0; x < number; x++) {
                var medic = Medic({team: currentGame.playerTeam, name: 'Ursula'});
                medic.typeId = 35;
                medic.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(medic, 4);
                this.addUnit(medic, true);
                this.medic = medic;
            }
        },

        createBane: function(number, autoHone) {
            for(x = 0; x < number; x++) {
                //var tint = x%2==0 ? 0xff0000 : null;
                var bane = Baneling({team: 4, isSelectable: false});
                if(autoHone)
                    bane.honeRange = 1400;
                utils.placeBodyWithinRadiusAroundCanvasCenter(bane, 600, 400);
                this.addUnit(bane, true);
                if(utils.flipCoin() && utils.flipCoin() || true) {
                    // ItemUtils.giveUnitItem({name: ["JewelOfLife", "MaskOfRage", "BootsOfHaste"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["SteadySyringe", "JewelOfLife", "MaskOfRage", "BootsOfHaste", "RingOfThought", "RingOfRenewal"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["MedalOfGrit"], unit: bane});
                    // ItemUtils.giveUnitItem({name: ["MedalOfMerit"], unit: bane});
                    ItemUtils.giveUnitItem({name: ["SereneStar"], unit: bane});
                }
            }
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
