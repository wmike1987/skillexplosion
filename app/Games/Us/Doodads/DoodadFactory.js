import * as $ from 'jquery';
import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    Doodad
} from '@utils/Doodad.js';
import RockPit from '@games/Us/Doodads/RockPit.js';
import EnemyPost1 from '@games/Us/Doodads/EnemyPost1.js';
import EnemyPost2 from '@games/Us/Doodads/EnemyPost2.js';
import SidewaysLog1 from '@games/Us/Doodads/SidewaysLog1.js';
import EnemyTent1 from '@games/Us/Doodads/EnemyTent1.js';
import WaterTrough from '@games/Us/Doodads/WaterTrough.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

var doodadMenu = {
    rockPit: RockPit,
    enemyPost1: EnemyPost1,
    enemyPost2: EnemyPost2,
    sidewaysLog1: SidewaysLog1,
    enemyTent1: EnemyTent1,
    waterTrough: WaterTrough,
};

/*
 * options
 */
var DoodadFactory = {
    createDoodad: function(options) {
        var originalOptions = options;

        //if we're pulling from a menu
        if (options.menuItem) {
            //get the options from the menu
            var menuDoodadOptions = new doodadMenu[options.menuItem](options);
            if(menuDoodadOptions.initialize) {
                menuDoodadOptions.initialize();
            }

            //and remix in the given options (in case of overridden values)
            options = Object.assign(menuDoodadOptions, originalOptions);
        }

        //specify default options
        var defaultOptions = {
            textureName: null,
            radius: 8,
            where: 'stage',
            tint: 0xffffff,
            randomHFlip: false,
            sortYOffset: 0,
            scale: {
                x: 1,
                y: 1
            },
            offset: {
                x: 0,
                y: 0
            },
            shadowScale: {
                x: 1,
                y: 1
            },
            shadowOffset: {
                x: 0,
                y: 0
            }
        };

        //build final options object
        options = Object.assign(defaultOptions, options);

        //create the doodad using the final options object
        var doodad = new Doodad({
            collides: mathArrayUtils.resolveBooleanParam(options.collides),
            autoAdd: false,
            position: options.position,
            radius: options.radius,
            // drawWire: true,
            texture: mathArrayUtils.convertToArray(options.textureName),
            stage: options.where,
            tint: options.tint,
            isSensor: options.isSensor,
            drawWire: options.drawWire,
            randomHFlip: options.randomHFlip,
            animateOnCollision: options.animateOnCollision,
            collisionSound: options.collisionSound,
            shadowIcon: options.shadowIcon,
            shadowAlpha: options.shadowAlpha,
            shadowScale: options.shadowScale,
            shadowOffset: options.shadowOffset,
            anchor: options.anchor,
            scale: options.scale,
            offset: options.offset,
            bodyScale: options.bodyScale,
            sortYOffset: options.sortYOffset,
            loneNZRadius: options.loneNZRadius,
            noShadow: options.noShadow,
            noZone: options.noZone,
        });

        return doodad;
    }
};

export {
    DoodadFactory
};
