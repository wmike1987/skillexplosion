import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import Tooltip from '@core/Tooltip.js'
import * as Matter from 'matter-js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'

var equipShow = gameUtils.getSound('menuopen1.wav', {volume: .08, rate: 1.0});
var equipHide = gameUtils.getSound('menuopen1.wav', {volume: .05, rate: 1.25});
var equip = gameUtils.getSound('augmentEquip.wav', {volume: .05, rate: 1.2});
var hoverAugmentSound = gameUtils.getSound('augmenthover.wav', {volume: .03, rate: 1});

var ConfigPanel = function(unitPanel) {
    this.unitPanelRef = unitPanel;
}

ConfigPanel.prototype.initialize = function() {
    this.id = mathArrayUtils.uuidv4();

    this.initialYOffset = -37;
    this.spacing = -62;

    //hide panel upon escape
    $('body').on('keydown.unitPassivePanel', function( event ) {
        var key = event.key.toLowerCase();
        if(key == 'escape') {
            this.hideForCurrentUnit();
        }
    }.bind(this));

    //close config windows when we click the canvas
    globals.currentGame.addListener("mousedown", function() {
        if(globals.currentGame.campActive) {
            this.hideForCurrentUnit();
        }
    }.bind(this), false, true);

    this.configButtonHeight = 218;
    this.configButtonGlassHeight = 218;
    this.showButton = graphicsUtils.createDisplayObject('PassivePanelBorder', {where: 'hudNOne', position: {x: this.unitPanelRef.passiveCenterX, y: gameUtils.getPlayableHeight()+this.configButtonHeight/3}});
    this.showButton.interactive = true;
    this.showButtonSkinny = graphicsUtils.createDisplayObject('PassivePanelSkinny', {where: 'hudNOne', position: {x: this.unitPanelRef.passiveCenterX, y: gameUtils.getPlayableHeight()+this.configButtonHeight/3}});
    this.showButtonSkinny.interactive = true;
    this.showButtonGlass = graphicsUtils.createDisplayObject('PassivePanelGlass', {where: 'hudNOne', position: {x: this.unitPanelRef.passiveCenterX, y: gameUtils.getPlayableHeight()+this.configButtonGlassHeight/3}});
    graphicsUtils.graduallyTint(this.showButtonGlass, 0x62f6db, 0xd1b877, 15000, null, 5000);

    var passiveMin = {x: this.unitPanelRef.passiveCenterX - 22, y: gameUtils.getPlayableHeight() - 40};
    var passiveMax = {x: this.unitPanelRef.passiveCenterX + 22, y: gameUtils.getCanvasHeight()};
    $('body').on('mousemove.unitPassivePanel', function(event) {
        var mousePoint = {x: 0, y: 0};
        gameUtils.pixiPositionToPoint(mousePoint, event);
        if(mousePoint.x <= passiveMax.x && mousePoint.x >= passiveMin.x && mousePoint.y <= passiveMax.y && mousePoint.y >= passiveMin.y) {
            if(this.showButton.state == 'lowered') {
                //(enlarge)
                this.showButtonSkinny.scale = {x: 1.05, y: 1.05};
                this.showButtonGlass.scale = {x: .32, y: 1.15};
            }
        } else {
            if(this.showButton.state == 'lowered') {
                this.showButtonSkinny.scale = {x: 1.00, y: 1.00};
                this.showButtonGlass.scale = {x: .3, y: 1.08};
            }
        }
    }.bind(this))

    $('body').on('mouseup.unitPassivePanel', function(event) {
        var mousePoint = {x: 0, y: 0};
        gameUtils.pixiPositionToPoint(mousePoint, event);
        if(mousePoint.x <= passiveMax.x && mousePoint.x >= passiveMin.x && mousePoint.y <= passiveMax.y && mousePoint.y >= passiveMin.y) {
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
    this.showPassives(unit);
};

ConfigPanel.prototype.showPassives = function(unit) {
    var passiveCenterX = this.unitPanelRef.passiveCenterX;
    var alphaPassive = .8;

    if(!this.currentAttackPassiveBorder) {
        this.currentAttackPassiveBorder = graphicsUtils.addSomethingToRenderer('AugmentBorderGold', {where: "hudOne", tint: 0xf90007});
        this.currentAttackPassiveBorder.visible = false;
        this.currentAttackPassiveBorder.sortYOffset = 1000;

        this.currentDefensePassiveBorder = graphicsUtils.addSomethingToRenderer('AugmentBorderGold', {where: "hudOne", tint: 0x1c5cff});
        this.currentDefensePassiveBorder.visible = false;
        this.currentDefensePassiveBorder.sortYOffset = 1000;
    }
    $.each(unit.passiveAbilities, function(j, passive) {
        var xpos;
        if(j < 3) {
            xpos = passiveCenterX - 35
        } else {
            xpos = passiveCenterX + 35
        }
        if(!passive.icon) {
            passive.icon = graphicsUtils.addSomethingToRenderer(passive.textureName, {position: {x: xpos, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
            passive.lock = graphicsUtils.addSomethingToRenderer('LockIcon', {position: {x: xpos, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudTwo'});
            passive.lock.visible = false;
            passive.unlocked = true; //for debugging
            passive.actionBox = graphicsUtils.addSomethingToRenderer('TransparentSquare', {position: {x: xpos, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudTwo'});
            Tooltip.makeTooltippable(passive.actionBox, passive);
            graphicsUtils.makeSpriteSize(passive.actionBox, {x: 50, y: 50});
            passive.border = graphicsUtils.addSomethingToRenderer('AugmentBorder', {position: {x: xpos, y:gameUtils.getPlayableHeight() + this.initialYOffset + this.spacing*(j)}, where: 'hudOne'});
            passive.border.sortYOffset = -10;
            passive.actionBox.interactive = true;

            passive.addSlave(passive.icon, passive.lock, passive.actionBox, passive.border);

            passive.actionBox.on('mousedown', function(event) {
                if(keyStates['Control']) {
                    if(!passive.defensePassive) {
                        if(passive.attackPassive) {
                            unit.unequipPassive(passive);
                            this.currentAttackPassiveBorder.visible = false;
                        }
                        var lastPassive = unit.defensePassive;
                        if(lastPassive) {
                            unit.unequipPassive(lastPassive);
                        }
                        unit.equipPassive(passive, 'defensePassive');
                        this.unitPanelRef.updateUnitPassives();
                        equip.play();
                        this.currentDefensePassiveBorder.position = passive.icon.position;
                        this.currentDefensePassiveBorder.visible = true;
                    }
                } else {
                    if(!passive.attackPassive) {
                        if(passive.defensePassive) {
                            unit.unequipPassive(passive);
                            this.currentDefensePassiveBorder.visible = false;
                        }
                        var lastPassive = unit.attackPassive;
                        if(lastPassive) {
                            unit.unequipPassive(lastPassive);
                        }
                        unit.equipPassive(passive, 'attackPassive');
                        this.unitPanelRef.updateUnitPassives();
                        equip.play();
                        this.currentAttackPassiveBorder.position = passive.icon.position;
                        this.currentAttackPassiveBorder.visible = true
                    }
                }
                if(lastPassive) {
                    //un-adorn existing passive
                    lastPassive.border.scale = {x: 1, y: 1};
                    lastPassive.border.alpha = alphaPassive;
                    lastPassive.border.visible = true;

                    //trigger event and trigger ability panel update
                    Matter.Events.trigger(this, 'passiveEquip', {passive: passive, unit: this.currentUnit})
                    this.unitPanelRef.updateUnitPassives();
                } else if(!passive.unlocked && unit.canUnlockAugment(passive)) {
                    unit.unlockAugment(passive);
                    passive.lock.visible = false;
                }
            }.bind(this))
            passive.actionBox.on('mouseover', function(event) {
                if(!passive.isEquipped) {
                    passive.border.alpha = 1;
                    passive.border.scale = {x: 1.1, y: 1.1};
                    hoverAugmentSound.play();
                }
            })
            passive.actionBox.on('mouseout', function(event) {
                if(!passive.isEquipped) {
                    passive.border.scale = {x: 1, y: 1};
                    passive.border.alpha = alphaPassive;
                }
            })
        }
        if(passive.isEquipped) {
            passive.icon.alpha = 1;
            passive.border.alpha = 0;
            passive.border.visible = false;
            if(passive.attackPassive) {
                this.currentAttackPassiveBorder.visible = true;
                this.currentAttackPassiveBorder.position = passive.icon.position;
            } else {
                this.currentDefensePassiveBorder.visible = true;
                this.currentDefensePassiveBorder.position = passive.icon.position;
            }
        } else {
            passive.icon.alpha = 1;
            passive.border.alpha = alphaPassive;
            passive.border.visible = true;
            if(!passive.unlocked) {
                passive.lock.visible = true;
            }
        }
        passive.icon.visible = true;
        passive.actionBox.visible = true;
    }.bind(this))
}

ConfigPanel.prototype.hideForCurrentUnit = function() {
    if(!this.currentUnit) {
        return;
    }

    //release current unit
    var unit = this.currentUnit;
    this.currentUnit = null;

    //hide augments
    $.each(unit.passiveAbilities, function(i, passive) {
        passive.icon.visible = false;
        passive.border.visible = false;
        passive.actionBox.tooltipObj.hide();
        passive.actionBox.visible = false;
        passive.lock.visible = false;
        this.currentDefensePassiveBorder.visible = false;
        this.currentAttackPassiveBorder.visible = false;
    }.bind(this))

    equipHide.play();

    //show button again if we're still selecting something
    if(this.unitPanelRef.prevailingUnit) {
        this.lowerOpenButton();
    }
};

ConfigPanel.prototype.lowerOpenButton = function() {
    if(this.unitPanelRef.prevailingUnit && globals.currentGame.campActive) {
        graphicsUtils.changeDisplayObjectStage(this.showButton, 'hudNOne');
        graphicsUtils.changeDisplayObjectStage(this.showButtonGlass, 'hudNTwo');
        graphicsUtils.addOrShowDisplayObject(this.showButtonSkinny);
        this.showButtonSkinny.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()+this.configButtonHeight/2.75}
        this.showButton.state = "lowered";
        this.showButton.visible = false;
        this.showButtonGlass.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()+this.configButtonGlassHeight/2.75}
        this.showButtonSkinny.scale = {x: 1.00, y: 1.00};
        this.showButtonGlass.scale = {x: .3, y: 1.1};
        this.showButtonSkinny.visible = true;
    }
};

ConfigPanel.prototype.hideOpenButton = function() {
    this.showButton.visible = false;
    this.showButton.state = "hidden";
    this.showButtonGlass.visible = false;
    this.showButtonGlass.state = "hidden";
    this.showButtonSkinny.visible = false;
    this.showButtonSkinny.state = "hidden";
};

ConfigPanel.prototype.liftOpenButton = function() {
    graphicsUtils.changeDisplayObjectStage(this.showButton, 'hud');
    graphicsUtils.addOrShowDisplayObject(this.showButton);
    this.showButton.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()-this.configButtonHeight/2}
    this.showButton.scale = {x: 1.00, y: 1.00};
    this.showButton.state = "lifted";
    this.showButton.visible = true;

    graphicsUtils.changeDisplayObjectStage(this.showButtonGlass, 'hud');
    graphicsUtils.addOrShowDisplayObject(this.showButtonGlass);
    this.showButtonGlass.position = {x: this.showButtonGlass.position.x, y: gameUtils.getPlayableHeight()-this.configButtonGlassHeight/2}
    this.showButtonGlass.scale = {x: 1.00, y: 1.00};

    this.showButtonSkinny.visible = false;
};

ConfigPanel.prototype.cleanUp = function() {
    $('body').off('keydown.unitPassivePanel');
    graphicsUtils.removeSomethingFromRenderer(this.showButton);
    graphicsUtils.removeSomethingFromRenderer(this.showButtonGlass);
    graphicsUtils.removeSomethingFromRenderer(this.showButtonSkinny);
    graphicsUtils.removeSomethingFromRenderer(this.currentDefensePassiveBorder);
    graphicsUtils.removeSomethingFromRenderer(this.currentActivePassiveBorder);
    $('body').off('mousemove.unitPassivePanel');
    $('body').off('mousedown.unitPassivePanel');
};

export default ConfigPanel;
