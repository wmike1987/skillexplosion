import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import styles from '@utils/Styles.js';
import Tooltip from '@core/Tooltip.js';
import ucp from '@games/Us/UnitAugmentPanel.js';
import upp from '@games/Us/PassivePanel.js';
import help from '@games/Us/HelpMenu.js';
import {
    globals,
    keyStates
} from '@core/Fundamental/GlobalState.js';

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
    this.autoCastSound = gameUtils.getSound('autocasttoggle.wav', {
        volume: 0.03,
        rate: 1.0
    });

    this.barOffset = 8; //top bar offset;
    this.centerX = gameUtils.getUnitPanelCenter().x;
    this.centerY = gameUtils.getUnitPanelCenter().y + this.barOffset / 2;

    //position variables
    this.unitPortraitPosition = {
        x: this.centerX,
        y: this.centerY
    };

    //unit status variables
    this.unitStatSpacing = 20;
    this.unitStatYOffset = -9;
    this.unitFrameCenterX = this.centerX - 260;
    this.unitFrameOffset = 87.5 / 32;
    this.unitNamePosition = {
        x: this.unitFrameCenterX,
        y: this.centerY - this.unitStatSpacing + this.unitStatYOffset
    };
    //this.unitLevelPosition = {x: this.unitFrameCenterX+this.unitFrameOffset, y: this.centerY - this.unitStatSpacing + this.unitStatYOffset};
    this.unitDamagePosition = {
        x: this.unitFrameCenterX - this.unitFrameOffset * 31,
        y: this.centerY + this.unitStatYOffset
    };
    this.unitArmorPosition = mathArrayUtils.roundPositionToWholeNumbers({
        x: this.unitFrameCenterX - this.unitFrameOffset * 31,
        y: this.centerY + this.unitStatSpacing + this.unitStatYOffset
    });
    this.unitHealthPosition = mathArrayUtils.roundPositionToWholeNumbers({
        x: this.unitFrameCenterX - this.unitFrameOffset * 31,
        y: this.centerY + this.unitStatSpacing * 2 + this.unitStatYOffset
    });
    this.unitGritPosition = mathArrayUtils.roundPositionToWholeNumbers({
        x: this.unitFrameCenterX + this.unitFrameOffset * 8,
        y: this.centerY + this.unitStatYOffset
    });
    this.unitDodgePosition = mathArrayUtils.roundPositionToWholeNumbers({
        x: this.unitFrameCenterX + this.unitFrameOffset * 8,
        y: this.centerY + this.unitStatSpacing + this.unitStatYOffset
    });
    this.unitEnergyPosition = mathArrayUtils.roundPositionToWholeNumbers({
        x: this.unitFrameCenterX + this.unitFrameOffset * 8,
        y: this.centerY + this.unitStatSpacing * 2 + this.unitStatYOffset
    });
    this.unitViewChangePosition = mathArrayUtils.roundPositionToWholeNumbers({
        x: this.unitFrameCenterX + this.unitFrameOffset * 25,
        y: this.centerY + this.unitStatSpacing * 2 + this.unitStatYOffset + 2
    });

    this.unitNameText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitNamePosition,
        where: 'hudOne',
        style: styles.unitNameStyle
    });
    //this.unitLevelText = graphicsUtils.addSomethingToRenderer('TEX+:--', {position: this.unitLevelPosition, where: 'hudOne', style: styles.unitLevelStyle});
    this.unitDamageText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitDamagePosition,
        where: 'hudOne',
        style: styles.unitDamageStyle,
        anchor: {
            x: 0,
            y: 0.5
        }
    });
    this.unitDamageAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        anchor: {
            x: 0,
            y: 0.5
        },
        position: this.unitDamagePosition,
        where: 'hudOne',
        style: styles.unitDamageAdditionsStyle
    });
    this.unitDefenseText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitArmorPosition,
        where: 'hudOne',
        style: styles.unitDefenseStyle,
        anchor: {
            x: 0,
            y: 0.5
        }
    });
    Tooltip.makeTooltippable(this.unitDefenseText, {
        showInfoCursor: true,
        title: 'Armor',
        updaters: {
            descriptions: function() {
                var result = {
                    index: 0,
                    value: ''
                };
                if (this.prevailingUnit) {
                    result.value = 'Subtract ' + (this.prevailingUnit.getTotalDefense().toFixed(1)) + ' damage from incoming attacks.';
                }
                return result;
            }.bind(this)
        }
    });

    this.unitDefenseAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        anchor: {
            x: 0,
            y: 0.5
        },
        position: this.unitArmorPosition,
        where: 'hudOne',
        style: styles.unitDefenseAdditionsStyle
    });
    this.unitHealthText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitHealthPosition,
        where: 'hudOne',
        style: styles.unitGeneralHPStyle,
        anchor: {
            x: 0,
            y: 0.5
        }
    });
    this.unitGritText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitGritPosition,
        where: 'hudOne',
        style: styles.unitGritStyle,
        anchor: {
            x: 0,
            y: 0.5
        }
    });
    Tooltip.makeTooltippable(this.unitGritText, {
        showInfoCursor: true,
        title: 'Grit',
        descriptions: ['', ''],
        updaters: {
            descriptions: function() {
                var result = [{
                    index: 0,
                    value: ''
                }, {
                    index: 1,
                    value: ''
                }];
                if (this.prevailingUnit) {
                    if (this.prevailingUnit.getTotalGrit() > 0.0) {
                        result[0].value = 'Regenerate hp at 2x rate while below ' + (this.prevailingUnit.getTotalGrit().toFixed(1)) + '% total health.';
                    } else {
                        result[0].value = 'Gain grit to increase hp regeneration rate near death.';
                    }

                    if (this.prevailingUnit.getTotalGrit() > 0.0) {
                        result[1].value = 'Dodge 1 killing blow every ' + this.prevailingUnit.gritCooldown + ' seconds';
                    } else {
                        result[1].value = 'Gain grit to block killing blows.';
                    }
                }
                return result;
            }.bind(this)
        }
    });
    this.unitGritAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        anchor: {
            x: 0,
            y: 0.5
        },
        position: this.unitGritPosition,
        where: 'hudOne',
        style: styles.unitGritAdditionsStyle
    });
    this.unitDodgeText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitDodgePosition,
        where: 'hudOne',
        style: styles.unitDodgeStyle,
        anchor: {
            x: 0,
            y: 0.5
        }
    });
    Tooltip.makeTooltippable(this.unitDodgeText, {
        showInfoCursor: true,
        title: 'Dodge',
        updaters: {
            descriptions: function() {
                var result = {
                    index: 0,
                    value: 'Chance to dodge attack.'
                };
                if (this.prevailingUnit) {
                    result.value = (this.prevailingUnit.getTotalDodge()) + '% chance to dodge attack.';
                }
                return result;
            }.bind(this)
        }
    });
    this.unitDodgeAdditionsText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        anchor: {
            x: 0,
            y: 0.5
        },
        position: this.unitDodgePosition,
        where: 'hudOne',
        style: styles.unitDodgeAdditionsStyle
    });
    this.unitEnergyText = graphicsUtils.addSomethingToRenderer('TEX+:', {
        position: this.unitEnergyPosition,
        where: 'hudOne',
        style: styles.unitGeneralEnergyStyle,
        anchor: {
            x: 0,
            y: 0.5
        }
    });

    //switch stat view (graph view)
    this.toGraphViewButton = this.experienceMeter = graphicsUtils.createDisplayObject('GraphView', {
        position: this.unitViewChangePosition,
        anchor: {
            x: 0,
            y: 0.5
        },
        scale: {
            x: 0.5,
            y: 0.5
        },
        where: 'hudOne'
    });
    this.toGraphViewButton.interactive = true;
    this.toGraphViewButton.on('mousedown', function(event) {
        this.swapStatView();
    }.bind(this));
    graphicsUtils.mouseOverOutTint(this.toGraphViewButton);

    this.toNumberViewButton = this.experienceMeter = graphicsUtils.createDisplayObject('NumberView', {
        position: this.unitViewChangePosition,
        anchor: {
            x: 0,
            y: 0.5
        },
        scale: {
            x: 0.5,
            y: 0.5
        },
        where: 'hudOne'
    });
    this.toNumberViewButton.interactive = true;
    this.toNumberViewButton.on('mousedown', function(event) {
        this.swapStatView();
    }.bind(this));
    graphicsUtils.mouseOverOutTint(this.toNumberViewButton);
    this.currentViewState = this.toNumberViewButton;

    //chart bars
    this.chartBarWidth = 14;
    this.chartLeftPosition = {
        x: this.unitFrameCenterX - 88,
        y: this.centerY + 43
    };

    //damage bar
    this.damageHealBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: this.chartLeftPosition,
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x555453
    });
    graphicsUtils.mouseOverOutTint(this.damageHealBar, this.damageHealBar.tint);
    graphicsUtils.makeSpriteSize(this.damageHealBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.damageHealBar, {
        title: "Damage",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.damageHealBar.currentRealValue;
            }.bind(this),
        }
    });

    //health bar
    this.healthChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 1 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0xb40026
    });
    graphicsUtils.mouseOverOutTint(this.healthChartBar, this.healthChartBar.tint);
    graphicsUtils.makeSpriteSize(this.healthChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.healthChartBar, {
        title: "Health",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.healthChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //health regen bar
    this.healthRegenerationBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 2 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0xe75983
    });
    graphicsUtils.mouseOverOutTint(this.healthRegenerationBar, this.healthRegenerationBar.tint);
    graphicsUtils.makeSpriteSize(this.healthRegenerationBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.healthRegenerationBar, {
        title: "Health Regeneration",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.healthRegenerationBar.currentRealValue;
            }.bind(this),
        }
    });

    //energy bar
    this.energyChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 3 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x860ed9
    });
    graphicsUtils.mouseOverOutTint(this.energyChartBar, this.energyChartBar.tint);
    graphicsUtils.makeSpriteSize(this.energyChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.energyChartBar, {
        title: "Energy",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.energyChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //energy regen bar
    this.energyRegenerationBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 4 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0xe2a1e8
    });
    graphicsUtils.mouseOverOutTint(this.energyRegenerationBar, this.energyRegenerationBar.tint);
    graphicsUtils.makeSpriteSize(this.energyRegenerationBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.energyRegenerationBar, {
        title: "Energy Regeneration",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.energyRegenerationBar.currentRealValue;
            }.bind(this),
        }
    });

    //armor bar
    this.armorChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 5 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x0734ba
    });
    graphicsUtils.mouseOverOutTint(this.armorChartBar, this.armorChartBar.tint);
    graphicsUtils.makeSpriteSize(this.armorChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.armorChartBar, {
        title: "Armor",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.armorChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //grit bar
    this.gritChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 6 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0xdbc81d
    });
    graphicsUtils.mouseOverOutTint(this.gritChartBar, this.gritChartBar.tint);
    graphicsUtils.makeSpriteSize(this.gritChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.gritChartBar, {
        title: "Grit",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.gritChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //dodge regen bar
    this.dodgeChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 7 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x2f811f
    });
    graphicsUtils.mouseOverOutTint(this.dodgeChartBar, this.dodgeChartBar.tint);
    graphicsUtils.makeSpriteSize(this.dodgeChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.dodgeChartBar, {
        title: "Dodge",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.dodgeChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //range bar
    this.rangeChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 8 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0xa26513
    });
    graphicsUtils.mouseOverOutTint(this.rangeChartBar, this.rangeChartBar.tint);
    graphicsUtils.makeSpriteSize(this.rangeChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.rangeChartBar, {
        title: "Range",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.rangeChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //attack speed bar
    this.asChartBar = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            x: 9 * this.chartBarWidth
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x31c4a1
    });
    graphicsUtils.mouseOverOutTint(this.asChartBar, this.asChartBar.tint);
    graphicsUtils.makeSpriteSize(this.asChartBar, {
        x: this.chartBarWidth,
        y: 1
    });
    Tooltip.makeTooltippable(this.asChartBar, {
        title: "Attack Speed",
        descriptionStyle: styles.abilityText,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                return this.asChartBar.currentRealValue;
            }.bind(this),
        }
    });

    //chart line 1
    var chartLineWidth = 150;
    this.chartLine1 = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            y: -15
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x3d3d3e,
        alpha: 0.3,
        sortYOffset: -1000
    });
    graphicsUtils.makeSpriteSize(this.chartLine1, {
        x: chartLineWidth,
        y: 1
    });

    //chart line 2
    this.chartLine2 = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            y: -30
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x3d3d3e,
        alpha: 0.3,
        sortYOffset: -1000
    });
    graphicsUtils.makeSpriteSize(this.chartLine2, {
        x: chartLineWidth,
        y: 1
    });

    //chart line 3
    this.chartLine3 = graphicsUtils.createDisplayObject('TintableSquare', {
        position: mathArrayUtils.clonePosition(this.chartLeftPosition, {
            y: -45
        }),
        anchor: {
            x: 0,
            y: 1
        },
        where: 'hudOne',
        tint: 0x3d3d3e,
        alpha: 0.3,
        sortYOffset: -1000
    });
    graphicsUtils.makeSpriteSize(this.chartLine3, {
        x: chartLineWidth,
        y: 1
    });

    //experience meter
    this.experienceMeter = graphicsUtils.addSomethingToRenderer('TintableSquare', {
        position: {
            x: 0,
            y: gameUtils.getPlayableHeight() + 1
        },
        anchor: {
            x: 0,
            y: 0
        },
        where: 'hudOne'
    });
    this.experienceMeter.alpha = 0.5;
    this.experienceMeter.visible = false;

    //health vial
    this.vialDimensions = {
        w: 24,
        h: 90
    };
    this.healthVialCenterY = this.centerY + 1;
    this.healthVialCenterX = this.centerX - 58;
    this.healthVialPosition = {
        x: this.healthVialCenterX,
        y: this.healthVialCenterY
    };
    this.healthVial = graphicsUtils.addSomethingToRenderer('Vial', {
        position: this.healthVialPosition,
        where: 'hud',
        sortYOffset: 2000
    });
    var hvtt = Tooltip.makeTooltippable(this.healthVial, {
        title: "Health",
        systemMessage: ['--------', '--------'],
        descriptionStyle: styles.HPTTStyle,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                let txt;
                if (this.prevailingUnit) {
                    txt = Math.floor(this.prevailingUnit.currentHealth) + "/" + this.prevailingUnit.maxHealth;
                    tooltip.mainDescription.tint = graphicsUtils.percentAsHexColor(this.prevailingUnit.currentHealth / this.prevailingUnit.maxHealth);
                }
                return txt;
            }.bind(this),
            mainSystemMessage: function() {
                var result = {
                    key: 'systemMessages',
                    index: 1
                };
                let txt;
                if (this.prevailingUnit) {
                    txt = 'Regen: +' + this.prevailingUnit.getTotalHealthRegeneration().toFixed(2) + " hp/sec";
                }
                result.value = txt;
                return result;
            }.bind(this),
            gritUpdater: function() {
                if (this.prevailingUnit) {
                    var result = {
                        key: 'systemMessages',
                        index: 0
                    };
                    var gritAmount = Math.floor((this.prevailingUnit.getTotalGrit()) / 100 * this.prevailingUnit.maxHealth);
                    result.value = 'Grit: ' + gritAmount + ' hp';
                    return result;
                }
                return null;
            }.bind(this)
        }
    });
    graphicsUtils.makeSpriteSize(this.healthVial, this.vialDimensions);

    this.healthBubbles = gameUtils.getAnimation({
        spritesheetName: 'UtilityAnimations1',
        animationName: 'bubbles',
        speed: 0.9,
        playThisManyTimes: 'loop',
        anchor: {
            x: 0.5,
            y: 1
        },
        transform: [this.healthVialPosition.x, gameUtils.getCanvasHeight() + 10, 1.5, 1.5],
    });
    graphicsUtils.makeSpriteSize(this.healthBubbles, {
        w: 40,
        h: 80
    });
    this.healthBubbles.visible = false;
    this.healthBubbles.tint = 0xff8080;
    this.healthBubbles.alpha = 1;
    this.healthBubbles.play();
    graphicsUtils.addSomethingToRenderer(this.healthBubbles, 'hud');

    this.healthVialSquare = graphicsUtils.createDisplayObject('TintableSquare', {
        tint: 0xa80000,
        scale: {
            x: 1,
            y: 1
        },
        alpha: 0.8,
        anchor: {
            x: 0.5,
            y: 1
        }
    });
    this.healthVialSquare.position = {
        x: this.healthVialPosition.x,
        y: gameUtils.getCanvasHeight()
    };
    graphicsUtils.makeSpriteSize(this.healthVialSquare, {
        x: 0,
        y: 0
    });
    graphicsUtils.addSomethingToRenderer(this.healthVialSquare, 'hudNOne');

    this.gritIndicator = graphicsUtils.createDisplayObject('TintableSquare', {
        tint: 0x717a04,
        scale: {
            x: 1,
            y: 1
        },
        alpha: 0.6,
        anchor: {
            x: 0.5,
            y: 1
        }
    });
    this.gritIndicator.position = {
        x: this.healthVialPosition.x,
        y: gameUtils.getCanvasHeight()
    };
    graphicsUtils.addSomethingToRenderer(this.gritIndicator, 'hudNOne');
    this.gritIndicator.sortYOffset += 2000;
    this.gritIndicator.visible = false;

    //energy vial
    this.energyVialCenterY = this.centerY + 1;
    this.energyVialCenterX = this.centerX + 58;
    this.energyVialPosition = {
        x: this.energyVialCenterX,
        y: this.energyVialCenterY
    };
    this.energyVial = graphicsUtils.addSomethingToRenderer('Vial2', {
        position: this.energyVialPosition,
        where: 'hud',
        sortYOffset: 2000
    });
    Tooltip.makeTooltippable(this.energyVial, {
        title: "Energy",
        systemMessage: "+X energy/sec",
        descriptionStyle: styles.EnergyTTStyle,
        noDelay: true,
        updaters: {
            mainDescription: function(tooltip) {
                let txt;
                if (this.prevailingUnit) {
                    txt = Math.floor(this.prevailingUnit.currentEnergy) + "/" + this.prevailingUnit.maxEnergy;
                }
                return txt;
            }.bind(this),
            mainSystemMessage: function() {
                var result = {
                    key: 'systemMessages',
                    index: 0
                };
                let txt;
                if (this.prevailingUnit) {
                    txt = 'Regen: +' + this.prevailingUnit.getTotalEnergyRegeneration().toFixed(2) + " energy/sec";
                }
                result.value = txt;
                return result;
            }.bind(this)
        }
    });
    graphicsUtils.makeSpriteSize(this.energyVial, this.vialDimensions);

    this.energyBubbles = gameUtils.getAnimation({
        spritesheetName: 'UtilityAnimations1',
        animationName: 'bubbles',
        speed: 0.5,
        playThisManyTimes: 'loop',
        anchor: {
            x: 0.5,
            y: 1
        },
        transform: [this.energyVialPosition.x, gameUtils.getCanvasHeight() + 10, 2.0, 1.5]
    });
    graphicsUtils.makeSpriteSize(this.energyBubbles, {
        w: 40,
        h: 80
    });
    this.energyBubbles.visible = false;
    this.energyBubbles.tint = 0xc2e808;
    this.energyBubbles.alpha = 0.5;
    this.energyBubbles.play();
    graphicsUtils.addSomethingToRenderer(this.energyBubbles, 'hud');

    this.energyVialSquare = graphicsUtils.createDisplayObject('TintableSquare', {
        tint: 0x5d0b55,
        scale: {
            x: 1,
            y: 1
        },
        alpha: 0.9,
        anchor: {
            x: 0.5,
            y: 1
        }
    });
    graphicsUtils.graduallyTint(this.energyVialSquare, 0x731871, 0x6b0090, 1500, null, 1000);
    this.energyVialSquare.position = {
        x: this.energyVialPosition.x,
        y: gameUtils.getCanvasHeight()
    };
    graphicsUtils.makeSpriteSize(this.energyVialSquare, {
        x: 0,
        y: 0
    });
    graphicsUtils.addSomethingToRenderer(this.energyVialSquare, 'hudNOne');

    //health vial and engery vial
    this.updateHealthAndEnergyVialTick = globals.currentGame.addTickCallback(function() {
        if (this.prevailingUnit) {
            this.healthVialSquare.visible = true;
            this.gritIndicator.visible = true;
            this.healthBubbles.visible = true;
            this.energyVialSquare.visible = true;
            this.energyBubbles.visible = true;
            this.healthVial.tooltipObj.disabled = false;
            this.energyVial.tooltipObj.disabled = false;
            var healthPercent = this.prevailingUnit.currentHealth / this.prevailingUnit.maxHealth;
            graphicsUtils.makeSpriteSize(this.healthVialSquare, {
                x: this.vialDimensions.w,
                y: this.vialDimensions.h * healthPercent
            });
            graphicsUtils.makeSpriteSize(this.healthBubbles, {
                x: this.vialDimensions.w,
                y: this.vialDimensions.h * healthPercent
            });

            //update grit
            var gritPercent = Math.min(1.0, (this.prevailingUnit.grit + this.prevailingUnit.getGritAdditionSum()) / 100);
            if (healthPercent < gritPercent) {
                graphicsUtils.makeSpriteSize(this.gritIndicator, {
                    x: this.vialDimensions.w,
                    y: this.vialDimensions.h * healthPercent
                });
            } else {
                graphicsUtils.makeSpriteSize(this.gritIndicator, {
                    x: this.vialDimensions.w,
                    y: this.vialDimensions.h * gritPercent
                });
            }

            //killing blow dodge indicator
            if (this.prevailingUnit.hasGritDodge) {
                if (!this.killingBlowIndicator) {
                    this.killingBlowIndicator = graphicsUtils.createDisplayObject("GritBuff", {
                        where: 'hud',
                        scale: {
                            x: 0.8,
                            y: 0.8
                        }
                    });
                    this.killingBlowIndicator.position = {
                        x: this.healthVialPosition.x,
                        y: gameUtils.getCanvasHeight() - 15
                    };
                }
                graphicsUtils.addOrShowDisplayObject(this.killingBlowIndicator);
            } else if (this.killingBlowIndicator) {
                this.killingBlowIndicator.visible = false;
            }

            var energyPercent;
            if (this.prevailingUnit.maxEnergy > 0) {
                energyPercent = this.prevailingUnit.currentEnergy / this.prevailingUnit.maxEnergy;
            } else {
                energyPercent = 0;
            }
            graphicsUtils.makeSpriteSize(this.energyVialSquare, {
                x: this.vialDimensions.w,
                y: this.vialDimensions.h * energyPercent
            });
            graphicsUtils.makeSpriteSize(this.energyBubbles, {
                x: this.vialDimensions.w,
                y: this.vialDimensions.h * energyPercent
            });
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
    this.passiveCenterX = this.centerX - 151;
    this.passiveTopCenterY = this.centerY - 28;
    this.passiveBottomCenterY = this.centerY + 17;

    //unit ability variables
    this.abilitySpacing = 77;
    this.abilityOneCenterX = this.centerX + 178;
    this.abilityCenterX = this.centerX + 178 + this.abilitySpacing;
    this.abilityOneCenterY = this.centerY - 1;
    this.abililtyWithBorderWidth = 64;
    this.abililtyWidth = 60;

    //basic command variables
    this.commandSpacing = 35;
    this.commandOneCenterX = this.centerX + 407;
    this.commandOneCenterY = this.centerY - 25;

    //selected-group variables
    this.wireframeSize = 55;
    this.groupCenterY = this.centerY;
    this.groupCenterX = 1 + this.wireframeSize / 2;
    this.groupSpacing = 0 + this.wireframeSize;

    //item variables
    this.itemCenterX = this.centerX + 85.5;
    this.itemCenterY = gameUtils.getPlayableHeight() + this.barOffset + 2 /* the 2 is a little buffer area */ + 13.5;
    this.itemXSpacing = 30;
    this.itemYSpacing = 30;

    //specialty item variables
    this.spItemCenterX = this.centerX - 115.5;
    this.spItemCenterY = gameUtils.getPlayableHeight() + this.barOffset + 2 /* the 2 is a little buffer area */ + 13.5;
    this.spItemYSpacing = 30;
    this.spItemXSpacing = 30;

    //backpack item variables
    this.bpItemCenterX = this.centerX + 401.5;
    this.bpItemCenterY = this.centerY + 20.5;
    this.bpItemXSpacing = 30;

    //help positioning
    this.helpButtonPosition = {};
    this.helpButtonPosition.x = gameUtils.getCanvasWidth() - 16;
    this.helpButtonPosition.y = gameUtils.getCanvasHeight() - 16;

    //enemy count positioning
    this.enemyCountStart = {
        x: this.centerX + 575,
        y: this.centerY - 28
    };
    this.enemyIconSize = 32;
    this.enemyCountYOffset = 44;
    this.enemyCountXOffset = 44;
    this.enemyIcons = {};

    //multi level panel position
    this.multiLevelPanelPosition = {
        x: this.centerX + 508,
        y: this.centerY + 16
    };

    //create frame
    this.frame = graphicsUtils.createDisplayObject('UnitPanelFrame', {
        persists: true,
        position: this.position
    });
    this.frame.interactive = true;
    this.frameBacking = graphicsUtils.createDisplayObject('TintableSquare', {
        persists: true,
        position: this.position,
        tint: 0x111111
    });
    graphicsUtils.makeSpriteSize(this.frameBacking, {
        w: gameUtils.getCanvasWidth(),
        h: gameUtils.getUnitPanelHeight()
    });

    //create frame tint
    this.frameTint = graphicsUtils.createDisplayObject('UnitPanelFrameTint', {
        persists: true,
        position: this.position,
        alpha: 0.0
    });
    this.frameTint.activatedAlpha = 0.3;
};

unitPanel.prototype.swapStatView = function() {
    if (this.prevailingUnit) {
        if (this.currentViewState == this.toGraphViewButton) {
            this.currentViewState = this.toNumberViewButton;
            this.clearUnitStatsGraph();
            this.displayUnitStats();
            graphicsUtils.hideDisplayObject(this.toNumberViewButton);
            graphicsUtils.addOrShowDisplayObject(this.toGraphViewButton);
            this.toNumberViewButton.tint = 0xFFFFFF;
        } else {
            this.currentViewState = this.toGraphViewButton;
            this.clearUnitStats();
            this.displayUnitStatsGraph();
            graphicsUtils.hideDisplayObject(this.toGraphViewButton);
            graphicsUtils.addOrShowDisplayObject(this.toNumberViewButton);
            this.toGraphViewButton.tint = 0xFFFFFF;
        }
    }
};

unitPanel.prototype.initialize = function(options) {

    //create unitAugmentPanel
    this.unitAugmentPanel = new ucp(this);
    this.unitAugmentPanel.initialize();

    //create passive panel
    this.unitPassivePanel = new upp(this);
    this.unitPassivePanel.initialize();

    //create help button
    this.helpMenu = new help(this);
    this.helpMenu.initialize();
    this.helpMenu.showButton(this.helpButtonPosition);

    $('body').on('keydown.viewSwitch', function(event) {
        if (event.key == 'c' || event.key == 'C') {
            this.swapStatView();
        }
    }.bind(this));

    //add frame-backing to world
    graphicsUtils.addSomethingToRenderer(this.frameBacking, 'hudNTwo');

    //add frame to world
    graphicsUtils.addSomethingToRenderer(this.frame, 'hud');

    graphicsUtils.addSomethingToRenderer(this.frameTint, 'hud');

    //listen for when the prevailing unit changes
    Matter.Events.on(this.unitSystem, 'prevailingUnitChange', function(event) {
        this.updatePrevailingUnit(event.unit);
    }.bind(this));

    //listen for when the prevailing unit changes
    Matter.Events.on(this.unitSystem, 'unitPassiveRefresh', function(event) {
        this.displayUnitPassives(event.unit);
    }.bind(this));

    //swap som listener
    Matter.Events.on(this.unitSystem, 'swapStatesOfMind', function(event) {
        this.swapStatesOfMind(event.unit);
    }.bind(this));

    //listen for item pickup
    if (globals.currentGame.itemSystem) {
        Matter.Events.on(globals.currentGame.itemSystem, 'pickupItem', function(event) {
            if (this.prevailingUnit == event.unit) {
                this.updateUnitItems();
            }
        }.bind(this));

        Matter.Events.on(globals.currentGame.itemSystem, 'usergrab', function(event) {
            if (this.prevailingUnit == event.unit) {
                this.updateUnitItems();
            }
        }.bind(this));

        Matter.Events.on(globals.currentGame.itemSystem, 'unitUnequippedItem', function(event) {
            if (this.prevailingUnit == event.unit) {
                event.item.icon.tooltipObj.hide();
                event.item.icon.visible = false;
            }
        }.bind(this));
    }

    //listen for when the selected group changes
    Matter.Events.on(this.unitSystem, 'selectedUnitsChange', function(event) {
        this.updateUnitGroup(event.orderedSelection);
    }.bind(this));

    //listen for event dispatch and blink sprites if needed
    Matter.Events.on(this.unitSystem, 'unitSystemEventDispatch', function(event) {
        var abilityTint = 0x80ba80;
        if (this.prevailingUnit.abilities) {
            $.each(this.prevailingUnit.abilities, function(i, ability) {
                if (ability.key == event.id && ability.type == event.type && !ability.handlesOwnBlink) {
                    graphicsUtils.makeSpriteBlinkTint({
                        sprite: ability.icon,
                        tint: abilityTint,
                        speed: 100
                    });
                }
            }.bind(this));
        }

        if (this.prevailingUnit.commands) {
            var commandTint = 0xa2fa93;
            $.each(this.prevailingUnit.commands, function(name, command) {
                if (command.key == event.id && command.type == event.type) {
                    if (name == 'attack') {
                        graphicsUtils.makeSpriteBlinkTint({
                            sprite: this.attackMoveIcon,
                            tint: commandTint,
                            speed: 100
                        });
                    } else if (name == 'move') {
                        graphicsUtils.makeSpriteBlinkTint({
                            sprite: this.moveIcon,
                            tint: commandTint,
                            speed: 100
                        });
                    } else if (name == 'stop') {
                        graphicsUtils.makeSpriteBlinkTint({
                            sprite: this.stopIcon,
                            tint: commandTint,
                            speed: 100
                        });
                    } else if (name == 'holdPosition') {
                        graphicsUtils.makeSpriteBlinkTint({
                            sprite: this.holdPositionIcon,
                            tint: commandTint,
                            speed: 100
                        });
                    }
                }
            }.bind(this));
        }
    }.bind(this));
};

//unit group
unitPanel.prototype.updateUnitGroup = function(units) {
    this.clearUnitGroup();
    this.selectedUnits = units;
    $.each(this.selectedUnits, function(i, unit) {
        if (unit.wireframe) {
            var wireframe = unit.wireframe;
            if (!wireframe.parent) {
                var wiref = graphicsUtils.addSomethingToRenderer(wireframe, 'hudOne');
                gameUtils.deathPact(unit, wiref);
                wireframe.interactive = true;
                wireframe.on('mouseup', function(event) {
                    this.unitSystem.selectedUnit = unit;
                }.bind(this));
            }
            wireframe.position = {
                x: this.groupCenterX + i * this.groupSpacing,
                y: this.groupCenterY
            };
            graphicsUtils.makeSpriteSize(wireframe, this.wireframeSize);
            wireframe.visible = true;
        }
    }.bind(this));

    this.highlightGroupUnit(this.prevailingUnit);
};


unitPanel.prototype.clearUnitGroup = function() {
    $.each(this.selectedUnits, function(i, unit) {
        if (unit.wireframe) {
            unit.wireframe.visible = false;
        }
    });
};

unitPanel.prototype.highlightGroupUnit = function(prevailingUnit) {
    $.each(this.selectedUnits, function(i, unit) {
        if (unit.wireframe) {
            if (unit == prevailingUnit) {
                graphicsUtils.makeSpriteSize(unit.wireframe, this.wireframeSize);
                unit.wireframe.tint = 0xFFFFFF;
            } else {
                graphicsUtils.makeSpriteSize(unit.wireframe, this.wireframeSize * 0.7);
                unit.wireframe.tint = 0xb3b3b3;
            }
        }
    }.bind(this));
};

//unit specific display
unitPanel.prototype.updatePrevailingUnit = function(unit) {

    //flush
    if (this.prevailingUnit) {
        this.clearPrevailingUnit({
            transitioningUnits: unit
        });
        this.unitAugmentPanel.hideForCurrentUnit();
        this.unitPassivePanel.hideForCurrentUnit();
    }

    //fill
    if (unit) {
        this.prevailingUnit = unit;
        this.displayUnitPortrait();
        this.displayCurrentViewUnitStats();
        this.displayUnitAbilities();
        this.displayUnitPassives();
        this.displayCommands();
        this.highlightGroupUnit(unit);
        this.updateUnitItems(unit);

        //tint frame tint
        this.frameTint.tint = this.prevailingUnit.frameTint || 0xffffff;
        this.frameTint.alpha = this.frameTint.activatedAlpha;

        //stat view button
        if (this.currentViewState == this.toGraphViewButton) {
            graphicsUtils.addOrShowDisplayObject(this.toNumberViewButton);
        } else {
            graphicsUtils.addOrShowDisplayObject(this.toGraphViewButton);
        }

        //if the new unit has a grit dodge available, immediate show it instead of waiting for the next tick
        if (this.prevailingUnit.hasGritDodge) {
            if (this.killingBlowIndicator) {
                graphicsUtils.addOrShowDisplayObject(this.killingBlowIndicator);
            }
        }

        //show augment button
        this.unitAugmentPanel.lowerOpenButton();
        this.unitPassivePanel.lowerOpenButton();
    }
};

unitPanel.prototype.clearEnemyIcons = function() {
    mathArrayUtils.operateOnObjectByKey(this.enemyIcons, ((key, set) => {
        graphicsUtils.fadeSpriteQuicklyThenDestroy(set.icon, 250);
        graphicsUtils.fadeSpriteQuicklyThenDestroy(set.number, 250);
    }));
    this.enemyIcons = [];

    if (this.multiLevelPositionCount) {
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.multiLevelPositionCount, 250);
    }

    if (this.initialMultiLevelPosition) {
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.initialMultiLevelPosition, 250);
    }
};

unitPanel.prototype.addEnemyIcons = function(level, additionalOffset) {
    var enemySets = level.enemySets;
    var fadeInTime = 1000;
    additionalOffset = additionalOffset || 0;
    var filteredSets = enemySets.filter((set) => {
        return !set.trivial;
    });
    var len = Object.keys(filteredSets).length;
    var positions = mathArrayUtils.distributeXPositionsEvenlyAroundPoint({
        numberOfPositions: len,
        position: gameUtils.getPlayableCenterPlus({
            x: 0,
            y: 80 + additionalOffset
        }),
        spacing: 50
    });

    //comprehend multi level
    this.initialMultiLevelPosition = null;
    if (level.multiLevel) {
        this.initialMultiLevelPosition = graphicsUtils.addSomethingToRenderer("TEX+:(" + (level.multiLevelPosition + 1) + '/' + level.multiLevelSize + ')', 'hudOne', {
            position: mathArrayUtils.clonePosition(gameUtils.getPlayableCenter(), {
                y: 125
            }),
            style: styles.scoreStyleNonItalic
        });
        graphicsUtils.fadeSpriteInQuickly(this.initialMultiLevelPosition, fadeInTime);
    }

    var getIconPosition = function(i) {
        return mathArrayUtils.clonePosition(this.enemyCountStart, {
            x: (Math.floor(i / 2.0) * this.enemyCountXOffset),
            y: ((i % 2) * this.enemyCountYOffset)
        });
    }.bind(this);

    filteredSets.forEach((set, index) => {
        let existingNumber = Object.keys(this.enemyIcons).length;
        let fromPosition = positions[index];

        //create the number
        let number = graphicsUtils.addSomethingToRenderer("TEX+:" + set.spawn.total, {
            position: mathArrayUtils.clonePosition(fromPosition, {
                x: 12,
                y: 12
            }),
            where: 'hudOne',
            style: styles.fpsStyle
        });
        graphicsUtils.fadeSpriteInQuickly(number, fadeInTime);

        //create the actual icon (and border)
        let icon = graphicsUtils.addSomethingToRenderer(set.icon, {
            position: fromPosition,
            where: 'hudOne'
        });
        graphicsUtils.fadeSpriteInQuickly(icon, fadeInTime);
        graphicsUtils.makeSpriteSize(icon, this.enemyIconSize);

        let borderTint = 0x252f59;
        if(level.isBossLevel() && !set.addedProps.immuneToAugment) {
            borderTint = 0x6710ab;
        }

        var border = graphicsUtils.addBorderToSprite({
            sprite: icon,
            alpha: 0.7,
            tint: borderTint,
            thickness: 0,
            doubleBorder: true,
            doubleBorderThickness: 1,
            doubleBorderTint: 0xb3b3b3,
        });

        graphicsUtils.fadeSpriteInQuickly(icon.addedBorder, fadeInTime);
        graphicsUtils.fadeSpriteInQuickly(icon.addedDoubleBorder, fadeInTime);
        // graphicsUtils.flashSprite({
        //     sprite: icon.addedBorder,
        //     fromColor: 0x996a6a,
        //     toColor: 0x621414,
        //     times: 3,
        //     duration: 200
        // });
        let toPosition = getIconPosition(existingNumber);
        this.enemyIcons[set.id] = {
            icon: icon,
            number: number,
            toPosition: toPosition
        };
    });

    var iconSpeed = 12;
    var timingSpace = 150;
    var self = this;
    gameUtils.doSomethingAfterDuration(() => {
        Object.values(this.enemyIcons).forEach((ic, index) => {
            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.soundPool.swipeQuiet.play();
                graphicsUtils.sendSpriteToDestinationAtSpeed({
                    sprite: ic.icon,
                    destination: ic.toPosition,
                    pointAtDestination: false,
                    speed: iconSpeed,
                    surpassDestination: false
                });

                //fade multi level position and create the panel representation
                if (this.initialMultiLevelPosition && index == 0) {
                    graphicsUtils.fadeSpriteQuicklyThenDestroy(this.initialMultiLevelPosition, 250);
                    self.multiLevelPositionCount = graphicsUtils.addSomethingToRenderer('TEX+:(' + (level.multiLevelPosition + 1) + '/' + level.multiLevelSize + ')', 'hudOne', {
                        position: getIconPosition(filteredSets.length),
                        style: styles.scoreStyleNonItalic,
                        alpha: 0.75
                    });
                }

            }, index * timingSpace);

            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.soundPool.swipeQuiet.play();
                graphicsUtils.sendSpriteToDestinationAtSpeed({
                    sprite: ic.number,
                    destination: mathArrayUtils.clonePosition(ic.toPosition, {
                        x: 12,
                        y: 12
                    }),
                    pointAtDestination: false,
                    speed: iconSpeed,
                    surpassDestination: false
                });
            }, index * timingSpace);

            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.soundPool.swipeQuiet.play();
                graphicsUtils.sendSpriteToDestinationAtSpeed({
                    sprite: ic.icon.addedBorder,
                    destination: ic.toPosition,
                    pointAtDestination: false,
                    speed: iconSpeed,
                    surpassDestination: false
                });
            }, index * timingSpace);

            gameUtils.doSomethingAfterDuration(() => {
                globals.currentGame.soundPool.swipeQuiet.play();
                graphicsUtils.sendSpriteToDestinationAtSpeed({
                    sprite: ic.icon.addedDoubleBorder,
                    destination: ic.toPosition,
                    pointAtDestination: false,
                    speed: iconSpeed,
                    surpassDestination: false
                });
            }, index * timingSpace);
        });
    }, 3200);
};

unitPanel.prototype.decrementEnemyCount = function(enemySetId) {
    if (!this.enemyIcons[enemySetId]) {
        return;
    }
    this.enemyIcons[enemySetId].number.text -= 1;
    if (this.enemyIcons[enemySetId].number.text == 0) {
        this.enemyIcons[enemySetId].icon.tint = 0xc80b0b;
        this.enemyIcons[enemySetId].icon.alpha = 0.5;
    }
};

unitPanel.prototype.clearPrevailingUnit = function(options) {
    //clear items
    this.clearUnitItems();

    //turn off portrait
    if (this.currentPortrait) {
        this.currentPortrait.visible = false;
    }

    if (this.killingBlowIndicator) {
        this.killingBlowIndicator.visible = false;
    }

    //hide augment button
    this.unitAugmentPanel.hideOpenButton();

    //hide passive button
    this.unitPassivePanel.hideOpenButton();

    //hide chart buttons
    graphicsUtils.hideDisplayObject(this.toNumberViewButton);
    graphicsUtils.hideDisplayObject(this.toGraphViewButton);

    //blank out unit stat panel
    if (!options.transitioningUnits) {
        this.clearUnitStats();
        this.clearUnitStatsGraph();
    }

    graphicsUtils.hideDisplayObject(this.toGraphViewButton);
    graphicsUtils.hideDisplayObject(this.toNumberViewButton);

    //reset the frame tint
    this.frameTint.tint = 0xffffff;
    this.frameTint.alpha = 0.0;

    //clear exp bar
    if (!options.transitioningUnits) {
        this.experienceMeter.visible = false;
    }

    //clear unit ability icons
    if (this.currentAbilities) {
        $.each(this.currentAbilities, function(i, ability) {
            ability.icon.visible = false;
            ability.icon.tooltipObj.hide();
            ability.augments.forEach((augment) => {
                if (augment.smallerIcon) {
                    augment.smallerIcon.visible = false;
                    augment.smallerBorder.visible = false;
                    augment.smallerIcon.tooltipObj.hide();
                }
            });
            if (ability.abilityBorder) {
                ability.abilityBorder.visible = false;
            }
        });
    }
    this.currentAbilities = null;

    //clear passives
    this.updateUnitPassives({
        clear: true,
        transitioningUnits: options.transitioningUnits
    });

    //clear commands
    if (this.currentCommands) {
        $.each(this.currentCommands, function(i, command) {
            command.icon.visible = false;
        });
    }

    this.prevailingUnit = null;
};

unitPanel.prototype.displayUnitPortrait = function() {
    this.currentPortrait = this.prevailingUnit.portrait;
    if (!this.currentPortrait) return;

    if (!this.currentPortrait.parent) {
        var port = graphicsUtils.addSomethingToRenderer(this.currentPortrait, 'hudOne');
        gameUtils.deathPact(this.prevailingUnit, port);
    } else {
        this.currentPortrait.visible = true;
    }
    graphicsUtils.makeSpriteSize(this.currentPortrait, 90);
    this.currentPortrait.position = this.unitPortraitPosition;
};

unitPanel.prototype.updateUnitItems = function() {
    if (this.prevailingUnit) {
        //show nothing for non-player team units
        if (this.prevailingUnit.team != globals.currentGame.playerTeam) return;

        //regular items
        $.each(this.prevailingUnit.currentItems, function(i, item) {
            if (item == null)
                return;
            var icon = item.icon;

            //determine position
            var x = i % 2 == 0 ? this.itemCenterX : this.itemCenterX + this.itemXSpacing;
            var yLevel = Math.floor(i / 2);
            var y = this.itemCenterY + this.itemXSpacing * yLevel;
            graphicsUtils.addOrShowDisplayObject(icon);
            icon.position = {
                x: x,
                y: y
            };

            //set the empty slot to not be visible
            if (!item.isEmptySlot) {
                item.currentSlot.slotDef.icon.visible = false;
            }
        }.bind(this));

        //specialty items
        $.each(this.prevailingUnit.currentSpecialtyItems, function(i, item) {
            if (item == null)
                return;
            var icon = item.icon;

            //determine position
            var x = i % 2 == 0 ? this.spItemCenterX : this.spItemCenterX + this.spItemXSpacing;
            var yLevel = Math.floor(i / 2);
            var y = this.itemCenterY + this.spItemXSpacing * yLevel;
            if (!icon.parent) {
                var it = graphicsUtils.addSomethingToRenderer(icon, 'hudOne', {
                    position: {
                        x: x,
                        y: y
                    }
                });
                icon.visible = true;
                graphicsUtils.makeSpriteSize(icon, 27);
            } else {
                icon.position = {
                    x: x,
                    y: y
                };
                icon.visible = true;
            }

            //set the empty slot to not be visible
            if (!item.isEmptySlot) {
                item.currentSlot.slotDef.icon.visible = false;
            }
        }.bind(this));

        //backpack
        $.each(this.prevailingUnit.currentBackpack, function(i, item) {
            if (item == null)
                return;
            var icon = item.icon;
            var x = this.bpItemCenterX + this.bpItemXSpacing * i;
            var y = this.bpItemCenterY;
            if (!icon.parent) {
                var it = graphicsUtils.addSomethingToRenderer(icon, 'hudOne', {
                    position: {
                        x: x,
                        y: y
                    }
                });
                icon.visible = true;
                graphicsUtils.makeSpriteSize(icon, 27);
            } else {
                icon.position = {
                    x: x,
                    y: y
                };
                icon.visible = true;
            }

            //set the empty slot to not be visible
            if (!item.isEmptySlot) {
                item.currentSlot.slotDef.icon.visible = false;
            }
        }.bind(this));
    }
};

unitPanel.prototype.clear = function() {

};

unitPanel.prototype.clearUnitItems = function() {
    //clear regular items
    if (this.prevailingUnit && this.prevailingUnit.currentItems.length > 0) {
        $.each(this.prevailingUnit.currentItems, function(i, item) {
            if (item) {
                item.icon.visible = false;
            }
        });
    }

    //clear specialty items
    if (this.prevailingUnit && this.prevailingUnit.currentSpecialtyItems.length > 0) {
        $.each(this.prevailingUnit.currentSpecialtyItems, function(i, item) {
            if (item) {
                item.icon.visible = false;
            }
        });
    }

    //clear backpack items
    if (this.prevailingUnit && this.prevailingUnit.currentBackpack.length > 0) {
        $.each(this.prevailingUnit.currentBackpack, function(i, item) {
            if (item) {
                item.icon.visible = false;
            }
        });
    }

    //clear empty slots icons
    if (this.prevailingUnit) {
        $.each(this.prevailingUnit.emptySlots, function(i, emptyItemSlot) {
            emptyItemSlot.icon.visible = false;
        });
    }
};

var _convertRawToScaled = function(value, localScale) {
    var maxChartHeight = 60;
    var val = (value / localScale) * maxChartHeight;
    if (val > maxChartHeight) {
        val = maxChartHeight;
    }

    return val;
};

var _displayUnitStatsGraph = function() {
    if (this.prevailingUnit) {

        //name
        this.unitNameText.text = this.prevailingUnit.name || this.prevailingUnit.unitType;

        //damage/heal
        var main = this.prevailingUnit.damageMember ? this.prevailingUnit.damageMember() : this.prevailingUnit.damage;
        var additions = this.prevailingUnit.damageAdditionType ? this.prevailingUnit.getAdditionSum(this.prevailingUnit.damageAdditionType) : this.prevailingUnit.getDamageAdditionSum();
        var localScale = this.prevailingUnit.damageScale || 60;

        //damage
        this.damageHealBar.tooltipObj.setTitle(this.prevailingUnit.damageLabel || "Damage");
        graphicsUtils.makeSpriteSize(this.damageHealBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main + additions, localScale)
        });
        this.damageHealBar.currentRealValue = main + additions;

        //health
        main = this.prevailingUnit.maxHealth;
        localScale = 180;
        graphicsUtils.makeSpriteSize(this.healthChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.healthChartBar.currentRealValue = main;

        //health regen
        main = this.prevailingUnit.getTotalHealthRegeneration();
        localScale = 8;
        graphicsUtils.makeSpriteSize(this.healthRegenerationBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.healthRegenerationBar.currentRealValue = main;

        //energy
        main = this.prevailingUnit.maxEnergy;
        localScale = 110;
        graphicsUtils.makeSpriteSize(this.energyChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.energyChartBar.currentRealValue = main;

        //energy regen
        main = this.prevailingUnit.getTotalEnergyRegeneration();
        localScale = 8;
        graphicsUtils.makeSpriteSize(this.energyRegenerationBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.energyRegenerationBar.currentRealValue = main;

        //armor
        main = this.prevailingUnit.getTotalDefense();
        localScale = 12;
        graphicsUtils.makeSpriteSize(this.armorChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.armorChartBar.currentRealValue = main;

        //grit
        main = this.prevailingUnit.getTotalGrit();
        localScale = 100;
        graphicsUtils.makeSpriteSize(this.gritChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.gritChartBar.currentRealValue = main;

        //dodge
        main = this.prevailingUnit.getTotalRawDodge();
        localScale = 100;
        graphicsUtils.makeSpriteSize(this.dodgeChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.dodgeChartBar.currentRealValue = main;

        //range
        main = this.prevailingUnit.range;
        localScale = 600;
        graphicsUtils.makeSpriteSize(this.rangeChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.rangeChartBar.currentRealValue = main;

        //attack speed
        this.asChartBar.tooltipObj.setTitle(this.prevailingUnit.attackSpeedLabel || "Attack Speed");
        main = 1000 / (this.prevailingUnit.cooldown * this.prevailingUnit.cooldownMultiplier);
        localScale = 10;
        graphicsUtils.makeSpriteSize(this.asChartBar, {
            x: this.chartBarWidth,
            y: _convertRawToScaled(main, localScale)
        });
        this.asChartBar.currentRealValue = main.toFixed(1);
    }
};

var _displayUnitStats = function() {
    var sign;
    if (this.prevailingUnit) {
        //name
        this.unitNameText.text = this.prevailingUnit.name || this.prevailingUnit.unitType;

        //damage (or heal)
        var functionText = "";
        if (this.prevailingUnit.damageMember && this.prevailingUnit.damageMember instanceof Function) {
            functionText = this.prevailingUnit.damageMember().toFixed(1);
        }
        this.unitDamageText.text = (this.prevailingUnit.damageLabel ? this.prevailingUnit.damageLabel + ": " : "Dmg: ") + (functionText || (this.prevailingUnit.damageMember ? this.prevailingUnit[this.prevailingUnit.damageMember].toFixed(1) : this.prevailingUnit.damage).toFixed(1));
        var damageAdditionLen = this.prevailingUnit.damageAdditionType ? this.prevailingUnit.getAdditions(this.prevailingUnit.damageAdditionType).length : this.prevailingUnit.damageAdditions.length;
        if (damageAdditionLen > 0) {
            sign = '+';
            if (this.prevailingUnit.getDamageAdditionSum() < 0) {
                sign = '';
            }
            var damageAdditionType = this.prevailingUnit.damageAdditionType ? this.prevailingUnit.getAdditionSum(this.prevailingUnit.damageAdditionType).toFixed(1) : this.prevailingUnit.getDamageAdditionSum().toFixed(1);
            this.unitDamageAdditionsText.text = sign + damageAdditionType;
            this.unitDamageAdditionsText.position = mathArrayUtils.clonePosition(this.unitDamageText.position, {
                x: this.unitDamageText.width
            });
        } else {
            this.unitDamageAdditionsText.text = '';
        }

        //armor
        this.unitDefenseText.text = "Arm: " + this.prevailingUnit.defense.toFixed(1);
        if (this.prevailingUnit.defenseAdditions.length > 0) {
            sign = '+';
            if (this.prevailingUnit.getDefenseAdditionSum() < 0) {
                sign = '';
            }
            this.unitDefenseAdditionsText.text = sign + this.prevailingUnit.getDefenseAdditionSum().toFixed(1);
            this.unitDefenseAdditionsText.position = mathArrayUtils.roundPositionToWholeNumbers(mathArrayUtils.clonePosition(this.unitDefenseText.position, {
                x: this.unitDefenseText.width
            }));
        } else {
            this.unitDefenseAdditionsText.text = '';
        }

        //health
        this.unitHealthText.text = "H: " + ((this.prevailingUnit.currentHealth < 1.0) ? 1.0 : Math.floor(this.prevailingUnit.currentHealth));

        //grit
        this.unitGritText.text = "G: " + this.prevailingUnit.grit;
        if (this.prevailingUnit.gritAdditions.length > 0) {
            sign = '+';
            if (this.prevailingUnit.getGritAdditionSum() < 0) {
                sign = '';
            }
            this.unitGritAdditionsText.text = sign + this.prevailingUnit.getGritAdditionSum();
            this.unitGritAdditionsText.position = mathArrayUtils.clonePosition(this.unitGritText.position, {
                x: this.unitGritText.width
            });
        } else {
            this.unitGritAdditionsText.text = '';
        }

        //dodge
        this.unitDodgeText.text = "D: " + this.prevailingUnit.dodge;
        if (this.prevailingUnit.dodgeAdditions.length > 0) {
            sign = '+';
            if (this.prevailingUnit.getDodgeAdditionSum() < 0) {
                sign = '';
            }
            this.unitDodgeAdditionsText.text = sign + this.prevailingUnit.getDodgeAdditionSum();
            this.unitDodgeAdditionsText.position = mathArrayUtils.clonePosition(this.unitDodgeText.position, {
                x: this.unitDodgeText.width
            });
        } else {
            this.unitDodgeAdditionsText.text = '';
        }

        //energy
        this.unitEnergyText.text = "E: " + Math.floor(this.prevailingUnit.currentEnergy);
    }
};

unitPanel.prototype.clearUnitStatsGraph = function() {
    graphicsUtils.hideDisplayObject(this.unitNameText);
    graphicsUtils.hideDisplayObject(this.damageHealBar);
    graphicsUtils.hideDisplayObject(this.healthChartBar);
    graphicsUtils.hideDisplayObject(this.healthRegenerationBar);
    graphicsUtils.hideDisplayObject(this.energyChartBar);
    graphicsUtils.hideDisplayObject(this.energyRegenerationBar);
    graphicsUtils.hideDisplayObject(this.armorChartBar);
    graphicsUtils.hideDisplayObject(this.gritChartBar);
    graphicsUtils.hideDisplayObject(this.dodgeChartBar);
    graphicsUtils.hideDisplayObject(this.rangeChartBar);
    graphicsUtils.hideDisplayObject(this.asChartBar);
    graphicsUtils.hideDisplayObject(this.chartLine1);
    graphicsUtils.hideDisplayObject(this.chartLine2);
    graphicsUtils.hideDisplayObject(this.chartLine3);
};

unitPanel.prototype.displayUnitStatsGraph = function() {
    graphicsUtils.addOrShowDisplayObject(this.unitNameText);
    graphicsUtils.addOrShowDisplayObject(this.damageHealBar);
    graphicsUtils.addOrShowDisplayObject(this.healthChartBar);
    graphicsUtils.addOrShowDisplayObject(this.healthRegenerationBar);
    graphicsUtils.addOrShowDisplayObject(this.energyChartBar);
    graphicsUtils.addOrShowDisplayObject(this.energyRegenerationBar);
    graphicsUtils.addOrShowDisplayObject(this.armorChartBar);
    graphicsUtils.addOrShowDisplayObject(this.gritChartBar);
    graphicsUtils.addOrShowDisplayObject(this.dodgeChartBar);
    graphicsUtils.addOrShowDisplayObject(this.rangeChartBar);
    graphicsUtils.addOrShowDisplayObject(this.asChartBar);
    graphicsUtils.addOrShowDisplayObject(this.chartLine1);
    graphicsUtils.addOrShowDisplayObject(this.chartLine2);
    graphicsUtils.addOrShowDisplayObject(this.chartLine3);

    //Unit Stats Graph Ticker
    if (!this.updateUnitStatGraphTick) {
        this.updateUnitStatGraphTick = globals.currentGame.addTickCallback(_displayUnitStatsGraph.bind(this));
    } else {
        _displayUnitStatsGraph.call(this);
    }
};

unitPanel.prototype.clearUnitStats = function() {
    graphicsUtils.hideDisplayObject(this.unitNameText);
    graphicsUtils.hideDisplayObject(this.unitDamageText);
    graphicsUtils.hideDisplayObject(this.unitDamageAdditionsText);
    graphicsUtils.hideDisplayObject(this.unitDefenseText);
    graphicsUtils.hideDisplayObject(this.unitDefenseAdditionsText);
    graphicsUtils.hideDisplayObject(this.unitHealthText);
    graphicsUtils.hideDisplayObject(this.unitGritText);
    graphicsUtils.hideDisplayObject(this.unitGritAdditionsText);
    graphicsUtils.hideDisplayObject(this.unitDodgeText);
    graphicsUtils.hideDisplayObject(this.unitDodgeAdditionsText);
    graphicsUtils.hideDisplayObject(this.unitEnergyText);
};

unitPanel.prototype.displayCurrentViewUnitStats = function() {
    this.clearUnitStats();
    this.clearUnitStatsGraph();
    if (this.currentViewState == this.toGraphViewButton) {
        this.displayUnitStatsGraph();
    } else {
        this.displayUnitStats();
    }
};

unitPanel.prototype.displayUnitStats = function() {
    graphicsUtils.addOrShowDisplayObject(this.unitNameText);
    graphicsUtils.addOrShowDisplayObject(this.unitDamageText);
    graphicsUtils.addOrShowDisplayObject(this.unitDamageAdditionsText);
    graphicsUtils.addOrShowDisplayObject(this.unitDefenseText);
    graphicsUtils.addOrShowDisplayObject(this.unitDefenseAdditionsText);
    graphicsUtils.addOrShowDisplayObject(this.unitHealthText);
    graphicsUtils.addOrShowDisplayObject(this.unitGritText);
    graphicsUtils.addOrShowDisplayObject(this.unitGritAdditionsText);
    graphicsUtils.addOrShowDisplayObject(this.unitDodgeText);
    graphicsUtils.addOrShowDisplayObject(this.unitDodgeAdditionsText);
    graphicsUtils.addOrShowDisplayObject(this.unitEnergyText);

    //Unit Stats Ticker
    if (!this.updateUnitStatTick) {
        this.updateUnitStatTick = globals.currentGame.addTickCallback(_displayUnitStats.bind(this));
    } else {
        _displayUnitStats.call(this);
    }

    //experience meter
    // if (!this.updateExperienceMeterTick) {
    //     this.updateExperienceMeterTick = globals.currentGame.addTickCallback(function() {
    //         if (this.prevailingUnit) {
    //             this.experienceMeter.visible = true;
    //             var expPercent = (this.prevailingUnit.currentExperience - this.prevailingUnit.lastLevelExp) / (this.prevailingUnit.nextLevelExp - this.prevailingUnit.lastLevelExp);
    //             graphicsUtils.makeSpriteSize(this.experienceMeter, {
    //                 x: gameUtils.getPlayableWidth() * expPercent,
    //                 y: this.barOffset - 1
    //             });
    //         } else {
    //             this.experienceMeter.visible = false;
    //         }
    //     }.bind(this));
    // }
};

unitPanel.prototype.displayUnitAbilities = function() {
    if (!this.prevailingUnit.abilities) return;

    this.currentAbilities = this.prevailingUnit.abilities;

    //place, scale and enable abilility icons
    $.each(this.currentAbilities, function(i, ability) {
        ability.icon.scale = graphicsUtils.makeSpriteSize(ability.icon, this.abililtyWidth);
        ability.icon.position = {
            x: this.abilityOneCenterX + (this.abilitySpacing * i),
            y: this.abilityOneCenterY
        };
        ability.icon.visible = true;
        if (!ability.icon.parent) {
            var a = graphicsUtils.addSomethingToRenderer(ability.icon, 'hudOne');
            ability.addSlave(a);

            //autocast init
            if (ability.autoCastEnabled) {
                ability.systemMessage.push('Ctrl+Click to toggle autocast');
                var b = ability.abilityBorder = graphicsUtils.addSomethingToRenderer('TintableAbilityBorder', 'hudOne', {
                    position: ability.icon.position
                });
                ability.addSlave(b);
                ability.autoCastTimer = graphicsUtils.graduallyTint(ability.abilityBorder, 0x284422, 0x27EC00, 1300, null, 500);
                ability.addSlave(ability.autoCastTimer);
                ability.abilityBorder.visible = ability.getAutoCastVariable;
                ability.icon.interactive = true;
                ability.icon.on('mouseup', function(event) {
                    if (keyStates.Control) {
                        ability.autoCast();
                        ability.abilityBorder.visible = ability.getAutoCastVariable();
                        ability.autoCastTimer.reset();
                        this.autoCastSound.play();
                    }
                }.bind(this));
            }
            Tooltip.makeTooltippable(ability.icon, ability);
        }


        //refresh autocast state
        if (ability.abilityBorder) {
            ability.abilityBorder.visible = ability.getAutoCastVariable();
        }

        var borderAddition = 2;
        var augmentSpacing = 10;
        var augmentSize = (ability.icon.width - (borderAddition * 2)) / (3);
        augmentSize = 19;
        var startingX = augmentSize;
        var augmentBorderSize = augmentSize + borderAddition;
        var augmentCount = 0; //init this to 1
        if (ability.augments) {
            $.each(ability.augments, function(i, augment) {
                let xAugmentOffset = augmentCount;
                let yAugmentOffset = 0;
                if(augmentCount > 2) {
                    xAugmentOffset = 2;
                    yAugmentOffset = augmentCount - 2;
                }

                let pos = {
                    x: (ability.icon.position.x - (ability.icon.width / 2)) + startingX - (augmentSize / 2) + xAugmentOffset * (augmentSize + borderAddition / 2),
                    y: (ability.icon.position.y) + (ability.icon.height / 2) - (yAugmentOffset * augmentSize) - (yAugmentOffset * 0.5),
                };
                var augmentPosition = mathArrayUtils.clonePosition(pos, {
                    x: borderAddition / 2,
                    y: -(augmentSize + borderAddition) / 2
                });
                if (!augment.smallerIcon) {
                    augment.smallerIcon = graphicsUtils.addSomethingToRenderer(augment.icon.texture, {
                        where: 'hudOne',
                        sortYOffset: 200
                    });
                    Tooltip.makeTooltippable(augment.smallerIcon, {
                        title: augment.title,
                        description: augment.description,
                        updaters: augment.updaters
                    });
                    augment.smallerBorder = graphicsUtils.addSomethingToRenderer('AugmentBorder', {
                        where: 'hudOne',
                        sortYOffset: 200
                    });
                    graphicsUtils.makeSpriteSize(augment.smallerIcon, augmentSize);
                    graphicsUtils.makeSpriteSize(augment.smallerBorder, augmentBorderSize);
                    ability.addSlave(augment.smallerIcon, augment.smallerBorder);
                }
                if (ability.isAugmentEnabled(augment)) {
                    augment.smallerIcon.position = augmentPosition;
                    augment.smallerBorder.position = augmentPosition;
                    augmentCount++;
                    augment.smallerIcon.visible = true;
                    augment.smallerBorder.visible = true;

                    //don't forget to match current ability tint
                    augment.smallerIcon.tint = ability.tint || 0xFFFFFF;
                    augment.smallerBorder.tint = ability.tint || 0xFFFFFF;
                } else {
                    augment.smallerIcon.visible = false;
                    augment.smallerBorder.visible = false;
                }
            }.bind(this));
        }
    }.bind(this));

    var unavailableTint = 0x2b2b2b;
    if (!this.abilityAvailableTick) {
        this.abilityAvailableTick = globals.currentGame.addTickCallback(function() {
            if (this.prevailingUnit) {
                $.each(this.currentAbilities, function(i, ability) {
                    var enabled = ability.isEnabled();
                    if (!enabled) {
                        ability.icon.tint = unavailableTint;
                        ability.augments.forEach((augment) => {
                            if (augment.smallerIcon) {
                                augment.smallerIcon.tint = unavailableTint;
                                augment.smallerBorder.tint = unavailableTint;
                            }
                        });
                    } else if (ability.icon.tint == unavailableTint) {
                        ability.icon.tint = 0xFFFFFF;
                        ability.augments.forEach((augment) => {
                            if (augment.smallerIcon) {
                                augment.smallerIcon.tint = 0xFFFFFF;
                                augment.smallerBorder.tint = 0xFFFFFF;
                            }
                        });
                    }
                });
            }
        }.bind(this));
    }
};

unitPanel.prototype.displayUnitPassives = function(options) {
    options = options || {};
    var unit = this.prevailingUnit;

    //clear last passive
    if (this.currentDefensePassive) {
        this.currentDefensePassive.activeIcon.visible = false;
        this.currentDefensePassive.activeIcon.tooltipObj.hide();
        this.defensePassiveMeter.visible = false;
    }

    if (this.currentActivePassive) {
        this.currentActivePassive.activeIcon.visible = false;
        this.currentActivePassive.activeIcon.tooltipObj.hide();
        this.attackPassiveMeter.visible = false;
    }

    if (this.defensivePassiveTooltippable) {
        this.defensivePassiveTooltippable.tooltipObj.hide();
        this.defensivePassiveTooltippable.visible = false;
    }
    if (this.aggressionPassiveTooltippable) {
        this.aggressionPassiveTooltippable.tooltipObj.hide();
        this.aggressionPassiveTooltippable.visible = false;
    }
    // if ((!this.prevailingUnit.defensePassive && !this.prevailingUnit.attackPassive) || options.clear) return;
    if (options.clear) {
        return;
    }

    if (unit.defensePassive) {
        if (!unit.defensePassive.activeIcon) {
            unit.defensePassive.activeIcon = graphicsUtils.createDisplayObject(unit.defensePassive.textureName, {
                where: 'hudOne'
            });
        }

        this.defensePassiveMeter.visible = true;

        //retooltip this
        if (unit.defensePassive.activeIcon.tooltipObj) {
            unit.defensePassive.activeIcon.tooltipObj.destroy();
        }
        Tooltip.makeTooltippable(unit.defensePassive.activeIcon, {
            title: unit.defensePassive.title,
            description: unit.defensePassive.defenseDescription,
            descriptionStyle: unit.defensePassive.defensiveDescrStyle,
            systemMessage: unit.defensePassive.defenseCooldown / 1000 + ' second cooldown'
        });

        graphicsUtils.addOrShowDisplayObject(unit.defensePassive.activeIcon);
        this.currentDefensePassive = unit.defensePassive;
        unit.defensePassive.activeIcon.position = {
            x: this.passiveCenterX,
            y: this.passiveBottomCenterY
        };
    } else {
        if (!this.defensivePassiveTooltippable) {
            this.defensivePassiveTooltippable = graphicsUtils.createDisplayObject('TintableSquare', {
                where: 'hudOne',
                position: {
                    x: this.passiveCenterX,
                    y: this.passiveBottomCenterY
                },
                alpha: 0.0,
            });
            this.defensivePassiveTooltippable.on('mousemove', function(event) {
                this.defensivePassiveTooltippable.alpha = 0.1;
            }.bind(this));
            this.defensivePassiveTooltippable.on('mouseout', function(event) {
                this.defensivePassiveTooltippable.alpha = 0.0;
            }.bind(this));
            graphicsUtils.makeSpriteSize(this.defensivePassiveTooltippable, {
                x: 32,
                y: 32
            });
            Tooltip.makeTooltippable(this.defensivePassiveTooltippable, {
                title: 'Defensive State Of Mind',
                descriptions: ['Inactive']
            });
        }
        graphicsUtils.addOrShowDisplayObject(this.defensivePassiveTooltippable);
    }

    if (unit.attackPassive) {
        if (!unit.attackPassive.activeIcon) {
            unit.attackPassive.activeIcon = graphicsUtils.createDisplayObject(unit.attackPassive.textureName, {
                where: 'hudOne'
            });
        }

        this.attackPassiveMeter.visible = true;

        //retooltip this
        if (unit.attackPassive.activeIcon.tooltipObj) {
            unit.attackPassive.activeIcon.tooltipObj.destroy();
        }
        Tooltip.makeTooltippable(unit.attackPassive.activeIcon, {
            title: unit.attackPassive.title,
            description: unit.attackPassive.aggressionDescription,
            descriptionStyle: unit.attackPassive.aggressionDescrStyle,
            systemMessage: unit.attackPassive.aggressionCooldown / 1000 + ' second cooldown'
        });

        graphicsUtils.addOrShowDisplayObject(unit.attackPassive.activeIcon);
        this.currentActivePassive = unit.attackPassive;
        unit.attackPassive.activeIcon.position = {
            x: this.passiveCenterX,
            y: this.passiveTopCenterY
        };
    } else {
        if (!this.aggressionPassiveTooltippable) {
            this.aggressionPassiveTooltippable = graphicsUtils.createDisplayObject('TintableSquare', {
                where: 'hudOne',
                position: {
                    x: this.passiveCenterX,
                    y: this.passiveTopCenterY
                },
                alpha: 0.0,
            });
            this.aggressionPassiveTooltippable.on('mousemove', function(event) {
                this.aggressionPassiveTooltippable.alpha = 0.1;
            }.bind(this));
            this.aggressionPassiveTooltippable.on('mouseout', function(event) {
                this.aggressionPassiveTooltippable.alpha = 0.0;
            }.bind(this));
            graphicsUtils.makeSpriteSize(this.aggressionPassiveTooltippable, {
                x: 32,
                y: 32
            });
            Tooltip.makeTooltippable(this.aggressionPassiveTooltippable, {
                title: 'Aggressive State Of Mind',
                descriptions: ['Inactive']
            });
        }
        graphicsUtils.addOrShowDisplayObject(this.aggressionPassiveTooltippable);
    }

    //create the timing meters
    if (!this.attackPassiveMeter) {
        this.attackPassiveMeter = graphicsUtils.addSomethingToRenderer('TintableSquare', {
            tint: 0x67c18b,
            position: {
                x: this.passiveCenterX - 16,
                y: this.passiveTopCenterY + 18
            },
            anchor: {
                x: 0,
                y: 0
            },
            where: 'hudOne'
        });
        this.defensePassiveMeter = graphicsUtils.addSomethingToRenderer('TintableSquare', {
            tint: 0x67c18b,
            position: {
                x: this.passiveCenterX - 16,
                y: this.passiveBottomCenterY + 18
            },
            anchor: {
                x: 0,
                y: 0
            },
            where: 'hudOne'
        });
        this.attackPassiveMeter.visible = false;
        this.defensePassiveMeter.visible = false;
        this.meterUpdater = globals.currentGame.addTickCallback(function() {
            var unit = this.prevailingUnit;
            if (!unit) return;
            if (unit.attackPassive) {
                let percentDone = unit.attackPassive.coolDownMeterPercent;
                this.attackPassiveMeter.visible = true;
                graphicsUtils.makeSpriteSize(this.attackPassiveMeter, {
                    x: 32 * percentDone,
                    y: 8
                });
                if (percentDone < 1.0) {
                    this.attackPassiveMeter.tint = 0xbbaeae;
                    unit.attackPassive.activeIcon.tint = 0x575757;
                } else if (!unit.attackPassive.inProcess && unit.attackPassive.newCharge) {
                    this.attackPassiveMeter.tint = 0x09c216;
                    unit.attackPassive.activeIcon.tint = 0xFFFFFF;
                } else if (unit.attackPassive.inProcess) {
                    this.attackPassiveMeter.tint = 0x7d302b;
                }
            } else {
                this.attackPassiveMeter.visible = false;
            }
            if (unit.defensePassive) {
                let percentDone = unit.defensePassive.coolDownMeterPercent;
                this.defensePassiveMeter.visible = true;
                graphicsUtils.makeSpriteSize(this.defensePassiveMeter, {
                    x: 32 * percentDone,
                    y: 8
                });
                if (percentDone < 1.0) {
                    this.defensePassiveMeter.tint = 0xbbaeae;
                    unit.defensePassive.activeIcon.tint = 0x575757;
                } else if (!unit.defensePassive.inProcess && unit.defensePassive.newCharge) {
                    this.defensePassiveMeter.tint = 0x09c216;
                    unit.defensePassive.activeIcon.tint = 0xFFFFFF;
                } else if (unit.defensePassive.inProcess) {
                    this.defensePassiveMeter.tint = 0x1f3c62;
                }
            } else {
                this.defensePassiveMeter.visible = false;
            }
        }.bind(this));
    }

    this.eventsSet = true;
    Matter.Events.on(this, "attackPassiveActivated", function(event) {
        var times = event.duration < 1000 ? 3 : 5;
        var timer = graphicsUtils.graduallyTint(this.currentActivePassive.activeIcon, 0xffffff, 0x575757, event.duration / times);
        gameUtils.doSomethingAfterDuration(function() {
            globals.currentGame.invalidateTimer(timer);
        }.bind(this), event.duration);
    }.bind(this));

    Matter.Events.on(this, "defensePassiveActivated", function(event) {
        var times = event.duration < 1000 ? 3 : 5;
        var timer = graphicsUtils.graduallyTint(this.currentDefensePassive.activeIcon, 0xffffff, 0x575757, event.duration / times);
        gameUtils.doSomethingAfterDuration(function() {
            globals.currentGame.invalidateTimer(timer);
        }.bind(this), event.duration);
    }.bind(this));
};

unitPanel.prototype.displayCommands = function() {
    if (!this.attackMoveIcon) {
        this.moveIcon = graphicsUtils.addSomethingToRenderer('MoveIcon', 'hudOne', {
            position: {
                x: this.commandOneCenterX,
                y: this.commandOneCenterY
            }
        });
        graphicsUtils.makeSpriteSize(this.moveIcon, 25);
        this.currentCommands.push({
            name: 'attack',
            icon: this.moveIcon
        });
        Tooltip.makeTooltippable(this.moveIcon, {
            title: 'Move',
            hotkey: 'M',
            description: "Move to a destination."
        });

        this.attackMoveIcon = graphicsUtils.addSomethingToRenderer('AttackIcon', 'hudOne', {
            position: {
                x: this.commandOneCenterX + this.commandSpacing,
                y: this.commandOneCenterY
            }
        });
        graphicsUtils.makeSpriteSize(this.attackMoveIcon, 25);
        this.currentCommands.push({
            name: 'move',
            icon: this.attackMoveIcon
        });
        Tooltip.makeTooltippable(this.attackMoveIcon, {
            title: 'Attack-move',
            hotkey: 'A',
            description: "Attack-move to a destination."
        });

        this.stopIcon = graphicsUtils.addSomethingToRenderer('StopIcon', 'hudOne', {
            position: {
                x: this.commandOneCenterX + this.commandSpacing * 2,
                y: this.commandOneCenterY
            }
        });
        graphicsUtils.makeSpriteSize(this.stopIcon, 25);
        this.currentCommands.push({
            name: 'stop',
            icon: this.stopIcon
        });
        Tooltip.makeTooltippable(this.stopIcon, {
            title: 'Stop',
            hotkey: 'S',
            description: "Stop current command."
        });

        this.holdPositionIcon = graphicsUtils.addSomethingToRenderer('HoldPositionIcon', 'hudOne', {
            position: {
                x: this.commandOneCenterX + this.commandSpacing * 3,
                y: this.commandOneCenterY
            }
        });
        graphicsUtils.makeSpriteSize(this.holdPositionIcon, 25);
        this.currentCommands.push({
            name: 'holdPosition',
            icon: this.holdPositionIcon
        });
        Tooltip.makeTooltippable(this.holdPositionIcon, {
            title: 'Hold Position',
            hotkey: 'G or H',
            description: "Prevent any automatic movement."
        });
    } else {
        $.each(this.currentCommands, function(i, command) {
            command.icon.visible = false;
            $.each(this.prevailingUnit.commands, function(j, unitCommand) {
                if (unitCommand.name == command.name) {
                    command.icon.visible = true;
                }
            }.bind(this));
        }.bind(this));
    }
};

unitPanel.prototype.swapStatesOfMind = function(unit) {
    this.unitPassivePanel.refreshForUnit(unit);
    this.displayUnitPassives();
};

unitPanel.prototype.showAugmentsForUnit = function(unit) {
    this.unitAugmentPanel.showForUnit(unit);
};

unitPanel.prototype.showPassivesForUnit = function(unit) {
    this.unitPassivePanel.showForUnit(unit);
};

unitPanel.prototype.hideAugmentsForCurrentUnit = function() {
    this.unitAugmentPanel.hideForCurrentUnit();
};

unitPanel.prototype.hidePassivesForCurrentUnit = function() {
    this.unitPassivePanel.hideForCurrentUnit();
};

unitPanel.prototype.showAugmentsAndPassivesForUnit = function(unit) {
    this.unitAugmentPanel.showForUnit(unit);
    this.unitPassivePanel.showForUnit(unit);
};

unitPanel.prototype.hideAugmentsAndPassivesForUnit = function() {
    this.unitAugmentPanel.hideForCurrentUnit();
    this.unitPassivePanel.hideForCurrentUnit();
};

unitPanel.prototype.refreshAugmentButton = function() {
    this.unitAugmentPanel.lowerOpenButton();
};

unitPanel.prototype.refreshPassiveButton = function() {
    this.unitPassivePanel.lowerOpenButton();
};

unitPanel.prototype.cleanUp = function() {
    globals.currentGame.removeTickCallback(this.updateUnitStatTick);
    globals.currentGame.removeTickCallback(this.updateUnitStatGraphTick);
    globals.currentGame.removeTickCallback(this.updateHealthAndEnergyVialTick);
    globals.currentGame.removeTickCallback(this.abilityAvailableTick);
    globals.currentGame.removeTickCallback(this.meterUpdater);

    //unit configuration panel
    if (this.unitAugmentPanel) {
        this.unitAugmentPanel.cleanUp();
    }

    //unit passive panel
    if (this.unitPassivePanel) {
        this.unitPassivePanel.cleanUp();
    }

    if (this.helpMenu) {
        this.helpMenu.cleanUp();
    }

    this.clearEnemyIcons();

    $('body').off('keydown.viewSwitch');

    this.autoCastSound.unload();

    if (this.eventsSet) {
        Matter.Events.off(this, "attackPassiveActivated");
        Matter.Events.off(this, "defensePassiveActivated");
    }
};

unitPanel.prototype.updateUnitAbilities = unitPanel.prototype.displayUnitAbilities;
unitPanel.prototype.updateUnitPassives = unitPanel.prototype.displayUnitPassives;

export default unitPanel;
