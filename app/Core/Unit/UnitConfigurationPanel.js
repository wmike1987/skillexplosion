define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js'], function($, utils, Tooltip, Matter) {

    var equipShow = utils.getSound('openEquipStation.wav', {volume: .1, rate: 1});
    var equip = utils.getSound('augmentEquip.wav', {volume: .1, rate: 1.2});

    var ConfigPanel = function() {
    }

    ConfigPanel.prototype.initialize = function() {
        this.id = utils.uuidv4();

        this.initialYOffset = -31;
        this.spacing = -65;
        $('body').on('keydown.unitConfigurationPanel', function( event ) {
            var key = event.key.toLowerCase();
            if(key == 'escape') {
                this.hideForUnit(this.currentUnit);
            }
        }.bind(this));

        this.abilityBases = [];
        for(var x = 0; x < 3; x++) {
            var base = utils.addSomethingToRenderer('AugmentArmPanel', {where: 'hud', anchor: {x: .5, y: 1}});
            base.visible = false;
            // utils.makeSpriteSize(base, {w: 30, h: 150});
            this.abilityBases.push(base)
            base.sortYOffset = 1000;
        }
    }

    ConfigPanel.prototype.showForUnit = function(unit) {
        this.hideForUnit(this.currentUnit);

        this.currentUnit = unit;
        equipShow.play();
        this.showAugments(unit);
        //this.showStats
    };

    ConfigPanel.prototype.showAugments = function(unit) {

        $.each(unit.abilities, function(i, ability) {
            var currentAugment = ability.currentAugment;
            if(ability.augments) {
                ability.currentAugmentBorder = utils.addSomethingToRenderer('AugmentBorderGold', "hudOne");
                ability.currentAugmentBorder.visible = false;
                ability.currentAugmentBorder.sortYOffset = 1000;
                $.each(ability.augments, function(j, augment) {
                    if(!augment.icon.parent) {
                        utils.addSomethingToRenderer(augment.icon, {position: {x: ability.position.x, y:utils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
                        augment.border = utils.addSomethingToRenderer('AugmentBorder', {position: {x: ability.position.x, y:utils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
                        augment.icon.interactive = true;
                        augment.icon.on('mouseup', function(event) {
                            ability.currentAugment = augment;
                            ability.currentAugmentBorder.position = this.position;
                            ability.currentAugmentBorder.visible = true;
                            equip.play();
                        })
                        Tooltip.makeTooltippable(augment.icon, {title: augment.title});

                    }
                    if(currentAugment == augment) {
                        augment.icon.alpha = 1;
                        augment.border.alpha = 0;
                        augment.border.visible = false;
                        ability.currentAugmentBorder.visible = true;
                        ability.currentAugmentBorder.position = augment.border.position;
                    } else {
                        augment.icon.alpha = .8;
                        augment.border.alpha = 1;
                        augment.border.visible = true;
                    }
                    augment.icon.visible = true;
                }.bind(this))

                //show ability bases
                this.abilityBases[i].position = {x: ability.position.x, y: utils.getPlayableHeight()+1}
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
                    augment.border.visible = false;
                    augment.icon.tooltipObj.hide();
                }.bind(this))
            }
            if(ability.currentAugmentBorder) {
                ability.currentAugmentBorder.visible = false;
            }
        }.bind(this))
    };

    ConfigPanel.prototype.cleanUp = function() {
        $('body').off('keydown.unitConfigurationPanel');
    };

    return ConfigPanel;
})
