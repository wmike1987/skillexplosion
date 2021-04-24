import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import style from '@utils/Styles.js';
import {globals} from '@core/Fundamental/GlobalState';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function DestructibleBox(options) {
    var box = {};

    options = options || {};
    $.extend(options, {radius: 25}, options);

    var sc = {x: 0.1, y: 0.1};
    var adjustedUpDownsc = {x: 0.1, y: 0.1};
    var flipsc = {x: -1 * sc.x, y: sc.y};
    var yOffset = 22;
    var rc = [
    {
        id: 'selected',
        data: 'IsometricSelected',
        scale: {x: 1, y: 1},
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
        id: 'main',
        data: 'Box',
        rotate: 'none',
        visible: true,
        offset: {x: 3, y: -20},
        sortYOffset: 45,
    }, {
        id: 'shadow',
        data: 'IsoShadowBlurred',
        scale: {x: 1.2, y: 1.2},
        visible: true,
        avoidIsoMgr: true,
        rotate: 'none',
        stage: "stageNTwo",
        offset: {x: 0, y: 20}
    }];

    box.tintMe = function(tint) {
        this.renderlings.main.tint = tint;
    };

    box.untintMe = function() {
        this.renderlings.main.tint = 0xFFFFFF;
    };

    var attackSound = gameUtils.getSound('critterhit.wav', {volume: 0.15, rate: 1});
    var deathSound = gameUtils.getSound('boxexplode.wav', {volume: 0.025, rate: 1.75});

    var unitProperties = $.extend({
        unitType: 'Box',
        health: 30,
        isoManaged: false,
        damage: 0,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        forcedItemDropOffset: {y: 10},
        hitboxWidth: 40,
        hitboxHeight: 40,
        hitboxYOffset: 5,
        itemsEnabled: true,
        portrait: graphicsUtils.createDisplayObject('BoxPortrait'),
        wireframe: graphicsUtils.createDisplayObject('BoxGroupPortrait'),
        team: options.team || 49,
        priority: 50,
        name: options.name,
        // heightAnimation: 'main',
        idleSpecificAnimation: true,
        abilities: [],
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

            var shadow = graphicsUtils.addSomethingToRenderer('IsoShadowBlurred', {where: 'stageNTwo', scale: {x: 0.75, y: 0.75}, position: mathArrayUtils.clonePosition(self.deathPosition, {y: 22})});
            graphicsUtils.fadeSpriteOverTime(shadow, 1500);
            graphicsUtils.addSomethingToRenderer(shadow);
            globals.currentGame.removeUnit(this);
            return [shadow, anim];
        }}, options);

    return UC({
            givenUnitObj: box,
            renderChildren: rc,
            radius: options.radius,
            mass: options.mass || 8,
            mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
            slaves: [attackSound, deathSound, unitProperties.portrait, unitProperties.wireframe],
            unit: unitProperties,
    });
}
