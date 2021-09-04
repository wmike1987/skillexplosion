import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {
    globals
} from '@core/Fundamental/GlobalState';

var unitSpawner = function(options) {
    options = options || {};

    var enemySets = options.enemySets;

    this.id = mathArrayUtils.uuidv4();
    this.timers = [];
    this.poolTimers = {};
    this.pool = {};
    this.locationPool = {};
    this.itemRandomFlips = {};
    this.seed = options.seed;

    var self = this;
    this.startPooling = function(options) {
        options = options || {};

        //set the random seed (uses the given seen which is the level's seed) - turned off for now
        if(false) {
            mathArrayUtils.setRandomizerSeed(this.seed);
        }

        //determine unit locations and unit item indexes
        $.each(enemySets, function(i, enemy) {
            var k;
            var locationArray = [];
            var itemRandomFlips = [];
            this.locationPool[enemy.constructor.name] = locationArray;
            this.itemRandomFlips[enemy.constructor.name] = itemRandomFlips;
            for(k = 0; k < enemy.spawn.total; k++) {
                //locations
                locationArray.push(gameUtils.getJustOffscreenPosition('random'));

                //item index
                itemRandomFlips.push(mathArrayUtils.flipCoin());
            }
        }.bind(this));

        //pool unit objects
        $.each(enemySets, function(i, enemy) {
            //create a timer to fill the enemy pool between hz to spread out the load
            var poolTimer = globals.currentGame.addTimer({
                name: 'poolSpawner' + i + this.id + enemy.type,
                runs: enemy.spawn.total,
                timeLimit: options.immediatePool || (enemy.spawn.hz / (enemy.spawn.atATime || 1)),
                callback: function() {
                    this.insertIntoPool(enemy.constructor, enemy.constructor({
                        team: globals.currentGame.enemyTeam
                    }));
                }.bind(this)
            });
            this.timers.push(poolTimer);
            this.poolTimers[enemy.constructor.name] = poolTimer;
        }.bind(this));

        //reset randomness
        mathArrayUtils.setRandomToTrueRandom();
    };

    this.start = function() {
        var spawner = this;
        $.each(enemySets, function(i, enemy) {
            var total = 0;
            var itemsToGive = enemy.item ? enemy.item.total : 0;
            var spawnTimer = globals.currentGame.addTimer({
                name: 'spawner' + i + this.id + enemy.type,
                gogogo: true,
                immediateStart: true,
                immediateDelay: enemy.initialDelay || 3000,
                timeLimit: enemy.spawn.hz,
                callback: function() {
                    if (enemy.fulfilled) return;
                    for (var x = 0; x < (enemy.spawn.atATime || 1); x++) {
                        var lastUnit = false;
                        if (total >= enemy.spawn.total) return;
                        if (total == Math.floor(enemy.spawn.total - 1)) lastUnit = true;
                        total++;

                        //Create unit
                        // var newUnit = enemy.constructor({team: 4});
                        var newUnit = spawner.getFromPool(enemy.constructor);
                        newUnit.body.collisionFilter.mask -= 0x0004; //subtract wall
                        newUnit.honeRange = 5000;
                        Matter.Body.setPosition(newUnit.body, spawner.locationPool[enemy.constructor.name].shift());

                        //Give item to unit if chosen
                        if (itemsToGive > 0) {
                            var giveItem = true;
                            if (lastUnit) {
                                giveItem = true;
                            } else {
                                giveItem = spawner.itemRandomFlips[enemy.constructor.name].shift();
                            }
                            if (giveItem) {
                                ItemUtils.giveUnitItem({
                                    gamePrefix: 'Us',
                                    className: enemy.item.className,
                                    typeName: enemy.item.typeName,
                                    unit: newUnit
                                });
                                itemsToGive--;
                            }
                        }

                        if (lastUnit) {
                            this.invalidated = true;
                            enemy.fulfilled = true;
                        }
                        globals.currentGame.addUnit(newUnit);
                    }
                }
            });

            this.timers.push(spawnTimer);
        }.bind(this));
    };

    this.cleanUp = function() {
        globals.currentGame.invalidateTimer(this.timers);
        $.each(this.pool, function(key, value) {
            value.forEach((unit) => {
                globals.currentGame.removeUnit(unit);
            });
        });
        this.pool = null;
    };

    this.getFromPool = function(unitConstructor) {
        var unit;
        var newUnits = this.pool[unitConstructor.name];

        //force a call to the pool timer if we don't have a unit
        if (!newUnits || newUnits.length == 0) {
            console.info('force spawning unit ' + unitConstructor.name);
            this.poolTimers[unitConstructor.name].executeCallbacks();
            newUnits = this.pool[unitConstructor.name];
        }
        if (newUnits && newUnits.length > 0) {
            unit = newUnits.shift();
        }
        return unit;
    };

    this.insertIntoPool = function(unitConstructor, newUnit) {
        if (!this.pool[unitConstructor.name]) {
            this.pool[unitConstructor.name] = [];
        }
        this.pool[unitConstructor.name].push(newUnit);
    };
};
export default unitSpawner;
