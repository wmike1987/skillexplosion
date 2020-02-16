define(['jquery', 'utils/GameUtils', 'utils/Styles'], function($, utils, styles) {

    // options {
    //     title
    //     hotkey
    //     description
    //     position
    // }
    var Tooltip = function(options) {
        var textAnchor = {x: 0, y: 0};

        this.title = utils.createDisplayObject('TEXT:' + options.title + (options.hotkey ? " - '" + options.hotkey + "'" : ""), {style: styles.abilityTitle, anchor: textAnchor});

        this.description = utils.createDisplayObject('TEXT:' + options.description, {style: styles.abilityText, anchor: textAnchor});

        var baseTint = 0x00042D;

        this.base = utils.createDisplayObject('TintableSquare', {tint: baseTint, scale: {x: 1, y: 1}, alpha: .85});
        utils.makeSpriteSize(this.base, {w: this.description.width + 10, h: 58});
    };

    //set title, text, backgroundColor, etc
    Tooltip.prototype.update = function(options) {
        this.title.text = options.text;
        this.description.text = options.text;
    };

    Tooltip.prototype.display = function(position) {
        this.visible = true;

        //lean our tooltip left or right so that it doesn't go off the screen
        var xOffset = 0;
        if(position.x > utils.getPlayableWidth()*3/4) {
            this.base.anchor = {x: 1, y: 1};
            xOffset = this.base.width
            this.leftLeaning = true;
        } else {
            this.base.anchor = {x: 0, y: 1};
            this.leftLeaning = false;
        }

        if(!this.base.parent) {
            utils.addDisplayObjectToRenderer(this.title, 'hudText');
            utils.addDisplayObjectToRenderer(this.description, 'hudText');
            utils.addDisplayObjectToRenderer(this.base, 'hudThree');
        }

        var buffer = 5;
        this.title.position = {x: position.x - xOffset + buffer, y: position.y - this.base.height + buffer/2};
        this.description.position = {x: position.x - xOffset + buffer, y: position.y - this.base.height + 30};
        this.base.position = position;

        this.title.visible = true;
        this.description.visible = true;
        this.base.visible = true;
    };

    Tooltip.prototype.hide = function() {
        this.visible = false;
        this.title.visible = false;
        this.description.visible = false;
        this.base.visible = false;
    };

    Tooltip.makeTooltippable = function(displayObject, options) {
        displayObject.interactive = true;
        options.position = displayObject.position;
        displayObject.tooltipObj = new Tooltip(options);

        var stopTimeout = null;
        displayObject.on('mousemove', function(event) {
            if(displayObject.tooltipObj.visible) return;
            if(stopTimeout) {
                clearTimeout(stopTimeout);
            }

            stopTimeout = setTimeout(function() {
                displayObject.tooltipObj.display(event.data.global);
            }, 225)
        }.bind(this))

        displayObject.on('mouseout', function(event) {
            displayObject.tooltipObj.hide();
            if(stopTimeout) {
                clearTimeout(stopTimeout);
            }
        }.bind(this))
    }

    return Tooltip;
})
