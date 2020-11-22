import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

export default function(options) {
    Object.assign(this, options);

    if(options.augments) {
        options.augments.forEach(augment => augment.ability = this);
    }

    this.costs = [];
    this.disables = {};

    //Manage tooltip options
    if(this.energyCost) {
      this.systemMessage = ["E: " + this.energyCost];
      this.updaters = {systemMessages: function() {
          if(this.customCostText) {
              return {index: 0, value: this.customCostText};
          }
          return {index: 0, value: "E: " + this.energyCost};
      }.bind(this)}
    }

    //convenience method for enabling and disabling an ability
    this.disable = function(id) {
        var disable = function() {
            return false;
        }
        this.disables[id] = disable;
        this.enablers.push(disable);
    };
    this.enable = function(id) {
        this.enablers.splice(this.enablers.indexOf(this.disables[id]), 1);
        delete this.disables[id];
    };

    this.addSlave = function(...slaves) {
        slaves.forEach((sl) => {
            gameUtils.deathPact(this, sl);
        })
    }
}
