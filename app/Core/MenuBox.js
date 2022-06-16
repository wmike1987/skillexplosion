import * as Matter from "matter-js";
import * as $ from "jquery";
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
} from "@utils/UtilityMenu.js";
import styles from "@utils/Styles.js";
import { globals } from "@core/Fundamental/GlobalState.js";

var MenuBox = function (options) {
    options = gameUtils.mixinDefaults({params: options, defaults: {
        destroyOnChoice: true,
        onShow: function() {},
        onHideOrDestroy: function() {},
        titleStyle: styles.passiveDStyle,
        optionStyle: styles.abilityText
    }});

    var textAnchor = {
        x: 0,
        y: 0,
    };

    options.onShow();
    this.onHideOrDestroy = options.onHideOrDestroy;
    
    this.buffer = 5;
    this.title = graphicsUtils.createDisplayObject("TEX+:" + options.title, {
        where: "hudText",
        style: options.titleStyle,
        anchor: textAnchor,
    });
    this.onClickObject = options.onClickObject;
    this.destroyOnChoice = options.destroyOnChoice;

    //menu option should be... {text: XXXX, action: function()}
    this.menuOptions = options.menuOptions.map((option, index) => {
        let textType = "TEXM:";
        let t = graphicsUtils.createDisplayObject(
            textType + "<st><highlight>" + (index + 1) + ")</highlight> " + option.text + "</st>",
            {
                where: "hudText",
                anchor: textAnchor,
                style: styles.menuMultiTextStyle,
            }
        );
        return {
            text: t,
            action: option.action,
        };
    });

    this.menuOptionHeight = this.menuOptions[0].text.getBounds().height-8;

    var baseTint = 0x00042d;
    this.base = graphicsUtils.createDisplayObject("TintableSquare", {
        tint: baseTint,
        scale: {
            x: 1,
            y: 1,
        },
        alpha: 0.85,
        where: "hudThree",
    });
    this.sizeBase();

    this.display = function (position) {
        this.visible = true;
        this.position = mathArrayUtils.clonePosition(position);

        //lean our tooltip left or right so that it doesn't go off the screen
        var xOffset = 0;
        if (position.x + this.base.width >= gameUtils.getPlayableWidth() - 15) {
            this.base.anchor = {
                x: 1,
                y: 1,
            };
            xOffset = this.base.width;
            //lean left
        } else {
            this.base.anchor = {
                x: 0,
                y: 1,
            };
            //lean right
        }

        //favor up or down so that the tooltip doesn't go off the screen
        var yOffset = 0;
        if (position.y - this.base.height <= 0 + 15) {
            this.base.anchor.y = 0;
            yOffset = this.base.height;
            //favor down
        } else {
            this.base.anchor.y = 1;
            //favor up (basically do nothing)
        }

        if (options.middleAnchor) {
            this.base.anchor = {
                x: 0.5,
                y: 0.5,
            };
            xOffset = this.base.width / 2.0;
            yOffset = this.base.height / 2.0;
        }

        //show title
        graphicsUtils.addDisplayObjectToRenderer(this.title);

        //show menu options
        this.menuOptions.forEach((option) => {
            graphicsUtils.addDisplayObjectToRenderer(option.text);
        });

        //show base
        graphicsUtils.addDisplayObjectToRenderer(this.base);

        //place title
        this.title.position = {
            x: position.x - xOffset + this.buffer,
            y: position.y + yOffset - this.base.height + this.buffer / 2,
        };
        mathArrayUtils.roundPositionToWholeNumbers(this.title.position);

        //place descriptions and description icons
        let descriptionHeightTally = 0;
        this.menuOptions.forEach((option) => {
            option.text.position = {
                x: position.x - xOffset + this.buffer,
                y:
                    position.y +
                    yOffset -
                    this.base.height +
                    this.title.height +
                    this.buffer / 2 +
                    (this.iconBuffer || this.buffer) +
                    descriptionHeightTally,
            };
            descriptionHeightTally +=
                this.menuOptionHeight * (option.text.lineAmount || 1);

            mathArrayUtils.roundPositionToWholeNumbers(option.text.position);
        });

        this.base.position = position;

        this.sizeBase();

        //add the base border on first display
        if (!this.baseBorder) {
            this.baseBorder = graphicsUtils.addBorderToSprite({
                sprite: this.base,
                thickness: 2,
                tint: this.borderTint || 0xa2a2a2,
                alpha: 0.75,
            });
        } else {
            graphicsUtils.resizeBorder(this.base);
        }
        graphicsUtils.addOrShowDisplayObject(this.baseBorder);

        //set the border position
        var borderPosition = this.base.position;
        if (this.base.anchor.x != 0.5 && this.base.anchor.y != 0.5) {
            borderPosition = mathArrayUtils.clonePosition(this.base.position, {
                x: (this.base.width / 2) * (this.base.anchor.x ? -1 : 1),
                y: (this.base.height / 2) * (this.base.anchor.y ? -1 : 1),
            });
            this.baseBorder.sortYOffset =
                -1 - this.base.position.y - borderPosition.y;
        }
        this.baseBorder.position = borderPosition;

        //setup hover listeners
        this.menuOptions.forEach((option) => {
            if (option.hoverFulfilled) {
                return;
            }
            option.hoverFulfilled = true;
            graphicsUtils.mouseOverOutTint({ sprite: option.text, finalTint: 0x9beb34});
        });

        //setup click listeners
        this.menuOptions.forEach((option) => {
            if (option.clickFulfilled) {
                return;
            }

            let self = this;
            option.clickFulfilled = true;
            option.text.on("mousedown", function (event) {
                if(self.destroyOnChoice) {
                    self.destroy();
                }
                option.action();
            });
        });

        //setup closing click listener
        this.baseImpeder = mathArrayUtils.getImpeder({sprite: this.base, id: mathArrayUtils.getId()});

        this.impederEvent = globals.currentGame.addListener('mousedown', (event) => {
            if(!this.baseImpeder.impedesPoint(globals.currentGame.mousePosition)) {
                this.hide();
            }
        });

    };

    this.hide = function () {
        //hide title
        this.visible = false;
        graphicsUtils.hideDisplayObject(this.title);
        graphicsUtils.hideDisplayObject(this.base);
        graphicsUtils.hideDisplayObject(this.baseBorder);

        //hide menu options
        this.menuOptions.forEach((option) => {
            graphicsUtils.hideDisplayObject(option.text);
        });

        globals.currentGame.removeListener(this.impederEvent);

        this.onHideOrDestroy();
    };

    this.destroy = function () {
        if(this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.visible = false;
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.base);
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.baseBorder);
        graphicsUtils.fadeSpriteQuicklyThenDestroy(this.title);

        this.menuOptions.forEach((option) => {
            graphicsUtils.fadeSpriteQuicklyThenDestroy(option.text);
        });

        globals.currentGame.removeListener(this.impederEvent);
        
        this.onHideOrDestroy();
    };
};

MenuBox.prototype.sizeBase = function () {
    var optionWidth = 0;
    var optionHeight = 0;
    var systemMessageWidth = 0;
    var systemMessageHeight = 0;
    var titleWidth = 0;
    var titleHeight = 0;
    var buffer = this.buffer;

    titleWidth = Math.max(titleWidth, this.title.width);
    titleHeight = this.title.height;
    if (this.titleOnly) {
        buffer = 2.5;
    }

    this.menuOptions.forEach((option) => {
        optionWidth = Math.max(optionWidth, option.text.getBounds().width);
        optionHeight += this.menuOptionHeight * (option.text.lineAmount || 1);
    });

    var width = Math.max(titleWidth, optionWidth) + 15;
    var height =
        this.title.height + buffer / 2 + optionHeight + buffer + buffer;
    graphicsUtils.makeSpriteSize(this.base, {
        w: width,
        h: height,
    });
    this.resizeAndPositionBorder();
};

MenuBox.prototype.resizeAndPositionBorder = function () {
    if (!this.baseBorder) {
        return;
    } else {
        //resize border
        graphicsUtils.resizeBorder(this.base);
        this.baseBorder.visible = this.base.visible;

        //position border
        var borderPosition = this.base.position;
        if (this.base.anchor.x != 0.5 && this.base.anchor.y != 0.5) {
            borderPosition = mathArrayUtils.clonePosition(this.base.position, {
                x: (this.base.width / 2) * (this.base.anchor.x ? -1 : 1),
                y: (this.base.height / 2) * (this.base.anchor.y ? -1 : 1),
            });
            this.baseBorder.sortYOffset =
                -1 - this.base.position.y - borderPosition.y;
        }
        this.baseBorder.position = borderPosition;
    }
};

export default MenuBox;
