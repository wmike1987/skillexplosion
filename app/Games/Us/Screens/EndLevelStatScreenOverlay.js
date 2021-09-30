import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import Tooltip from '@core/Tooltip.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    ItemClasses
} from '@games/Us/Items/ItemClasses.js';

//Stat titles
var kills = "Kills";
var deaths = "Deaths";
var damageDone = "Damage Done";
var damageTaken = "Damage Taken";
var healingDone = "Healing Done";
var preventedArmorDamage = "Damage Blocked By Armor";
var attacksDodged = "Attacks Dodged";
var groundCovered = "Distance Covered";
var apm = "APM";
var titleStyle = styles.statTitleStyle;
var statStyle = styles.statTextStyle;
var statDividerStyle = styles.statDividerStyle;
var unitGeneralHPStyle = styles.unitGeneralHPStyle;
var unitDamageStyle = styles.unitDamageStyle;
var unitDefenseStyle = styles.unitDefenseStyle;
var unitGritStyle = styles.unitGritStyle;
var unitDodgeStyle = styles.unitDodgeStyle;
var unitDefenseAdditionsStyle = styles.unitDefenseAdditionsStyle;
var unitGeneralEnergyStyle = styles.unitGeneralEnergyStyle;

//Shane titles
var shaneTitle = "Shane";
var knivesThrownKilled = "Knife Throws/Kills";
var dashesPerformed = "Dashes Performed";

//Ursula titles
var ursulaTitle = "Ursula";
var minesLaid = "Mines Laid";
var secretStepsPerformed = "Vanishes Performed";

var createContainer = function() {
    var container = new PIXI.Container();
    var left = graphicsUtils.createDisplayObject('Container1Left', {
        where: 'hudText',
        position: {
            x: -44,
            y: 0
        }
    });
    var right = graphicsUtils.createDisplayObject('Container1Right', {
        where: 'hudText',
        position: {
            x: 44,
            y: 0
        }
    });
    container.addChild(left);
    container.addChild(right);
    return container;
};

var presentItems = function(options) {
    var scene = options.scene;
    var nodeIndex = 0;
    var numberOfChoices = globals.currentGame.map.completedNodes.length;
    var choices = [];
    var rewardDuration = 800;
    var done = options.done;

    var recursivePresentation = function() {
        var currentNode = globals.currentGame.map.completedNodes[nodeIndex];
        nodeIndex += 1;

        //Show the choose item text
        globals.currentGame.soundPool.positiveSoundFast.play();
        var t = numberOfChoices == 1 ? 'Take your item!' : 'Choose an item!';
        t = (nodeIndex > 1) ? "Choose another!" : t;
        var rewardText = graphicsUtils.floatText(t, gameUtils.getPlayableCenterPlus({
            y: 300
        }), {
            where: 'hudTwo',
            style: styles.rewardTextLarge,
            speed: 6,
            duration: rewardDuration
        });
        scene.add(rewardText);
        graphicsUtils.addGleamToSprite({
            sprite: rewardText,
            gleamWidth: 50,
            duration: 500
        });

        //Display the choices
        var j = 0;
        var positions = mathArrayUtils.distributeXPositionsEvenlyAroundPoint({
            numberOfPositions: numberOfChoices,
            position: gameUtils.getPlayableCenterPlus({
                x: 0,
                y: 300
            }),
            spacing: 50
        });
        gameUtils.doSomethingAfterDuration(() => {
            var selectionOptions = ItemUtils.getRandomItemsFromClass(currentNode.levelDetails.itemClass, currentNode.levelDetails.itemType, numberOfChoices);
            selectionOptions.forEach((choice) => {
                var position = positions[j];
                j++;

                var itemDef = $.Deferred();
                ItemUtils.createItemObj({
                    gamePrefix: 'Us',
                    itemName: choice,
                    position: gameUtils.getPlayableCenter(),
                    dontAddToItemSystem: true,
                    itemDeferred: itemDef
                });
                itemDef.done(function(item) {
                    items.push(item);

                    //show item icon
                    graphicsUtils.addDisplayObjectToRenderer(item.icon);
                    graphicsUtils.changeDisplayObjectStage(item.icon, 'hudTwo');
                    graphicsUtils.makeSpriteSize(item.icon, 36);
                    item.icon.position = position;
                    graphicsUtils.addBorderToSprite({
                        sprite: item.icon
                    });
                    Tooltip.makeTooltippable(item.icon, Object.assign({}, item.originalTooltipObj, {
                        systemMessage: 'Click to receive.'
                    }));

                    //mouse down listener
                    var f = function(event) {
                        makeSelection(item);
                    }.bind(this);
                    item.icon.on('mousedown', f);
                    item.removeSelector = function() {
                        item.icon.off('mousedown', f);
                    };
                }.bind(this));
            });
        }, rewardDuration);

        var items = [];

        //selection method
        var makeSelection = function(item) {
            choices.push(item.itemName);
            item.icon.tooltipObj.hide();
            globals.currentGame.soundPool.itemChoose.play();

            //hide all icons, remove the click handlers, then destory the items
            items.forEach((i) => {
                i.icon.visible = false;
                i.removeSelector();
                i.destroy();
            });

            if (choices.length == globals.currentGame.map.completedNodes.length) {
                globals.currentGame.flyover(() => {
                    globals.currentGame.dustAndItemBox({
                        location: gameUtils.getPlayableCenterPlus({
                            y: 50
                        }),
                        item: choices,
                        autoDestroyBox: true
                    });
                }, {
                    quiet: true
                });
                done(); //We're done
            } else {
                //present the next set of choices
                gameUtils.doSomethingAfterDuration(() => {
                    recursivePresentation();
                }, 100);
            }

            return;
        };
    };

    recursivePresentation();
};

var EndLevelStatScreenOverlay = function(units, statsObj, options) {
    options = Object.assign({
        type: 'victory'
    }, options);
    //for troubleshooting victory screen
    if (true) {
        units = units || {
            shane: {},
            ursula: {}
        };
        statsObj = statsObj || {
            shane: {
                getStatMap: function() {
                    return {};
                }
            },
            ursula: {
                getStatMap: function() {
                    return {};
                }
            }
        };
    }

    var shane = units.shane;
    var ursula = units.ursula;

    var shaneStats = statsObj.shane.getStatMap();
    var ursulaStats = statsObj.ursula.getStatMap();

    //Global vars
    var startY = gameUtils.getCanvasHeight() / 15 * 2;
    var yIncrement = gameUtils.getCanvasHeight() / 15;
    var stage = "hudText";
    var healthEnergyXOffset = 38;
    var healthEnergyXSlice = 172 / 16;
    var unitStatYSpacing = 22;
    var unitStatTextBuffer = 2;

    //Shane vars
    var shaneColumnX = gameUtils.getPlayableWidth() / 4;

    //Ursula vars
    var ursulaColumnX = gameUtils.getPlayableWidth() * 3 / 4;

    var shaneBasePosition = {
        x: shaneColumnX,
        y: startY
    };
    var ursulaBasePosition = {
        x: ursulaColumnX,
        y: startY
    };

    //Convience position creators
    var same = 0;
    var title = 22;
    var portrait = 55;
    var reg = 15;
    var divider = 25;

    var shaneY = 0;
    var shanePosition = function(type) {
        var r = mathArrayUtils.clonePosition(shaneBasePosition, {
            y: shaneY
        });
        shaneY += type;
        return r;
    };

    var ursulaY = 0;
    var ursulaPosition = function(type) {
        var r = mathArrayUtils.clonePosition(ursulaBasePosition, {
            y: ursulaY
        });
        ursulaY += type;
        return r;
    };

    this.shaneStats = [];
    this.ursulaStats = [];
    this.initialize = function() {
        var scene = new Scene();
        gameUtils.doSomethingAfterDuration(() => {
            Matter.Events.trigger(scene, 'sceneFadeInDone');
        }, 150);
        scene.addBlackBackground({
            alpha: 0.75,
            fadeDuration: 500
        });

        var isVictory = options.type == 'victory';

        var titleText = null;
        if (isVictory) {
            titleText = graphicsUtils.createDisplayObject("TEX+:" + 'Victory', {
                position: {
                    x: gameUtils.getPlayableWidth() / 2,
                    y: gameUtils.getCanvasHeight() / 15
                },
                style: styles.statScreenVictoryTitleStyle,
                where: "hudText",
                anchor: {
                    x: 0.5,
                    y: 0.5
                },
                visible: false
            });
        } else {
            titleText = graphicsUtils.createDisplayObject("TEX+:" + 'Defeat', {
                position: {
                    x: gameUtils.getPlayableWidth() / 2,
                    y: gameUtils.getCanvasHeight() / 15
                },
                style: styles.statScreenDefeatTitleStyle,
                where: "hudText",
                anchor: {
                    x: 0.5,
                    y: 0.5
                },
                visible: false
            });
        }

        //victory or loss tint
        var tintTo = 0x62ff68;
        if (!isVictory) {
            tintTo = 0xf12323;
        }

        var titleTextFadetime = 300;
        graphicsUtils.flashSprite({
            sprite: titleText,
            fromColor: 0xffffff,
            toColor: tintTo,
            duration: titleTextFadetime,
            times: 0.5
        });
        graphicsUtils.fadeSpriteOverTime({
            sprite: titleText,
            duration: 0,
            fadeIn: true,
            nokill: true,
            makeVisible: true
        });
        scene.add(titleText);

        var skinnyDivider = '———————';
        var divider = '———————————';

        var startFadeTime = 30;

        //Shane
        var startPos = shanePosition(same);
        startPos.x -= 86;
        var marinePortrait = graphicsUtils.createDisplayObject('MarinePortrait', {
            position: startPos,
            where: stage,
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marinePortrait,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marinePortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {
            position: shanePosition(portrait),
            where: stage,
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marinePortraitBorder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marineDamage = graphicsUtils.createDisplayObject("TEX+:" + "Dmg: " + shane.damage, {
            position: {
                x: shaneColumnX - healthEnergyXOffset + healthEnergyXSlice,
                y: startY - unitStatTextBuffer - unitStatYSpacing
            },
            style: unitDamageStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marineDamage,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marineDefense = graphicsUtils.createDisplayObject("TEX+:" + "Arm: " + shane.defense, {
            position: {
                x: shaneColumnX - healthEnergyXOffset + healthEnergyXSlice,
                y: startY - unitStatTextBuffer
            },
            style: unitDefenseStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marineDefense,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marineHealth = graphicsUtils.createDisplayObject("TEX+:" + "HP: " + shane.maxHealth, {
            position: {
                x: shaneColumnX - healthEnergyXOffset + healthEnergyXSlice,
                y: startY - unitStatTextBuffer + unitStatYSpacing
            },
            style: unitGeneralHPStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marineHealth,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marineGrit = graphicsUtils.createDisplayObject("TEX+:" + "Grt: " + shane.grit, {
            position: {
                x: shaneColumnX - healthEnergyXOffset + healthEnergyXSlice * 9,
                y: startY - unitStatTextBuffer - unitStatYSpacing
            },
            style: unitGritStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marineGrit,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marineDodge = graphicsUtils.createDisplayObject("TEX+:" + "Ddg: " + shane.dodge, {
            position: {
                x: shaneColumnX - healthEnergyXOffset + healthEnergyXSlice * 9,
                y: startY - unitStatTextBuffer
            },
            style: unitDodgeStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marineDodge,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var marineEnergy = graphicsUtils.createDisplayObject("TEX+:" + "E: " + shane.maxEnergy, {
            position: {
                x: shaneColumnX - healthEnergyXOffset + healthEnergyXSlice * 9,
                y: startY - unitStatTextBuffer + unitStatYSpacing
            },
            style: unitGeneralEnergyStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: marineEnergy,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        // var defenseAdditionText = '';
        // if(shane.defenseAdditions.length > 0) {
        //     var sign = '+';
        //     if(shane.getDefenseAdditionSum() < 0) {
        //         sign = '';
        //     }
        //     defenseAdditionText = sign + shane.getDefenseAdditionSum();
        // }
        // var marineDefenseAdditions = graphicsUtils.createDisplayObject("TEX+:" + defenseAdditionText, {position: {x: shaneColumnX + healthEnergyXOffset + marineDefense.width/2, y: shaneY + unitStatYSpacing*1.5}, style: unitDefenseAdditionsStyle, where: "hudText", anchor: {x:0.5, y:0.5}});
        // if(defenseAdditionText != '') {
        //     marineDefense.position.x -= marineDefenseAdditions.width/2;
        // }

        var placeholder = graphicsUtils.createDisplayObject("TEX+:" + skinnyDivider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 2);
        });

        var tintMarineBorder = graphicsUtils.graduallyTint(marinePortraitBorder, 0x18bb96, 0xa80505, 6000);
        this.shaneStats.push([marinePortrait, marinePortraitBorder, placeholder, marineHealth,
            marineEnergy, marineDamage, marineDefense, /*marineDefenseAdditions,*/ marineGrit, marineDodge
        ]);

        var shaneKillsTitle = graphicsUtils.createDisplayObject("TEX+:" + kills, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneKillsTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 2);
        });

        // graphicsUtils.addSomethingToRenderer(createContainer(), {where: 'hudText', position: shanePosition(same)});
        var shaneKills = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.kills, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneKills,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 2);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 3);
        });
        this.shaneStats.push([shaneKillsTitle, shaneKills, placeholder]);

        var shaneDamageTitle = graphicsUtils.createDisplayObject("TEX+:" + damageDone, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDamageTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 3);
        });

        var shaneDamage = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageDone, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDamage,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 3);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 4);
        });
        this.shaneStats.push([shaneDamageTitle, shaneDamage, placeholder]);

        var shaneDamageTakenTitle = graphicsUtils.createDisplayObject("TEX+:" + damageTaken, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDamageTakenTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 4);
        });

        var shaneDamageTaken = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageTaken, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDamageTaken,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 4);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 5);
        });
        this.shaneStats.push([shaneDamageTakenTitle, shaneDamageTaken, placeholder]);

        var shaneDamageReducedByAmorTitle = graphicsUtils.createDisplayObject("TEX+:" + preventedArmorDamage, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDamageReducedByAmorTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 5);
        });

        var shaneDamageReducedByAmor = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageReducedByArmor, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDamageReducedByAmor,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 5);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 6);
        });
        this.shaneStats.push([shaneDamageReducedByAmorTitle, shaneDamageReducedByAmor, placeholder]);

        var shaneDodgedTitle = graphicsUtils.createDisplayObject("TEX+:" + attacksDodged, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDodgedTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 6);
        });

        var shaneDodgedText = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.attacksDodged, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDodgedText,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 6);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 7);
        });
        this.shaneStats.push([shaneDodgedTitle, shaneDodgedText, placeholder]);

        var shaneHealingDoneTitle = graphicsUtils.createDisplayObject("TEX+:" + healingDone, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneHealingDoneTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 7);
        });

        var shaneHealingDone = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.healingDone, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneHealingDone,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 7);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 8);
        });
        this.shaneStats.push([shaneHealingDoneTitle, shaneHealingDone, placeholder]);

        var shaneKnifeTitle = graphicsUtils.createDisplayObject("TEX+:" + knivesThrownKilled, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneKnifeTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 8);
        });

        var shaneKnifeStats = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.knivesThrown + "/" + shaneStats.knifeKills, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneKnifeStats,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 8);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 9);
        });
        this.shaneStats.push([shaneKnifeTitle, shaneKnifeStats, placeholder]);

        var shaneDashTitle = graphicsUtils.createDisplayObject("TEX+:" + dashesPerformed, {
            position: shanePosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDashTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 9);
        });

        var shaneDashesPerformed = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.dashesPerformed, {
            position: shanePosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneDashesPerformed,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 9);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: shanePosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
                //globals.currentGame.soundPool.keypressSound.play();
            }, startFadeTime * 9);
        });
        this.shaneStats.push([shaneDashTitle, shaneDashesPerformed, placeholder]);

        //Ursula
        startPos = ursulaPosition(same);
        startPos.x -= 86;
        var medicPortrait = graphicsUtils.createDisplayObject('MedicPortrait', {
            position: startPos,
            where: stage,
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicPortrait,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicPortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {
            position: ursulaPosition(portrait),
            where: stage,
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicPortraitBorder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicDamage = graphicsUtils.createDisplayObject("TEX+:" + ursula.damageLabel + ursula.damageMember(), {
            position: {
                x: ursulaColumnX - healthEnergyXOffset + healthEnergyXSlice,
                y: startY - unitStatTextBuffer - unitStatYSpacing
            },
            style: unitDamageStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicDamage,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicDefense = graphicsUtils.createDisplayObject("TEX+:" + "Arm: " + ursula.defense, {
            position: {
                x: ursulaColumnX - healthEnergyXOffset + healthEnergyXSlice,
                y: startY - unitStatTextBuffer
            },
            style: unitDefenseStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicDefense,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicHealth = graphicsUtils.createDisplayObject("TEX+:" + "HP: " + ursula.maxHealth, {
            position: {
                x: ursulaColumnX - healthEnergyXOffset + healthEnergyXSlice,
                y: startY - unitStatTextBuffer + unitStatYSpacing
            },
            style: unitGeneralHPStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicHealth,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicGrit = graphicsUtils.createDisplayObject("TEX+:" + "Grt: " + ursula.grit, {
            position: {
                x: ursulaColumnX - healthEnergyXOffset + healthEnergyXSlice * 9,
                y: startY - unitStatTextBuffer - unitStatYSpacing
            },
            style: unitGritStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicGrit,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicDodge = graphicsUtils.createDisplayObject("TEX+:" + "Ddg: " + ursula.dodge, {
            position: {
                x: ursulaColumnX - healthEnergyXOffset + healthEnergyXSlice * 9,
                y: startY - unitStatTextBuffer
            },
            style: unitDodgeStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicDodge,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });

        var medicEnergy = graphicsUtils.createDisplayObject("TEX+:" + "E: " + ursula.maxEnergy, {
            position: {
                x: ursulaColumnX - healthEnergyXOffset + healthEnergyXSlice * 9,
                y: startY - unitStatTextBuffer + unitStatYSpacing
            },
            style: unitGeneralEnergyStyle,
            where: "hudText",
            anchor: {
                x: 0,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: medicEnergy,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime);
        });
        // var defenseAdditionText = '';
        // if(ursula.defenseAdditions.length > 0) {
        //     var sign = '+';
        //     if(ursula.getDefenseAdditionSum() < 0) {
        //         sign = '';
        //     }
        //     defenseAdditionText = sign + ursula.getDefenseAdditionSum();
        // }
        // var ursulaDefenseAdditions = graphicsUtils.createDisplayObject("TEX+:" + defenseAdditionText, {position: {x: ursColumnX + healthEnergyXOffset + medicDefense.width/2, y: ursulaY + unitStatYSpacing*1.5}, style: unitDefenseAdditionsStyle, where: "hudText", anchor: {x:0.5, y:0.5}});
        // if(defenseAdditionText != '') {
        //     medicDefense.position.x -= ursulaDefenseAdditions.width/2;
        // }

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + skinnyDivider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 2);
        });

        var tintMedicBorder = graphicsUtils.graduallyTint(medicPortraitBorder, 0x18bb96, 0xa80505, 6000);
        this.ursulaStats.push([medicPortrait, medicPortraitBorder, placeholder, medicHealth, medicEnergy, medicDamage,
            medicDefense, /*ursulaDefenseAdditions,*/ medicGrit, medicDodge
        ]);

        var ursulaKillsTitle = graphicsUtils.createDisplayObject("TEX+:" + kills, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaKillsTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 2);
        });

        var ursulaKills = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.kills, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaKills,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 2);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 3);
        });
        this.ursulaStats.push([ursulaKillsTitle, ursulaKills, placeholder]);

        var ursulaDamageTitle = graphicsUtils.createDisplayObject("TEX+:" + damageDone, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDamageTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 3);
        });

        var ursulaDamage = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageDone, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDamage,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 3);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 4);
        });
        this.ursulaStats.push([ursulaDamageTitle, ursulaDamage, placeholder]);

        var ursulaDamageTakenTitle = graphicsUtils.createDisplayObject("TEX+:" + damageTaken, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDamageTakenTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 4);
        });

        var ursulaDamageTaken = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageTaken, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDamageTaken,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 4);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 5);
        });
        this.ursulaStats.push([ursulaDamageTakenTitle, ursulaDamageTaken, placeholder]);

        var ursulaDamageReducedByAmorTitle = graphicsUtils.createDisplayObject("TEX+:" + preventedArmorDamage, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDamageReducedByAmorTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 5);
        });

        var ursulaDamageReducedByAmor = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageReducedByArmor, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDamageReducedByAmor,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 5);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 6);
        });
        this.ursulaStats.push([ursulaDamageReducedByAmorTitle, ursulaDamageReducedByAmor, placeholder]);

        var ursulaDodgedTitle = graphicsUtils.createDisplayObject("TEX+:" + attacksDodged, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDodgedTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 6);
        });

        var ursulaDodgedText = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.attacksDodged, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaDodgedText,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 6);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 7);
        });
        this.ursulaStats.push([ursulaDodgedTitle, ursulaDodgedText, placeholder]);

        var ursulaHealingDoneTitle = graphicsUtils.createDisplayObject("TEX+:" + healingDone, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaHealingDoneTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 7);
        });

        var ursulaHealingDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.healingDone, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaHealingDone,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 7);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 8);
        });
        this.ursulaStats.push([ursulaHealingDoneTitle, ursulaHealingDone, placeholder]);

        var minesLaidTitle = graphicsUtils.createDisplayObject("TEX+:" + minesLaid, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: minesLaidTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 8);
        });

        var minesLaidDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.minesLaid, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: minesLaidDone,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 8);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 9);
        });
        this.ursulaStats.push([minesLaidTitle, minesLaidDone, placeholder]);

        var secretStepsTitle = graphicsUtils.createDisplayObject("TEX+:" + secretStepsPerformed, {
            position: ursulaPosition(title),
            style: titleStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: secretStepsTitle,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 9);
        });

        var secretStepsDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.secretStepsPerformed, {
            position: ursulaPosition(reg),
            style: statStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: secretStepsDone,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 9);
        });

        placeholder = graphicsUtils.createDisplayObject("TEX+:" + divider, {
            position: ursulaPosition(reg),
            style: statDividerStyle,
            where: "hudText",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });
        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: placeholder,
                    duration: 1000,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true
                });
            }, startFadeTime * 9);
        });
        this.ursulaStats.push([secretStepsTitle, secretStepsDone, placeholder]);

        //Add everything to the scene
        this.shaneStats.forEach((objArr) => {
            objArr.forEach((obj) => {
                scene.add(obj);
            });
        });

        this.ursulaStats.forEach((objArr) => {
            objArr.forEach((obj) => {
                scene.add(obj);
            });
        });

        scene._clearExtension = function() {
            globals.currentGame.invalidateTimer(tintMarineBorder);
            globals.currentGame.invalidateTimer(tintMedicBorder);
        };

        //continue-only key listeners
        Matter.Events.on(scene, 'sceneFadeInDone', () => {
            Matter.Events.trigger(globals.currentGame, "VictoryDefeatSceneFadeIn");
            $('body').on('keydown.uskeydownendscreen', function(event) {
                if (!this.spaceToContinue) {
                    return;
                }
                var key = event.key.toLowerCase();
                if (key == ' ') {
                    globals.currentGame.soundPool.sceneContinue.play();
                    $('body').off('keydown.uskeydownendscreen');
                    graphicsUtils.graduallyTint(this.spaceToContinue, 0xFFFFFF, 0x6175ff, 60, null, false, 3, function() {
                        if (options.done) {
                            options.done();
                        }
                    });
                }
            }.bind(this));
        });

        //We have three options here...
        //1. continue only (used for tutorial)
        //2. loss (essentially continue only)
        //3. victory (generate pill choice)
        if (options.onlyContinueAllowed) {
            //space to continue
            this.spaceToContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {
                where: 'hudText',
                style: styles.escapeToContinueStyle,
                anchor: {
                    x: 0.5,
                    y: 1
                },
                position: {
                    x: gameUtils.getPlayableWidth() - 210,
                    y: gameUtils.getCanvasHeight() - 20
                }
            });
            scene.add(this.spaceToContinue);
            this.spaceToContinue.visible = false;
            Matter.Events.on(scene, 'sceneFadeInDone', () => {
                this.spaceToContinue.visible = true;
            });
        } else {
            if (!isVictory) {
                var adrenalineGained = globals.currentGame.map.outingAdrenalineGained;
                gameUtils.doSomethingAfterDuration(() => {
                    //get adrenaline lost during an outing
                    gameUtils.doSomethingAfterDuration(() => {
                        globals.currentGame.soundPool.negativeSound.play();
                        for (var x = 0; x < adrenalineGained; x++) {
                            globals.currentGame.map.removeAdrenalineBlock();
                        }
                        var adrText = graphicsUtils.floatText('-' + adrenalineGained + ' adrenaline', gameUtils.getPlayableCenterPlus({
                            y: 300
                        }), {
                            where: 'hudTwo',
                            style: styles.adrenalineTextLarge,
                            speed: 6,
                            duration: 800
                        });
                        graphicsUtils.addGleamToSprite({
                            sprite: adrText,
                            gleamWidth: 50,
                            duration: 500
                        });
                    }, 1000);

                    //show items gains by completed nodes in outing
                    var completedNodes = globals.currentGame.map.inProgressOutingNodes;
                    gameUtils.doSomethingAfterDuration(() => {
                        globals.currentGame.soundPool.negativeSound.play();
                        for (var x = 0; x < adrenalineGained; x++) {
                            globals.currentGame.map.removeAdrenalineBlock();
                        }
                        var adrText = graphicsUtils.floatText('-' + adrenalineGained + ' adrenaline', gameUtils.getPlayableCenterPlus({
                            y: 300
                        }), {
                            where: 'hudTwo',
                            style: styles.adrenalineTextLarge,
                            speed: 6,
                            duration: 800
                        });
                        graphicsUtils.addGleamToSprite({
                            sprite: adrText,
                            gleamWidth: 50,
                            duration: 500
                        });
                    }, 2250);

                    //show items
                    gameUtils.doSomethingAfterDuration(() => {
                        globals.currentGame.soundPool.negativeSound.play();
                        for (var x = 0; x < adrenalineGained; x++) {
                            globals.currentGame.map.removeAdrenalineBlock();
                        }
                        var adrText = graphicsUtils.floatText('-' + adrenalineGained + ' adrenaline', gameUtils.getPlayableCenterPlus({
                            y: 300
                        }), {
                            where: 'hudTwo',
                            style: styles.adrenalineTextLarge,
                            speed: 6,
                            duration: 800
                        });
                        graphicsUtils.addGleamToSprite({
                            sprite: adrText,
                            gleamWidth: 50,
                            duration: 500
                        });
                    }, 2000);

                    //space to continue upon loss
                    this.spaceToContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {
                        where: 'hudText',
                        style: styles.escapeToContinueStyle,
                        anchor: {
                            x: 0.5,
                            y: 1
                        },
                        position: {
                            x: gameUtils.getPlayableWidth() - 210,
                            y: gameUtils.getCanvasHeight() - 35
                        }
                    });
                    scene.add(this.spaceToContinue);
                    this.spaceToContinue.visible = true;
                }, (adrenalineGained ? 0 : (startFadeTime * 9 + 300)));

            } else if (isVictory) {
                //show +1 adrenaline
                Matter.Events.on(scene, 'sceneFadeInDone', () => {
                    var adrenalineIsFull = globals.currentGame.map.isAdrenalineFull();
                    var rewardDuration = 800;
                    gameUtils.doSomethingAfterDuration(() => {
                        if (!adrenalineIsFull) {
                            globals.currentGame.soundPool.positiveSoundFast.play();
                            var adrText = graphicsUtils.floatText('+1 adrenaline!', gameUtils.getPlayableCenterPlus({
                                y: 300
                            }), {
                                where: 'hudTwo',
                                style: styles.adrenalineTextLarge,
                                speed: 6,
                                duration: rewardDuration
                            });
                            graphicsUtils.addGleamToSprite({
                                sprite: adrText,
                                gleamWidth: 50,
                                duration: 500
                            });
                            scene.add(adrText);
                        }

                        gameUtils.doSomethingAfterDuration(() => {
                            presentItems({
                                scene: scene,
                                done: options.done
                            });
                        }, rewardDuration);
                    }, (adrenalineIsFull ? 0 : (startFadeTime * 9 + 300)));
                });
            }

            Matter.Events.on(scene, 'sceneFadeInDone', () => {
                if (this.spaceToContinue) {
                    this.spaceToContinue.visible = true;
                }
            });
        }

        scene.initializeScene();
        return scene;
    };
};

export default EndLevelStatScreenOverlay;
