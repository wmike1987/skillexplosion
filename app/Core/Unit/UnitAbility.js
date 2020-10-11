import utils from '@utils/GameUtils.js'

export default function(options) {
    Object.assign(this, options);

    if(options.augments) {
        options.augments.forEach(augment => augment.ability = this);
    }

    this.costs = [];
    this.disables = {};

    //Manage tooltip options
    if(this.energyCost) {
      this.systemMessage = ["🔹" + this.energyCost];
      this.updaters = {systemMessages: function() {
          if(this.customCostText) {
              return {index: 0, value: this.customCostText};
          }
          return {index: 0, value: "🔹" + this.energyCost};
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
}
