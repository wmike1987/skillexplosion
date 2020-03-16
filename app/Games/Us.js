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

            //map the background
            var grassColor = 'Yellow';
            var backgroundTiles = [];
            for(var x = 0; x < 6; x++) {
                backgroundTiles.push(grassColor + 'Grass' + (x+1));
            }
            //backgroundTiles = ['YellowGrass1','TealGrass1','GreenGrass1','RedGrass1', 'OrangeGrass1']
            var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: 180, realTileWidth: 370});
            tileMap.initialize({where: 'background'});

            //create some Doodads
            var tree1 = new Doodad({collides: true, radius: 20, texture: 'avgoldtree1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: -75}, sortYOffset: 75,
                                    shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 2, y: 2}, shadowOffset: {x: -6, y: 20}})

            utils.addAmbientLightsToBackground([0x660000, 0x00cc44, 0x660066, 0x00cc44, 0x660000, 0x660000, 0x4d79ff], null, .3);

        },

        play: function(options) {
            this.nextLevel();

            var tree1 = new Doodad({drawWire: false, collides: true, radius: 20, texture: 'skelly', stage: 'stage', scale: {x: .3, y: .3}, offset: {x: 0, y: -50}, sortYOffset: 75, shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 1, y: 1}, shadowOffset: {x: -6, y: 0}})

            var tree1 = new Doodad({drawWire: false, collides: true, radius: 20, texture: 'avsnowtree7', stage: 'stage', scale: {x: 1, y: 1}, offset: {x: -6, y: -55}, sortYOffset: 75, shadowIcon: 'IsoTreeShadow1', shadowScale: {x: 2, y: 2}, shadowOffset: {x: 2, y: 28}})

            /*
             * Create banes
             */
            this.addTimer({name: 'newbane', gogogo: true, timeLimit: 5000, callback: function() {
                // this.createBane(2, true);
            }.bind(this)});
        },

        engageSceneTransition: function() {

        },

        createCamp: function() {

        },

        nextLevel: function() {

            if(this.lives == 0) return;
            var s = this.nextWave.play();
            this.nextWave.rate(.8 + .1 * this.level, s);

            if(this.banes)
                this.removeBodies(this.banes);
            if(this.marbles) {
                this.incrementScore(this.marbles.length);
                this.removeBodies(this.marbles);
            }
            this.marbles = [];
            this.banes = [];

            //increment level
            this.level += 1;

            this.createMarine(1);
            this.createMedic(1);
            this.createBane(8);

            // var posUpdate = this.addRunnerCallback(function() {
            //     this.simpleLightShader.uniforms.lightOnePosition = this.medic.position;
            //     this.simpleLightShader.uniforms.lightTwoPosition = this.marine.position;
            // }.bind(this));
            // utils.deathPact(this.medic, posUpdate);


        },

        createMarine: function(number) {
            for(x = 0; x < number; x++) {
                var marine = Marine({team: currentGame.playerTeam, name: 'Shane'});
                marine.typeId = 34;
                marine.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(marine, 4);
                this.addUnit(marine, true);
                //this.marine = marine;
            }
        },

        createMedic: function(number) {
            for(x = 0; x < number; x++) {
                var medic = Medic({team: currentGame.playerTeam, name: 'Ursula'});
                medic.typeId = 35;
                medic.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(medic, 4);
                this.addUnit(medic, true);
                //this.medic = medic;
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
