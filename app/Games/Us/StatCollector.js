import * as $ from 'jquery';
import * as Matter from 'matter-js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import {
    globals
} from '@core/Fundamental/GlobalState';

/*
 * This object keeps a history of CollectorManagers and provides an api to start/stop/pause/unpause a "current collector."
 */
var StatCollector = function(options) {
    this.statHistory = {};
    this.customCollectors = {};
    this.unit = options.unit;

    this.startNewCollector = function(name) {
        //Create a new collector manager
        this.currentCollectorManager = new CollectorManager(Object.assign({}, options));

        //Add any item collectors to the manager
        mathArrayUtils.operateOnObjectByKey(this.customCollectors, function(key, coll) {
            this.currentCollectorManager.addCollector(coll.collector.spawnNewCollector());
        }.bind(this));

        this.statHistory[options.name] = this.currentCollectorManager;
        this.currentCollectorManager.startCollecting();

        Matter.Events.trigger(globals.currentGame, 'NewCollectorStarted', {
            unit: this.unit,
            newCollectorManager: this.currentCollectorManager
        });
    };

    this.isCollecting = function() {
        if (this.currentCollectorManager) {
            return this.currentCollectorManager.isCollecting;
        } else {
            return false;
        }
    };

    this.getCurrentCollector = function() {
        return this.currentCollectorManager;
    };

    this.registerCustomCollector = function(coll) {
        if (this.customCollectors[coll.name]) {
            this.customCollectors[coll.name].amount++;
        } else {
            this.customCollectors[coll.name] = {
                collector: coll,
                amount: 1
            };
            if (this.isCollecting()) {
                this.currentCollectorManager.addCollector(coll.spawnNewCollector(), true);
            }
        }

    };

    this.deregisterCustomCollector = function(coll) {
        if (this.customCollectors[coll.name]) {
            this.customCollectors[coll.name].amount--;
            if (this.customCollectors[coll.name].amount == 0) {
                delete this.customCollectors[coll.name];
            }
        }
    };

    this.stopCurrentCollector = function() {
        this.currentCollectorManager.stopCollecting();
        this.lastCollector = this.currentCollectorManager;
    };

    this.pauseCurrentCollector = function() {
        this.currentCollectorManager.pause();
    };

    this.unpauseCurrentCollector = function() {
        this.currentCollectorManager.unpause();
    };

    this.getLastCollector = function() {
        return this.lastCollector;
    };
};

/*
 * Represent a blob of default collectors
 */
var CollectorManager = function(options) {
    options = options || {};
    var damageCollector = new DamageCollector(options);
    var healingCollector = new HealCollector(options);
    var killCollector = new KillCollector(options);
    var damageTakenCollector = new DamageTakenCollector(options);
    var damageReducedByArmorCollector = new DamageReducedByArmorCollector(options);
    var knivesThrownCollector = new KnivesThrownCollector(options);
    var knifeKillsCollector = new KnifeKillsCollector(options);
    var dashCollector = new DashCollector(options);
    var mineCollector = new MineCollector(options);
    var secretStepCollector = new SecretStepCollector(options);
    var dodgeCollector = new DodgeCollector(options);
    this.collectors = [];

    if (options.collectors) {

    } else /*Subscribe to everything*/ {
        this.collectors.push(damageCollector);
        this.collectors.push(healingCollector);
        this.collectors.push(killCollector);
        this.collectors.push(damageTakenCollector);
        this.collectors.push(damageReducedByArmorCollector);
        this.collectors.push(knivesThrownCollector);
        this.collectors.push(knifeKillsCollector);
        this.collectors.push(dashCollector);
        this.collectors.push(mineCollector);
        this.collectors.push(secretStepCollector);
        this.collectors.push(dodgeCollector);
    }

    this.startCollecting = function() {
        this.isCollecting = true;
        this.collectors.forEach((collector) => {
            collector.start();
        });
    };

    this.stopCollecting = function() {
        this.isCollecting = false;
        this.collectors.forEach((collector) => {
            collector.stop();
        });
    };

    this.pauseCollecting = function() {
        this.isCollecting = false;
        this.collectors.forEach((collector) => {
            collector.pause();
        });
    };

    this.unpauseCollecting = function() {
        this.isCollecting = true;
        this.collectors.forEach((collector) => {
            collector.unpause();
        });
    };

    this.addCollector = function(collector, start) {
        this.collectors.push(collector);
        if (start) {
            collector.start();
        }
    };

    this.getDefaultStatMap = function() {
        var map = {};
        this.collectors.forEach((collector) => {
            if (!collector.isCustomCollector) {
                map[collector.name] = collector.value;
            }
        });
        return map;
    };

    this.getSortedCustomCollectors = function() {
        var arr = [];
        this.collectors.forEach((collector) => {
            if (collector.isCustomCollector) {
                arr.push(collector);
            }
        });

        return arr.sort(function(a, b) {
            return a.priority - b.priority;
        });
    };

    this.getCustomCollector = function(name) {
        var ret = null;
        this.collectors.forEach((collector) => {
            if (collector.isCustomCollector && collector.name == name) {
                ret = collector;
            }
        });

        return ret;
    };
};

var Collector = {
    value: 0,
    listener: null,
    start: function() {
        if (this.init) {
            this.init();
        }
        var decoratedCollector = function(event) {
            if (this.paused) return;
            this.collectorFunction(event);
        }.bind(this);
        this.listener = Matter.Events.on(globals.currentGame, this.eventName, decoratedCollector);
    },

    stop: function() {
        Matter.Events.off(globals.currentGame, this.eventName, this.listener);
    },

    pause: function() {
        this.paused = true;
    },

    unpause: function() {
        this.paused = false;
    }
};

var CustomCollector = function(options) {
    //default predicate
    options.predicate = options.predicate || function() {
        return true;
    };
    this.isCustomCollector = true;
    this.entity = options.entity;
    this.name = this.entity.name;
    this.init = options.init;
    this.priority = options.priority;
    this.predicate = options.predicate || function() {
        return true;
    };

    this.priority = options.priority || 50;
    this.eventName = options.eventName;
    this.presentation = options.presentation;
    this.canPresent = options.canPresent || function() {
        return true;
    };
    if(!this.presentation.tint) {
        this.presentation.tint = 0xbdbdbd; //default tint
    }

    this.collectorFunction = function(event) {
        if (options.predicate(event))
            options.collectorFunction.call(this, event);
    };

    this.spawnNewCollector = function() {
        return Object.assign(Object.create(Collector), this);
    };
};

var KillCollector = function(options) {
    this.name = "kills";
    this.eventName = 'performKill';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
KillCollector.prototype = Collector;

var DamageCollector = function(options) {
    this.name = "damageDone";
    this.eventName = 'sufferAttack';
    this.collectorFunction = function(event) {
        var attackingUnit = event.performingUnit;
        var damageDone = event.amountDone;
        if (options.predicate(event)) {
            this.value += damageDone;
        }
    }.bind(this);
};
DamageCollector.prototype = Collector;

var HealCollector = function(options) {
    this.name = "healingDone";
    this.eventName = 'performHeal';
    this.collectorFunction = function(event) {
        var healingUnit = event.performingUnit;
        var healingDone = event.amountDone;
        if (options.predicate(event)) {
            this.value += healingDone;
        }
    }.bind(this);
};
HealCollector.prototype = Collector;

var DamageTakenCollector = function(options) {
    this.name = "damageTaken";
    this.eventName = 'sufferAttack';
    this.collectorFunction = function(event) {
        var damageTaken = event.amountDone;
        if (options.sufferingPredicate(event)) {
            this.value += damageTaken;
        }
    }.bind(this);
};
DamageTakenCollector.prototype = Collector;

var DamageReducedByArmorCollector = function(options) {
    this.name = "damageReducedByArmor";
    this.eventName = 'damageReducedByArmor';
    this.collectorFunction = function(event) {
        var damageReducedByArmor = event.amountDone;
        if (options.sufferingPredicate(event)) {
            this.value += damageReducedByArmor;
        }
    }.bind(this);
};
DamageReducedByArmorCollector.prototype = Collector;

var KnivesThrownCollector = function(options) {
    this.name = "knivesThrown";
    this.eventName = 'knifeThrow';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
KnivesThrownCollector.prototype = Collector;

var KnifeKillsCollector = function(options) {
    this.name = "knifeKills";
    this.eventName = 'knifeKill';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
KnifeKillsCollector.prototype = Collector;

var DashCollector = function(options) {
    this.name = "dashesPerformed";
    this.eventName = 'dash';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
DashCollector.prototype = Collector;

var MineCollector = function(options) {
    this.name = "minesLaid";
    this.eventName = 'layMine';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
MineCollector.prototype = Collector;

var SecretStepCollector = function(options) {
    this.name = "secretStepsPerformed";
    this.eventName = 'secretStep';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
SecretStepCollector.prototype = Collector;

var DodgeCollector = function(options) {
    this.name = "attacksDodged";
    this.eventName = 'dodgeAttack';
    this.collectorFunction = function(event) {
        if (options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
};
DodgeCollector.prototype = Collector;

export {
    StatCollector,
    CustomCollector,
    Collector
};
