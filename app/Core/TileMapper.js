import * as $ from 'jquery'
import utils from '@utils/GameUtils.js'
import TileMap from '@core/TileMap'

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
    var bounds = options.bounds || utils.getCanvasWH();
    var tileWidth = options.tileWidth;
    var tileHeight = tileWidth/2;
    var realTileWidth = options.realTileWidth;
    var tileStart = options.tileStart || {x: 0, y: 0};
    var where = options.where || 'background';
    var alpha = options.alpha || 1;
    var frequency = options.hz || 1;

    var tm = new TileMap();
    var column = 0;
    for(var x = tileStart.x; x <= bounds.x+tileWidth;) {

        //alter the y when we're on an odd column
        var yOffset = 0;
        if(column % 2 != 0) {
            yOffset = tileHeight/2;
        }

        //draw columns
        for(var y = tileStart.y; y <= bounds.y+tileHeight/2;) {
            if(Math.random() < frequency) {
                //scaling tiles, there are two "modes"
                // 1) realTileWidth is provided, this is needed when the tile doesn't span the whole texture width
                var newDO = utils.createDisplayObject(utils.getRandomElementOfArray(textureArray), {position: {x: x, y: y+yOffset}, alpha: alpha, where: where, scale: {x: tileWidth/(realTileWidth || 1), y: tileWidth/(realTileWidth || 1)}});
                newDO.tint = 0xe335a5;

                // 2) if realTileWidth is not provided, it's assumed that the textures spans the whole texture width which means we can simply rely on this method
                if(!realTileWidth) {
                    var w = newDO.texture.width;
                    var h = newDO.texture.height;
                    var wScale = tileWidth/w;
                    utils.makeSpriteSize(newDO, {w: tileWidth, h: wScale * h})
                }
                tm.addTile(newDO);
            }
            y+=tileHeight;
        }
        x+=tileWidth/2;
        column++;
    }
    return tm;
}

export default tileMapper;
