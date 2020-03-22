define(['jquery', 'utils/GameUtils'], function($, utils) {

    var ConfigPanel = function() {
    }

    ConfigPanel.prototype.initialize = function() {
        //noop
    }

    ConfigPanel.prototype.showForUnit = function(unit) {
        this.hideForUnit(this.currentUnit);

        this.currentUnit = unit;
        this.showAugments(unit);
        //this.showStats
    };

    ConfigPanel.prototype.showAugments = function(unit) {
        $.each(unit.abilities, function(i, ability) {
            if(ability.augments) {
                $.each(ability.augments, function(j, augment) {
                    if(!augment.icon.parent) {
                        utils.addSomethingToRenderer(augment.icon, {position: {x: ability.position.x, y:ability.position.y - 50}, where: 'hudOne'});
                        augment.icon.interactive = true;
                        augment.icon.on('mouseup', function(event) {
                            ability.currentAugment = augment;
                        }.bind(this))
                    }
                    augment.icon.visible = true;
                }.bind(this))
            }
        }.bind(this))
    }

    ConfigPanel.prototype.hideForUnit = function(unit) {
        if(!unit) return;

        //hide augments
        $.each(unit.abilities, function(i, ability) {
            if(ability.augments) {
                $.each(ability.augments, function(j, augment) {
                    augment.icon.visible = false;
                }.bind(this))
            }
        }.bind(this))
    };

    ConfigPanel.prototype.cleanUp = function() {

    };

    return ConfigPanel;
})
