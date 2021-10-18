import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import styles from '@utils/Styles.js';
import Tooltip from '@core/Tooltip.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';

var capitalizeFirstLetter = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

var baseItem = {
    equip: function(unit) {
        if (!this.manipulations) return;
        $.each(this.manipulations, function(key, value) {
            if (key == 'events') {
                $.each(value, function(k, v) {
                    this.eventFunctions[k] = function(event) {
                        event.equippedUnit = unit;
                        event.item = this;
                        $.each(v, function(kk, vv) {
                            if (kk == 'callback') {
                                vv(event);
                            } else {
                                unit[kk] += vv;
                            }
                        });
                    }.bind(this);
                    Matter.Events.on(unit, k, this.eventFunctions[k]);
                }.bind(this));
            } else if (value instanceof Function) {
                value.call(unit, true, this);
            } else {
                if (unit['add' + capitalizeFirstLetter(key)] instanceof Function) {
                    unit['add' + capitalizeFirstLetter(key)](value);
                } else if (key.includes('Addition')) {
                    var idx = key.indexOf('Addition');
                    unit.addAddition(key.substr(0, idx), value);
                } else {
                    unit[key] += value;
                }
            }
        }.bind(this));
    },
    unequip: function(unit) {
        if (!this.manipulations) return;
        $.each(this.manipulations, function(key, value) {
            if (key == "events") {
                $.each(value, function(k, v) {
                    Matter.Events.off(unit, k, this.eventFunctions[k]);
                }.bind(this));
            } else if (value instanceof Function) {
                value.call(unit, false, this);
            } else {
                if (unit['remove' + capitalizeFirstLetter(key)] instanceof Function) {
                    unit['remove' + capitalizeFirstLetter(key)](value);
                } else if (key.includes('Addition')) {
                    var idx = key.indexOf('Addition');
                    unit.removeAddition(key.substr(0, idx), value);
                } else {
                    unit[key] -= value;
                }
            }
        }.bind(this));
    },
    name: 'generic item name',
    description: 'generic item description',
    icon: 'TintableSquare',
    type: 'common',
    worksWithSlot: function(slot) {
        if (slot.type == 'universal')
            return true;
        if (slot.type == this.type)
            return true;
        return false;
    }
};

var itemDropSound = gameUtils.getSound('itemdrop.wav', {
    volume: 0.04,
    rate: 1
});
var microchipDropSound = gameUtils.getSound('itemdrop.wav', {
    volume: 0.04,
    rate: 1.75
});
var bookDropSound = gameUtils.getSound('criticalhit.wav', {
    volume: 0.025,
    rate: 1.15
});
var stimulantDropSound = gameUtils.getSound('itemdrop.wav', {
    volume: 0.04,
    rate: 1.75
});
var pillDropSound = gameUtils.getSound('itemdrop.wav', {
    volume: 0.04,
    rate: 2.25
});
var itemSwoosh = gameUtils.getSound('itemSwoosh.wav', {
    volume: 0.04,
    rate: 1.1
});

var ic = function(options) {
    var newItem = $.extend({}, baseItem, options);
    newItem.isItem = true;
    newItem.id = mathArrayUtils.uuidv4();
    newItem.customColor = 0;
    newItem.eventFunctions = {};

    newItem.icon = graphicsUtils.createDisplayObject(newItem.icon, {
        where: 'hudOne'
    }); //note that this icon will not die upon removing the item
    graphicsUtils.makeSpriteSize(newItem.icon, 27);
    newItem.icon.interactive = true;

    newItem.chargeThenActivate = (options) => {
        if(newItem.isCharging || newItem.isActive) {
            return;
        }
        options = options || {};
        newItem.isCharging = true;
        var activateWrapper = () => {
            newItem.isCharging = false;
            if(!options.activateFunction()) {

                return;
            }
            newItem.showAsActive(true);
            gameUtils.doSomethingAfterDuration(() => {
                newItem.showAsActive(false);
            }, options.activeDuration);
        };

        var chargeTimes = 2.5;
        newItem.chargingTimer = graphicsUtils.flashSprite({
            sprite: newItem.icon,
            duration: options.chargeDuration/(chargeTimes*2),
            times: chargeTimes,
            toColor: 0x03d1d1,
            onEnd: activateWrapper
        });

        newItem.cancelCharge = function() {
            this.chargingTimer.invalidate();
            this.isCharging = false;
        };

        options.setupCancel();
    };

    newItem.invalidateCharge = function() {
        newItem.chargingTimer.invalidate();
    };

    newItem.showAsActive = (bool) => {
        newItem.isActive = bool;
        if(bool) {
            newItem.icon.tint = 0x28d005;
        } else {
            newItem.customColor--;
        }
    };

    //mouse hover event
    newItem.hoverListener = globals.currentGame.addTickCallback(function() {

        if (newItem.isCharging || newItem.isActive) {
            return;
        }

        //reset everything assuming we're not hovering anymore, or if we're the grabbed item
        newItem.icon.tint = 0xFFFFFF;
        if (!newItem.icon.visible || globals.currentGame.itemSystem.grabbedItem == newItem) return;
        if (newItem.isEmptySlot) {
            newItem.icon.alpha = 0;
        }

        //if we are hovering, do something
        if (newItem.icon.containsPoint(globals.currentGame.renderer.interaction.mouse.global)) {
            newItem.icon.tint = 0x669900;
            if (newItem.isEmptySlot) {
                newItem.icon.alpha = 0.1;
                newItem.icon.tint = 0xFFFFFF;
                return;
            }
        }
    });

    //setup for non-empty items
    if (!newItem.isEmptySlot) {
        newItem.icon.on('mousedown', function(event) {
            if (newItem.notGrabbable) return;
            if (globals.currentGame.itemSystem.isGrabbing() || newItem.manuallyManaged) return;
            if (newItem.grabPredicate) {
                var ret = newItem.grabPredicate();
                if (!ret) {
                    return;
                }
            }
            newItem.owningUnit.unequipItem(newItem);
            newItem.grasp(newItem.owningUnit);
        }.bind(this));

        var sysMessage = '(Click to grab item)';
        if (newItem.systemMessage) {
            sysMessage = [newItem.systemMessage, sysMessage];
        }
        newItem.originalTooltipObj = {
            title: newItem.name,
            description: newItem.description,
            systemMessage: sysMessage
        };
        Tooltip.makeTooltippable(newItem.icon, newItem.originalTooltipObj);

        var baseTint = 0x00042D;
        newItem.nameDisplayBase = graphicsUtils.createDisplayObject('TintableSquare', {
            tint: baseTint,
            scale: {
                x: 1,
                y: 1
            },
            alpha: 0.85
        });

        var style = styles.regularItemName;
        if (newItem.fontType == 'shane') {
            style = styles.shaneItemName;
        } else if (newItem.fontType == 'ursula') {
            style = styles.ursulaItemName;
        } else if (newItem.fontType == 'stimulant') {
            style = styles.stimulantItemName;
        } else if (newItem.fontType == 'microchip') {
            style = styles.microchipItemName;
        } else if (newItem.fontType == 'book') {
            style = styles.bookItemName;
        }

        newItem.nameDisplay = graphicsUtils.createDisplayObject('TEX+:' + newItem.name, {
            style: style
        });
        graphicsUtils.makeSpriteSize(newItem.nameDisplayBase, {
            w: newItem.nameDisplay.width + 15,
            h: 25
        });

        newItem.showName = function(bool) {
            if (!this.body) return; //if we've been collected, don't display the name
            if (!newItem.nameDisplay.parent) {
                graphicsUtils.addDisplayObjectToRenderer(newItem.nameDisplay, 'hudText');
                graphicsUtils.addDisplayObjectToRenderer(newItem.nameDisplayBase, 'hud');
            }

            newItem.nameDisplayBase.visible = bool;
            newItem.nameDisplay.visible = bool;

            if (bool) {
                newItem.nameDisplayBase.position = {
                    x: newItem.body.position.x,
                    y: newItem.body.position.y - 30
                };
                mathArrayUtils.roundPositionToWholeNumbers(newItem.nameDisplayBase.position);

                newItem.nameDisplay.position = {
                    x: newItem.body.position.x,
                    y: newItem.body.position.y - 30
                };
                mathArrayUtils.roundPositionToWholeNumbers(newItem.nameDisplay.position);
            }
        };

        newItem.removePhysicalForm = function() {
            this.showName(false);
            globals.currentGame.removeBody(this.body);
            this.body = null;
        };

        newItem.pickup = function() {
            this.removePhysicalForm();
        };

        newItem.drop = function(position, options) {
            if (!options) options = {};
            options = $.extend({}, {
                fleeting: true
            }, options);

            //create item body
            this.body = Matter.Bodies.circle(position.x, position.y, 20, {
                isSensor: true
            });

            Object.defineProperty(this, 'position', {
                get: function() {
                    if (this.body) {
                        return this.body.position;
                    } else {
                        return this.icon.position;
                    }
                },
                configurable: true
            });

            var item = this;
            var shadowYScale = 1.0;

            //play drop animation
            var dropAnimationName = item.classInformation.itemType == 'microchip' ? 'MicrochipDrop' : 'ItemDropFroll';
            if (item.classInformation.itemClass == 'book') {
                dropAnimationName = 'BookDrop';
            } else if (item.classInformation.itemClass == 'stimulant') {
                dropAnimationName = 'StimulantDrop';
                shadowYScale = 0.0;
            } else if (item.classInformation.itemClass == 'lightStimulant') {
                dropAnimationName = 'PillDrop';
                shadowYScale = 0.0;
            }
            this.itemDrop = gameUtils.getAnimation({
                spritesheetName: 'ItemAnimations1',
                animationName: dropAnimationName,
                speed: 0.6,
                playThisManyTimes: 1,
                transform: [position.x, position.y],
                onComplete: function() {
                    graphicsUtils.removeSomethingFromRenderer(this);
                    globals.currentGame.addBody(item.body);
                    item.body.renderlings.itemFootprint.startFromFrameZero();
                    Matter.Events.trigger(globals.currentGame.itemSystem, 'dropItem', {
                        item: item
                    });
                    item.isDropping = false;
                    item.currentSlot = null;
                    item.manuallyManaged = false;
                    if (options.fleeting)
                        ItemUtils.initiateBlinkDeath({
                            item: item
                        });

                    var dropSound = itemDropSound;
                    if (item.classInformation.itemType == 'microchip') {
                        dropSound = microchipDropSound;
                    } else if (item.classInformation.itemClass == 'book') {
                        dropSound = bookDropSound;
                    } else if (item.classInformation.itemClass == 'stimulant') {
                        dropSound = stimulantDropSound;
                    } else if (item.classInformation.itemClass == 'lightStimulant') {
                        dropSound = pillDropSound;
                    }
                    dropSound.play();
                }
            });

            itemSwoosh.play();
            item.isDropping = true;
            this.itemDrop.play();
            this.itemDrop.tint = item.classInformation.typeInfo.tint;
            this.itemDrop.anchor.set(0.5, 0.75);
            graphicsUtils.addSomethingToRenderer(this.itemDrop, 'stage');

            //Make renderlings accessible from the item itself
            Object.defineProperty(newItem.body, 'renderlings', {
                get: function() {
                    return newItem.renderlings;
                },
                set: function(v) {
                    newItem.renderlings = v;
                }
            });
            Object.defineProperty(newItem.body, 'renderChildren', {
                get: function() {
                    return newItem.renderChildren;
                }
            });

            //play gleam animation
            var itemAnim = gameUtils.getAnimation({
                spritesheetName: 'ItemAnimations1',
                animationName: item.classInformation.typeInfo.gleamAnimation || 'ItemGleamFroll',
                speed: 0.15,
                loopPause: 2000,
                transform: [position.x, position.y],
            });
            itemAnim.play();
            itemAnim.tint = item.classInformation.typeInfo.tint;

            newItem.renderChildren = [{
                    id: 'itemFootprint',
                    data: itemAnim,
                    sortYOffset: 0,
                    visible: true,
                },
                {
                    id: 'shadow',
                    data: 'IsoShadowBlurred',
                    scale: {
                        x: 0.6,
                        y: 0.6 * shadowYScale
                    },
                    visible: true,
                    rotate: 'none',
                    stage: "stageNTwo",
                    offset: {
                        x: 0,
                        y: 5
                    }
                }
            ];

            newItem.body.item = newItem;
        };
    } else {
        Tooltip.makeTooltippable(newItem.icon, {
            title: newItem.title,
            description: newItem.description
        });
    }

    newItem.destroy = function() {
        this.itemDestroyed = true;
        if (this.icon.tooltipObj) {
            this.icon.tooltipObj.destroy();
        }
        if (this.nameDisplayBase) {
            graphicsUtils.removeSomethingFromRenderer(this.nameDisplayBase);
            graphicsUtils.removeSomethingFromRenderer(this.nameDisplay);
        }

        graphicsUtils.removeSomethingFromRenderer(this.icon);
        if (newItem.body) {
            globals.currentGame.removeBody(newItem.body);
        }

        globals.currentGame.removeTickCallback(newItem.hoverListener);
        if (this.itemDrop) {
            graphicsUtils.removeSomethingFromRenderer(this.itemDrop);
        }

        if (this.onDestroy) {
            this.onDestroy();
        }
    };

    newItem.grasp = function(unit, autoGrab) {
        Matter.Events.trigger(globals.currentGame.itemSystem, "usergrab", {
            item: this,
            unit: unit,
            autoGrab: autoGrab
        });
        gameUtils.setCursorStyle('server:MainCursor.png');
    };

    if (!options.dontAddToItemSystem) {
        globals.currentGame.addItem(newItem);
    } else {
        newItem.manuallyManaged = true;
    }
    return newItem;
};

export default ic;
