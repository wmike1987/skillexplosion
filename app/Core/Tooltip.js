define(['jquery', 'utils/GameUtils', 'utils/Styles', 'matter-js'], function($, utils, styles, Matter) {

    // options {
    //     title
    //     hotkey
    //     description
    //     system message (at the very bottom, smaller font)
    //     position
    // }
    var Tooltip = function(options) {
        var textAnchor = {x: 0, y: 0};

        this.title = utils.createDisplayObject('TEXT:' + options.title + (options.hotkey ? " - '" + options.hotkey + "'" : ""), {style: styles.abilityTitle, anchor: textAnchor});

        //build descriptions
        this.description = [];
        this.systemMessages = [];
        if($.isArray(options.description)) {
            $.each(options.description, function(i, descr) {
                this.description.push(utils.createDisplayObject('TEXT:' + descr, {style: options.descriptionStyle || styles.abilityText, anchor: textAnchor}));
            }.bind(this))
        } else {
            this.description.push(utils.createDisplayObject('TEXT:' + options.description, {style: options.descriptionStyle || styles.abilityText, anchor: textAnchor}));
        }
        this.mainDescription = this.description[0];

        //build system messages
        if($.isArray(options.systemMessage)) {
            $.each(options.systemMessage, function(i, sysMessage) {
                this.systemMessages.push(utils.createDisplayObject('TEXT:' + sysMessage, {style: options.systemMessageText || styles.systemMessageText, anchor: textAnchor}));
            }.bind(this))
        } else if(options.systemMessage){
            this.systemMessages.push(utils.createDisplayObject('TEXT:' + options.systemMessage, {style: options.systemMessageText || styles.systemMessageText, anchor: textAnchor}));
        }
        this.mainSystemMessage = this.systemMessages[0];

        this.noDelay = options.noDelay;

        this.updaters = options.updaters || {};
        var self = this;
        if(options.updaters) {
            var tt = this;
            $.each(options.updaters, function(key, updater) {
                this.updaters[key] = currentGame.addTickCallback(function() {
                    var result = updater(self);
                    if(result === null || result === undefined) {
                        return;
                    }
                    if(result.index) {
                        tt[key][result.index].text = result.value;
                    } else {
                        tt[key].text = result;
                    }
                })
            }.bind(this))
        }

        //create base and size it
        var baseTint = 0x00042D;
        this.base = utils.createDisplayObject('TintableSquare', {tint: baseTint, scale: {x: 1, y: 1}, alpha: .85});
        var descriptionWidth = 0;
        var descriptionHeight = 0;
        var systemMessageWidth = 0;
        var systemMessageHeight = 0;
        this.systemMessageBuffer = 5;
        this.buffer = 5;
        $.each(this.systemMessages, function(i, sysMessage) {
            systemMessageWidth = Math.max(systemMessageWidth, sysMessage.width);
            systemMessageHeight += sysMessage.height;
        })
        $.each(this.description, function(i, descr) {
            descriptionWidth = Math.max(descriptionWidth, descr.width);
            descriptionHeight += descr.height;
        })
        utils.makeSpriteSize(this.base, {w: Math.max(descriptionWidth, systemMessageWidth) + 15, h: this.title.height + this.buffer/2 + descriptionHeight + this.buffer + systemMessageHeight + (this.systemMessages.length ? this.buffer : 0) + this.buffer});
    };

    //set title, text, backgroundColor, etc
    Tooltip.prototype.update = function(options) {
        this.title.text = options.text;
        this.description[0].text = options.text;
    };

    Tooltip.prototype.destroy = function(options) {
        utils.removeSomethingFromRenderer(this.title);
        $.each(this.description, function(i, descr) {
            utils.removeSomethingFromRenderer(descr);
        })

        $.each(this.systemMessages, function(i, sysMessage) {
            utils.removeSomethingFromRenderer(sysMessage);
        })

        utils.removeSomethingFromRenderer(this.base);

        $.each(this.updaters, function(key, updater) {
            currentGame.removeTickCallback(updater);
        }.bind(this))

        this.isDestroyed = true;
    };

    Tooltip.prototype.display = function(position) {
        this.visible = true;

        //lean our tooltip left or right so that it doesn't go off the screen
        var xOffset = 0;
        if(position.x + this.base.width >= utils.getPlayableWidth() - 15) {
            this.base.anchor = {x: 1, y: 1};
            xOffset = this.base.width
            this.leftLeaning = true;
        } else {
            this.base.anchor = {x: 0, y: 1};
            this.leftLeaning = false;
        }

        if(!this.base.parent) {
            utils.addDisplayObjectToRenderer(this.title, 'hudText');
            $.each(this.description, function(i, descr) {
                utils.addDisplayObjectToRenderer(descr, 'hudText');
            })
            $.each(this.systemMessages, function(i, sysMessage) {
                utils.addDisplayObjectToRenderer(sysMessage, 'hudText');
            })
            // if(this.systemMessage)
            //     utils.addDisplayObjectToRenderer(this.systemMessage, 'hudText');
            utils.addDisplayObjectToRenderer(this.base, 'hudThree');
        }

        //place descriptions
        this.title.position = {x: position.x - xOffset + this.buffer, y: position.y - this.base.height + this.buffer/2};
        $.each(this.description, function(i, descr) {
            descr.position = {x: position.x - xOffset + this.buffer, y: position.y - this.base.height + this.title.height + this.buffer/2 + this.buffer + (i * descr.height)};
        }.bind(this))

        //place system messages
        $.each(this.systemMessages, function(i, sysMessage) {
            sysMessage.position = {x: position.x - xOffset + this.buffer, y: position.y - this.base.height  + this.title.height + this.buffer/2 + this.buffer + (this.description.length)*this.description[0].height + this.systemMessageBuffer + (i * sysMessage.height)};
        }.bind(this))
        // if(this.systemMessage)
        //     this.systemMessage.position = {x: position.x - xOffset + buffer, y: position.y - this.base.height + (this.description.length-1)*25 + 48};

        this.base.position = position;

        this.title.visible = true;
        $.each(this.description, function(i, descr) {
            descr.visible = true;
        })
        $.each(this.systemMessages, function(i, sysMessage) {
            sysMessage.visible = true;
        })
        // if(this.systemMessage)
        //     this.systemMessage.visible = true;
        this.base.visible = true;
    };

    Tooltip.prototype.hide = function() {
        this.visible = false;
        this.title.visible = false;
        $.each(this.description, function(i, descr) {
            descr.visible = false;
        })
        $.each(this.systemMessages, function(i, sysMessage) {
            sysMessage.visible = false;
        })
        // if(this.systemMessage)
        //     this.systemMessage.visible = false;
        this.base.visible = false;
    };

    Tooltip.makeTooltippable = function(displayObject, options) {
        displayObject.interactive = true;
        options.position = displayObject.position;
        displayObject.tooltipObj = new Tooltip(options);

        var stopTimeout = null;
        displayObject.on('mousemove', function(event) {
            if(displayObject.tooltipObj.visible || displayObject.tooltipObj.disabled) return;
            if(stopTimeout) {
                clearTimeout(stopTimeout);
            }

            if(displayObject.tooltipObj.noDelay) {
                if(!displayObject.tooltipObj.isDestroyed && displayObject.visible) {
                    displayObject.tooltipObj.display(event.data.global);
                }
            } else {
                stopTimeout = setTimeout(function() {
                    if(!displayObject.tooltipObj.isDestroyed && displayObject.visible) {
                        displayObject.tooltipObj.display(event.data.global);
                    }
                }.bind(this), 100)
            }
        }.bind(this))

        displayObject.on('mouseout', function(event) {
            displayObject.tooltipObj.hide();
            if(stopTimeout) {
                clearTimeout(stopTimeout);
            }
        }.bind(this))

        Matter.Events.on(displayObject, 'destroy', function() {
            displayObject.tooltipObj.destroy();
        })

        return displayObject.tooltipObj;
    }

    return Tooltip;
})
