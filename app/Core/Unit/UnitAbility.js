import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import {
    CustomCollector
} from '@games/Us/StatCollector.js';

export default function(options) {
    this.costs = [];
    this.defaultDisablers = {};
    this.enablers = [];
    this.enabledAugments = {};
    this.updaters = {};
    this.availableAugments = [];

    Object.assign(this, options);

    //Alter the ability's augments somewhat
    if (options.augments) {
        options.augments.forEach(augment => {
            augment.ability = this;

            //default to not avilable
            augment.isAvailable = false;

            if(augment.isAvailable) {
                this.availableAugments.push(augment);
            }

            if (augment.collector) {
                augment.customCollector = new CustomCollector({
                    eventName: augment.collector.eventName,
                    priority: 10,
                    init: augment.collector.init,
                    presentation: {
                        tint: 0x15c5e4,
                        iconTextureName: augment.icon.creationTextureName,
                        labels: augment.collector.presentation.labels,
                        values: augment.collector.presentation.values || ["value"],
                        formats: augment.collector.presentation.formats || [],
                        suffixes: augment.collector.presentation.suffixes || []
                    },
                    collectorFunction: function(event) {
                        this.presentation.values.forEach(function(value) {
                            var safeValue = event[value] || 0;
                            this[value] += safeValue;
                        }.bind(this));
                    },
                    entity: augment
                });

                //convenience for fixed formatter
                if (augment.collector.presentation.formats == "fixed1") {
                    augment.customCollector.presentation.formats = [function(v) {
                        return v.toFixed(1);
                    }];
                }
            }
        });
    }

    //Manage tooltip options
    if (this.energyCost) {
        this.systemMessage = ["E: " + this.energyCost];
        this.updaters.systemMessages = function() {
            if (this.customCostTextUpdater) {
                return {
                    index: 0,
                    value: this.customCostTextUpdater()
                };
            }
            return {
                index: 0,
                value: "E: " + this.energyCost
            };
        }.bind(this);
    }

    //convenience method for enabling and disabling an ability
    this.disable = function(id) {
        var disable = function() {
            return false;
        };
        this.defaultDisablers[id] = disable;
        this.enablers.push(disable);
    };

    this.enable = function(id) {
        this.enablers.splice(this.enablers.indexOf(this.defaultDisablers[id]), 1);
        delete this.defaultDisablers[id];
    };

    this.isEnabled = function() {
        var disabled = this.enablers.some((f) => {
            return !f();
        });

        if (this.manuallyEnabled) {
            disabled = false;
        }

        //this manual setting will take precedence
        if (this.manuallyDisabled) {
            disabled = true;
        }

        return !disabled;
    };

    this.enableAugment = function(augment) {
        this.enabledAugments[augment.name] = augment;
    };

    this.isAugmentEnabled = function(name) {
        if (name.name) {
            name = name.name;
        }
        return this.enabledAugments[name];
    };

    this.disableAugment = function(augment) {
        this.enabledAugments[augment.name] = null;
    };

    this.addSlave = function(...slaves) {
        slaves.forEach((sl) => {
            gameUtils.deathPact(this, sl);
        });
    };

    this.addAugment = function(augment) {
        augment.isAvailable = true;
        this.availableAugments.push(augment);
    };

    this.getAvailableAugment = function(options) {
        if(this.allAugmentsAvailable()) {
            return;
        }

        options = Object.assign({
            random: true
        }, options);
        let nonAvailableAugments = this.getPendingAugments();

        let randomAugment = null;
        if(options.random) {
            randomAugment = mathArrayUtils.getRandomElementOfArray(nonAvailableAugments);
        }

        return randomAugment;
    };

    this.addRandomAugment = function() {
        this.addAugment(this.getAvailableAugment());
    };

    this.getPendingAugments = function() {
        return this.augments.filter((augment) => {
            return !augment.isAvailable;
        });
    };

    this.addAllPendingAugments = function() {
        this.getPendingAugments().forEach((augment) => {
            this.addAugment(augment);
        });
    };

    this.getAvailableAugments = function() {
        return this.availableAugments;
    };

    this.allAugmentsAvailable = function() {
        return this.getAvailableAugments().length == this.augments.length;
    };
}
