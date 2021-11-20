import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import styles from '@utils/Styles.js';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';

export default function Critter(options) {
    var critter = {};

    options = options || {};
    $.extend(options, {radius: 25}, options);

    //animation settings
    var runSpeed = 0.9;
    var runSpeedBonus = 0.25;
    var shootSpeed = 1;

    var spineNorth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterN'].spineData);
    var spineSouth = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterS'].spineData);
    var spineWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterW'].spineData);
    var spineEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterW'].spineData);
    var spineSouthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterSW'].spineData);
    var spineSouthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterSW'].spineData);
    var spineNorthWest = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterNW'].spineData);
    var spineNorthEast = new PIXI.spine.Spine(globals.currentGame.renderer.texturePool['critterNW'].spineData);

    var runAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'run',
            speed: 1.5,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineNorth,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineNorthEast,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineSouthEast,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineSouth,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineSouthWest,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineWest,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineNorthWest,
            animationName: 'attack',
            speed: 2,
            times: 3,
        }),
    };

    var otherAnimations = {

    };

    var sc = {x: 0.1, y: 0.1};
    var adjustedUpDownsc = {x: 0.1, y: 0.1};
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
        scale: {x: 0.55, y: 0.55},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 22}}];

    var attackSound = gameUtils.getSound('critterhit.wav', {volume: 0.15, rate: 1});
    var deathSound = gameUtils.getSound('critterdeath.wav', {volume: 0.08, rate: 1.5});

    // var meText = graphicsUtils.addSomethingToRenderer('TEX+:IsoShadowBlurred', {where: 'stage', style: styles.unitDamageStyle, position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter(), {y: 22})});

    var unitProperties = $.extend({
        unitType: 'Critter',
        health: 20,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        hitboxWidth: 40,
        hitboxHeight: 40,
        hitboxYOffset: 5,
        buffYOffset: 40,
        itemsEnabled: true,
        portrait: graphicsUtils.createDisplayObject('CritterPortrait'),
        wireframe: graphicsUtils.createDisplayObject('CritterGroupPortrait'),
        team: options.team || 4,
        priority: 50,
        name: options.name,
        heightAnimation: 'up',
        idleSpecificAnimation: true,
        abilities: [],
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'CritterAnimations1',
                animationName: 'critterdeath',
                speed: 0.25,
                fadeAway: true,
                fadeTime: globals.currentGame.unitCorpseTime,
                transform: [self.deathPosition.x, self.deathPosition.y, 1.1, 1.1]
            });
            if(mathArrayUtils.flipCoin()) {
                anim.scale.x *= -1;
            }
            graphicsUtils.addSomethingToRenderer(anim);
            anim.play();
            deathSound.play();

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: 0.75, y: 0.75}, position: mathArrayUtils.clonePosition(self.deathPosition, {y: 22})});
            graphicsUtils.fadeSpriteOverTimeLegacy(shadow, globals.currentGame.unitCorpseTime);
            graphicsUtils.addSomethingToRenderer(shadow);
            globals.currentGame.removeUnit(this);
            return [shadow, anim];
        }}, options);

    return UC({
            givenUnitObj: critter,
            renderChildren: rc,
            radius: options.radius,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [attackSound, /*meText,*/ deathSound, unitProperties.portrait, unitProperties.wireframe],
            unit: unitProperties,
            moveable: {
                moveSpeed: 3.00,
                walkAnimations: runAnimations,
            }, attacker: {
                attackAnimations: attackAnimations,
                cooldown: 650,
                honeRange: 300,
                isMelee: true,
                range: options.radius*2+10,
                damage: 6,
                attackExtension: function(target) {
                    var bloodAnimation = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'GenericHit',
                        speed: 1.0,
                        transform: [target.position.x + Math.random()*8, target.position.y + Math.random()*8, 0.25, 0.25]
                    });
                    graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                    bloodAnimation.play();
                    attackSound.play();
                },
            },
    });
}
