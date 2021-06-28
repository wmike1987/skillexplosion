import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import Projectile from '@core/Unit/UnitProjectile.js';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/GameUtils.js';

export default function Sentinel(options) {
    var sentinel = {};

    options = options || {};
    $.extend(options, {radius: 25}, options);

    //animation settings
    var runSpeed = 0.9;
    var runSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienN'].spineData);
    var spineSouth = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienS'].spineData);
    var spineWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienW'].spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienW'].spineData);
    var spineSouthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienSW'].spineData);
    var spineSouthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienSW'].spineData);
    var spineNorthWest = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienNW'].spineData);
    var spineNorthEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['alienNW'].spineData);

    var runAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'walk',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'shoot',
            speed: 2,
            times: 3,
        }),
    };

    var otherAnimations = {

    };

    var sc = {x: 0.33, y: 0.33};
    var adjustedUpsc = {x: 0.36, y: 0.36};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: 0.55, y: 0.55},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },
    {
        id: 'selectionPending',
        data: unitUtils.getPendingAnimation(),
        scale: {x: 0.35, y: 0.35},
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
        scale: adjustedUpsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset}
    },
    {
        id: 'down',
        data: spineSouth,
        scale: sc,
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
        scale: {x: 0.55, y: 0.55},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 22}}];

    var fireSound = gameUtils.getSound('sentinelfire.wav', {volume: 0.015, rate: 1});
    var hitSound = gameUtils.getSound('sentinelhit.wav', {volume: 0.05, rate: 2});
    var deathSound = gameUtils.getSound('sentineldeath.wav', {volume: 0.55, rate: 1});

    var unitProperties = $.extend({
        unitType: 'Sentinel',
        health: 35,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 1,
        hitboxWidth: 40,
        hitboxHeight: 60,
        hitboxYOffset: -5,
        portrait: graphicsUtils.createDisplayObject('SentinelPortrait'),
        wireframe: graphicsUtils.createDisplayObject('SentinelGroupPortrait'),
        team: options.team || 4,
        priority: 50,
        experienceWorth: 20,
        name: options.name,
        heightAnimation: 'up',
        idleSpecificAnimation: true,
        abilities: [],
        death: function() {
            var anim = gameUtils.getAnimation({
                spritesheetName: 'SentinelAnimations1',
                animationName: 'sentineldeath',
                speed: 0.22,
                fadeAway: true,
                fadeTime: 8000,
                transform: [this.deathPosition.x + 25, this.deathPosition.y, 1.3, 1.3]
            });
            graphicsUtils.addSomethingToRenderer(anim);
            anim.play();
            deathSound.play();

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: 0.75, y: 0.75}, position: mathArrayUtils.clonePosition(this.deathPosition, {y: 22})});
            graphicsUtils.fadeSpriteOverTime(shadow, 1500);
            graphicsUtils.addSomethingToRenderer(shadow);
            globals.currentGame.removeUnit(this);
            return [shadow, anim];
        }}, options);

    return UC({
            givenUnitObj: sentinel,
            renderChildren: rc,
            radius: options.radius,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [fireSound, hitSound, deathSound, unitProperties.wireframe, unitProperties.portrait],
            unit: unitProperties,
            moveable: {
                moveSpeed: 3.00,
                walkAnimations: runAnimations,
            }, attacker: {
                attackAnimations: attackAnimations,
                cooldown: 1400,
                honeRange: 500,
                range: 440,
                damage: 15,
                itemsEnabled: true,
                attack: function(target) {
                    fireSound.play();
                    var projectileOptions = {
                        damage: this.damage,
                        speed: 5,
                        displayObject: graphicsUtils.createDisplayObject('SentinelBullet'),
                        target: target,
                        impactType: 'collision',
                        owningUnit: this,
                        originOffset: 30,
                        autoSend: true,
                        impactExtension: function(target) {
                            var position = target.getCurrentOrLastStandingPosition();
                            var bloodAnimation = gameUtils.getAnimation({
                                spritesheetName: 'UtilityAnimations1',
                                animationName: 'GenericHit',
                                speed: 0.8,
                                transform: [position.x + Math.random()*8, position.y + Math.random()*8, 0.35, 0.35]
                            });
                            graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                            bloodAnimation.play();
                            hitSound.play();
                        }
                    };
                    var projectile = new Projectile(projectileOptions);
                },
            },
    });
}
