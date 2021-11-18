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
import {
    StatCollector,
    CustomCollector
} from '@games/Us/StatCollector.js';

var rewardConstants = {
    extraAdrenaline: 20
};

var rewardChecks = {
    extraAdrenaline: {name: 'rewardDamageTaken', predicate: function(value) {
        return value <= rewardConstants.extraAdrenaline;
    }}
};

var RewardManager = function(options) {
    this.statCollector = new StatCollector({
        useDefaultCollectors: false
    });

    //create the damage collector
    this.damageCollector = new CustomCollector({
        name: 'rewardDamageTaken',
        eventName: 'sufferAttack',
        predicate: function(event) {
            let sufferingUnit = event.sufferingUnit;
            return sufferingUnit.team == globals.currentGame.playerTeam;
        },
        collectorFunction: function(event) {
            this.value += event.amountDone;
        },
    });

    //register damage collector
    this.statCollector.registerCustomCollector(this.damageCollector);

    this.startNewRewardCollector = function() {
        this.statCollector.startNewCollector("Reward " + mathArrayUtils.getId());
    };

    this.getRewardValue = function(name) {
        var collector = this.statCollector.getCurrentCollector().getCollectorByName(name);
        if(collector) {
            return collector.value;
        } else {
            return null;
        }
    };
};

RewardManager.prototype = {
    checkExtraAdrenalineReward: function() {
        var name = rewardChecks.extraAdrenaline.name;
        var pred = rewardChecks.extraAdrenaline.predicate;
        return pred(this.getRewardValue(name));
    }
};



export {
    RewardManager,
};
