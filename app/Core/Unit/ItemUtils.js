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

            var t = currentGame.addTimer({name: 'itemRemove' + newItem.body.id, runs: 160, timeLimit: 50,
            callback: function() {
                $.each(newItem.renderlings, function(i, rl) {
                    if(this.currentRun > 80) {
                        if(this.currentRun < 130) {
                            if(this.currentRun % 4 == 0 || this.currentRun-1 % 4 == 0) {
                                rl.alpha = .3;
                            } else {
                                rl.alpha = 1;
                            }
                        } else if(this.currentRun % 2 == 0) {
                            $.each(newItem.renderlings, function(i, rl) {
                                rl.alpha = .3;
                            })
                        } else {
                            rl.alpha = 1;
                        }
                    } else {
                        rl.alpha = 1;
                    }
                }.bind(this))
            },
            totallyDoneCallback: function() {
                currentGame.removeItem(newItem);
            }.bind(this)})

            utils.deathPact(newItem, t);
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
