import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import Tooltip from '@core/Tooltip.js';
import * as Matter from 'matter-js';
import {globals, keyStates, mousePosition} from '@core/Fundamental/GlobalState.js';

var equipShow = gameUtils.getSound('menuopen1.wav', {volume: 0.08, rate: 1.0});
var equipHide = gameUtils.getSound('menuopen1.wav', {volume: 0.05, rate: 1.25});
var equip = gameUtils.getSound('augmentEquip.wav', {volume: 0.05, rate: 1.2});
var equip2 = gameUtils.getSound('augmentEquip.wav', {volume: 0.05, rate: 1.6});
var hoverAugmentSound = gameUtils.getSound('augmenthover.wav', {volume: 0.03, rate: 1});
var unlockAugmentSound = gameUtils.getSound('unlockability.wav', {volume: 0.16, rate: 1});
var cantdo = gameUtils.getSound('cantpickup.wav', {
    volume: 0.03,
    rate: 1.3
});

var ConfigPanel = function(unitPanel) {
    this.unitPanelRef = unitPanel;

    this.currentLevelIsConfigurable = function() {
        return globals.currentGame.isCurrentLevelConfigurable();
    };
};

ConfigPanel.prototype.flashPanel = function(unit) {
    if(this.flashTimer) {
        this.flashTimer.invalidate();
    }
    this.flashTimer = graphicsUtils.flashSprite({sprite: this.showButton, duration: 150, pauseDurationAtEnds: 80, times: 2, toColor: 0xe62f2f});
};

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
        if(this.currentLevelIsConfigurable()) {
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
        var mousePoint = mathArrayUtils.clonePosition(mousePosition);
        if(mousePoint.x <= passiveMax.x && mousePoint.x >= passiveMin.x && mousePoint.y <= passiveMax.y && mousePoint.y >= passiveMin.y) {
            if(this.showButton.state == 'lowered') {
                //(enlarge)
                this.showButtonSkinny.scale = {x: 1.05, y: 1.05};
                this.showButtonGlass.scale = {x: 0.32, y: 1.15};
            }
        } else {
            if(this.showButton.state == 'lowered') {
                this.showButtonSkinny.scale = {x: 1.00, y: 1.00};
                this.showButtonGlass.scale = {x: 0.3, y: 1.08};
            }
        }
    }.bind(this));

    $('body').on('mousedown.unitPassivePanel', function(event) {
        var mousePoint = mathArrayUtils.clonePosition(mousePosition);
        // gameUtils.pixiPositionToPoint(mousePoint, event);
        if(mousePoint.x <= passiveMax.x && mousePoint.x >= passiveMin.x && mousePoint.y <= passiveMax.y && mousePoint.y >= passiveMin.y) {
            if(this.showButton.state == 'lowered') {
                this.showForUnit(this.unitPanelRef.prevailingUnit);
            }
        }
    }.bind(this));
};

ConfigPanel.prototype.showForUnit = function(unit) {

    //set current unit
    this.prevailingUnit = unit;

    //hide showbutton and text
    this.liftOpenButton();

    //hide for last unit
    // this.hideForCurrentUnit();

    //play sounds
    equipShow.play();

    //show augments
    this.showPassives(unit);

    //flash panel
    this.flashPanel();
};

ConfigPanel.prototype.refreshForUnit = function(unit) {
    if(unit && this.showButton.state == 'lifted') {
        this.showPassives(unit);
    }
};

ConfigPanel.prototype.showPassives = function(unit) {
    var passiveCenterX = this.unitPanelRef.passiveCenterX;
    var alphaPassive = 0.8;

    if(!this.currentAttackPassiveBorder) {
        this.currentAttackPassiveBorder = graphicsUtils.addSomethingToRenderer('AugmentBorderWhite', {where: "hudOne", tint: 0xff1414});
        this.currentAttackPassiveBorder.visible = false;
        this.currentAttackPassiveBorder.sortYOffset = 1000;

        this.currentDefensePassiveBorder = graphicsUtils.addSomethingToRenderer('AugmentBorderWhite', {where: "hudOne", tint: 0x0094ff});
        this.currentDefensePassiveBorder.visible = false;
        this.currentDefensePassiveBorder.sortYOffset = 1000;
    } else {
        this.currentDefensePassiveBorder.visible = false;
        this.currentAttackPassiveBorder.visible = false;
    }

    // $.each(unit.passiveAbilities, function(j, passive) {
    $.each(unit.availablePassives, function(j, passive) {
        var yOffsetI = j % 3;
        if(!passive.icon) {
            let xpos = passiveCenterX + ((j % 2 == 0) ? -35 : 35);
            let shelf = Math.floor(j / 2);
            let position = {x: xpos, y: gameUtils.getPlayableHeight() + this.initialYOffset + shelf * this.spacing};
            passive.icon = graphicsUtils.addSomethingToRenderer(passive.textureName, {position: position, where: 'hudOne'});
            // passive.lock = graphicsUtils.addSomethingToRenderer('LockIcon', {position: position, where: 'hudTwo'});
            // passive.lock.visible = false;
            // passive.unlocked = true; //for debugging
            passive.actionBox = graphicsUtils.addSomethingToRenderer('TransparentSquare', {position: position, where: 'hudTwo'});

            //delay this for a sec... it takes some time to load the bitmap font and don't want a delay in bringing up the panel
            gameUtils.executeSomethingNextFrame(() => {
                this.prevailingUnit.freeUnlockSomething(passive);
            //     Tooltip.makeTooltippable(passive.actionBox, Object.assign({}, passive, {systemMessage: "Unlearned"}));
            });

            graphicsUtils.makeSpriteSize(passive.actionBox, {x: 50, y: 50});
            passive.border = graphicsUtils.addSomethingToRenderer('AugmentBorder', {position: position, where: 'hudOne'});
            passive.border.sortYOffset = -10;
            passive.actionBox.interactive = true;

            passive.addSlave(passive.icon, /*passive.lock,*/ passive.actionBox, passive.border);

            var lastPassive = null;
            var mindType = 'mind';
            passive.actionBox.on('mousedown', function(event) {
                if(keyStates.Control && passive.unlocked) {
                    if(!passive.defensePassive) {
                        if(passive.attackPassive) {
                            unit.unequipPassive(passive, {reequipping: true});
                            this.currentAttackPassiveBorder.visible = false;
                        }
                        lastPassive = unit.defensePassive;
                        if(lastPassive) {
                            unit.unequipPassive(lastPassive);
                        }
                        unit.equipPassive(passive, 'defensePassive');
                        Matter.Events.trigger(globals.currentGame.unitSystem, 'stateOfMindEquipped', {passive: passive, mode: 'defensive'});
                        graphicsUtils.addGleamToSprite({sprite: passive.icon, gleamWidth: 20, duration: 750});
                        this.unitPanelRef.updateUnitPassives();
                        equip.play();
                        this.currentDefensePassiveBorder.position = passive.icon.position;
                        this.currentDefensePassiveBorder.visible = true;
                    } else {
                        unit.unequipPassive(passive, {manual: true});
                        passive.border.scale = {x: 1, y: 1};
                        passive.border.alpha = 1;
                        passive.border.visible = true;
                        this.currentDefensePassiveBorder.visible = false;
                        this.unitPanelRef.updateUnitPassives();
                        equip2.play();
                    }
                } else {
                    if(!passive.attackPassive && passive.unlocked) {
                        if(passive.defensePassive) {
                            unit.unequipPassive(passive, {reequipping: true});
                            this.currentDefensePassiveBorder.visible = false;
                        }
                        lastPassive = unit.attackPassive;
                        if(lastPassive) {
                            unit.unequipPassive(lastPassive);
                        }
                        unit.equipPassive(passive, 'attackPassive');
                        Matter.Events.trigger(globals.currentGame.unitSystem, 'stateOfMindEquipped', {passive: passive, mode: 'aggression'});
                        graphicsUtils.addGleamToSprite({sprite: passive.icon, gleamWidth: 20, duration: 750});
                        this.unitPanelRef.updateUnitPassives();
                        equip.play();
                        this.currentAttackPassiveBorder.position = passive.icon.position;
                        this.currentAttackPassiveBorder.visible = true;
                    }  else if (passive.attackPassive) {
                        unit.unequipPassive(passive, {manual: true});
                        passive.border.scale = {x: 1, y: 1};
                        passive.border.alpha = 1;
                        passive.border.visible = true;
                        this.currentAttackPassiveBorder.visible = false;
                        this.unitPanelRef.updateUnitPassives();
                        equip2.play();
                    }
                }
                if(lastPassive) {
                    //un-adorn existing passive
                    lastPassive.border.scale = {x: 1, y: 1};
                    lastPassive.border.alpha = alphaPassive;
                    lastPassive.border.visible = true;
                    this.unitPanelRef.updateUnitPassives();
                } else if(!passive.unlocked) {
                    if(!unit.canUnlockSomething(mindType)) {
                        cantdo.play();
                        return;
                    }
                    unit.unlockSomething(mindType, passive);
                    Matter.Events.trigger(globals.currentGame.unitSystem, 'stateOfMindLearned', {unit: this.prevailingUnit, passive: passive});
                    unlockAugmentSound.play();
                    // passive.lock.visible = false;
                }
            }.bind(this));
            passive.actionBox.on('mouseover', function(event) {
                if(!passive.isEquipped) {
                    passive.border.alpha = 1;
                    graphicsUtils.makeSpriteSize(passive.border, 38);
                    hoverAugmentSound.play();
                }
            });
            passive.actionBox.on('mouseout', function(event) {
                if(!passive.isEquipped) {
                    passive.border.scale = {x: 1, y: 1};
                    passive.border.alpha = alphaPassive;
                }
            });
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
                // passive.lock.visible = true;
            }
        }
        passive.icon.visible = true;
        passive.actionBox.visible = true;
    }.bind(this));
};

ConfigPanel.prototype.hideForCurrentUnit = function() {
    if(this.showButton.state != 'lifted') {
        return;
    }

    //release current unit
    var unit = this.prevailingUnit;
    this.prevailingUnit = null;

    //hide augments
    $.each(unit.availablePassives, function(i, passive) {
        passive.icon.visible = false;
        passive.border.visible = false;
        passive.actionBox.tooltipObj.hide();
        passive.actionBox.visible = false;
        // passive.lock.visible = false;
        this.currentDefensePassiveBorder.visible = false;
        this.currentAttackPassiveBorder.visible = false;
    }.bind(this));

    equipHide.play();

    //show button again if we're still selecting something
    if(this.unitPanelRef.prevailingUnit) {
        this.lowerOpenButton();
    }
};

ConfigPanel.prototype.lowerOpenButton = function() {
    if(this.unitPanelRef.prevailingUnit && this.currentLevelIsConfigurable()) {
        graphicsUtils.changeDisplayObjectStage(this.showButton, 'hudNOne');
        graphicsUtils.changeDisplayObjectStage(this.showButtonGlass, 'hudNTwo');
        graphicsUtils.addOrShowDisplayObject(this.showButtonSkinny);
        this.showButtonSkinny.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()+this.configButtonHeight/2.75};
        this.showButton.state = "lowered";
        this.showButton.visible = false;
        this.showButtonGlass.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight()+this.configButtonGlassHeight/2.75};
        this.showButtonGlass.visible = true;
        this.showButtonSkinny.scale = {x: 1.00, y: 1.00};
        this.showButtonGlass.scale = {x: 0.3, y: 1.1};
        this.showButtonSkinny.visible = true;

        this.registerPassiveImpeder(this.showButtonSkinny);
    }
};

ConfigPanel.prototype.hideOpenButton = function() {
    //hide all passives first and lower the button
    this.hideForCurrentUnit();

    this.showButton.visible = false;
    this.showButton.state = "hidden";
    this.showButtonGlass.visible = false;
    this.showButtonGlass.state = "hidden";
    this.showButtonSkinny.visible = false;
    this.showButtonSkinny.state = "hidden";

    this.deregisterPassiveImpeder();
};

ConfigPanel.prototype.liftOpenButton = function() {
    var shelves = Math.floor((this.prevailingUnit.availablePassives.length-1) / 2) + 1;
    if(shelves == 0) {
        return;
    }
    var glassOffset = 32;
    var glassIncrement = (this.configButtonHeight-glassOffset)/3;

    graphicsUtils.changeDisplayObjectStage(this.showButton, 'hudNOne');
    graphicsUtils.addOrShowDisplayObject(this.showButton);
    this.showButton.position = {x: this.showButton.position.x, y: gameUtils.getPlayableHeight() + this.configButtonHeight/2 - glassOffset - (shelves * glassIncrement)};
    this.showButton.scale = {x: 1.00, y: 1.00};
    this.showButton.state = "lifted";
    this.showButton.visible = true;

    graphicsUtils.changeDisplayObjectStage(this.showButtonGlass, 'hudNOne');
    graphicsUtils.addOrShowDisplayObject(this.showButtonGlass);
    this.showButtonGlass.position = {x: this.showButtonGlass.position.x, y: gameUtils.getPlayableHeight() + this.configButtonGlassHeight/2 - glassOffset - (shelves * glassIncrement)};
    this.showButtonGlass.scale = {x: 1.00, y: 1.00};

    this.showButtonSkinny.visible = false;

    this.registerPassiveImpeder();
};

ConfigPanel.prototype.registerPassiveImpeder = function(widget) {
    widget = widget || this.showButton;
    let impederOpts = {
        x: mathArrayUtils.scaleScreenValueToWorldCoordinate(widget.getBounds().left),
        y: mathArrayUtils.scaleScreenValueToWorldCoordinate(widget.getBounds().top),
        width: mathArrayUtils.scaleScreenValueToWorldCoordinate(widget.width),
        height: mathArrayUtils.scaleScreenValueToWorldCoordinate(widget.height),
        id: 'passiveImpeder'
    };

    globals.currentGame.unitSystem.registerClickImpeder(mathArrayUtils.getImpeder(impederOpts));
};

ConfigPanel.prototype.deregisterPassiveImpeder = function() {
    globals.currentGame.unitSystem.deregisterClickImpeder('passiveImpeder');
};

ConfigPanel.prototype.collidesWithPoint = function(point) {
    return (this.showButton.visible && this.showButton.containsPoint(mathArrayUtils.scalePositionToScreenCoordinates(point)));
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
