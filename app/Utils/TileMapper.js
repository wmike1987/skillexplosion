define(['jquery', 'utils/GameUtils', 'utils/TileMap'], function($, utils, TileMap) {

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

        var tm = new TileMap();
        var column = 0;
        for(var x = tileStart.x; x <= bounds.x+tileWidth;) {

            //alter the y when we're on an odd column
            var yOffset = 0;
            if(column % 2 != 0) {
                yOffset = tileHeight/2;
            }

            //draw columns
            for(var y = tileStart.y; y <= bounds.y+tileWidth/2;) {
                var newDO = utils.createDisplayObject(utils.getRandomElementOfArray(textureArray), {position: {x: x, y: y+yOffset}, scale: {x: tileWidth/realTileWidth, y: tileWidth/realTileWidth}});
                y+=tileHeight;
                tm.addTile(newDO);
            }
            x+=tileWidth/2;
            column++;
        }
        return tm;
    }

    return tileMapper;
})
