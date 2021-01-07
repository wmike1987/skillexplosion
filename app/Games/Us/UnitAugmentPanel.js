import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import * as Matter from 'matter-js'
import {globals} from '@core/Fundamental/GlobalState.js'

var equipShow = gameUtils.getSound('menuopen1.wav', {volume: .08, rate: 1.0});
var equipHide = gameUtils.getSound('menuopen1.wav', {volume: .05, rate: 1.25});
var equip = gameUtils.getSound('augmentEquip.wav', {volume: .05, rate: 1.2});
var hoverAugmentSound = gameUtils.getSound('augmenthover.wav', {volume: .03, rate: 1});
var unlockAugmentSound = gameUtils.getSound('unlockability.wav', {volume: .16, rate: 1});

var ConfigPanel = function(unitPanel) {
    this.unitPanelRef = unitPanel;
}

ConfigPanel.prototype.initialize = function() {
    this.id = mathArrayUtils.uuidv4();

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
    globals.currentGame.addListener("mousedown", function() {
        if(globals.currentGame.campLikeActive) {
            this.hideForCurrentUnit();
        }
    }.bind(this), false, true);

    this.configButtonHeight = 218;
    this.configButtonGlassHeight = 200;
    this.showButton = graphicsUtils.createDisplayObject('AugmentNotificationPanelBorder', {where: 'hudNOne', position: {x: this.unitPanelRef.abilityCenterX, y: gameUtils.getPlayableHeight()+this.configButtonHeight/3}});
    this.showButton.interactive = true;
    this.showButtonGlass = graphicsUtils.createDisplayObject('AugmentNotificationPanelGlass', {where: 'hudNOne', position: {x: this.unitPanelRef.abilityCenterX, y: gameUtils.getPlayableHeight()+this.configButtonGlassHeight/3}});
    graphicsUtils.graduallyTint(this.showButtonGlass, 0x62f6db, 0xd1b877, 15000, null, 5000);

    var abilityMin = {x: this.unitPanelRef.abilityCenterX - 122, y: gameUtils.getPlayableHeight() - 40};
    var abilityMax = {x: this.unitPanelRef.abilityCenterX + 122, y: gameUtils.getCanvasHeight()};
    $('body').on('mousemove.unitConfigurationPanel', function(event) {
        var mousePoint = {x: 0, y: 0};
        gameUtils.pixiPositionToPoint(mousePoint, event);
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

    $('body').on('mousedown.unitConfigurationPanel', function(event) {
        var mousePoint = {x: 0, y: 0};
        gameUtils.pixiPositionToPoint(mousePoint, event);
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
    // this.hideForCurrentUnit();

    //set current unit
    this.prevailingUnit = unit;

    //play sounds
    equipShow.play();

    //show augments
    this.showAugments(unit);
};

ConfigPanel.prototype.showAugments = function(unit) {
    $.each(unit.abilities, function(i, ability) {
        var currentAugment = ability.currentAugment;
        if(ability.augments) {
            if(!ability.currentAugmentBorder) {
                ability.currentAugmentBorder = graphicsUtils.addSomethingToRenderer('AugmentBorderGold', "hudOne");
                ability.currentAugmentBorder.id = ability.name;
                ability.currentAugmentBorder.visible = false;
                ability.currentAugmentBorder.sortYOffset = 1000;
                ability.addSlave(ability.currentAugmentBorder);
            }
            var alphaAugment = .8;
            $.each(ability.augments, function(j, augment) {
                if(!augment.icon.parent) {
                    var a = graphicsUtils.addSomethingToRenderer(augment.icon, {position: {x: ability.position.x, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
                    var l = augment.lock = graphicsUtils.addSomethingToRenderer('LockIcon', {position: {x: ability.position.x, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudTwo'});
                    augment.lock.visible = false;
                    // augment.unlocked = true; //for debugging
                    var ab = augment.actionBox = graphicsUtils.addSomethingToRenderer('TransparentSquare', {position: {x: ability.position.x, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudTwo'});
                    graphicsUtils.makeSpriteSize(augment.actionBox, {x: 50, y: 50});
                    var b = augment.border = graphicsUtils.addSomethingToRenderer('AugmentBorder', {position: {x: ability.position.x, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
                    augment.border.sortYOffset = -10;
                    augment.actionBox.interactive = true;

                    ability.addSlave(a);
                    ability.addSlave(l);
                    ability.addSlave(ab);
                    ability.addSlave(b);

                    augment.actionBox.on('mousedown', function(event) {
                        if(ability.currentAugment != augment && augment.unlocked) {
                            //unequip existing augment
                            if(ability.currentAugment) {
                                if(ability.currentAugment.unequip)
                                    ability.currentAugment.unequip(this.prevailingUnit);
                                ability.currentAugment.border.scale = {x: 1, y: 1};
                                ability.currentAugment.border.alpha = alphaAugment;
                                ability.currentAugment.border.visible = true;
                            }

                            ability.currentAugmentBorder.position = augment.icon.position;
                            ability.currentAugmentBorder.visible = true;

                            //equip augment
                            ability.currentAugment = augment;
                            if(ability.currentAugment.equip) {
                                ability.currentAugment.equip(this.prevailingUnit);
                            }
                            equip.play();

                            //trigger event and trigger ability panel update
                            Matter.Events.trigger(this, 'augmentEquip', {augment: augment, unit: this.prevailingUnit})
                            this.unitPanelRef.updateUnitAbilities();
                        } else if(!augment.unlocked && unit.canUnlockSomething(augment)) {
                            unit.unlockSomething(augment);
                            Tooltip.makeTooltippable(augment.actionBox, {title: augment.title, description: augment.description, systemMessage: augment.systemMessage});
                            unlockAugmentSound.play();
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
                    Tooltip.makeTooltippable(augment.actionBox, {title: augment.title, description: augment.description, systemMessage: "Locked"});

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
            // this.abilityBases[i].position = {x: ability.position.x, y: gameUtils.getPlayableHeight()+1}
            // this.abilityBases[i].visible = true;
        }
    }.bind(this))
}

ConfigPanel.prototype.hideForCurrentUnit = function() {
    if(!this.prevailingUnit) {
        return;
    }

    //release current unit
    var unit = this.prevailingUnit;
    this.prevailingUnit = null;

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
    if(this.unitPanelRef.prevailingUnit && globals.currentGame.campLikeActive) {
        graphicsUtils.changeDisplayObjectStage(this.showButton, 'hudNOne');
        graphicsUtils.changeDisplayObjectStage(this.showButtonGlass, 'hudNOne');
        graphicsUtils.addOrShowDisplayObject(this.showButton);
        graphicsUtils.addOrShowDisplayObject(this.showButtonGlass);
        this.showButton.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()+this.configButtonHeight/2.75}
        this.showButton.state = "lowered";
        this.showButtonGlass.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()+this.configButtonGlassHeight/2.75}
    }
};

ConfigPanel.prototype.hideOpenButton = function() {
    this.showButton.visible = false;
    this.showButton.state = "hidden";
    this.showButtonGlass.visible = false;
    this.showButtonGlass.state = "hidden";
};

ConfigPanel.prototype.liftOpenButton = function() {
    graphicsUtils.changeDisplayObjectStage(this.showButton, 'hud');
    graphicsUtils.addOrShowDisplayObject(this.showButton);
    this.showButton.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()-this.configButtonHeight/2}
    this.showButton.scale = {x: 1.00, y: 1.00};
    this.showButton.state = "lifted";

    graphicsUtils.changeDisplayObjectStage(this.showButtonGlass, 'hud');
    graphicsUtils.addOrShowDisplayObject(this.showButtonGlass);
    this.showButtonGlass.position = {x: this.showButtonGlass.position.x, y: gameUtils.getPlayableHeight()-this.configButtonGlassHeight/2}
    this.showButtonGlass.scale = {x: 1.00, y: 1.00};
};

ConfigPanel.prototype.collidesWithPoint = function(point) {
    return (this.showButton.containsPoint(point));
};

ConfigPanel.prototype.cleanUp = function() {
    $('body').off('keydown.unitConfigurationPanel');
    graphicsUtils.removeSomethingFromRenderer(this.showButton);
    graphicsUtils.removeSomethingFromRenderer(this.showButtonGlass);
    $('body').off('mousemove.unitConfigurationPanel');
    $('body').off('mousedown.unitConfigurationPanel');
};

export default ConfigPanel;
