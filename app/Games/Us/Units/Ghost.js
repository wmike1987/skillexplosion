import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import UC from '@core/Unit/UnitConstructor.js'
import aug from '@core/Unit/_Unlocker.js'
import Ability from '@core/Unit/UnitAbility.js'
import style from '@utils/Styles.js'
import {globals} from '@core/Fundamental/GlobalState'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default function Ghost(options) {
    var ghost = {};

    var options = options || {};
    $.extend(options, {radius: 25}, options)

    //animation settings
    var runSpeed = .9;
    var runSpeedBonus = .25;
    var shootSpeed = 1;

    //The ghost character has all its spine data in one sheet, but we need two instances of it in order to scale it
    //for East (-1 scale) and West direction.
    var spineAll = new PIXI.spine.Spine(PIXI.Loader.shared.resources['apparitionAll'].spineData);
    var spineEast = new PIXI.spine.Spine(PIXI.Loader.shared.resources['apparitionAll'].spineData);

    var runSpeed = 1.3;
    var runAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'walk_N',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk_NW',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk_W',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'walk_SW',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'walk_S',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'walk_SW',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'walk_W',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'walk_NW',
            speed: runSpeed,
            loop: true,
            canInterruptSelf: false
        }),
    };

    var attackSpeed = 2;
    var attackAnimations = {
        up: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'attack_N',
            speed: attackSpeed,
            times: 1,
        }),
        upRight: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'attack_NW',
            speed: attackSpeed,
            times: 1,
        }),
        right: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'attack_W',
            speed: attackSpeed,
            times: 1,
        }),
        downRight: gameUtils.getSpineAnimation({
            spine: spineEast,
            animationName: 'attack_SW',
            speed: attackSpeed,
            times: 1,
        }),
        down: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'attack_S',
            speed: attackSpeed,
            times: 1,
        }),
        downLeft: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'attack_SW',
            speed: attackSpeed,
            times: 1,
        }),
        left: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'attack_W',
            speed: attackSpeed,
            times: 1,
        }),
        upLeft: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'attack_NW',
            speed: attackSpeed,
            times: 1,
        }),
    }

    var deathAnimations = {
        south: gameUtils.getSpineAnimation({
            spine: spineAll,
            animationName: 'Death',
            speed: attackSpeed,
            times: 1,
            listeners: {name: 'complete', f: function(entry) {
                if(entry.animation.name == 'Death') {
                    globals.currentGame.removeUnit(ghost);
                }
            }}
        }),
    }

    var sc = {x: .48, y: .48};
    var adjustedUpDownsc = {x: .5, y: .5};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 10;
    var nwswyOffset = 25;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: .9, y: .9},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },
    {
        id: 'selectionPending',
        data: 'IsometricSelectedPending',
        scale: {x: 1.1, y: 1.1},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },{
        id: 'left',
        data: spineAll,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset+14},
    },{
        id: 'right',
        data: spineEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset+14}
    },
    {
        id: 'up',
        data: spineAll,
        scale: adjustedUpDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset+14}
    },
    {
        id: 'down',
        data: spineAll,
        scale: adjustedUpDownsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: yOffset+14}
    },
    {
        id: 'upLeft',
        data: spineAll,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: nwswyOffset}
    },
    {
        id: 'upRight',
        data: spineEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: nwswyOffset}
    },
    {
        id: 'downRight',
        data: spineEast,
        scale: flipsc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: nwswyOffset}
    }, {
        id: 'downLeft',
        data: spineAll,
        scale: sc,
        rotate: 'none',
        visible: false,
        offset: {x: 0, y: nwswyOffset}
    },{
        id: 'shadow',
        data: 'IsoShadowBlurred',
        scale: {x: .8, y: .8},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 22}}];

    var attackSound = gameUtils.getSound('ghostattack.wav', {volume: .15, rate: .8});
    var deathSound = gameUtils.getSound('ghostdeathsound.wav', {volume: .1, rate: 1.0});

    var unitProperties = $.extend({
        unitType: 'Ghost',
        health: 20,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        hitboxWidth: 40,
        hitboxHeight: 40,
        hitboxYOffset: 5,
        itemsEnabled: true,
        deathAnimations: deathAnimations,
        portrait: graphicsUtils.createDisplayObject('CritterPortrait'),
        wireframe: graphicsUtils.createDisplayObject('CritterGroupPortrait'),
        team: options.team || 4,
        priority: 50,
        name: options.name,
        heightAnimation: 'up',
        idleSpecificAnimation: true,
        abilities: [],
        death: function() {
            this.nullify();
            this.isoManager.playSpecifiedAnimation('death', 'south', {force: true});
            deathSound.play();
        },
        _afterAddInit: function() {
            $.each(this.body.renderlings, function(key, renderling) {
                if(renderling.skeleton) {
                    $.each(renderling.skeleton.slots, function(i, slot) {
                        if(slot.currentMesh) {
                            if(slot.currentMeshName.includes('Attack_effect'))
                            {
                                slot.customColor = {r: 1.0, g: 1.0, b: 0.0, a: 1.0};
                                slot.customPreserveAlpha = true;
                            }
                        }
                    })
                }
            });
        },
    }, options);

    return UC({
            givenUnitObj: ghost,
            renderChildren: rc,
            radius: options.radius,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [attackSound, deathSound, unitProperties.portrait, unitProperties.wireframe],
            unit: unitProperties,
            moveable: {
                moveSpeed: 3.00,
                walkAnimations: runAnimations,
            }, attacker: {
                attackAnimations: attackAnimations,
                cooldown: 1200,
                honeRange: 300,
                range: options.radius*2+10,
                damage: 6,
                attackExtension: function(target) {
                    var self = this;
                    var attackDelay = 200;
                    gameUtils.doSomethingAfterDuration(function() {
                        if(self.isAttacking) {
                            var bloodAnimation = gameUtils.getAnimation({
                                spritesheetName: 'UtilityAnimations1',
                                animationName: 'GenericHit',
                                speed: 1.0,
                                transform: [target.position.x + Math.random()*8, target.position.y + Math.random()*8, .5, .5]
                            });
                            graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                            bloodAnimation.play();
                            attackSound.play();
                        }
                    }, attackDelay);
                    return {delay: attackDelay};
                },
            },
    });
}
