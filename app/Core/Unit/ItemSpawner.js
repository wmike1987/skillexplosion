define(['jquery', 'utils/GameUtils'], function($, utils) {

    // options {
    //     name: string,
    //     position
    // }
    var spawn = function(options) {
        require(['items/'+options.name], function(item) {
            var newItem = item();
            currentGame.addItem(newItem);
            utils.placeBodyWithinRadiusAroundCanvasCenter(newItem.body, 200);
        })
    }

    return {spawn: spawn};
})
