define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker',
'units/Marine', 'units/Baneling', 'pixi-filters', 'utils/GameUtils', 'units/Medic', 'shaders/SimpleLightFragmentShader',
'utils/TileMapper', 'utils/Doodad'],
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Marine, Baneling, filters, utils, Medic, lightShader, TileMapper, Doodad) {

    var targetScore = 1;

    var blueGlowShader = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform vec2 unitStart;
        uniform vec2 currentUnitPosition;

        void main()
        {
           vec4 fg = texture2D(uSampler, vTextureCoord);
           if(fg.a > 0.0) {
            gl_FragColor.r = 1.0;

            if(currentUnitPosition.x < unitStart.x) {
                gl_FragColor.b = 0.0;
            } else {
                gl_FragColor.b = 1.0;
            }
           }
        }
    `;

    var game = {
        gameName: 'Us',
        extraLarge: 32,
        large: 18,
        medium: 16,
        small: 8,
        zoneSize: 128,
        level: 1,
        // victoryCondition: {type: 'timed', limit: 5},
        victoryCondition: {type: 'lives', limit: 5},
        enableUnitSystem: true,
        currentZones: [],
        selectionBox: true,
        noClickIndicator: true,
        acceptableTints: [/*blue*/ 0x009BFF, /*green*/0xCBCBCB /*red0xFF2300 0xFFFFFF*/, /*purple*/0xCC00BA, /*yellow*/0xCFD511],
        highlightTints: [/*blue*/ 0x43FCFF, /*green*/0xFFFFFF /*red0xFF2300 0xFFFFFF*/, /*purple*/0xFFB8F3, /*yellow*/0xFBFF00],
        selectionTint: 0x33FF45,
        pendingSelectionTint: 0x70ff32,
        previousListener: null,
        baneSpeed: 2.0,

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
            var grassColor = 'Teal';
            var backgroundTiles = [];
            for(var x = 0; x < 6; x++) {
                backgroundTiles.push(grassColor + 'Grass' + (x+1));
            }
            //backgroundTiles = ['YellowGrass1','TealGrass1','GreenGrass1','RedGrass1', 'OrangeGrass1']
            var tileMap = TileMapper.produceTileMap({possibleTextures: backgroundTiles, tileWidth: 180, realTileWidth: 370});
            tileMap.initialize({where: 'background'});

            //create some Doodads
            var tree1 = new Doodad({collides: true, radius: 20, texture: 'avgoldtree1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: -75}, sortYOffset: 75,
                                    shadowScale: {x: 2, y: 2}, shadowOffset: {x: -6, y: 20}})




            utils.addAmbientLightsToBackground([0x660000, 0x00cc44, 0x660066, 0x00cc44, 0x660000, 0x660000, 0x4d79ff], null, .3);

        },

        play: function(options) {
            this.nextLevel();

            var tree1 = new Doodad({drawWire: true, collides: true, radius: 20, texture: 'avsnowtree1', stage: 'stage', scale: {x: .6, y: .6}, offset: {x: 0, y: -50}, sortYOffset: 75, shadowScale: {x: 2, y: 2}, shadowOffset: {x: -6, y: 20}})

            var tree1 = new Doodad({drawWire: false, collides: true, radius: 20, texture: 'avsnowtree7', stage: 'stage', scale: {x: 1, y: 1}, offset: {x: -6, y: -55}, sortYOffset: 75, shadowScale: {x: 2, y: 2}, shadowOffset: {x: 2, y: 28}})

            this.addTimer({name: 'newbane', gogogo: true, timeLimit: 4000, callback: function() {

            }.bind(this)});
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
            //start increasing speed if we've got lots of units on the map
            var levelCap = 18;
            if(this.level < levelCap) {
                this.baneSpeed = Math.min(2.5, this.baneSpeed+.05);
                var numberOfDrones = 3 + this.level * 2; //add two drones per level
                var numberOfBanes = Math.floor(numberOfDrones*.75); // three fourths-ish
            } else {
                this.baneSpeed = Math.min(3.2, this.baneSpeed+.03);
                var numberOfDrones = 3 + levelCap * 2; //add two drones per level
                var numberOfBanes = Math.floor(numberOfDrones*.75); // three fourths-ish
            }

            this.createMarine(4);
            this.createMedic(1);
            this.createBane(4);
            var posUpdate = this.addRunnerCallback(function() {
                this.simpleLightShader.uniforms.lightOnePosition = this.medic.position;
                this.simpleLightShader.uniforms.lightTwoPosition = this.marine.position;
            }.bind(this));
            utils.deathPact(this.medic, posUpdate);
        },

        createMarine: function(number) {
            for(x = 0; x < number; x++) {
                var marine = Marine({team: currentGame.playerTeam});
                marine.typeId = 34;
                marine.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(marine, 4);
                this.addUnit(marine, true);
                this.marine = marine;
            }
        },

        createMedic: function(number) {
            for(x = 0; x < number; x++) {
                var medic = Medic({team: currentGame.playerTeam});
                medic.typeId = 35;
                medic.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(medic, 4);
                this.addUnit(medic, true);
                this.medic = medic;
            }
        },

        createBane: function(number) {
            for(x = 0; x < number; x++) {
                //var tint = x%2==0 ? 0xff0000 : null;
                var bane = Baneling({team: 4, isSelectable: false});
                utils.placeBodyWithinRadiusAroundCanvasCenter(bane, 4);

    //          this.blueGlowFilter.uniforms.unitStart = {x: marble.position.x, y: marble.position.y};
              //  this.addTickCallback(function() {
              //      this.blueGlowFilter.uniforms.currentUnitPosition = {x: marble.position.x, y: marble.position.y};
              //  }.bind(this))

                if(utils.flipCoin()) {
                    Matter.Body.setPosition(bane.body, {x: Math.random() * 100, y: utils.getCanvasCenter().y + Math.random() * 600 - 300});
                } else {
                    Matter.Body.setPosition(bane.body, {x: utils.getCanvasWidth() - Math.random() * 100, y: utils.getCanvasCenter().y + Math.random() * 600 - 300});
                }

                this.addUnit(bane, true);
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
                height: 600,
                gravity: 0,
               };

    //game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

    return $.extend({}, CommonGameMixin, game);
})
