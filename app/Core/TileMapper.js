import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import TileMap from '@core/TileMap';

//This module takes in a collection of sprites + tile options and returns a TileMap
//We assume isometric tiles, aka height = width/2
var tileMapper = {};

/*
 * options: {
 *  possibleTextures: array of texture names that can be chosen
 *  bounds: {x, y} representing width and height of area tobe tiled
 *  tileWidth: desired output width of a tile
 *  realTileWidth: actual width of tile inside texture
 *  tileStart: where to start tiling, default is {0, 0}
 * }
 */
tileMapper.produceTileMap = function(options) {
    var textureArray = options.possibleTextures;
    var bounds = options.bounds || gameUtils.getCanvasWH();
    var tileWidth = options.tileWidth;
    var tileHeight = tileWidth / 2;
    var realTileWidth = options.realTileWidth;
    var realTileHeight = options.realTileHeight;
    var tileStart = options.tileStart || {
        x: 0,
        y: 0
    };
    var tileTint = options.tileTint;
    var where = options.where || 'background';
    var alpha = options.alpha || 1;
    var frequency = options.hz || 1;
    var r = options.r || 0; //r is 0-1 (random scale)
    var noScale = options.noScale;
    var noZones = options.noZones || [];
    noZones = mathArrayUtils.convertToArray(noZones);

    var tm = new TileMap();
    var column = 0;
    for (var x = tileStart.x; x <= bounds.x + tileWidth;) {

        //alter the y when we're on an odd column
        var yOffset = 0;
        if (column % 2 != 0) {
            yOffset = tileHeight / 2;
        }

        //draw columns
        for (var y = tileStart.y; y <= bounds.y + tileHeight / 2;) {
            if (Math.random() < frequency) {

                //no zones
                var skip = false;
                if(noZones) {
                    noZones.forEach((nz) => {
                        if(mathArrayUtils.distanceBetweenPoints(nz.center, {x: x, y: y}) < nz.radius) {
                            skip = true;
                        }
                    });
                }
                if(skip) {
                    y += tileHeight;
                    continue;
                }

                var randomnessX = ((Math.random() * 200) - 100) * r;
                var randomnessY = ((Math.random() * 200) - 100) * r;

                var randomTexture = mathArrayUtils.getRandomElementOfArray(textureArray);
                var newDO = null;
                if(randomTexture.animationName) {
                    randomTexture.scale = randomTexture.scale || {x: 1.0, y: 1.0};
                    newDO = gameUtils.getAnimation({
                        spritesheetName: randomTexture.spritesheetName,
                        animationName: randomTexture.animationName,
                        speed: randomTexture.speed || 1.0,
                        loop: true,
                        transform: [x + randomnessX,y + yOffset + randomnessY, randomTexture.scale.x, randomTexture.scale.y]
                    });
                    newDO.play();
                } else {
                    newDO = graphicsUtils.createDisplayObject(randomTexture, {
                        position: {
                            x: x + randomnessX,
                            y: y + yOffset + randomnessY
                        },
                        alpha: alpha,
                        where: where,
                        scale: {
                            // if realTileWidth is provided, this is needed when the tile doesn't span the whole texture width
                            x: noScale ? 1 : tileWidth / (realTileWidth || 1),
                            y: noScale ? 1 : tileWidth / (realTileWidth || 1)
                        }
                    });
                }

                if (tileTint) {
                    newDO.tint = tileTint;
                }

                // 2) if realTileWidth is not provided (usual case), it's assumed that the textures spans the whole texture width which means we can simply rely on this method
                if (!realTileWidth && !noScale) {
                    var w = newDO.texture.width;
                    var h = newDO.texture.height;
                    var wScale = tileWidth / w;
                    graphicsUtils.makeSpriteSize(newDO, {
                        w: tileWidth,
                        h: wScale * h
                    });
                }
                tm.addTile(newDO);
            }
            y += tileHeight;
        }
        x += tileWidth / 2;
        column++;
    }
    return tm;
};

export default tileMapper;
