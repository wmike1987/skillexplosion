define(['jquery', 'utils/GameUtils', 'matter-js'], function($, utils, Matter) {

    // options {
    //     name: string,
    //     position
    // }
    var spawn = function(options) {
        require(['items/'+options.name], function(item) {
            var newItem = item();
            currentGame.addItem(newItem);
            if(options.position) {
                Matter.Body.setPosition(newItem.body, options.position);
            } else {
                utils.placeBodyWithinRadiusAroundCanvasCenter(newItem.body, 200);
            }
        })
    }

    var giveUnitItem = function(options) {
        if(Array.isArray(options.name)) {
            var len = options.name.length;
            var index = Math.floor(Math.random() * len);
            options.name = options.name[index];
        }
        require(['items/'+options.name], function(item) {
            options.unit.pickupItem(item());
        })
    }

    return {spawn: spawn, giveUnitItem: giveUnitItem};
})
