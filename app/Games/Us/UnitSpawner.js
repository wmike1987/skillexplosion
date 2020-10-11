import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import utils from '@utils/GameUtils.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import {globals} from '@core/Fundamental/GlobalState'

var unitSpawner = function(enemySets) {
    this.id = utils.uuidv4();

    this.timers = [];

    var self = this;

    this.initialize = function() {
        $.each(enemySets, function(i, enemy) {
            var total = 0;
            var itemsToGive = enemy.item ? enemy.item.total : 0;
            var spawnTimer = globals.currentGame.addTimer({
                name: 'spawner' + i + this.id + enemy.type,
                gogogo: true,
                timeLimit: enemy.spawn.hz,
                callback: function() {
                    if(enemy.fulfilled) return;
                    for(var x = 0; x < enemy.spawn.n; x++) {
                        var lastUnit = false;
                        if(total == (enemy.spawn.total-1)) lastUnit = true;
                        total++;

                        //Create unit
                        for(var i = 0; i < (enemy.spawn.atATime || 1); i++) {
                            var newUnit = enemy.constructor({team: 4});
                            newUnit.body.collisionFilter.mask -= 0x0004; //subtract wall
                            newUnit.honeRange = 5000;
                            utils.placeBodyJustOffscreen(newUnit);

                            //Give item to unit if chosen
                            if(itemsToGive > 0) {
                                var giveItem = true;
                                if(lastUnit) {
                                    giveItem = true;
                                } else {
                                    giveItem = utils.flipCoin() && utils.flipCoin();
                                }
                                if(giveItem) {
                                    ItemUtils.giveUnitItem({gamePrefix: 'Us', name: utils.getRandomElementOfArray(globals.currentGame.itemClasses[enemy.item.type]), unit: newUnit});
                                    itemsToGive--;
                                }
                            }

                            if(lastUnit) {
                                this.invalidated = true;
                                enemy.fulfilled = true;
                            }
                            globals.currentGame.addUnit(newUnit);
                        }
                    }
                }
            })
            this.timers.push(spawnTimer);
        }.bind(this))
    }

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.timers);
    }
}
export default unitSpawner;
