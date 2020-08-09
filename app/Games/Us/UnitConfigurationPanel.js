define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js'], function($, utils, Tooltip, Matter) {

    var equipShow = utils.getSound('augmentPanelOpen.wav', {volume: .07, rate: 1.0});
    var equipHide = utils.getSound('augmentPanelOpen.wav', {volume: .05, rate: 1.25});
    var equip = utils.getSound('augmentEquip.wav', {volume: .05, rate: 1.2});
    var hoverAugmentSound = utils.getSound('augmenthover.wav', {volume: .03, rate: 1});

    var ConfigPanel = function(unitPanel) {
        this.unitPanelRef = unitPanel;
    }

    ConfigPanel.prototype.initialize = function() {
        this.id = utils.uuidv4();

        this.initialYOffset = -37;
        this.spacing = -62;

        //hide panel upon escape
        $('body').on('keydown.unitConfigurationPanel', function( event ) {
            var key = event.key.toLowerCase();
            if(key == 'escape') {
                this.hideForCurrentUnit();
            }
        }.bind(this));

        //close config windows when we click the canvas
        currentGame.addListener("mousedown", function() {
            if(currentGame.campActive) {
                this.hideForCurrentUnit();
            }
        }.bind(this), false, true);

        this.abilityBases = [];
        for(var x = 0; x < 3; x++) {
            var base = utils.addSomethingToRenderer('AugmentArmPanel', {where: 'hud', anchor: {x: .5, y: 1}, scale: {x: 0, y: 0}});
            base.visible = false;
            // utils.makeSpriteSize(base, {w: 30, h: 150});
            this.abilityBases.push(base)
            base.sortYOffset = 1000;
        }

        this.configButtonHeight = 218;
        this.configButtonGlassHeight = 200;
        this.showButton = utils.createDisplayObject('AugmentNotificationPanelBorder', {where: 'hudNOne', position: {x: this.unitPanelRef.abilityCenterX, y: utils.getPlayableHeight()+this.configButtonHeight/3}});
        this.showButton.interactive = true;
        this.showButtonGlass = utils.createDisplayObject('AugmentNotificationPanelGlass', {where: 'hudNOne', position: {x: this.unitPanelRef.abilityCenterX, y: utils.getPlayableHeight()+this.configButtonGlassHeight/3}});
        utils.graduallyTint(this.showButtonGlass, 0x62f6db, 0xd1b877, 15000, null, 5000);

        var abilityMin = {x: this.unitPanelRef.abilityCenterX - 122, y: utils.getPlayableHeight() - 40};
        var abilityMax = {x: this.unitPanelRef.abilityCenterX + 122, y: utils.getCanvasHeight()};
        $('body').on('mousemove.unitConfigurationPanel', function(event) {
            var mousePoint = {x: 0, y: 0};
            currentGame.renderer.interaction.mapPositionToPoint(mousePoint, event.clientX, event.clientY);
            if(mousePoint.x <= abilityMax.x && mousePoint.x >= abilityMin.x && mousePoint.y <= abilityMax.y && mousePoint.y >= abilityMin.y) {
                if(this.showButton.state == 'lowered') {
                    this.showButton.scale = {x: 1.05, y: 1.05};
                    this.showButtonGlass.scale = {x: 1.05, y: 1.05};
                }
            } else {
                this.showButton.scale = {x: 1.00, y: 1.00};
                this.showButtonGlass.scale = {x: 1.00, y: 1.00};
            }
        }.bind(this))

        $('body').on('mouseup.unitConfigurationPanel', function(event) {
            var mousePoint = {x: 0, y: 0};
            currentGame.renderer.interaction.mapPositionToPoint(mousePoint, event.clientX, event.clientY);
            if(mousePoint.x <= abilityMax.x && mousePoint.x >= abilityMin.x && mousePoint.y <= abilityMax.y && mousePoint.y >= abilityMin.y) {
                if(this.showButton.state == 'lowered') {
                    this.showForUnit(this.unitPanelRef.prevailingUnit);
                }
            }
        }.bind(this))
    }

    ConfigPanel.prototype.showForUnit = function(unit) {
        //hide showbutton and text
        this.liftOpenButton();

        //hide for last unit
        this.hideForCurrentUnit();

        //set current unit
        this.currentUnit = unit;

        //play sounds
        equipShow.play();

        //show augments
        this.showAugments(unit);
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
                        augment.lock.visible = false;
                        augment.unlocked = true; //for debugging
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
                                this.unitPanelRef.updateUnitAbilities();
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

    ConfigPanel.prototype.hideForCurrentUnit = function() {
        if(!this.currentUnit) {
            return;
        }

        //release current unit
        var unit = this.currentUnit;
        this.currentUnit = null;

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

        equipHide.play();

        //show button again if we're still selecting something
        if(this.unitPanelRef.prevailingUnit) {
            this.lowerOpenButton();
        }
    };

    ConfigPanel.prototype.lowerOpenButton = function() {
        if(this.unitPanelRef.prevailingUnit && currentGame.campActive) {
            utils.changeDisplayObjectStage(this.showButton, 'hudNOne');
                utils.changeDisplayObjectStage(this.showButtonGlass, 'hudNOne');
            utils.addOrShowDisplayObject(this.showButton);
            utils.addOrShowDisplayObject(this.showButtonGlass);
            this.showButton.position = {x: this.showButton.position.x, y: utils.getPlayableHeight()+this.configButtonHeight/2.75}
            this.showButton.state = "lowered";
            this.showButtonGlass.position = {x: this.showButton.position.x, y: utils.getPlayableHeight()+this.configButtonGlassHeight/2.75}
        }
    };

    ConfigPanel.prototype.hideOpenButton = function() {
        this.showButton.visible = false;
        this.showButton.state = "hidden";
        this.showButtonGlass.visible = false;
        this.showButtonGlass.state = "hidden";
    };

    ConfigPanel.prototype.liftOpenButton = function() {
        utils.changeDisplayObjectStage(this.showButton, 'hud');
        utils.addOrShowDisplayObject(this.showButton);
        this.showButton.position = {x: this.showButton.position.x, y: utils.getPlayableHeight()-this.configButtonHeight/2}
        this.showButton.scale = {x: 1.00, y: 1.00};
        this.showButton.state = "lifted";

        utils.changeDisplayObjectStage(this.showButtonGlass, 'hud');
        utils.addOrShowDisplayObject(this.showButtonGlass);
        this.showButtonGlass.position = {x: this.showButtonGlass.position.x, y: utils.getPlayableHeight()-this.configButtonGlassHeight/2}
        this.showButtonGlass.scale = {x: 1.00, y: 1.00};
    };

    ConfigPanel.prototype.cleanUp = function() {
        $('body').off('keydown.unitConfigurationPanel');
        utils.removeSomethingFromRenderer(this.showButton);
        utils.removeSomethingFromRenderer(this.showButtonGlass);
        $('body').off('mousemove.unitConfigurationPanel');
    };


    return ConfigPanel;
})
