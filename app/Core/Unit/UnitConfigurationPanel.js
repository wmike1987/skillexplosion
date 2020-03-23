define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js'], function($, utils, Tooltip, Matter) {

    var ConfigPanel = function() {
    }

    ConfigPanel.prototype.initialize = function() {
        this.id = utils.uuidv4();

        this.augmentOffsetY = -100;
        $('body').on('keydown.unitConfigurationPanel', function( event ) {
            var key = event.key.toLowerCase();
            if(key == 'escape') {
                this.hideForUnit(this.currentUnit);
            }
        }.bind(this));

        this.abilityBases = [];
        for(var x = 0; x < 3; x++) {
            var base = utils.addSomethingToRenderer('TintableSquare', {where: 'hud', tint: 0xbbbbbb, anchor: {x: .5, y: 1}});
            base.visible = false;
            utils.makeSpriteSize(base, {w: 30, h: 150});
            this.abilityBases.push(base)
        }
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
                        utils.addSomethingToRenderer(augment.icon, {position: {x: ability.position.x, y:ability.position.y + this.augmentOffsetY*(j+1)}, where: 'hudOne'});
                        augment.icon.interactive = true;
                        augment.icon.on('mouseup', function(event) {
                            ability.currentAugment = augment;
                        }.bind(this))
                        Tooltip.makeTooltippable(augment.icon, {title: augment.title});

                    }
                    augment.icon.visible = true;
                }.bind(this))

                //show ability bases
                utils.makeSpriteSize(this.abilityBases[i], {w: ability.icon.width, h: ability.augments.length * 100});
                this.abilityBases[i].position = {x: ability.position.x, y: utils.getPlayableHeight()}
                this.abilityBases[i].visible = true;
            }
        }.bind(this))
    }

    ConfigPanel.prototype.hideForUnit = function(unit) {
        if(!unit) return;

        //hide infrastructure
        $.each(this.abilityBases, function(i, base) {
            base.visible = false;
        })

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
        $('body').off('keydown.unitConfigurationPanel');
    };

    return ConfigPanel;
})
