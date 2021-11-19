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
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';

var doodadMenu = {
    rockPit: RockPit
};

/*
 * options
 */
var DoodadFactory = {
    createDoodad: function(options) {
        var originalOptions = options;
        if (options.menuItem) {
            options = doodadMenu[options.menuItem];
            if(options.initialize) {
                options.initialize();
            }

            options = Object.assign(options, originalOptions);
        }

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
            }
        };
        options = Object.assign(defaultOptions, options);

        var doodad = new Doodad({
            collides: true,
            autoAdd: false,
            position: options.position,
            radius: options.radius,
            // drawWire: true,
            texture: mathArrayUtils.convertToArray(options.textureName),
            stage: options.where,
            tint: options.tint,
            randomHFlip: options.randomHFlip,
            scale: options.scale,
            offset: options.offset,
            bodyScale: options.bodyScale,
            sortYOffset: options.sortYOffset,
            noShadow: true,
        });

        return doodad;
    }
};

export {
    DoodadFactory
};
