import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import style from '@utils/Styles.js';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';

var attackSound = gameUtils.getSound('critterhit.wav', {volume: 0.10, rate: 2});
var deathSound = gameUtils.getSound('boxexplode.wav', {volume: 0.025, rate: 1.75});

export default function DamageFlySwarm(options) {
    var flies = {};

    options = options || {};
    $.extend(options, {radius: 22}, options);

    var randomFlyNumber = mathArrayUtils.getRandomIntInclusive(1, 10);

    var flyAnim = gameUtils.getAnimation({
        spritesheetName: 'FlySwarmAnimations',
        animationName: 'Swarm_' + randomFlyNumber,
        speed: 0.3 + Math.random() * 0.1,
        loop: true,
    });

    flyAnim.tint = 0x360809;
    flyAnim.originalTint = flyAnim.tint;
    flyAnim.originalSpeed = flyAnim.animationSpeed;

    flies.tintMe = function(tint) {
        flyAnim.tint = tint;
    };

    flies.untintMe = function() {
        flyAnim.tint = flyAnim.originalTint;
    };

    var sc = {x: 0.1, y: 0.1};
    var adjustedUpDownsc = {x: 0.1, y: 0.1};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: 1.1, y: 1.1},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },
    {
        id: 'selectionPending',
        data: unitUtils.getPendingAnimation(),
        scale: {x: 0.6, y: 0.6},
        stage: 'stageNOne',
        visible: false,
        avoidIsoMgr: true,
        rotate: 'none',
        offset: {x: 0, y: 22},
    },{
        id: 'main',
        data: flyAnim,
        stage: 'stageOne',
        rotate: 'none',
        visible: true,
        offset: {x: 0, y: 0},
        sortYOffset: 0,
    }, {
        id: 'shadow',
        data: 'IsoShadowBlurred',
        scale: {x: 1.2, y: 1.2},
        alpha: 0.2,
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 20}
    }];

    var unitProperties = $.extend({
        unitType: 'DamageFlies',
        health: 1000,
        isoManaged: false,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        forcedItemDropOffset: {y: 10},
        hitboxWidth: 50,
        hitboxHeight: 50,
        hitboxYOffset: 5,
        itemsEnabled: true,
        disregardItemBuffs: true,
        // isSelectable: false,
        // isTargetable: false,
        organic: true,
        flying: true,
        portrait: graphicsUtils.createDisplayObject('BoxPortrait'),
        wireframe: graphicsUtils.createDisplayObject('BoxGroupPortrait'),
        team: options.team || 49,
        priority: 50,
        name: options.name,
        // heightAnimation: 'main',
        idleSpecificAnimation: true,
        abilities: [],
        _init: function() {
            Matter.Sleeping.set(this.body, true);
        },
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'UtilityAnimations3',
                animationName: 'BoxExplode',
                speed: 0.3,
                fadeAway: true,
                fadeTime: 8000,
                transform: [self.deathPosition.x+3, self.deathPosition.y-20, 1.0, 1.0]
            });
            graphicsUtils.addSomethingToRenderer(anim);
            anim.play();
            deathSound.play();

            globals.currentGame.removeUnit(this);
            return [anim];
        },
        _afterAddInit: function() {
            this.honeRange = 60;
            this.moveSpeed = 1.0 + Math.random() * 0.5;
            var currentPosition = this.position;

            var attackPosX = Math.random() * gameUtils.getPlayableWidth();
            var attackPosY = Math.random() * gameUtils.getPlayableHeight();
            var amPosition = {x: attackPosX, y: attackPosY};
            amPosition = mathArrayUtils.addScalarToVectorTowardDestination(currentPosition, amPosition, 9999);

            this.attackMove(amPosition);
            flyAnim.play();
            unitUtils.createUnitRanOffStageListener(this, function() {
                globals.currentGame.removeUnit(this);
            }.bind(this));
        }}, options);

    return UC({
            givenUnitObj: flies,
            renderChildren: rc,
            radius: options.radius,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [/*attackSound, deathSound,*/ unitProperties.portrait, unitProperties.wireframe],
            unit: unitProperties,
            moveable: {
                moveSpeed: 2.0,
                canStop: false,
            },
            attacker: {
                cooldown: 200,
                honeRange: 60,
                range: 60,
                isMelee: true,
                damage: 2,
                attackExtension: function(target) {
                    var bloodAnimation = gameUtils.getAnimation({
                        spritesheetName: 'UtilityAnimations1',
                        animationName: 'GenericHit',
                        speed: 1.0,
                        transform: [target.position.x + Math.random()*8, target.position.y + Math.random()*8, 0.25, 0.25]
                    });
                    graphicsUtils.addSomethingToRenderer(bloodAnimation, 'foreground');
                    flyAnim.animationSpeed = 0.5;
                    bloodAnimation.play();
                    attackSound.play();
                },
                loseTargetExtension: function() {
                    flyAnim.animationSpeed = flyAnim.originalSpeed;
                }
            },
    });
}
