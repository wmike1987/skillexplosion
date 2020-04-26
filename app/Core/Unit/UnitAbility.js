define(['jquery', 'utils/GameUtils'], function($, utils) {

    return function(options) {
        $.extend(this, options);

        if(options.augments) {
            options.augments.forEach(augment => augment.ability = this);
        }

        this.costs = [];
        this.disables = {};

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
})
