import * as Matter from 'matter-js'
import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import styles from '@utils/Styles.js'
import Tooltip from '@core/Tooltip.js'
import ucp from '@games/Us/UnitAugmentPanel.js'
import upp from '@games/Us/PassivePanel.js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'

//This module represents a tile map. This is produced by the tile mapper
var unitPanel = function(options) {
    this.unitSystem = options.systemRef;
    this.position = options.position;
    this.prevailingUnit = null; //the unit in focus
    this.currentPortrait = null;
    this.selectedUnits = [];
    this.currentAbilities = [];
    this.currentCommands = [];
    this.itemSystem = null;
    this.autoCastSound = gameUtils.getSound('autocasttoggle.wav', {volume: .03, rate: 1.0});

    this.barOffset = 8; //top bar offset;
    this.centerX = gameUtils.getUnitPanelCenter().x;
    this.centerY = gameUtils.getUnitPanelCenter().y + this.barOffset/2;

    //position variables
    this.unitPortraitPosition = {x: this.centerX, y: this.centerY};

    //unit status variables
    this.unitStatSpacing = 20;
    this.unitStatYOffset = -9;
    this.unitFrameCenterX = this.centerX - 226;
    this.unitFrameOffset = 81.5/16;
    this.unitNamePosition = {x: this.unitFrameCenterX, y: this.centerY - this.unitStatSpacing + this.unitStatYOffset};
    //this.unitLevelPosition = {x: this.unitFrameCenterX+this.unitFrameOffset, y: this.centerY - this.unitStatSpacing + this.unitStatYOffset};
    this.unitDamagePosition = {x: this.unitFrameCenterX-this.unitFrameOffset*15, y: this.centerY + this.unitStatYOffset};
    this.unitArmorPosition = {x: this.unitFrameCenterX-this.unitFrameOffset*15, y: this.centerY + this.unitStatSpacing + this.unitStatYOffset};
    this.unitHealthPosition = {x: this.unitFrameCenterX-this.unitFrameOffset*15, y: this.centerY + this.unitStatSpacing*2 + this.unitStatYOffset};
    this.unitGritPosition = {x: this.unitFrameCenterX+this.unitFrameOffset*2, y: this.centerY + this.unitStatYOffset};
    this.unitDodgePosition = {x: this.unitFrameCenterX+this.unitFrameOffset*2, y: this.centerY + this.unitStatSpacing + this.unitStatYOffset};
    this.unitEnergyPosition = {x: this.unitFrameCenterX+this.unitFrameOffset*2, y: this.centerY + this.unitStatSpacing*2 + this.unitStatYOffset};

    this.unitNameText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitNamePosition, where: 'hudOne', style: styles.unitNameStyle});
    //this.unitLevelText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitLevelPosition, where: 'hudOne', style: styles.unitLevelStyle});
    this.unitDamageText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitDamagePosition, where: 'hudOne', style: styles.unitDamageStyle, anchor: {x: 0, y: .5}});
    this.unitDamageAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:--', {anchor: {x: 0, y: .5}, position: this.unitDamagePosition, where: 'hudOne', style: styles.unitDamageAdditionsStyle});
    this.unitDefenseText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitArmorPosition, where: 'hudOne', style: styles.unitDefenseStyle, anchor: {x: 0, y: .5}});
    this.unitDefenseAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:--', {anchor: {x: 0, y: .5}, position: this.unitArmorPosition, where: 'hudOne', style: styles.unitDefenseAdditionsStyle});
    this.unitHealthText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitHealthPosition, where: 'hudOne', style: styles.unitGeneralHPStyle, anchor: {x: 0, y: .5}});
    this.unitGritText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitGritPosition, where: 'hudOne', style: styles.unitGritStyle, anchor: {x: 0, y: .5}});
    Tooltip.makeTooltippable(this.unitGritText, {title: 'Grit', updaters: {description: function() {
        var result = {index: 0, value: ''};
        if(this.prevailingUnit) {
            result.value = 'Regenerate hp at 2x rate while below ' + (this.prevailingUnit.grit + this.prevailingUnit.getGritAdditionSum()) + '% total health.'
        }
        return result;
    }.bind(this)}});
    this.unitGritAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:--', {anchor: {x: 0, y: .5}, position: this.unitGritPosition, where: 'hudOne', style: styles.unitGritAdditionsStyle});
    this.unitDodgeText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitDodgePosition, where: 'hudOne', style: styles.unitDodgeStyle, anchor: {x: 0, y: .5}});
    Tooltip.makeTooltippable(this.unitDodgeText, {title: 'Dodge', updaters: {description: function() {
        var result = {index: 0, value: 'Chance to dodge attack.'};
        if(this.prevailingUnit) {
            result.value = (this.prevailingUnit.dodge + this.prevailingUnit.getDodgeAdditionSum()) + '% chance to dodge attack.'
        }
        return result;
    }.bind(this)}});
    this.unitDodgeAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:--', {anchor: {x: 0, y: .5}, position: this.unitDodgePosition, where: 'hudOne', style: styles.unitDodgeAdditionsStyle});
    this.unitEnergyText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitEnergyPosition, where: 'hudOne', style: styles.unitGeneralEnergyStyle, anchor: {x: 0, y: .5}});

    //experience meter
    this.experienceMeter = graphicsUtils.addSomethingToRenderer('TintableSquare', {position: {x: 0, y: gameUtils.getPlayableHeight()+1}, anchor: {x: 0, y: 0}, where: 'hudOne'});
    this.experienceMeter.alpha = .5;
    this.experienceMeter.visible = false;

    //health vial
    this.vialDimensions = {w: 24, h: 90};
    this.healthVialCenterY = this.centerY + 1;
    this.healthVialCenterX = this.centerX - 58;
    this.healthVialPosition = {x: this.healthVialCenterX, y: this.healthVialCenterY};
    this.healthVial = graphicsUtils.addSomethingToRenderer('Vial', {position: this.healthVialPosition, where: 'hudOne'});
    var hvtt = Tooltip.makeTooltippable(this.healthVial, {title: "Health", systemMessage: ['--------', '--------'], descriptionStyle: styles.HPTTStyle, noDelay: true, updaters: {mainDescription: function(tooltip) {
        if(this.prevailingUnit) {
            var txt = Math.floor(this.prevailingUnit.currentHealth) + "/" + this.prevailingUnit.maxHealth;
            tooltip.mainDescription.style.fill = graphicsUtils.percentAsHexColor(this.prevailingUnit.currentHealth/this.prevailingUnit.maxHealth);
        }
        return txt;
    }.bind(this), mainSystemMessage: function() {
        var result = {key: 'systemMessages', index: 1};
        if(this.prevailingUnit) {
            var txt = 'Regen: +' + (this.prevailingUnit.getTotalHealthRegeneration()) + " hp/sec";
        }
        result.value = txt;
        return result;
    }.bind(this), gritUpdater: function() {
        if(this.prevailingUnit) {
            var result = {key: 'systemMessages', index: 0};
            var gritAmount = Math.floor((this.prevailingUnit.grit + this.prevailingUnit.getGritAdditionSum())/100 * this.prevailingUnit.maxHealth);
            result.value = 'Grit: ' + gritAmount  +' hp';
            return result;
        }
        return null;
    }.bind(this)}})
    graphicsUtils.makeSpriteSize(this.healthVial, this.vialDimensions);

    this.healthBubbles = gameUtils.getAnimation({
        spritesheetName: 'UtilityAnimations1',
        animationName: 'bubbles',
        speed: .9,
        playThisManyTimes: 'loop',
        anchor: {x: .5, y: 1},
        transform: [this.healthVialPosition.x, gameUtils.getCanvasHeight() + 10, 1.5, 1.5],
    });
    graphicsUtils.makeSpriteSize(this.healthBubbles, {w: 40, h: 80});
    this.healthBubbles.visible = false;
    this.healthBubbles.tint = 0xff8080;
    this.healthBubbles.alpha = 1;
    this.healthBubbles.play();
    graphicsUtils.addSomethingToRenderer(this.healthBubbles, 'hud');

    this.healthVialSquare = graphicsUtils.createDisplayObject('TintableSquare', {tint: 0xa80000, scale: {x: 1, y: 1}, alpha: .8, anchor: {x: .5, y: 1}});
    this.healthVialSquare.position = {x: this.healthVialPosition.x, y: gameUtils.getCanvasHeight()}
    graphicsUtils.makeSpriteSize(this.healthVialSquare,  {x: 0, y: 0});
    graphicsUtils.addSomethingToRenderer(this.healthVialSquare, 'hudNOne');

    this.gritIndicator = graphicsUtils.createDisplayObject('TintableSquare', {tint: 0x717a04, scale: {x: 1, y: 1}, alpha: .6, anchor: {x: .5, y: 1}});
    this.gritIndicator.position = {x: this.healthVialPosition.x, y: gameUtils.getCanvasHeight()}
    graphicsUtils.addSomethingToRenderer(this.gritIndicator, 'hudNOne');
    this.gritIndicator.sortYOffset += 2000;
    this.gritIndicator.visible = false;

    //energy vial
    this.energyVialCenterY = this.centerY + 1;
    this.energyVialCenterX = this.centerX + 58;
    this.energyVialPosition = {x: this.energyVialCenterX, y: this.energyVialCenterY};
    this.energyVial = graphicsUtils.addSomethingToRenderer('Vial2', {position: this.energyVialPosition, where: 'hud'});
    Tooltip.makeTooltippable(this.energyVial, {title: "Energy", systemMessage: "+X energy/sec", descriptionStyle: styles.EnergyTTStyle, noDelay: true, updaters: {mainDescription: function(tooltip) {
        if(this.prevailingUnit) {
            var txt = Math.floor(this.prevailingUnit.currentEnergy) + "/" + this.prevailingUnit.maxEnergy;
        }
        return txt;
    }.bind(this), mainSystemMessage: function() {
        var result = {key: 'systemMessages', index: 0};
        if(this.prevailingUnit) {
            var txt = 'Regen: +' + this.prevailingUnit.getTotalEnergyRegeneration() + " energy/sec";
        }
        result.value = txt;
        return result;
    }.bind(this)}})
    graphicsUtils.makeSpriteSize(this.energyVial, this.vialDimensions);

    this.energyBubbles = gameUtils.getAnimation({
        spritesheetName: 'UtilityAnimations1',
        animationName: 'bubbles',
        speed: .5,
        playThisManyTimes: 'loop',
        anchor: {x: .5, y: 1},
        transform: [this.energyVialPosition.x, gameUtils.getCanvasHeight() + 10, 2.0, 1.5]
    });
    graphicsUtils.makeSpriteSize(this.energyBubbles, {w: 40, h: 80});
    this.energyBubbles.visible = false;
    this.energyBubbles.tint = 0xc2e808;
    this.energyBubbles.alpha = .5;
    this.energyBubbles.play();
    graphicsUtils.addSomethingToRenderer(this.energyBubbles, 'hud');

    this.energyVialSquare = graphicsUtils.createDisplayObject('TintableSquare', {tint: 0x5d0b55, scale: {x: 1, y: 1}, alpha: .9, anchor: {x: .5, y: 1}});
    graphicsUtils.graduallyTint(this.energyVialSquare, 0x5d0b55, 0x6b0090, 1500, null, 1000);
    this.energyVialSquare.position = {x: this.energyVialPosition.x, y: gameUtils.getCanvasHeight()}
    graphicsUtils.makeSpriteSize(this.energyVialSquare, {x: 0, y: 0});
    graphicsUtils.addSomethingToRenderer(this.energyVialSquare, 'hudNOne');

    //health vial and engery vial
    this.updateHealthAndEnergyVialTick = globals.currentGame.addTickCallback(function() {
        if(this.prevailingUnit) {
            this.healthVialSquare.visible = true;
            this.gritIndicator.visible = true;
            this.healthBubbles.visible = true;
            this.energyVialSquare.visible = true;
            this.energyBubbles.visible = true;
            this.healthVial.tooltipObj.disabled = false;
            this.energyVial.tooltipObj.disabled = false;
            var healthPercent = this.prevailingUnit.currentHealth / this.prevailingUnit.maxHealth;
            graphicsUtils.makeSpriteSize(this.healthVialSquare, {x: this.vialDimensions.w, y: this.vialDimensions.h * healthPercent});
            graphicsUtils.makeSpriteSize(this.healthBubbles, {x: this.vialDimensions.w, y: this.vialDimensions.h * healthPercent});

            //update grit
            var gritPercent = Math.min(1.0, (this.prevailingUnit.grit + this.prevailingUnit.getGritAdditionSum())/100);
            if(healthPercent < gritPercent) {
                graphicsUtils.makeSpriteSize(this.gritIndicator, {x: this.vialDimensions.w, y: this.vialDimensions.h * healthPercent});
            } else {
                graphicsUtils.makeSpriteSize(this.gritIndicator, {x: this.vialDimensions.w, y: this.vialDimensions.h * gritPercent});
            }

            if(this.prevailingUnit.maxEnergy > 0) {
                var energyPercent = this.prevailingUnit.currentEnergy / this.prevailingUnit.maxEnergy;
            } else {
                var energyPercent = 0;
            }
            graphicsUtils.makeSpriteSize(this.energyVialSquare, {x: this.vialDimensions.w, y: this.vialDimensions.h * energyPercent});
            graphicsUtils.makeSpriteSize(this.energyBubbles, {x: this.vialDimensions.w, y: this.vialDimensions.h * energyPercent});
        } else {
            this.healthVialSquare.visible = false;
            this.gritIndicator.visible = false;
            this.healthBubbles.visible = false;
            this.energyVialSquare.visible = false;
            this.energyBubbles.visible = false;
            this.healthVial.tooltipObj.disabled = true;
            this.energyVial.tooltipObj.disabled = true;
        }
    }.bind(this));

    //unit passive variables
    this.passiveCenterX = this.centerX - 121;
    this.passiveTopCenterY = this.centerY - 28;
    this.passiveBottomCenterY = this.centerY + 17;

    //unit ability variables
    this.abilitySpacing = 77;
    this.abilityOneCenterX = this.centerX + 178;
    this.abilityCenterX = this.centerX + 178 + this.abilitySpacing;
    this.abilityOneCenterY = this.centerY-1;
    this.abililtyWithBorderWidth = 64;
    this.abililtyWidth = 60;

    //basic command variables
    this.commandSpacing = 35;
    this.commandOneCenterX = this.centerX + 407;
    this.commandOneCenterY = this.centerY - 25;

    //selected-group variables
    this.wireframeSize = 55;
    this.groupCenterY = this.centerY;
    this.groupCenterX = 1 + this.wireframeSize/2;
    this.groupSpacing = 0 + this.wireframeSize;

    //item variables
    this.itemCenterX = this.centerX + 85.5;
    this.itemCenterY = gameUtils.getPlayableHeight() + this.barOffset + 2 /* the 2 is a little buffer area */ + 13;
    this.itemXSpacing = 30;
    this.itemYSpacing = 30;

    //specialty item variables
    this.spItemCenterX = this.centerX - 85.5;
    this.spItemCenterY = gameUtils.getPlayableHeight() + this.barOffset + 2 /* the 2 is a little buffer area */ + 13;
    this.spItemYSpacing = 30;

    //backpack item variables
    this.bpItemCenterX = this.centerX + 402;
    this.bpItemCenterY = this.centerY + 20;
    this.bpItemXSpacing = 30;

    //create frame
    this.frame = graphicsUtils.createDisplayObject('UnitPanelFrame', {persists: true, position: this.position});
    this.frame.interactive = true;
    this.frameBacking = graphicsUtils.createDisplayObject('TintableSquare', {persists: true, position: this.position, tint: 0x5e5e5b});
    graphicsUtils.makeSpriteSize(this.frameBacking, {w: gameUtils.getCanvasWidth(), h: gameUtils.getUnitPanelHeight()});
};

unitPanel.prototype.initialize = function(options) {

    //create unitAugmentPanel
    this.unitAugmentPanel = new ucp(this);
    this.unitAugmentPanel.initialize();

    //create passive panel
    this.unitPassivePanel = new upp(this);
    this.unitPassivePanel.initialize();

    //add frame-backing to world
    graphicsUtils.addSomethingToRenderer(this.frameBacking, 'hudNTwo');

    //add frame to world
    graphicsUtils.addSomethingToRenderer(this.frame, 'hud');

    //listen for when the prevailing unit changes
    Matter.Events.on(this.unitSystem, 'prevailingUnitChange', function(event) {
        this.updatePrevailingUnit(event.unit);
    }.bind(this))

    //listen for when the prevailing unit changes
    Matter.Events.on(this.unitSystem, 'unitPassiveRefresh', function(event) {
        this.displayUnitPassives(event.unit);
    }.bind(this))

    //listen for item pickup
    if(globals.currentGame.itemSystem) {
        Matter.Events.on(globals.currentGame.itemSystem, 'pickupItem', function(event) {
            if(this.prevailingUnit == event.unit) {
                this.updateUnitItems();
            }
        }.bind(this))

        Matter.Events.on(globals.currentGame.itemSystem, 'unitUnequippedItem', function(event) {
            if(this.prevailingUnit == event.unit) {
                event.item.icon.tooltipObj.hide();
                event.item.icon.visible = false;
            }
        }.bind(this))
    }

    //listen for when the selected group changes
    Matter.Events.on(this.unitSystem, 'selectedUnitsChange', function(event) {
        this.updateUnitGroup(event.orderedSelection);
    }.bind(this))

    //listen for event dispatch and blink sprites if needed
    Matter.Events.on(this.unitSystem, 'unitSystemEventDispatch', function(event) {
        var abilityTint = 0x80ba80;
        if(this.prevailingUnit.abilities) {
            $.each(this.prevailingUnit.abilities, function(i, ability) {
                if(ability.key == event.id && ability.type == event.type && !ability.handlesOwnBlink) {
                    graphicsUtils.makeSpriteBlinkTint({sprite: ability.icon, tint: abilityTint, speed: 100})
                }
            }.bind(this))
        }

        if(this.prevailingUnit.commands) {
            var commandTint = 0xa2fa93;
            $.each(this.prevailingUnit.commands, function(name, command) {
                if(command.key == event.id && command.type == event.type) {
                    if(name == 'attack') {
                        graphicsUtils.makeSpriteBlinkTint({sprite: this.attackMoveIcon, tint: commandTint, speed: 100});
                    } else if(name == 'move') {
                        graphicsUtils.makeSpriteBlinkTint({sprite: this.moveIcon, tint: commandTint, speed: 100})
                    } else if(name == 'stop') {
                        graphicsUtils.makeSpriteBlinkTint({sprite: this.stopIcon, tint: commandTint, speed: 100})
                    } else if(name == 'holdPosition') {
                        graphicsUtils.makeSpriteBlinkTint({sprite: this.holdPositionIcon, tint: commandTint, speed: 100})
                    }
                }
            }.bind(this))
        }
    }.bind(this))

    Matter.Events.on(globals.currentGame, 'enteringCamp', this.enterCamp.bind(this));
    Matter.Events.on(globals.currentGame, 'enteringLevel', this.leaveCamp.bind(this));
};

//unit group
unitPanel.prototype.updateUnitGroup = function(units) {
    this.clearUnitGroup();
    this.selectedUnits = units;
    $.each(this.selectedUnits, function(i, unit) {
        if(unit.wireframe) {
            var wireframe = unit.wireframe;
            if(!wireframe.parent) {
                var wiref = graphicsUtils.addSomethingToRenderer(wireframe, 'hudOne');
                gameUtils.deathPact(unit, wiref);
                wireframe.interactive = true;
                wireframe.on('mouseup', function(event) {
                    this.unitSystem.selectedUnit = unit;
                }.bind(this))
            }
            wireframe.position = {x: this.groupCenterX + i * this.groupSpacing, y: this.groupCenterY};
            graphicsUtils.makeSpriteSize(wireframe, this.wireframeSize);
            wireframe.visible = true;
        }
    }.bind(this))

    this.highlightGroupUnit(this.prevailingUnit);
};


unitPanel.prototype.clearUnitGroup = function() {
    $.each(this.selectedUnits, function(i, unit) {
        if(unit.wireframe) {
            unit.wireframe.visible = false;
        }
    })
};

unitPanel.prototype.highlightGroupUnit = function(prevailingUnit) {
    $.each(this.selectedUnits, function(i, unit) {
        if(unit.wireframe) {
            if(unit == prevailingUnit) {
                graphicsUtils.makeSpriteSize(unit.wireframe, this.wireframeSize);
                unit.wireframe.tint = 0xFFFFFF;
            } else {
                graphicsUtils.makeSpriteSize(unit.wireframe, this.wireframeSize*.7);
                unit.wireframe.tint = 0xb3b3b3;
            }
        }
    }.bind(this))
};

//unit specific display
unitPanel.prototype.updatePrevailingUnit = function(unit) {

    //flush
    if(this.prevailingUnit) {
        this.clearPrevailingUnit({transitioningUnits: unit});
        this.unitAugmentPanel.hideForCurrentUnit();
        this.unitPassivePanel.hideForCurrentUnit();
    }

    //fill
    if(unit) {
        this.prevailingUnit = unit;
        this.displayUnitPortrait();
        this.displayUnitStats();
        this.displayUnitAbilities();
        this.displayUnitPassives();
        this.displayCommands();
        this.highlightGroupUnit(unit);
        this.updateUnitItems(unit);

        //show augment button
        this.unitAugmentPanel.lowerOpenButton();
        this.unitPassivePanel.lowerOpenButton();
    }

};

unitPanel.prototype.clearPrevailingUnit = function(options) {
    //clear items
    this.clearUnitItems();

    //turn off portrait
    if(this.currentPortrait)
        this.currentPortrait.visible = false;

    //hide augment button
    this.unitAugmentPanel.hideOpenButton();

    //hide passive button
    this.unitPassivePanel.hideOpenButton();

    //blank out unit stat panel
    if(!options.transitioningUnits) {
        this.unitNameText.text = '-----';
        //this.unitLevelText.text = '--';
        this.unitDamageText.text = '';
        this.unitDamageAdditionsText.text = '';
        this.unitDefenseText.text = '';
        this.unitDefenseAdditionsText.text = '';
        this.unitHealthText.text = '';
        this.unitGritText.text = '';
        this.unitGritAdditionsText.text = '';
        this.unitDodgeText.text = '';
        this.unitDodgeAdditionsText.text = '';
        this.unitEnergyText.text = '';
    }

    //clear exp bar
    if(!options.transitioningUnits) {
        this.experienceMeter.visible = false;
    }

    //clear unit ability icons
    if(this.currentAbilities) {
        $.each(this.currentAbilities, function(i, ability) {
            ability.icon.visible = false;
            ability.icon.tooltipObj.hide();
            if(ability.currentAugmentIcon) {
                ability.currentAugmentIcon.tooltipObj.hide();
                ability.currentAugmentIcon.visible = false;
                ability.currentAugmentBorderIcon.visible = false;
            }
            if(ability.abilityBorder) {
                ability.abilityBorder.visible = false;
            }
        })
    }
    this.currentAbilities = null;

    //clear passives
    this.updateUnitPassives({clear: true});

    //clear commands
    if(this.currentCommands) {
        $.each(this.currentCommands, function(i, command) {
            command.icon.visible = false;
        })
    };

    this.prevailingUnit = null;
};

unitPanel.prototype.displayUnitPortrait = function() {
    this.currentPortrait = this.prevailingUnit.portrait;
    if(!this.currentPortrait) return;

    if(!this.currentPortrait.parent) {
        var port = graphicsUtils.addSomethingToRenderer(this.currentPortrait, 'hudOne');
        gameUtils.deathPact(this.prevailingUnit, port);
    } else {
        this.currentPortrait.visible = true;
    }
    graphicsUtils.makeSpriteSize(this.currentPortrait, 90);
    this.currentPortrait.position = this.unitPortraitPosition;
};

unitPanel.prototype.updateUnitItems = function() {
    if(this.prevailingUnit) {
        //regular items
        $.each(this.prevailingUnit.currentItems, function(i, item) {
            if(item == null)
                return;
            var icon = item.icon;
            icon.alpha = 1;
            var x = i % 2 == 0 ? this.itemCenterX : this.itemCenterX + this.itemXSpacing;
            var yLevel = Math.floor(i / 2);
            var y = this.itemCenterY + this.itemXSpacing * yLevel;
            if(!icon.parent) {
                var it = graphicsUtils.addSomethingToRenderer(icon, 'hudOne', {position: {x: x, y: y}});
                graphicsUtils.makeSpriteSize(icon, 27);
            } else {
                icon.position = {x: x, y: y};
                icon.visible = true;
            }

            if(item.isEmptySlot) {
                icon.alpha = 0;
            }
        }.bind(this))

        //specialty items
        $.each(this.prevailingUnit.currentSpecialtyItems, function(i, item) {
            if(item == null)
                return;
            var icon = item.icon;
            icon.alpha = 1;
            var x = this.spItemCenterX;
            var y = this.itemCenterY + this.spItemYSpacing * i;
            if(!icon.parent) {
                var it = graphicsUtils.addSomethingToRenderer(icon, 'hudOne', {position: {x: x, y: y}});
                graphicsUtils.makeSpriteSize(icon, 27);
            } else {
                icon.position = {x: x, y: y};
                icon.visible = true;
            }

            if(item.isEmptySlot) {
                icon.alpha = 0;
            }
        }.bind(this))

        //backpack
        $.each(this.prevailingUnit.currentBackpack, function(i, item) {
            if(item == null)
                return;
            var icon = item.icon;
            icon.alpha = .5;
            var x = this.bpItemCenterX + this.bpItemXSpacing * i;
            var y = this.bpItemCenterY;
            if(!icon.parent) {
                var it = graphicsUtils.addSomethingToRenderer(icon, 'hudOne', {position: {x: x, y: y}});
                graphicsUtils.makeSpriteSize(icon, 27);
            } else {
                icon.position = {x: x, y: y};
                icon.visible = true;
            }

            if(item.isEmptySlot) {
                icon.alpha = 0;
            }
        }.bind(this))
    }
};

unitPanel.prototype.clear = function() {

}

unitPanel.prototype.clearUnitItems = function() {
    //clear regular items
    if(this.prevailingUnit && this.prevailingUnit.currentItems.length > 0) {
        $.each(this.prevailingUnit.currentItems, function(i, item) {
            if(item) {
                item.icon.visible = false;
            }
        })
    }

    //clear specialty items
    if(this.prevailingUnit && this.prevailingUnit.currentSpecialtyItems.length > 0) {
        $.each(this.prevailingUnit.currentSpecialtyItems, function(i, item) {
            if(item) {
                item.icon.visible = false;
            }
        })
    }

    //clear backpack items
    if(this.prevailingUnit && this.prevailingUnit.currentBackpack.length > 0) {
        $.each(this.prevailingUnit.currentBackpack, function(i, item) {
            if(item) {
                item.icon.visible = false;
            }
        })
    }

    //clear empty slots icons
    if(this.prevailingUnit) {
        $.each(this.prevailingUnit.emptySlots, function(i, emptyItemSlot) {
            emptyItemSlot.icon.visible = false;
        })
    }
};

unitPanel.prototype.displayUnitStats = function() {
    //Unit Stats Ticker
    if(!this.updateUnitStatTick) {
        this.updateUnitStatTick = globals.currentGame.addTickCallback(function() {
            if(this.prevailingUnit) {
                //name
                this.unitNameText.text = this.prevailingUnit.name || this.prevailingUnit.unitType;

                //damage (or heal)
                var functionText = "";
                if(this.prevailingUnit.damageMember && this.prevailingUnit.damageMember instanceof Function) {
                    functionText = this.prevailingUnit.damageMember();
                }
                this.unitDamageText.text = (this.prevailingUnit.damageLabel || "Dmg: ") + (functionText || (this.prevailingUnit.damageMember ? this.prevailingUnit[this.prevailingUnit.damageMember] : this.prevailingUnit.damage));
                if(this.prevailingUnit.damageAdditions.length > 0) {
                    var sign = '+';
                    if(this.prevailingUnit.getDamageAdditionSum() < 0) {
                        sign = '';
                    }
                    this.unitDamageAdditionsText.text = sign + this.prevailingUnit.getDamageAdditionSum();
                    this.unitDamageAdditionsText.position = mathArrayUtils.clonePosition(this.unitDamageText.position, {x: this.unitDamageText.width});
                } else {
                    this.unitDamageAdditionsText.text = '';
                }

                //armor
                this.unitDefenseText.text = "Arm: " + this.prevailingUnit.defense;
                if(this.prevailingUnit.defenseAdditions.length > 0) {
                    var sign = '+';
                    if(this.prevailingUnit.getDefenseAdditionSum() < 0) {
                        sign = '';
                    }
                    this.unitDefenseAdditionsText.text = sign + this.prevailingUnit.getDefenseAdditionSum();
                    this.unitDefenseAdditionsText.position = mathArrayUtils.clonePosition(this.unitDefenseText.position, {x: this.unitDefenseText.width});
                } else {
                    this.unitDefenseAdditionsText.text = '';
                }

                //health
                this.unitHealthText.text = "HP: " + Math.floor(this.prevailingUnit.currentHealth);

                //grit
                this.unitGritText.text = "Grt: " + this.prevailingUnit.grit;
                if(this.prevailingUnit.gritAdditions.length > 0) {
                    var sign = '+';
                    if(this.prevailingUnit.getGritAdditionSum() < 0) {
                        sign = '';
                    }
                    this.unitGritAdditionsText.text = sign + this.prevailingUnit.getGritAdditionSum();
                    this.unitGritAdditionsText.position = mathArrayUtils.clonePosition(this.unitGritText.position, {x: this.unitGritText.width});
                } else {
                    this.unitGritAdditionsText.text = '';
                }

                //dodge
                this.unitDodgeText.text = "Ddg: " + this.prevailingUnit.dodge;
                if(this.prevailingUnit.dodgeAdditions.length > 0) {
                    var sign = '+';
                    if(this.prevailingUnit.getDodgeAdditionSum() < 0) {
                        sign = '';
                    }
                    this.unitDodgeAdditionsText.text = sign + this.prevailingUnit.getDodgeAdditionSum();
                    this.unitDodgeAdditionsText.position = mathArrayUtils.clonePosition(this.unitDodgeText.position, {x: this.unitDodgeText.width});
                } else {
                    this.unitDodgeAdditionsText.text = '';
                }

                //energy
                this.unitEnergyText.text = "E: " + Math.floor(this.prevailingUnit.currentEnergy);
            }
        }.bind(this));
    }

    //experience meter
    if(!this.updateExperienceMeterTick) {
        this.updateExperienceMeterTick = globals.currentGame.addTickCallback(function() {
            if(this.prevailingUnit) {
                this.experienceMeter.visible = true;
                var expPercent = (this.prevailingUnit.currentExperience-this.prevailingUnit.lastLevelExp) / (this.prevailingUnit.nextLevelExp-this.prevailingUnit.lastLevelExp);
                graphicsUtils.makeSpriteSize(this.experienceMeter, {x: gameUtils.getPlayableWidth()*expPercent, y: this.barOffset-1});
            } else {
                this.experienceMeter.visible = false;
            }
        }.bind(this));
    }
};

unitPanel.prototype.displayUnitAbilities = function() {
    if(!this.prevailingUnit.abilities) return;

    this.currentAbilities = this.prevailingUnit.abilities;

    //place, scale and enable abilility icons
    $.each(this.currentAbilities, function(i, ability) {
        ability.icon.scale = graphicsUtils.makeSpriteSize(ability.icon, this.abililtyWidth);
        ability.icon.position = {x: this.abilityOneCenterX + (this.abilitySpacing * i), y: this.abilityOneCenterY};
        ability.icon.visible = true;
        if(!ability.icon.parent) {
            var a = graphicsUtils.addSomethingToRenderer(ability.icon, 'hudOne');
            ability.addSlave(a);

            //autocast init
            if(ability.autoCastEnabled) {
                ability.systemMessage.push('Ctrl+Click to toggle autocast')
                var b = ability.abilityBorder = graphicsUtils.addSomethingToRenderer('TintableAbilityBorder', 'hudOne', {position: ability.icon.position});
                ability.addSlave(b);
                ability.autoCastTimer = graphicsUtils.graduallyTint(ability.abilityBorder, 0x284422, 0x27EC00, 1300, null, 500);
                ability.addSlave(ability.autoCastTimer);
                ability.abilityBorder.visible = ability.getAutoCastVariable;
                ability.icon.interactive = true;
                ability.icon.on('mouseup', function(event) {
                    if(keyStates['Control']) {
                        ability.autoCast();
                        ability.abilityBorder.visible = ability.getAutoCastVariable();
                        ability.autoCastTimer.reset();
                        this.autoCastSound.play();
                    }
                }.bind(this))
            }
            Tooltip.makeTooltippable(ability.icon, ability);
        }


        //refresh autocast state
        if(ability.abilityBorder) {
            ability.abilityBorder.visible = ability.getAutoCastVariable();
        }

        var augmentSize = 20;
        var augmentBorderSize = augmentSize+4;
        if(ability.augments) {
            $.each(ability.augments, function(i, augment) {
                var bottomRightOfAbility = {x: ability.position.x + this.abililtyWithBorderWidth/2, y: ability.position.y + this.abililtyWithBorderWidth/2};
                var agumentPosition = mathArrayUtils.addScalarToPosition(bottomRightOfAbility, -augmentBorderSize/2);
                if(!augment.smallerIcon) {
                    augment.smallerIcon = graphicsUtils.addSomethingToRenderer(augment.icon.texture, {position: agumentPosition, where: 'hudTwo'});
                    Tooltip.makeTooltippable(augment.smallerIcon, {title: augment.title, description: augment.description});
                    augment.smallerBorder = graphicsUtils.addSomethingToRenderer('AugmentBorder', {position: agumentPosition, where: 'hudTwo'});
                    graphicsUtils.makeSpriteSize(augment.smallerIcon, augmentSize);
                    graphicsUtils.makeSpriteSize(augment.smallerBorder, augmentBorderSize);
                    ability.addSlave(augment.smallerIcon, augment.smallerBorder);
                }
                if(ability.currentAugment == augment) {
                    augment.smallerIcon.visible = true;
                    augment.smallerBorder.visible = true;
                    ability.currentAugmentIcon = augment.smallerIcon;
                    ability.currentAugmentBorderIcon = augment.smallerBorder;

                    //don't forget to match current ability tint
                    augment.smallerIcon.tint = ability.tint || 0xFFFFFF;
                    augment.smallerBorder.tint = ability.tint || 0xFFFFFF;
                } else {
                    augment.smallerIcon.visible = false;
                    augment.smallerBorder.visible = false;
                }
            }.bind(this))
        }
    }.bind(this))

    var unavailableTint = 0x4C4949;
    if(!this.abilityAvailableTick) {
        this.abilityAvailableTick = globals.currentGame.addTickCallback(function() {
            if(this.prevailingUnit) {
                $.each(this.currentAbilities, function(i, ability) {
                    var enabled = true;
                    if(ability.enablers) {
                        $.each(ability.enablers, function(i, enabler) {
                            enabled = enabler();
                            return enabled;
                        })
                    }
                    if(!enabled) {
                        ability.icon.tint = unavailableTint;
                        if(ability.currentAugment) {
                            ability.currentAugmentIcon.tint = unavailableTint;
                            ability.currentAugmentBorderIcon.tint = unavailableTint;
                        }
                    } else if(ability.icon.tint == unavailableTint) {
                        ability.icon.tint = 0xFFFFFF;
                        if(ability.currentAugment) {
                            ability.currentAugmentIcon.tint = 0xFFFFFF;
                            ability.currentAugmentBorderIcon.tint = 0xFFFFFF;
                        }
                    }
                })
            }
        }.bind(this));
    }
};

unitPanel.prototype.displayUnitPassives = function(options) {
    options = options || {};

    //clear last passive
    if(this.currentDefensePassive) {
        this.currentDefensePassive.activeIcon.visible = false;
        this.defensePassiveMeter.visible = false;
    }

    if(this.currentActivePassive) {
        this.currentActivePassive.activeIcon.visible = false;
        this.attackPassiveMeter.visible = false;
    }

    if((!this.prevailingUnit.defensePassive && !this.prevailingUnit.attackPassive) || options.clear) return;

    var unit = this.prevailingUnit;

    if(unit.defensePassive) {
        if(!unit.defensePassive.activeIcon) {
            unit.defensePassive.activeIcon = graphicsUtils.createDisplayObject(unit.defensePassive.textureName, {where: 'hudOne'});
        }
        //retooltip this
        if(unit.defensePassive.activeIcon.tooltipObj) {
            unit.defensePassive.activeIcon.tooltipObj.destroy();
        }
        Tooltip.makeTooltippable(unit.defensePassive.activeIcon, {title: unit.defensePassive.title, description: unit.defensePassive.defenseDescription,
            descriptionStyle: unit.defensePassive.defensiveDescrStyle, systemMessage: unit.defensePassive.defenseCooldown/1000 + ' second cooldown'});

        graphicsUtils.addOrShowDisplayObject(unit.defensePassive.activeIcon);
        this.currentDefensePassive = unit.defensePassive;
        unit.defensePassive.activeIcon.position = {x: this.passiveCenterX, y: this.passiveBottomCenterY};
    }

    if(unit.attackPassive) {
        if(!unit.attackPassive.activeIcon) {
            unit.attackPassive.activeIcon = graphicsUtils.createDisplayObject(unit.attackPassive.textureName, {where: 'hudOne'});
        }
        //retooltip this
        if(unit.attackPassive.activeIcon.tooltipObj) {
            unit.attackPassive.activeIcon.tooltipObj.destroy();
        }
        Tooltip.makeTooltippable(unit.attackPassive.activeIcon, {title: unit.attackPassive.title, description: unit.attackPassive.aggressionDescription,
            descriptionStyle: unit.attackPassive.aggressionDescrStyle, systemMessage: unit.attackPassive.aggressionCooldown/1000 + ' second cooldown'});

        graphicsUtils.addOrShowDisplayObject(unit.attackPassive.activeIcon);
        this.currentActivePassive = unit.attackPassive;
        unit.attackPassive.activeIcon.position = {x: this.passiveCenterX, y: this.passiveTopCenterY};
    }

    //create the timing meters
    if(!this.attackPassiveMeter) {
        this.attackPassiveMeter = graphicsUtils.addSomethingToRenderer('TintableSquare', {tint: 0x67c18b, position: {x: this.passiveCenterX-16, y: this.passiveTopCenterY + 18}, anchor: {x: 0, y: 0}, where: 'hudOne'});
        this.defensePassiveMeter = graphicsUtils.addSomethingToRenderer('TintableSquare', {tint: 0x67c18b, position: {x: this.passiveCenterX-16, y: this.passiveBottomCenterY + 18}, anchor: {x: 0, y: 0}, where: 'hudOne'});
        this.attackPassiveMeter.visible = false;
        this.defensePassiveMeter.visible = false;
        this.meterUpdater = globals.currentGame.addTickCallback(function() {
            var unit = this.prevailingUnit;
            if(!unit) return;
            if(unit.attackPassive) {
                var percentDone = unit.attackPassive.coolDownMeterPercent;
                this.attackPassiveMeter.visible = true;
                graphicsUtils.makeSpriteSize(this.attackPassiveMeter, {x: 32*percentDone, y: 8})
                if(percentDone < 1.0) {
                    this.attackPassiveMeter.tint = 0xbbaeae;
                    unit.attackPassive.activeIcon.tint = 0x575757;
                } else if(!this.attackPassiveIconFlashing && unit.attackPassive.newCharge) {
                    this.attackPassiveMeter.tint = 0x09c216;
                    unit.attackPassive.activeIcon.tint = 0xFFFFFF;
                }
            } else {
                this.attackPassiveMeter.visible = false;
            }
            if(unit.defensePassive) {
                var percentDone = unit.defensePassive.coolDownMeterPercent;
                this.defensePassiveMeter.visible = true;
                graphicsUtils.makeSpriteSize(this.defensePassiveMeter, {x: 32*percentDone, y: 8})
                if(percentDone < 1.0) {
                    this.defensePassiveMeter.tint = 0xbbaeae;
                    unit.defensePassive.activeIcon.tint = 0x575757;
                } else if(!this.defensePassiveIconFlashing && unit.defensePassive.newCharge) {
                    this.defensePassiveMeter.tint = 0x09c216;
                    unit.defensePassive.activeIcon.tint = 0xFFFFFF;
                }
            } else {
                this.defensePassiveMeter.visible = false;
            }
        }.bind(this))
    }

    this.eventsSet = true;
    Matter.Events.on(this, "attackPassiveActivated", function(event) {
        this.attackPassiveMeter.tint = 0x7d302b;
        var times = event.duration < 1000 ? 3 : 5;
        var timer = graphicsUtils.graduallyTint(this.currentActivePassive.activeIcon, 0xffffff, 0x575757, event.duration/times);
        this.attackPassiveIconFlashing = true;
        gameUtils.doSomethingAfterDuration(function() {
            globals.currentGame.invalidateTimer(timer);
            this.attackPassiveIconFlashing = false;
        }.bind(this), event.duration);
    }.bind(this))

    Matter.Events.on(this, "defensePassiveActivated", function(event) {
        this.defensePassiveMeter.tint = 0x1f3c62;
        var times = event.duration < 1000 ? 3 : 5;
        var timer = graphicsUtils.graduallyTint(this.currentDefensePassive.activeIcon, 0xffffff, 0x575757, event.duration/times);
        this.defensePassiveIconFlashing = true;
        gameUtils.doSomethingAfterDuration(function() {
            globals.currentGame.invalidateTimer(timer);
            this.defensePassiveIconFlashing = false;
        }.bind(this), event.duration);
    }.bind(this))
}

unitPanel.prototype.displayCommands = function() {
    if(!this.attackMoveIcon) {
        this.moveIcon = graphicsUtils.addSomethingToRenderer('MoveIcon', 'hudOne', {position: {x: this.commandOneCenterX, y: this.commandOneCenterY}});
        graphicsUtils.makeSpriteSize(this.moveIcon, 25);
        this.currentCommands.push({name: 'attack', icon: this.moveIcon});
        Tooltip.makeTooltippable(this.moveIcon, {title: 'Move', hotkey: 'M', description: "Move to a destination."})

        this.attackMoveIcon = graphicsUtils.addSomethingToRenderer('AttackIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing, y: this.commandOneCenterY}});
        graphicsUtils.makeSpriteSize(this.attackMoveIcon, 25);
        this.currentCommands.push({name: 'move', icon: this.attackMoveIcon});
        Tooltip.makeTooltippable(this.attackMoveIcon, {title: 'Attack-move', hotkey: 'A', description: "Attack-move to a destination."})

        this.stopIcon = graphicsUtils.addSomethingToRenderer('StopIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*2, y: this.commandOneCenterY}});
        graphicsUtils.makeSpriteSize(this.stopIcon, 25);
        this.currentCommands.push({name: 'stop', icon: this.stopIcon});
        Tooltip.makeTooltippable(this.stopIcon, {title: 'Stop', hotkey: 'S', description: "Stop current command."})

        this.holdPositionIcon = graphicsUtils.addSomethingToRenderer('HoldPositionIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*3, y: this.commandOneCenterY}});
        graphicsUtils.makeSpriteSize(this.holdPositionIcon, 25);
        this.currentCommands.push({name: 'holdPosition', icon: this.holdPositionIcon});
        Tooltip.makeTooltippable(this.holdPositionIcon, {title: 'Hold Position', hotkey: 'H', description: "Prevent any automatic movement."})
    } else {
        $.each(this.currentCommands, function(i, command) {
            command.icon.visible = false;
            $.each(this.prevailingUnit.commands, function(j, unitCommand) {
                if(unitCommand.name == command.name) {
                    command.icon.visible = true;
                }
            }.bind(this))
        }.bind(this))
    }
};

unitPanel.prototype.showAugmentsAndPassivesForUnit = function(unit) {
    this.unitAugmentPanel.showForUnit(unit);
    this.unitPassivePanel.showForUnit(unit);
},

unitPanel.prototype.hideAugmentsAndPassivesForUnit = function() {
    this.unitAugmentPanel.hideForCurrentUnit();
    this.unitPassivePanel.hideForCurrentUnit();
},

unitPanel.prototype.enterCamp = function() {
    this.unitAugmentPanel.lowerOpenButton();
    this.unitPassivePanel.lowerOpenButton();
},

unitPanel.prototype.leaveCamp = function() {
    this.unitAugmentPanel.hideForCurrentUnit();
    this.unitAugmentPanel.hideOpenButton();

    this.unitPassivePanel.hideForCurrentUnit();
    this.unitPassivePanel.hideOpenButton();
},

unitPanel.prototype.cleanUp = function() {
    globals.currentGame.removeTickCallback(this.updateUnitStatTick);
    globals.currentGame.removeTickCallback(this.updateHealthAndEnergyVialTick);
    globals.currentGame.removeTickCallback(this.abilityAvailableTick);
    globals.currentGame.removeTickCallback(this.meterUpdater);

    //unit configuration panel
    if(this.unitAugmentPanel)
        this.unitAugmentPanel.cleanUp();

    //unit passive panel
    if(this.unitPassivePanel)
        this.unitPassivePanel.cleanUp();

    this.autoCastSound.unload();

    if(this.eventsSet) {
        Matter.Events.off(this, "attackPassiveActivated");
        Matter.Events.off(this, "defensePassiveActivated");
    }
};

unitPanel.prototype.updateUnitAbilities = unitPanel.prototype.displayUnitAbilities;
unitPanel.prototype.updateUnitPassives = unitPanel.prototype.displayUnitPassives;

export default unitPanel;
