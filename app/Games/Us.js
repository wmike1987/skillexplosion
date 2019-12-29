define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker',
'units/Gunner', 'units/Baneling', 'pixi-filters', 'utils/GameUtils'],
function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Gunner, Baneling, filters, utils) {

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
        victoryCondition: {type: 'lives', limit: 95},
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
            //this.blueGlowFilter = new PIXI.Filter(null, blueGlowShader)
        },

        play: function(options) {
            this.nextLevel();

            this.addTimer({name: 'newbane', gogogo: true, timeLimit: 4000, callback: function() {
//                this.createBane(15);
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

            this.createGunner(5);
            this.createBane(5);

            // var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineNW'].spineData);
            // var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineN'].spineData);
            // spineNorthWest.state.setAnimation(0, 'walk', true);
            // spineNorth.state.setAnimation(0, 'walk', true);
            // utils.addSomethingToRenderer(spineNorthWest, {position: {x: this.getCanvasCenter().x, y: this.getCanvasHeight()}, scale: {x: .5, y: .5}})
            // utils.addSomethingToRenderer(spineNorth, {position: {x: this.getCanvasCenter().x + 50, y: this.getCanvasHeight()}, scale: {x: .55, y: .55}})
        },

        createGunner: function(number) {
            for(x = 0; x < number; x++) {
                var gunner = Gunner();
                gunner.typeId = 34;
                gunner.directional = true;
                utils.placeBodyWithinRadiusAroundCanvasCenter(gunner, 4);

    //          this.blueGlowFilter.uniforms.unitStart = {x: marble.position.x, y: marble.position.y};
              //  this.addTickCallback(function() {
              //      this.blueGlowFilter.uniforms.currentUnitPosition = {x: marble.position.x, y: marble.position.y};
              //  }.bind(this))

                this.addUnit(gunner, true);
            }
        },

        createBane: function(number) {
            for(x = 0; x < number; x++) {
                var bane = Baneling({team: 2, isSelectable: false});
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
            background: {image: 'Grass', scale: {x: 1.0, y: 1.0}},
                width: 1200,
                height: 600,
                gravity: 0,
               };

    //game.instructions = ['Split the purple marbles to avoid area of effect damage', 'If all purple marbles die, you lose a life'];

    return $.extend({}, CommonGameMixin, game);
})
