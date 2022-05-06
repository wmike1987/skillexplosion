import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import UC from '@core/Unit/UnitConstructor.js';
import aug from '@core/Unit/_Unlocker.js';
import Ability from '@core/Unit/UnitAbility.js';
import style from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

var attackSound = gameUtils.getSound('critterhit.wav', {
    volume: 0.15,
    rate: 1
});
var deathSound = gameUtils.getSound('boxexplode.wav', {
    volume: 0.025,
    rate: 1.75
});

export default function DestructibleBox(options) {
    var box = {};

    options = options || {};
    $.extend(options, {
        radius: 20
    }, options);

    var sc = {
        x: 0.1,
        y: 0.1
    };
    var adjustedUpDownsc = {
        x: 0.1,
        y: 0.1
    };
    var flipsc = {
        x: -1 * sc.x,
        y: sc.y
    };
    var yOffset = 22;
    var rc = [{
            id: 'selected',
            data: 'IsometricSelectedSmall',
            scale: {
                x: 1.6,
                y: 1.76
            },
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {
                x: 0,
                y: 22
            },
        },
        {
            id: 'selectionPending',
            data: unitUtils.getPendingAnimation(),
            scale: {
                x: 0.5,
                y: 0.59
            },
            stage: 'stageNOne',
            visible: false,
            avoidIsoMgr: true,
            rotate: 'none',
            offset: {
                x: 0,
                y: 22
            },
        }, {
            id: 'main',
            data: options.special ? 'GoldBox' : 'Box',
            rotate: 'none',
            visible: true,
            offset: {
                x: 3,
                y: -20
            },
            sortYOffset: 45,
        }, {
            id: 'shadow',
            data: 'IsoShadowBlurredSmall',
            scale: {
                x: 1.6,
                y: 1.76
            },
            visible: true,
            avoidIsoMgr: true,
            rotate: 'none',
            stage: "stageNTwo",
            offset: {
                x: 0,
                y: 20
            }
        }
    ];

    box.tintMe = function(tint) {
        this.renderlings.main.tint = tint;
    };

    box.untintMe = function() {
        this.renderlings.main.tint = 0xFFFFFF;
    };

    var unitProperties = $.extend({
        unitType: 'Box',
        health: 15,
        isoManaged: false,
        damage: 0,
        defense: 1,
        energy: 0,
        energyRegenerationRate: 0,
        experienceWorth: 20,
        forcedItemDropOffset: {
            y: 10
        },
        hitboxWidth: 50,
        hitboxHeight: 50,
        hitboxYOffset: 5,
        itemsEnabled: true,
        disregardItemBuffs: true,
        organic: false,
        drawWire: true,
        portrait: graphicsUtils.createDisplayObject('BoxPortrait'),
        wireframe: graphicsUtils.createDisplayObject('BoxGroupPortrait'),
        team: options.team || 49,
        priority: 50,
        name: options.name,
        // heightAnimation: 'main',
        idleSpecificAnimation: true,
        abilities: [],
        _init: function() {
            this.setSleep(true);
        },
        death: function() {
            var self = this;
            var anim = gameUtils.getAnimation({
                spritesheetName: 'UtilityAnimations3',
                animationName: 'BoxExplode',
                speed: 0.3,
                fadeAway: true,
                fadeTime: 8000,
                transform: [self.deathPosition.x + 3, self.deathPosition.y - 20, 1.0, 1.0]
            });
            graphicsUtils.addSomethingToRenderer(anim);
            anim.play();
            deathSound.play();

            globals.currentGame.removeUnit(this);
            return [anim];
        }
    }, options);

    return UC({
        givenUnitObj: box,
        renderChildren: rc,
        radius: options.radius,
        mass: options.mass || 8,
        mainRenderSprite: ['left', 'right', 'up', 'down', 'upRight', 'upLeft', 'downRight', 'downLeft'],
        slaves: [ /*attackSound, deathSound,*/ unitProperties.portrait, unitProperties.wireframe],
        unit: unitProperties,
    });
}
