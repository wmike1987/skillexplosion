import * as $ from 'jquery'
import * as Matter from 'matter-js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals} from '@core/Fundamental/GlobalState'

/*
 * This object keeps a history of CollectorManagers and provides an api to start/stop/pause/unpause a "current collector."
 */
var StatMaster = function(options) {
    this.statHistory = {};
    this.startNewCollector = function(name) {
        this.currentCollectorManager = new CollectorManager(Object.assign({}, options));
        this.statHistory[options.name] = this.currentCollectorManager;
        this.currentCollectorManager.startCollecting();
    }

    this.stopCurrentCollector = function() {
        this.currentCollectorManager.stopCollecting();
        this.lastCollector = this.currentCollectorManager;
    }

    this.pauseCurrentCollector = function() {
        this.currentCollectorManager.pause();
    }

    this.unpauseCurrentCollector = function() {
        this.currentCollectorManager.unpause();
    }

    this.getLastCollector = function() {
        return this.lastCollector;
    }
}

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
    this.collectors = [];

    if(options.collectors) {

    } else /*Subscribe to everything*/{
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
    }

    this.startCollecting = function() {
        this.collectors.forEach((collector) => {
            collector.start();
        })
    }

    this.stopCollecting = function() {
        this.collectors.forEach((collector) => {
            collector.stop();
        })
    }

    this.pauseCollecting = function() {
        this.collectors.forEach((collector) => {
            collector.pause();
        })
    }

    this.unpauseCollecting = function() {
        this.collectors.forEach((collector) => {
            collector.unpause();
        })
    }

    this.getStatMap = function() {
        var map = {};
        this.collectors.forEach((collector) => {
            map[collector.name] = collector.value;
        })
        return map;
    }
}

var Collector = {
    value: 0,
    listener: null,
    start: function() {
        var decoratedCollector = function(event) {
            if(this.paused) return;
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
}

var KillCollector = function(options) {
    this.name = "kills";
    this.eventName = 'performKill';
    this.collectorFunction = function(event) {
        if(options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this);
}
KillCollector.prototype = Collector;

var DamageCollector = function(options) {
    this.name = "damageDone";
    this.eventName = 'sufferedAttack';
    this.collectorFunction = function(event) {
        var attackingUnit = event.performingUnit;
        var damageDone = event.amountDone;
        if(options.predicate(event)) {
            this.value += damageDone;
        }
    }.bind(this);
}
DamageCollector.prototype = Collector;

var HealCollector = function(options) {
    this.name = "healingDone";
    this.eventName = 'performedHeal';
    this.collectorFunction = function(event) {
        var healingUnit = event.performingUnit;
        var healingDone = event.amountDone;
        if(options.predicate(event)) {
            this.value += healingDone;
        }
    }.bind(this)
}
HealCollector.prototype = Collector;

var DamageTakenCollector = function(options) {
    this.name = "damageTaken";
    this.eventName = 'sufferedAttack';
    this.collectorFunction = function(event) {
        var damageTaken = event.amountDone;
        if(options.sufferingPredicate(event)) {
            this.value += damageTaken;
        }
    }.bind(this)
}
DamageTakenCollector.prototype = Collector;

var DamageReducedByArmorCollector = function(options) {
    this.name = "damageReducedByArmor";
    this.eventName = 'damageReducedByArmor';
    this.collectorFunction = function(event) {
        var damageReducedByArmor = event.amountDone;
        if(options.sufferingPredicate(event)) {
            this.value += damageReducedByArmor;
        }
    }.bind(this)
}
DamageReducedByArmorCollector.prototype = Collector;

var KnivesThrownCollector = function(options) {
    this.name = "knivesThrown";
    this.eventName = 'performKnifeThrow';
    this.collectorFunction = function(event) {
        if(options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this)
}
KnivesThrownCollector.prototype = Collector;

var KnifeKillsCollector = function(options) {
    this.name = "knifeKills";
    this.eventName = 'knifeKill';
    this.collectorFunction = function(event) {
        if(options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this)
}
KnifeKillsCollector.prototype = Collector;

var DashCollector = function(options) {
    this.name = "dashesPerformed";
    this.eventName = 'dash';
    this.collectorFunction = function(event) {
        if(options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this)
}
DashCollector.prototype = Collector;

var MineCollector = function(options) {
    this.name = "minesLaid";
    this.eventName = 'layMine';
    this.collectorFunction = function(event) {
        if(options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this)
}
MineCollector.prototype = Collector;

var SecretStepCollector = function(options) {
    this.name = "secretStepsPerformed";
    this.eventName = 'secretStep';
    this.collectorFunction = function(event) {
        if(options.predicate(event)) {
            this.value += 1;
        }
    }.bind(this)
}
SecretStepCollector.prototype = Collector;

export default StatMaster;
