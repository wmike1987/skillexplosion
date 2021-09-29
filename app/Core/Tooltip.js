import * as Matter from 'matter-js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import styles from '@utils/Styles.js';
import {globals} from '@core/Fundamental/GlobalState.js';

// options {
//     title
//     hotkey
//     description
//     system message (at the very bottom, smaller font)
//     position
// }
var Tooltip = function(options) {
    var textAnchor = {x: 0, y: 0};
    this.titleOnly = options.titleOnly;
    this.descriptionSystemMessageBuffer = 5;
    this.systemMessagesBuffer = 0;
    this.buffer = 5;
    this.iconBuffer = 0;

    this.title = graphicsUtils.createDisplayObject('TEX+:' + options.title + (options.hotkey ? " - '" + options.hotkey + "'" : ""), {style: styles.abilityTitle, anchor: textAnchor});


    //handle description param
    this.descriptions = [];
    if(options.description) { //handle if they passed in a singular 'description' (we'll convert it to an array)
        if(!$.isArray(options.description)) {
            options.description = [options.description];
        }
    }
    options.descriptions = options.descriptions || options.description;

    //actually fill the descriptions with display objects
    $.each(options.descriptions, function(i, descr) {
        var style = options.descriptionStyle || styles.abilityText;
        if($.isArray(options.descriptionStyle)) {
            style = options.descriptionStyle[i];
        }
        this.descriptions.push(graphicsUtils.createDisplayObject('TEX+:' + descr, {style: style, anchor: textAnchor}));
    }.bind(this));

    //always provide a blank description
    if(this.descriptions.length == 0) {
        this.descriptions.push(graphicsUtils.createDisplayObject('TEX+: ', {style: options.descriptionStyle || styles.abilityText, anchor: textAnchor}));
    }

    //set the mainDescription
    this.mainDescription = this.descriptions[0];

    //create the icon map - these icons will be placed to the left of each description, in order
    this.descriptionIcons = [];
    this.iconSize = 32;
    if($.isArray(options.descriptionIcons)) {
        $.each(options.descriptionIcons, function(i, icon) {
            var sizedIcon = graphicsUtils.createDisplayObject(icon, {where: 'hudText', anchor: {x: 0, y: 0.5}});
            this.descriptions[i].anchor = {x: 0, y: 0.5};
            graphicsUtils.makeSpriteSize(sizedIcon, this.iconSize);
            this.descriptionIcons.push(sizedIcon);
        }.bind(this));
    } else if(options.descriptionIcons){
        var sizedIcon = graphicsUtils.createDisplayObject(options.descriptionIcons, {where: 'hudText', anchor: {x: 0, y: 0.5}});
        this.descriptions[0].anchor = {x: 0, y: 0.5};
        graphicsUtils.makeSpriteSize(sizedIcon, this.iconSize);
        this.descriptionIcons.push(sizedIcon);
    }

    //set a description height which will either be the text height, or icon height
    this.descrHeight = (this.mainDescription && this.mainDescription.height) || 0;
    if(this.descriptionIcons.length > 0) {
        this.descrHeight = this.iconSize;
    }

    //build system messages
    //system message could be {text: 'tttt', style: 'sss'} or just a string
    this.systemMessages = [];
    var arrayMessages = mathArrayUtils.convertToArray(options.systemMessage);
    $.each(arrayMessages, function(i, sysMessage) {
        if(!sysMessage) return;

        //determine style
        var style = options.systemMessageText || styles.systemMessageText;
        if(sysMessage.style) {
            style = styles[sysMessage.style];
        }

        //determine message
        sysMessage = sysMessage.text || sysMessage;

        //create message
        this.systemMessages.push(graphicsUtils.createDisplayObject('TEX+:' + sysMessage, {style: style, anchor: textAnchor}));
    }.bind(this));
    this.mainSystemMessage = this.systemMessages[0];

    this.noDelay = options.noDelay;

    this.updaters = options.updaters || {};
    var self = this;
    if(options.updaters) {
        var tt = this;
        $.each(options.updaters, function(key, updater) {
            this.updaters[key] = globals.currentGame.addTickCallback(function() {
                var result = updater(self);
                var results = mathArrayUtils.convertToArray(result);
                results.forEach((result) => {
                    if(result === null || result === undefined) {
                        return;
                    }
                    if(typeof result === 'object' && (result.value === null || result.value === undefined)) {
                        return;
                    }
                    if(result.index != null) {
                        var iKey = result.key || key;
                        tt[iKey][result.index].text = result.value;
                    } else if(tt[key].text != result) {
                        tt[key].text = result;
                        self.sizeBase();
                    }
                });
            });
        }.bind(this));
    }

    //create base and size it
    var baseTint = 0x00042D;
    this.base = graphicsUtils.createDisplayObject('TintableSquare', {tint: baseTint, scale: {x: 1, y: 1}, alpha: 0.85});
    this.sizeBase();
};

Tooltip.prototype.setMainDescription = function(text) {
    this.descriptions[0].text = text;
    this.sizeBase();
};

Tooltip.prototype.sizeBase = function() {
    var descriptionWidth = 0;
    var descriptionHeight = 0;
    var systemMessageWidth = 0;
    var systemMessageHeight = 0;
    var titleWidth = 0;
    var titleHeight = 0;
    var buffer = this.buffer;

    titleWidth = Math.max(titleWidth, this.title.width);
    titleHeight = this.title.height;
    if(this.titleOnly) {
        buffer = 2.5;
    }

    $.each(this.systemMessages, function(i, sysMessage) {
        systemMessageWidth = Math.max(systemMessageWidth, sysMessage.width);
        systemMessageHeight += sysMessage.height;
        if(i > 0) {
            systemMessageHeight += this.systemMessagesBuffer;
        }
    }.bind(this));
    $.each(this.descriptions, function(i, descr) {
        descriptionWidth = Math.max(descriptionWidth, descr.width);
        descriptionHeight += this.descrHeight;
    }.bind(this));

    var iconWidthAdjustment = 0;
    if(this.descriptionIcons.length > 0) {
        iconWidthAdjustment = this.iconSize;
        this.iconBuffer = this.iconSize/2 + buffer;
    }
    var width = Math.max(titleWidth, descriptionWidth, systemMessageWidth) + 15 + iconWidthAdjustment;
    var height = this.title.height + buffer/2 + descriptionHeight + buffer + systemMessageHeight + (this.systemMessages.length ? buffer : 0) + buffer;
    graphicsUtils.makeSpriteSize(this.base, {w: width, h: height});
};

Tooltip.prototype.destroy = function(options) {
    graphicsUtils.removeSomethingFromRenderer(this.title);
    $.each(this.descriptions, function(i, descr) {
        graphicsUtils.removeSomethingFromRenderer(descr);
    });
    this.descriptions = null;

    $.each(this.descriptionIcons, function(i, icon) {
        graphicsUtils.removeSomethingFromRenderer(icon);
    });
    this.descriptionIcons = null;

    $.each(this.systemMessages, function(i, sysMessage) {
        graphicsUtils.removeSomethingFromRenderer(sysMessage);
    });
    this.systemMessages = null;

    graphicsUtils.removeSomethingFromRenderer(this.base);

    $.each(this.updaters, function(key, updater) {
        globals.currentGame.removeTickCallback(updater);
    }.bind(this));
    this.updaters = null;

    if(this.cleanUpEvent) {
        this.cleanUpEvent();
    }

    this.isDestroyed = true;
};

Tooltip.prototype.display = function(position, options) {
    options = options || {};
    this.visible = true;

    //lean our tooltip left or right so that it doesn't go off the screen
    var xOffset = 0;
    if(position.x + this.base.width >= gameUtils.getPlayableWidth() - 15) {
        this.base.anchor = {x: 1, y: 1};
        xOffset = this.base.width;
        //lean left
    } else {
        this.base.anchor = {x: 0, y: 1};
        //lean right
    }

    //favor up or down so that the tooltip doesn't go off the screen
    var yOffset = 0;
    if(position.y - this.base.height <= 0 + 15) {
        this.base.anchor.y = 0;
        yOffset = this.base.height;
        //favor down
    } else {
        this.base.anchor.y = 1;
        //favor up (basically do nothing)
    }

    if(options.middleAnchor) {
        this.base.anchor = {x: 0.5, y: 0.5};
        xOffset = this.base.width/2.0;
        yOffset = this.base.height/2.0;
    }

    if(!this.base.parent) {
        graphicsUtils.addDisplayObjectToRenderer(this.title, 'hudText');
        $.each(this.descriptions, function(i, descr) {
            graphicsUtils.addDisplayObjectToRenderer(descr, 'hudText');
        });
        $.each(this.descriptionIcons, function(i, icon) {
            graphicsUtils.addDisplayObjectToRenderer(icon, 'hudText');
        });
        $.each(this.systemMessages, function(i, sysMessage) {
            graphicsUtils.addDisplayObjectToRenderer(sysMessage, 'hudText');
        });
        graphicsUtils.addDisplayObjectToRenderer(this.base, 'hudThree');
    }

    //place title
    this.title.position = {x: position.x - xOffset + this.buffer, y: position.y + yOffset - this.base.height + this.buffer/2};

    //place descriptions and description icons
    $.each(this.descriptions, function(i, descr) {
        descr.position = {x: position.x - xOffset + this.buffer, y: position.y + yOffset - this.base.height + this.title.height + this.buffer/2 + (this.iconBuffer || this.buffer) + (i * (this.descrHeight))};

        //if we're using description icons, need to make some alterations
        if(this.descriptionIcons.length > 0) {
            this.descriptionIcons[i].position = descr.position;
            descr.position.x += this.iconSize;
        }
    }.bind(this));

    //place system messages
    $.each(this.systemMessages, function(i, sysMessage) {
        sysMessage.position = {x: position.x - xOffset + this.buffer, y: position.y + yOffset - this.base.height  + this.title.height + this.buffer/2 + this.buffer + (this.descriptions.length)*this.descrHeight + this.descriptionSystemMessageBuffer + ((i * sysMessage.height) + (i * this.systemMessagesBuffer))};
    }.bind(this));

    this.base.position = position;

    this.title.visible = true;
    $.each(this.descriptions, function(i, descr) {
        descr.visible = true;
    });

    $.each(this.descriptionIcons, function(i, icon) {
        icon.visible = true;
    });

    $.each(this.systemMessages, function(i, sysMessage) {
        sysMessage.visible = true;
    });
    this.sizeBase();
    this.base.visible = true;

    Matter.Events.trigger(this.dobj, 'tooltipShown');
    Matter.Events.trigger(globals.currentGame, 'tooltipShown', {tooltip: this});
};

Tooltip.prototype.disable = function() {
    this.disabled = true;
};

Tooltip.prototype.enable = function() {
    this.disabled = false;
};

Tooltip.prototype.hide = function() {
    this.visible = false;
    this.title.visible = false;
    $.each(this.descriptions, function(i, descr) {
        descr.visible = false;
    });
    $.each(this.descriptionIcons, function(i, icon) {
        icon.visible = false;
    });
    $.each(this.systemMessages, function(i, sysMessage) {
        sysMessage.visible = false;
    });
    this.base.visible = false;
};

Tooltip.makeTooltippable = function(displayObject, options) {
    options = options || {};

    //If we have an existing tooltip, just kill it
    if(displayObject.tooltipObj) {
        displayObject.tooltipObj.destroy();
    }
    displayObject.interactive = true;
    options.position = displayObject.position;
    displayObject.tooltipObj = new Tooltip(options);
    displayObject.tooltipObj.dobj = displayObject;

    var stopTimeout = null;
    if(!options.manualHandling) {
        displayObject.on('mousemove', function(event) {
            //escape routes
            if(options.showInfoCursor) {
                gameUtils.setCursorStyle('Info');
            }
            if(displayObject.tooltipObj.visible || displayObject.tooltipObj.disabled) return;
            if(!gameUtils.isPositionWithinCanvasBounds(event.data.global, {x: 1, y: 1})) return;

            if(stopTimeout) {
                clearTimeout(stopTimeout);
            }

            if(displayObject.tooltipObj.noDelay) {
                if(!displayObject.tooltipObj.isDestroyed && displayObject.visible) {
                    displayObject.tooltipObj.display(event.data.global);
                }
            } else {
                stopTimeout = setTimeout(function() {
                    if(!displayObject.tooltipObj.isDestroyed && displayObject.visible && !displayObject.tooltipObj.disabled) {
                        displayObject.tooltipObj.display(event.data.global);
                    }
                }.bind(this), 100);
            }
        }.bind(this));
    }

    if(!options.manualHandling) {
        displayObject.on('mouseout', function(event) {
            if(options.showInfoCursor) {
                gameUtils.setCursorStyle('Main');
            }
            displayObject.tooltipObj.hide();
            if(stopTimeout) {
                clearTimeout(stopTimeout);
            }
        }.bind(this));
    }

    var f = Matter.Events.on(displayObject, 'destroy', function() {
        displayObject.tooltipObj.destroy();
    });

    displayObject.tooltipObj.cleanUpEvent = function() {
        Matter.Events.off(displayObject, 'destroy', f);
    };

    return displayObject.tooltipObj;
};

export default Tooltip;
