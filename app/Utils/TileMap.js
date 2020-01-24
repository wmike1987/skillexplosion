define(['jquery', 'utils/GameUtils'], function($, utils) {

    //This module represents a tile map. This is produced by the tile mapper
    var tileMap = function() {
        this.tiles = [];
    };

    tileMap.prototype.initialize = function(options) {
        //loop through tiles and add them at the specified location
        $.each(this.tiles, function(i, tile) {
            utils.addSomethingToRenderer(tile, options);
        })

        console.info("initialized " + this.tiles.length + " tiles")
    };

    tileMap.prototype.addTile = function(displayObject) {
        this.tiles.push(displayObject);
    };

    //other utility methods?

    return tileMap;
})
