import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import {globals} from '@core/Fundamental/GlobalState'

var unitSpawner = function(enemySets) {
    this.id = mathArrayUtils.uuidv4();

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
                    for(var x = 0; x < (enemy.spawn.atATime || 1); x++) {
                        var lastUnit = false;
                        if(total == Math.floor(enemy.spawn.total-1)) lastUnit = true;
                        total++;

                        //Create unit
                        var newUnit = enemy.constructor({team: 4});
                        newUnit.body.collisionFilter.mask -= 0x0004; //subtract wall
                        newUnit.honeRange = 5000;
                        gameUtils.placeBodyJustOffscreen(newUnit);

                        //Give item to unit if chosen
                        if(itemsToGive > 0) {
                            var giveItem = true;
                            if(lastUnit) {
                                giveItem = true;
                            } else {
                                giveItem = mathArrayUtils.flipCoin() && mathArrayUtils.flipCoin();
                            }
                            if(giveItem) {
                                ItemUtils.giveUnitItem({gamePrefix: 'Us', name: mathArrayUtils.getRandomElementOfArray(globals.currentGame.itemClasses[enemy.item.type]), unit: newUnit});
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
            })
            this.timers.push(spawnTimer);
        }.bind(this))
    }

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.timers);
    }
}
export default unitSpawner;
