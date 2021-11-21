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
import SidewaysLog1 from '@games/Us/Doodads/SidewaysLog1.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

var doodadMenu = {
    rockPit: RockPit,
    enemyPost1: EnemyPost1,
    sidewaysLog1: SidewaysLog1
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
            options = doodadMenu[options.menuItem];
            if(options.initialize) {
                options.initialize();
            }

            //and remix in the given options (in case of overridden values)
            options = Object.assign(options, originalOptions);
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

        //create the doodad
        var doodad = new Doodad({
            collides: mathArrayUtils.resolveBooleanParam(options.collides),
            autoAdd: false,
            position: mathArrayUtils.cloneVector(options.position),
            radius: options.radius,
            // drawWire: true,
            texture: mathArrayUtils.convertToArray(options.textureName),
            stage: options.where,
            tint: options.tint,
            randomHFlip: options.randomHFlip,
            shadowIcon: options.shadowIcon,
            shadowAlpha: options.shadowAlpha,
            shadowScale: mathArrayUtils.cloneVector(options.shadowScale),
            shadowOffset: mathArrayUtils.cloneVector(options.shadowOffset),
            scale: mathArrayUtils.cloneVector(options.scale),
            offset: mathArrayUtils.cloneVector(options.offset),
            bodyScale: mathArrayUtils.cloneVector(options.bodyScale),
            sortYOffset: options.sortYOffset,
            loneNZRadius: options.loneNZRadius,
            noShadow: options.noShadow,
        });

        return doodad;
    }
};

export {
    DoodadFactory
};
