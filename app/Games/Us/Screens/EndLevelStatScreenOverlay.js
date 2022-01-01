import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import Tooltip from '@core/Tooltip.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {
    Scene
} from '@core/Scene.js';
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
var unitDamageAdditionsStyle = styles.unitDamageAdditionsStyle;
var unitGritAdditionsStyle = styles.unitGritAdditionsStyle;
var unitDodgeAdditionsStyle = styles.unitDodgeAdditionsStyle;
var unitGeneralEnergyStyle = styles.unitGeneralEnergyStyle;


//Shane titles
var shaneTitle = "Shane";
var knivesThrownKilled = "Knife Throws/Kills";
var dashesPerformed = "Dashes Performed";
var shaneVisuals = [];

//Ursula titles
var ursulaTitle = "Ursula";
var minesLaid = "Mines Laid";
var secretStepsPerformed = "Vanishes Performed";
var ursulaVisuals = [];

var rewardDuration = 800;
var rewardPauseDuration = 1400;

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

var overlayCommonFade = function(sprite, delay) {
    gameUtils.doSomethingAfterDuration(() => {
        graphicsUtils.fadeSpriteOverTime({
            sprite: sprite,
            duration: 1000,
            fadeIn: true,
            nokill: true,
            makeVisible: true
        });
    }, delay);
};

var applyArrowInOut = function(arrow) {
    arrow.on('mouseover', () => {
        if (arrow.alpha == 1) {
            arrow.tint = 0xf02354;
        }
    });
    arrow.on('mouseout', () => {
        if (arrow.alpha == 1) {
            arrow.tint = 0xffffff;
        }
    });
    arrow.on('mousedown', () => {
        if (arrow.alpha == 1) {
            globals.currentGame.soundPool.keypressSound.play();
            arrow.tint = 0xffffff;
        }
    });
};

var presentItems = function(options) {
    var nodeIndex = 0;
    var numberOfChoices = globals.currentGame.map.completedNodes.length;
    var choices = [];
    var done = options.done;

    var recursivePresentation = function() {
        var currentNode = globals.currentGame.map.completedNodes[nodeIndex];
        nodeIndex += 1;

        //make sure our item class can satisfy this many choices (only applies to book right now)
        var forcedLength = ItemClasses[currentNode.levelDetails.itemClass][currentNode.levelDetails.itemType].items.length;
        var localNumberOfChoices = forcedLength < numberOfChoices ? forcedLength : numberOfChoices;

        //Show the choose item text
        globals.currentGame.soundPool.positiveSoundFast.play();
        var t = localNumberOfChoices == 1 ? 'Take your item!' : 'Choose an item!';
        t = (nodeIndex > 1) ? "Choose another!" : t;
        var rewardText = graphicsUtils.floatText(t, gameUtils.getPlayableCenterPlus({
            y: 290
        }), {
            where: 'hudTwo',
            style: styles.rewardTextMedium,
            speed: 6,
            duration: rewardDuration,
            persistAtEnd: true
        });
        rewardText.tint = 0x08d491;
        graphicsUtils.addGleamToSprite({
            sprite: rewardText,
            gleamWidth: 25,
            duration: 500
        });

        //Display the choices
        var j = 0;
        var positions = mathArrayUtils.distributeXPositionsEvenlyAroundPoint({
            numberOfPositions: localNumberOfChoices,
            position: gameUtils.getPlayableCenterPlus({
                x: 0,
                y: 300
            }),
            spacing: 50
        });
        gameUtils.doSomethingAfterDuration(() => {
            var selectionOptions = ItemUtils.getRandomItemsFromClass({itemClass: currentNode.levelDetails.itemClass, itemType: currentNode.levelDetails.itemType, amount: localNumberOfChoices});
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
                        sprite: item.icon,
                        alpha: 0.75
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
            graphicsUtils.removeSomethingFromRenderer(rewardText);

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

var capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

var getAdditionObj = function(unit, additionName, locationRef, style) {
    var text = '';

    var additions = null;
    var additionSum = null;
    if (!unit[additionName]) {
        additions = unit.getAdditions(additionName);
        additionSum = unit.getAdditionSum(additionName);
    } else {
        var methodName = 'get' + (additionName.charAt(0).toUpperCase() + additionName.slice(1, -1)) + 'Sum';
        additions = unit[additionName];
        additionSum = unit[methodName]();
    }

    if (additions.length > 0) {
        var sign = '+';

        if (additionSum < 0) {
            sign = '';
        }
        text = sign + additionSum.toFixed(1);
    }
    var addPos = mathArrayUtils.clonePosition(locationRef.position, {
        x: locationRef.width
    });

    var additionObj = graphicsUtils.createDisplayObject("TEX+:" + text, {
        position: mathArrayUtils.roundPositionToWholeNumbers(addPos),
        style: style,
        where: "hudText",
        visible: false,
        anchor: {
            x: 0.0,
            y: 0.5
        }
    });

    return additionObj;
};

var EndLevelStatScreenOverlay = function(units, options) {
    options = Object.assign({
        type: 'victory'
    }, options);

    //Global vars
    var startY = gameUtils.getCanvasHeight() / 15 * 2;
    var yIncrement = gameUtils.getCanvasHeight() / 15;
    var stage = "hudText";
    var healthEnergyXOffset = 57;
    var healthEnergyXSlice = 198 / 16;
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
    var iconSpacing = 30;
    var portrait = 55;
    var reg = 15;
    var anotherLabel = 20;
    var divider = 25;

    var shaneY = {
        value: 0
    };
    var shanePosition = function(type, baseNumber) {
        baseNumber = baseNumber || shaneY;
        var r = mathArrayUtils.clonePosition(shaneBasePosition, {
            y: baseNumber.value
        });
        baseNumber.value += type;
        return r;
    };

    var ursulaY = {
        value: 0
    };
    var ursulaPosition = function(type, baseNumber) {
        baseNumber = baseNumber || ursulaY;
        var r = mathArrayUtils.clonePosition(ursulaBasePosition, {
            y: baseNumber.value
        });
        baseNumber.value += type;
        return r;
    };

    var statsObj;

    //for troubleshooting victory screen
    if (true) {
        units = units || {
            shane: {},
            ursula: {}
        };
        statsObj = statsObj || {
            shane: {
                getDefaultStatMap: function() {
                    return {};
                }
            },
            ursula: {
                getDefaultStatMap: function() {
                    return {};
                }
            }
        };
    }

    var shane = units.shane;
    var ursula = units.ursula;

    statsObj = {
        shane: shane.statCollector.getLastCollector(),
        ursula: ursula.statCollector.getLastCollector()
    };

    //get default collector (first page)
    var shaneStats = statsObj.shane.getDefaultStatMap();
    var ursulaStats = statsObj.ursula.getDefaultStatMap();

    var currentShanePage = 0;
    var currentUrsulaPage = 0;

    //determine pages
    var pageSize = 5;
    var shanePages = [
        []
    ];
    var ursulaPages = [
        []
    ];

    var fillPages = function(options) {
        options = options || {};
        var unit = options.unit;
        var currentPage = 0;
        var pageHolder = options.pageHolder;
        var pageSize = options.pageSize;
        var customCollectors = options.unit.statCollector.getLastCollector().getSortedCustomCollectors();
        var scene = options.scene;
        var positionFunc = options.positionFunc;

        var p = 0;
        var startingY = {
            value: 80
        };

        var len = customCollectors.length;
        customCollectors.forEach(function(coll, index) {
            if (!coll.canPresent()) {
                return;
            }

            var last = index == len - 1 ? true : false;
            if (p % pageSize == 0) {
                startingY = {
                    value: 80
                };
                currentPage++;
            }
            p++;

            //if we're the last on a page or the last in the set, don't display the divider
            var needsDivider = true;
            if (last || p % pageSize == 0) {
                needsDivider = false;
            }

            //create icon
            var icon = graphicsUtils.createDisplayObject(coll.presentation.iconTextureName, {
                where: 'hudText',
                visible: false
            });
            icon.position = positionFunc(iconSpacing, startingY);
            icon.border = graphicsUtils.addBorderToSprite({
                sprite: icon,
                thickness: 1,
                tint: coll.presentation.tint,
                alpha: 1.0,
                where: 'hudText'
            });

            //create label
            var labels = [];
            var lastLabel = coll.presentation.labels.length - 1;
            coll.presentation.labels.forEach(function(label, index) {
                //check to see if we're enabled
                var enabled = true; //default
                if (coll.presentation.variableLabels) {
                    enabled = coll.presentation.variableLabels.includes(label);
                }
                if (!enabled) {
                    return;
                }

                //if so, present the label/value/suffix
                var v = coll[coll.presentation.values[index]];

                //call any given formatters
                var formatters = coll.presentation.formats;
                if (formatters && formatters[index]) {
                    v = coll.presentation.formats[index](v);
                }

                var suff = "";
                if (coll.presentation.suffixes) {
                    suff = coll.presentation.suffixes[index] ? " " + coll.presentation.suffixes[index] : "";
                }
                var spacing = index == lastLabel ? reg : anotherLabel;
                var newLabel = graphicsUtils.createDisplayObject("TEX+:" + label + ": " + v + suff, {
                    position: positionFunc(spacing, startingY),
                    style: titleStyle,
                    where: "hudText",
                    anchor: {
                        x: 0.5,
                        y: 0.5
                    },
                    visible: false
                });
                labels.push(newLabel);
            });

            //add elements to current page
            if (!pageHolder[currentPage]) {
                pageHolder[currentPage] = [];
            }

            //create divider if we're not the last on the page
            if (needsDivider) {
                var myDivider = graphicsUtils.createDisplayObject('TintableSquare', {
                    where: 'hudText',
                    scale: {
                        x: 190,
                        y: 1
                    },
                    alpha: 0.25,
                    visible: false,
                    tint: 0xde3939
                });
                myDivider.position = positionFunc(divider, startingY);
                pageHolder[currentPage].push(myDivider);
            }

            pageHolder[currentPage].push(icon);
            pageHolder[currentPage] = pageHolder[currentPage].concat(labels);

            //add objects to the scene
            pageHolder[currentPage].forEach(function(item) {
                scene.add(item);
            });
        });
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

        //fill pages shane
        fillPages({
            unit: shane,
            pageSize: pageSize,
            pageHolder: shanePages,
            scene: scene,
            positionFunc: shanePosition
        });
        //ursula
        fillPages({
            unit: ursula,
            pageSize: pageSize,
            pageHolder: ursulaPages,
            scene: scene,
            positionFunc: ursulaPosition
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
        startPos.x -= 105;
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
        var b1 = graphicsUtils.addBorderToSprite({
            sprite: marinePortraitBorder,
            thickness: 0,
            tint: 0x000000,
            alpha: 1.0,
            where: 'hud'
        });
        b1.visible = false;

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

        var shaneDamageAdditions = getAdditionObj(shane, 'damageAdditions', marineDamage, unitDamageAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(marineDamage, startFadeTime);
            overlayCommonFade(shaneDamageAdditions, startFadeTime);
        });

        var marineDefense = graphicsUtils.createDisplayObject("TEX+:" + "A: " + shane.defense.toFixed(1), {
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

        var shaneDefenseAdditions = getAdditionObj(shane, 'defenseAdditions', marineDefense, unitDefenseAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(marineDefense, startFadeTime);
            overlayCommonFade(shaneDefenseAdditions, startFadeTime);
            overlayCommonFade(b1, startFadeTime);
        });

        var marineHealth = graphicsUtils.createDisplayObject("TEX+:" + "H: " + shane.maxHealth, {
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

        var shaneGritAdditions = getAdditionObj(shane, 'gritAdditions', marineGrit, unitGritAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(marineGrit, startFadeTime);
            overlayCommonFade(shaneGritAdditions, startFadeTime);
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

        var shaneDodgeAdditions = getAdditionObj(shane, 'dodgeAdditions', marineDodge, unitDodgeAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(marineDodge, startFadeTime);
            overlayCommonFade(shaneDodgeAdditions, startFadeTime);
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
            marineEnergy, marineDamage, marineDefense, shaneDefenseAdditions, marineGrit, marineDodge, shaneGritAdditions,
            shaneDodgeAdditions, shaneDamageAdditions
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
        shanePages[0].push(shaneKillsTitle, shaneKills, placeholder);

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
        shanePages[0].push(shaneDamageTitle, shaneDamage, placeholder);

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

        var shaneDamageTaken = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageTaken.toFixed(1), {
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
        shanePages[0].push(shaneDamageTakenTitle, shaneDamageTaken, placeholder);

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

        var shaneDamageReducedByAmor = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.damageReducedByArmor.toFixed(1), {
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
        shanePages[0].push(shaneDamageReducedByAmorTitle, shaneDamageReducedByAmor, placeholder);

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
        shanePages[0].push(shaneDodgedTitle, shaneDodgedText, placeholder);

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

        var shaneHealingDone = graphicsUtils.createDisplayObject("TEX+:" + shaneStats.healingDone.toFixed(1), {
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
        shanePages[0].push(shaneHealingDoneTitle, shaneHealingDone, placeholder);

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
        shanePages[0].push(shaneKnifeTitle, shaneKnifeStats, placeholder);

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
        shanePages[0].push(shaneDashTitle, shaneDashesPerformed, placeholder);

        var shaneArrowPosition = shanePosition(reg);
        var shaneLeftArrow = graphicsUtils.createDisplayObject("TEX+:" + '<<', {
            position: mathArrayUtils.clonePosition(shaneArrowPosition, {
                x: -50
            }),
            style: styles.pageArrowStyle,
            where: "hudTwo",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            alpha: 0.1,
            visible: false
        });

        shaneLeftArrow.interactive = true;
        applyArrowInOut(shaneLeftArrow);
        shaneLeftArrow.on('mousedown', () => {
            if (currentShanePage == 0 || !shaneLeftArrow.isPressable) {
                return;
            }
            shanePages[currentShanePage].forEach(function(item) {
                item.visible = false;
                if (item.border) {
                    item.border.visible = false;
                }
            });
            currentShanePage--;
            shanePages[currentShanePage].forEach(function(item) {
                graphicsUtils.addOrShowDisplayObject(item);
            });

            //apply some alpha effects
            shaneRightArrow.alpha = 1.0;
            if (currentShanePage == 0) {
                shaneLeftArrow.alpha = 0.1;
            }
        });
        scene.add(shaneLeftArrow);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneLeftArrow,
                    duration: 500,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true,
                    callback: () => {
                        shaneLeftArrow.isPressable = true;
                    }
                });
            }, startFadeTime * 10);
        });

        var shaneRightArrow = graphicsUtils.createDisplayObject("TEX+:" + '>>', {
            position: mathArrayUtils.clonePosition(shaneArrowPosition, {
                x: 50
            }),
            style: styles.pageArrowStyle,
            where: "hudTwo",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });

        if (shanePages.length == 1) {
            shaneRightArrow.alpha = 0.1;
        }

        shaneRightArrow.interactive = true;
        applyArrowInOut(shaneRightArrow);
        shaneRightArrow.on('mousedown', () => {
            if (currentShanePage == shanePages.length - 1 || !shaneRightArrow.isPressable) {
                return;
            }
            shanePages[currentShanePage].forEach(function(item) {
                item.visible = false;
                if (item.border) {
                    item.border.visible = false;
                }
            });
            currentShanePage++;
            shanePages[currentShanePage].forEach(function(item) {
                graphicsUtils.addOrShowDisplayObject(item);
            });

            //apply some alpha effects
            shaneLeftArrow.alpha = 1.0;
            if (currentShanePage == shanePages.length - 1) {
                shaneRightArrow.alpha = 0.1;
            }
        });
        scene.add(shaneRightArrow);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: shaneRightArrow,
                    duration: 500,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true,
                    callback: () => {
                        shaneRightArrow.isPressable = true;
                    }
                });
            }, startFadeTime * 10);
        });
        this.shaneStats.push([shaneLeftArrow, shaneRightArrow, placeholder]);

        //Ursula
        startPos = ursulaPosition(same);
        startPos.x -= 105;
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
                    makeVisible: true,
                });
            }, startFadeTime);
        });

        var medicPortraitBorder = graphicsUtils.createDisplayObject('PortraitBorder', {
            position: ursulaPosition(portrait),
            where: stage,
            visible: false
        });

        var b2 = graphicsUtils.addBorderToSprite({
            sprite: medicPortraitBorder,
            thickness: 0,
            tint: 0x000000,
            alpha: 1.0,
            where: 'hud'
        });
        b2.visible = false;

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(medicPortraitBorder, startFadeTime);
            overlayCommonFade(b2, startFadeTime);
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

        var ursulaHealAdditions = getAdditionObj(ursula, 'heal', medicDamage, unitDamageAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(medicDamage, startFadeTime);
            overlayCommonFade(ursulaHealAdditions, startFadeTime);
        });

        var medicDefense = graphicsUtils.createDisplayObject("TEX+:" + "A: " + ursula.defense.toFixed(1), {
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

        var ursulaDefenseAdditions = getAdditionObj(ursula, 'defenseAdditions', medicDefense, unitDefenseAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(medicDefense, startFadeTime);
            overlayCommonFade(ursulaDefenseAdditions, startFadeTime);
        });

        var medicHealth = graphicsUtils.createDisplayObject("TEX+:" + "H: " + ursula.maxHealth, {
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

        var ursulaGritAdditions = getAdditionObj(ursula, 'gritAdditions', medicGrit, unitGritAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(medicGrit, startFadeTime);
            overlayCommonFade(ursulaGritAdditions, startFadeTime);
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

        var ursulaDodgeAdditions = getAdditionObj(ursula, 'dodgeAdditions', medicDodge, unitDodgeAdditionsStyle);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            overlayCommonFade(medicDodge, startFadeTime);
            overlayCommonFade(ursulaDodgeAdditions, startFadeTime);
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
            medicDefense, ursulaDefenseAdditions, medicGrit, medicDodge, ursulaHealAdditions, ursulaGritAdditions, ursulaDodgeAdditions
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
        ursulaPages[0].push(ursulaKillsTitle, ursulaKills, placeholder);

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
        ursulaPages[0].push(ursulaDamageTitle, ursulaDamage, placeholder);

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

        var ursulaDamageTaken = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageTaken.toFixed(1), {
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
        ursulaPages[0].push(ursulaDamageTakenTitle, ursulaDamageTaken, placeholder);

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

        var ursulaDamageReducedByAmor = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.damageReducedByArmor.toFixed(1), {
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
        ursulaPages[0].push(ursulaDamageReducedByAmorTitle, ursulaDamageReducedByAmor, placeholder);

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
        ursulaPages[0].push(ursulaDodgedTitle, ursulaDodgedText, placeholder);

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

        var ursulaHealingDone = graphicsUtils.createDisplayObject("TEX+:" + ursulaStats.healingDone.toFixed(1), {
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
        ursulaPages[0].push(ursulaHealingDoneTitle, ursulaHealingDone, placeholder);

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
        ursulaPages[0].push(minesLaidTitle, minesLaidDone, placeholder);

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
        ursulaPages[0].push(secretStepsTitle, secretStepsDone, placeholder);

        var ursulaArrowPosition = ursulaPosition(reg);
        var ursulaLeftArrow = graphicsUtils.createDisplayObject("TEX+:" + '<<', {
            position: mathArrayUtils.clonePosition(ursulaArrowPosition, {
                x: -50
            }),
            style: styles.pageArrowStyle,
            where: "hudTwo",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            alpha: 0.1,
            visible: false
        });

        ursulaLeftArrow.interactive = true;
        applyArrowInOut(ursulaLeftArrow);
        ursulaLeftArrow.on('mousedown', () => {
            if (currentUrsulaPage == 0 || !ursulaLeftArrow.isPressable) {
                return;
            }
            ursulaPages[currentUrsulaPage].forEach(function(item) {
                item.visible = false;
                if (item.border) {
                    item.border.visible = false;
                }
            });
            currentUrsulaPage--;
            ursulaPages[currentUrsulaPage].forEach(function(item) {
                graphicsUtils.addOrShowDisplayObject(item);
            });

            //apply some alpha effects
            ursulaRightArrow.alpha = 1.0;
            if (currentUrsulaPage == 0) {
                ursulaLeftArrow.alpha = 0.1;
            }
        });
        scene.add(ursulaLeftArrow);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaLeftArrow,
                    duration: 500,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true,
                    callback: () => {
                        ursulaLeftArrow.isPressable = true;
                    }
                });
            }, startFadeTime * 10);
        });

        var ursulaRightArrow = graphicsUtils.createDisplayObject("TEX+:" + '>>', {
            position: mathArrayUtils.clonePosition(ursulaArrowPosition, {
                x: 50
            }),
            style: styles.pageArrowStyle,
            where: "hudTwo",
            anchor: {
                x: 0.5,
                y: 0.5
            },
            visible: false
        });

        if (ursulaPages.length == 1) {
            ursulaRightArrow.alpha = 0.1;
        }

        ursulaRightArrow.interactive = true;
        applyArrowInOut(ursulaRightArrow);
        ursulaRightArrow.on('mousedown', () => {
            if (currentUrsulaPage == ursulaPages.length - 1 || !ursulaRightArrow.isPressable) {
                return;
            }
            ursulaPages[currentUrsulaPage].forEach(function(item) {
                item.visible = false;
                if (item.border) {
                    item.border.visible = false;
                }
            });
            currentUrsulaPage++;
            ursulaPages[currentUrsulaPage].forEach(function(item) {
                graphicsUtils.addOrShowDisplayObject(item);
            });

            //apply some alpha effects
            ursulaLeftArrow.alpha = 1.0;
            if (currentUrsulaPage == ursulaPages.length - 1) {
                ursulaRightArrow.alpha = 0.1;
            }
        });
        scene.add(ursulaRightArrow);

        gameUtils.matterOnce(scene, 'sceneFadeInDone', () => {
            gameUtils.doSomethingAfterDuration(() => {
                graphicsUtils.fadeSpriteOverTime({
                    sprite: ursulaRightArrow,
                    duration: 500,
                    fadeIn: true,
                    nokill: true,
                    makeVisible: true,
                    callback: () => {
                        ursulaRightArrow.isPressable = true;
                    }
                });
            }, startFadeTime * 10);
        });
        this.ursulaStats.push([ursulaLeftArrow, ursulaRightArrow, placeholder]);

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
        var campsCompleted = globals.currentGame.map.completedNodes.length;
        if (this.spaceToContinue || campsCompleted == 0) {
            Matter.Events.on(scene, 'sceneFadeInDone', () => {
                Matter.Events.trigger(globals.currentGame, "VictoryDefeatSceneFadeIn");
                $('body').on('keydown.uskeydownendscreen', function(event) {
                    var key = event.key.toLowerCase();
                    if (key == ' ' && this.spaceToContinue) {
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
        }

        if (!isVictory) {
            var adrenalineGained = globals.currentGame.map.outingAdrenalineGained;
            var pauseTime = adrenalineGained ? rewardPauseDuration : 0;
            gameUtils.doSomethingAfterDuration(() => {
                //get adrenaline lost during an outing
                gameUtils.doSomethingAfterDuration(() => {

                    if (adrenalineGained) {
                        for (var x = 0; x < adrenalineGained; x++) {
                            globals.currentGame.map.removeAdrenalineBlock();
                        }
                        globals.currentGame.soundPool.negativeSound.play();
                        var adrText = graphicsUtils.floatText('-' + adrenalineGained + ' adrenaline', gameUtils.getPlayableCenterPlus({
                            y: 300
                        }), {
                            where: 'hudTwo',
                            style: styles.adrenalineTextLarge,
                            speed: 6,
                            duration: rewardDuration * 2.0
                        });
                        graphicsUtils.addGleamToSprite({
                            sprite: adrText,
                            gleamWidth: 30,
                            duration: 1000
                        });
                    }
                }, pauseTime);

                //present items if we've completed nodes
                if (globals.currentGame.map.completedNodes.length > 0) {
                    gameUtils.doSomethingAfterDuration(() => {
                        //float levels completed text
                        globals.currentGame.soundPool.positiveSoundFast.play();
                        var levelsCompletedText = campsCompleted == 1 ? "1 camp completed!" : campsCompleted + " camps completed!";
                        var txt = levelsCompletedText;
                        var lText = graphicsUtils.floatText(txt, gameUtils.getPlayableCenterPlus({
                            y: 300
                        }), {
                            where: 'hudTwo',
                            style: styles.rewardTextLarge,
                            speed: 6,
                            duration: rewardDuration * 2.0
                        });
                        lText.tint = 0x08d491;
                        graphicsUtils.addGleamToSprite({
                            sprite: lText,
                            gleamWidth: 30,
                            duration: 1000
                        });

                        //show supply drop message
                        gameUtils.doSomethingAfterDuration(() => {
                            globals.currentGame.soundPool.positiveSoundFast.play();
                            var txt = 'Supply drop en route...';
                            var sdText = graphicsUtils.floatText(txt, gameUtils.getPlayableCenterPlus({
                                y: 300
                            }), {
                                where: 'hudTwo',
                                style: styles.rewardTextLarge,
                                speed: 6,
                                duration: rewardDuration * 2.0
                            });
                            graphicsUtils.flashSprite({
                                sprite: sdText,
                                times: 4,
                                fromColor: 0x01cd46,
                                toColor: 0xc39405,
                                duration: 200,
                            });
                        }, rewardPauseDuration);

                        //then present items
                        gameUtils.doSomethingAfterDuration(() => {
                            presentItems({
                                done: options.done
                            });
                        }, 3200);
                    }, pauseTime + rewardPauseDuration);
                } else {
                    //else we'll have space to continue show up
                    gameUtils.doSomethingAfterDuration(() => {
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
                        this.spaceFlashTimer = graphicsUtils.graduallyTint(this.spaceToContinue, 0xFFFFFF, 0x3183fe, 120, null, false, 3);
                        globals.currentGame.soundPool.positiveSound.play();
                        scene.add(this.spaceToContinue);
                        this.spaceToContinue.visible = true;
                    }, pauseTime + rewardDuration);
                }

            }, (adrenalineGained ? 0 : (startFadeTime * 9 + 300)));

        } else if (isVictory) {
            //show + adrenaline text
            Matter.Events.on(scene, 'sceneFadeInDone', () => {
                var adrenalineIsFull = globals.currentGame.map.isAdrenalineFull();
                gameUtils.doSomethingAfterDuration(() => {
                    //create text chain
                    var textChain = graphicsUtils.createFloatingTextChain({
                        onDone: function() {
                            presentItems({
                                done: options.done
                            });
                        },
                    });

                    //add the camp clearance text
                    var levelsCompletedText = globals.currentGame.map.completedNodes.length == 1 ? "1 camp completed!" : globals.currentGame.map.completedNodes.length + " camps completed!";
                    textChain.add({
                        text: levelsCompletedText,
                        position: gameUtils.getPlayableCenterPlus({
                            y: 300
                        }),
                        additionalOptions: {
                            where: 'hudTwo',
                            style: styles.rewardTextLarge,
                            speed: 6,
                            duration: rewardDuration * 2.0,
                            startNextAfter: 1000,
                            onStart: (myText) => {
                                myText.tint = 0x08d491;
                                globals.currentGame.soundPool.positiveSoundFast.play();
                                graphicsUtils.addGleamToSprite({
                                    sprite: myText,
                                    gleamWidth: 50,
                                    duration: 500
                                });
                            }
                        }
                    });

                    //add the supply drop text
                    textChain.add({
                        text: 'Supply drop en route...',
                        position: gameUtils.getPlayableCenterPlus({
                            y: 300
                        }),
                        additionalOptions: {
                            where: 'hudTwo',
                            style: styles.rewardTextLarge,
                            speed: 6,
                            duration: rewardDuration * 2.0,
                            onStart: (myText) => {
                                globals.currentGame.soundPool.positiveSoundFast.play();
                                graphicsUtils.flashSprite({
                                    sprite: myText,
                                    times: 2,
                                    fromColor: 0x01cd46,
                                    toColor: 0xc900c7,
                                    duration: 150,
                                });
                            }
                        }
                    });

                    textChain.play();
                }, startFadeTime * 9 + 300);
            });
        }

        Matter.Events.on(scene, 'sceneFadeInDone', () => {
            if (this.spaceToContinue) {
                this.spaceToContinue.visible = true;
            }
        });

        scene.initializeScene();
        return scene;
    };
};

export default EndLevelStatScreenOverlay;
