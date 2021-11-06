import * as $ from 'jquery';
import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import {
    CommonGameMixin
} from '@core/Fundamental/CommonGameMixin.js';
import {
    globals,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import {
    Doodad
} from '@utils/Doodad.js';
import Scene from '@core/Scene.js';

/* options
 * start {x: , y: }
 * width, height
 * density (0-1)
 * possibleTrees []
 */
var sceneryUtils = {
    fillAreaWithTrees: function(options) {
        var trees = [];
        for (var x = options.start.x; x < options.start.x + options.width; x += (220 - options.density * 200)) {
            for (var y = options.start.y; y < options.start.y + options.height; y += (220 - options.density * 200)) {
                var tree = new Doodad({
                    collides: true,
                    autoAdd: false,
                    radius: 120,
                    texture: 'Doodads/' + mathArrayUtils.getRandomElementOfArray(options.possibleTrees),
                    stage: 'stageTrees',
                    scale: {
                        x: 1.1,
                        y: 1.1
                    },
                    offset: {
                        x: 0,
                        y: -75
                    },
                    sortYOffset: 75,
                    shadowIcon: 'IsoTreeShadow1',
                    shadowScale: {
                        x: 4,
                        y: 4
                    },
                    shadowOffset: {
                        x: -6,
                        y: 20
                    },
                    position: {
                        x: x + (Math.random() * 200 - 50),
                        y: y + (Math.random() * 300 - 40)
                    }
                });
                trees.push(tree);
            }
        }
        return trees;
    },

    createRock: function(options) {
        options = Object.assign({
            where: 'stage'
        }, options);
        var possibleRocks = ['Rock1', 'Rock3', 'Rock4'];
        var decorRocks = ['Rock2', 'Rock5'];

        possibleRocks = possibleRocks.concat(decorRocks);
        if(options.names) {
            possibleRocks = options.names;
        }
        var rockDetails = {
            Rock1: {
                radius: 5
            },
            Rock3: {
                radius: 12,
                offset: {x: 4, y: 0}
            },
            Rock4: {
                scale: {x: 1.5, y: 1.5},
                radius: 5
            },
            Rock2: {
                collides: false
            },
            Rock5: {
                textureName: 'Rock1',
                collides: false,
                scale: {x: 0.35, y: 0.35}
            }
        };
        var randomRockName = mathArrayUtils.getRandomElementOfArray(possibleRocks);

        //mixin the default options
        var myDetails = Object.assign({
            collides: true,
            offset: {x: 0, y: 0},
            scale: {x: 1, y: 1},
            textureName: randomRockName
        }, rockDetails[randomRockName]);
        var rock = new Doodad({
            collides: myDetails.collides,
            autoAdd: false,
            radius: myDetails.radius || 1,
            // drawWire: true,
            texture: 'Doodads/' + myDetails.textureName,
            stage: options.where,
            tint: options.tint,
            scale: myDetails.scale,
            offset: myDetails.offset,
            sortYOffset: 0,
            shadowIcon: 'IsoTreeShadow1',
            shadowScale: {
                x: 0,
                y: 0
            },
            shadowOffset: {
                x: -6,
                y: 20
            },
            // position: {
            //     x: x + (Math.random() * 200 - 50),
            //     y: y + (Math.random() * 300 - 40)
            // }
        });

        return rock;
    }
};

export default sceneryUtils;
