define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js'], function($, utils, Tooltip, Matter) {

    var equipShow = utils.getSound('openEquipStation.wav', {volume: .15, rate: .8});
    var equip = utils.getSound('augmentEquip.wav', {volume: .1, rate: 1.2});
    var hoverAugmentSound = utils.getSound('augmenthover.wav', {volume: .03, rate: 1});

    var ConfigPanel = function() {
    }

    ConfigPanel.prototype.initialize = function() {
        this.id = utils.uuidv4();

        this.initialYOffset = -31;
        this.spacing = -65;

        //hide panel upon escape
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
        if(unit == this.currentUnit) return;

        //remove the move listener for last unit
        if(this.currentUnit && this.currentUnit.equipHideFunction) {
            Matter.Events.off(this.currentUnit, 'unitMove', this.currentUnit.equipHideFunction);
        }

        //occupy unit
        unit.isOccupied = true;

        //hide for last unit
        this.hideForUnit(this.currentUnit);

        //setup move listener for new unit
        unit.equipHideFunction = function(event) {
            this.hideForUnit(event.unit)
        }.bind(this)
        Matter.Events.on(unit, 'unitMove', unit.equipHideFunction);

        this.currentUnit = unit;
        unit.stop();
        equipShow.play();
        this.showAugments(unit);
        //this.showStats - TODO
    };

    ConfigPanel.prototype.showAugments = function(unit) {
        $.each(unit.abilities, function(i, ability) {
            var currentAugment = ability.currentAugment;
            if(ability.augments) {
                ability.currentAugmentBorder = utils.addSomethingToRenderer('AugmentBorderGold', "hudOne");
                ability.currentAugmentBorder.visible = false;
                ability.currentAugmentBorder.sortYOffset = 1000;
                var alphaAugment = .8;
                $.each(ability.augments, function(j, augment) {
                    if(!augment.icon.parent) {
                        utils.addSomethingToRenderer(augment.icon, {position: {x: ability.position.x, y:utils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
                        augment.lock = utils.addSomethingToRenderer('LockIcon', {position: {x: ability.position.x, y:utils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudTwo'});
                        augment.actionBox = utils.addSomethingToRenderer('TransparentSquare', {position: {x: ability.position.x, y:utils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudTwo'});
                        utils.makeSpriteSize(augment.actionBox, {x: 50, y: 50});
                        augment.border = utils.addSomethingToRenderer('AugmentBorder', {position: {x: ability.position.x, y:utils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
                        augment.border.sortYOffset = -10;
                        augment.actionBox.interactive = true;
                        augment.actionBox.on('mouseup', function(event) {
                            if(ability.currentAugment != augment && augment.unlocked) {
                                //unequip existing augment
                                if(ability.currentAugment) {
                                    if(ability.currentAugment.unequip)
                                        ability.currentAugment.unequip(this.currentUnit);
                                    ability.currentAugment.border.scale = {x: 1, y: 1};
                                    ability.currentAugment.border.alpha = alphaAugment;
                                    ability.currentAugment.border.visible = true;
                                }

                                ability.currentAugmentBorder.position = augment.icon.position;
                                ability.currentAugmentBorder.visible = true;

                                //equip augment
                                ability.currentAugment = augment;
                                if(ability.currentAugment.equip) {
                                    ability.currentAugment.equip(this.currentUnit);
                                }
                                equip.play();

                                //trigger event and trigger ability panel update
                                Matter.Events.trigger(this, 'augmentEquip', {augment: augment, unit: this.currentUnit})
                                currentGame.unitSystem.unitPanel.updateUnitAbilities();
                            } else if(!augment.unlocked && unit.canUnlockAugment(augment)) {
                                unit.unlockAugment(augment);
                                augment.lock.visible = false;
                            }
                        }.bind(this))
                        augment.actionBox.on('mouseover', function(event) {
                            if(ability.currentAugment != augment) {
                                augment.border.alpha = 1;
                                augment.border.scale = {x: 1.1, y: 1.1};
                                hoverAugmentSound.play();
                            }
                        })
                        augment.actionBox.on('mouseout', function(event) {
                            if(ability.currentAugment != augment) {
                                augment.border.scale = {x: 1, y: 1};
                                augment.border.alpha = alphaAugment;
                            }
                        })
                        Tooltip.makeTooltippable(augment.actionBox, {title: augment.title, description: augment.description});

                    }
                    if(currentAugment == augment) {
                        augment.icon.alpha = 1;
                        augment.border.alpha = 0;
                        augment.border.visible = false;
                        ability.currentAugmentBorder.visible = true;
                        ability.currentAugmentBorder.position = augment.border.position;
                    } else {
                        augment.icon.alpha = 1;
                        augment.border.alpha = alphaAugment;
                        augment.border.visible = true;
                        if(!augment.unlocked) {
                            augment.lock.visible = true;
                        }
                    }
                    augment.icon.visible = true;
                    augment.actionBox.visible = true;
                }.bind(this))

                //show ability bases
                this.abilityBases[i].position = {x: ability.position.x, y: utils.getPlayableHeight()+1}
                this.abilityBases[i].visible = true;
            }
        }.bind(this))
    }

    ConfigPanel.prototype.hideForUnit = function(unit) {
        if(!unit) return;

        //release current unit
        this.currentUnit = null;

        //remove the move listener for unit
        if(unit.equipHideFunction) {
            Matter.Events.off(unit, 'unitMove', unit.equipHideFunction);
        }

        //de-occupy unit
        unit.isOccupied = false;

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
                    augment.actionBox.tooltipObj.hide();
                    augment.actionBox.visible = false;
                    augment.lock.visible = false;
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
