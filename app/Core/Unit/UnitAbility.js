import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';

export default function(options) {
    this.costs = [];
    this.defaultDisablers = {};
    this.enablers = [];
    this.enabledAugments = {};
    this.updaters = {};

    Object.assign(this, options);

    //Alter the ability's augments somewhat
    if(options.augments) {
        options.augments.forEach(augment => {
            augment.ability = this;
            if(augment.systemMessage) {
                // augment.systemMessage = [augment.systemMessage, 'Click to equip'];
            } else {
                // augment.systemMessage = 'Click to equip';
            }
        });
    }

    //Manage tooltip options
    if(this.energyCost) {
      this.systemMessage = ["E: " + this.energyCost];
      this.updaters.systemMessages = function() {
          if(this.customCostTextUpdater) {
              return {index: 0, value: this.customCostTextUpdater()};
          }
          return {index: 0, value: "E: " + this.energyCost};
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

        return !disabled;
    };

    this.enableAugment = function(augment) {
        this.enabledAugments[augment.name] = augment;
    };

    this.isAugmentEnabled = function(name) {
        if(name.name) {
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
}
