import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {globals} from '@core/GlobalState'
import utils from '@utils/GameUtils.js'

// options {
//     item: item
//     totalLife: number (default 8000 millis)
// }
var initiateBlinkDeath = function(options) {
    var time = options.time || 8000;
    var timerTime = time/50;
    var item = options.item;
    //create item removal and blink
    var t = globals.currentGame.addTimer({name: 'itemRemove' + item.body.id, runs: timerTime, timeLimit: 50,
    callback: function() {
        $.each(item.renderlings, function(i, rl) {
            if(this.totalPercentDone > .5) {
                if(this.totalPercentDone < .8) {
                    if(this.currentRun % 4 == 0 || this.currentRun-1 % 4 == 0) {
                        rl.alpha = .3;
                    } else {
                        rl.alpha = 1;
                    }
                } else if(this.currentRun % 2 == 0) {
                    $.each(item.renderlings, function(i, rl) {
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
        globals.currentGame.removeItem(item);
    }.bind(this)})

    item.deathTimer = t;
    var originalCollect = item.removePhysicalForm;
    item.removePhysicalForm = function() {
        if(this.deathTimer) {
            globals.currentGame.invalidateTimer(this.deathTimer);
        }
        originalCollect.call(item);
    }
    utils.deathPact(item, t);
}

var giveUnitItem = function(options) {
    if(Array.isArray(options.name)) {
        var len = options.name.length;
        var index = Math.floor(Math.random() * len);
        options.name = options.name[index];
    }

    //This is assuming a particular structure of the Item files within the project and game
    const target = options.gamePrefix+'/Items/'+options.name+'.js';
    import(`@games/${target}`).then((item) => {
        item = item.default;
        if(options.unit.isDead) {
            var item = item();
            item.drop(options.unit.position);
        } else {
            options.unit.pickupItem(item(), null, true);
        }
    })
}

export default {initiateBlinkDeath: initiateBlinkDeath, giveUnitItem: giveUnitItem};
