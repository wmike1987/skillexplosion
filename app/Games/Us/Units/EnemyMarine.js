import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import UC from '@core/Unit/UnitConstructor.js'
import aug from '@core/Unit/_Augmentable.js'
import Ability from '@core/Unit/UnitAbility.js'
import style from '@utils/Styles.js'
import {globals} from '@core/GlobalState'
import utils from '@utils/GameUtils.js'

export default function EnemyMarine(options) {
    var marine = {};

    var options = options || {};

    //animation settings
    var walkSpeed = .9;
    var walkSpeedBonus = .25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineN'].spineData);
    var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineS'].spineData);
    var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineW'].spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineW'].spineData);
    var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineSW'].spineData);
    var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineSW'].spineData);
    var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineNW'].spineData);
    var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['marineNW'].spineData);

    var walkAnimations = {
        up: utils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: utils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        right: utils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: utils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        down: utils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: utils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        left: utils.getSpineAnimation({
            spine: spineWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: utils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackAnimations = {
        up: utils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        upRight: utils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        right: utils.getSpineAnimation({
            spine: spineEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        downRight: utils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        down: utils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        downLeft: utils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        left: utils.getSpineAnimation({
            spine: spineWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        upLeft: utils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
    }

    var otherAnimations = {

    }

    var sc = {x: .35, y: .35};
    var adjustedUpDownsc = {x: .38, y: .38};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: .8, y: .8},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },
    {
        id: 'selectionPending',
        data: 'IsometricSelectedPending',
        scale: {x: 1, y: 1},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },{
        id: 'left',
        data: spineWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset},
    },{
        id: 'right',
        data: spineEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'up',
        data: spineNorth,
        scale: adjustedUpDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'down',
        data: spineSouth,
        scale: adjustedUpDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'upLeft',
        data: spineNorthWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'upRight',
        data: spineNorthEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'downRight',
        data: spineSouthEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    }, {
        id: 'downLeft',
        data: spineSouthWest,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },{
        id: 'shadow',
        data: 'IsoShadowBlurred',
        scale: {x: .75, y: .75},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 22}}];

    var fireSound = utils.getSound('machinegun.wav', {volume: .002, rate: 3});

    var unitProperties = $.extend({
        unitType: 'Marine',
        health: 50,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 1,
        hitboxWidth: 35,
        hitboxHeight: 60,
        itemsEnabled: true,
        portrait: utils.createDisplayObject('MarineRedHat'),
        wireframe: utils.createDisplayObject('MarineRedHat'),
        team: options.team || 4,
        priority: 50,
        name: options.name,
        heightAnimation: 'up',
        abilities: [],
        death: function() {
            var self = this;
            var anim = utils.getAnimationB({
                spritesheetName: 'BaseUnitAnimations1',
                animationName: 'bloodsplat',
                speed: .3,
                transform: [self.position.x, self.position.y, .3, .3]
            });
            utils.addSomethingToRenderer(anim);
            anim.play();
            globals.currentGame.removeUnit(this);
        }}, options);

    return UC({
            givenUnitObj: marine,
            renderChildren: rc,
            radius: options.radius || 25,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [fireSound],
            unit: unitProperties,
            moveable: {
                moveSpeed: 2.00,
                walkAnimations: walkAnimations,
                smallerBodyHeightChange: true,
            }, attacker: {
                attackAnimations: attackAnimations,
                cooldown: 650,
                honeRange: 300,
                range: 180,
                damage: 12,
                attackExtension: function(target) {
                    fireSound.play();

                    //bullet emitter
                    var emitter = utils.createParticleEmitter({where: globals.currentGame.renderer.stages.stage,
                        config: {
                        	"alpha": {
                        		"start": 1,
                        		"end": 1
                        	},
                        	"scale": {
                        		"start": .3,
                        		"end": .2,
                        		"minimumScaleMultiplier": 1
                        	},
                        	"color": {
                        		"start": "#ffd21f",
                        		"end": "#fff23d"
                        	},
                        	"speed": {
                        		"start": 200,
                        		"end": 200,
                        		"minimumSpeedMultiplier": 1
                        	},
                        	"acceleration": {
                        		"x": 0,
                        		"y": 0
                        	},
                        	"maxSpeed": 0,
                        	"startRotation": {
                        		"min": 0,
                        		"max": 360
                        	},
                        	"noRotation": false,
                        	"rotationSpeed": {
                        		"min": 0,
                        		"max": 0
                        	},
                        	"lifetime": {
                        		"min": 0.02,
                        		"max": 0.02
                        	},
                        	"blendMode": "normal",
                        	"frequency": .3/3,
                        	"emitterLifetime": .3,
                        	"maxParticles": 3,
                        	"pos": {
                        		"x": 0,
                        		"y": 0
                        	},
                        	"addAtBack": false,
                        	"spawnType": "circle",
                        	"spawnCircle": {
                        		"x": 0,
                        		"y": 0,
                        		"r": 8
                        	}
                    }, texture: PIXI.Texture.fromImage('Textures/bulletParticle.png')})
                    emitter.updateSpawnPos(target.position.x, target.position.y);
                    emitter.playOnceAndDestroy();

                    //blood emitter
                    var bloodEmitter = utils.createParticleEmitter({where: globals.currentGame.renderer.stages.stage,
                        config: {
                    	"alpha": {
                    		"start": 1,
                    		"end": 1
                    	},
                    	"scale": {
                    		"start": 0.1,
                    		"end": 0.01,
                    		"minimumScaleMultiplier": 1
                    	},
                    	"color": {
                    		"start": "#ff0000",
                    		"end": "#ff0000"
                    	},
                    	"speed": {
                    		"start": 0,
                    		"end": 0,
                    		"minimumSpeedMultiplier": 1
                    	},
                    	"acceleration": {
                    		"x": 0,
                    		"y": 1800
                    	},
                    	"maxSpeed": 0,
                    	"startRotation": {
                    		"min": 0,
                    		"max": 0
                    	},
                    	"noRotation": false,
                    	"rotationSpeed": {
                    		"min": 0,
                    		"max": 0
                    	},
                    	"lifetime": {
                    		"min": 0.25,
                    		"max": 0.3
                    	},
                    	"blendMode": "normal",
                    	"frequency": 0.01,
                    	"emitterLifetime": 0.2,
                    	"maxParticles": 2,
                    	"pos": {
                    		"x": 0,
                    		"y": 0
                    	},
                    	"addAtBack": false,
                    	"spawnType": "circle",
                    	"spawnCircle": {
                    		"x": 0,
                    		"y": 0,
                    		"r": 20
                    	}
                    }, texture: PIXI.Texture.fromImage('Textures/particle.png')});
                    bloodEmitter.updateSpawnPos(target.position.x, target.position.y);
                    bloodEmitter.playOnceAndDestroy();
                },
            },
    });
}
