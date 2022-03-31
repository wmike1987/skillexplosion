import * as $ from 'jquery';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import Tooltip from '@core/Tooltip.js';
import * as Matter from 'matter-js';
import {
    globals,
    keyStates,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import styles from '@utils/Styles.js';
import ItemUtils from '@core/Unit/ItemUtils.js';

var mainColor = 0x004623;

var Page = function(options) {
    var pagePosition = {
        x: gameUtils.getPlayableWidth() / 2.0,
        y: gameUtils.getPlayableHeight() / 2.0
    };
    var pageHeight = 620;
    var pageWidth = 450;
    var initialTextBuffer = 40;
    this.buffer = 20;
    this.leftSideBuffer = 10;
    this.smallLineBuffer = options.smallLineBuffer || 15;
    this.lineBuffer = options.lineBuffer || 20;
    this.titleLineBuffer = options.titleLineBuffer || 22;
    this.currentBuffer = initialTextBuffer;

    var titlePosition = mathArrayUtils.clonePosition(pagePosition, {
        y: -pageHeight / 2.0 + this.buffer
    });
    this.title = graphicsUtils.createDisplayObject('TEX+:' + options.title, {
        position: titlePosition,
        where: 'hudText',
        style: styles.fatigueTextLarge
    });

    this.startingTextPosition = mathArrayUtils.clonePosition(pagePosition, {
        x: -pageWidth / 2.0 + this.leftSideBuffer,
        y: -pageHeight / 2.0 + initialTextBuffer
    });
    this.lines = 0;
    this.pageObjects = [];

    this.background = graphicsUtils.createDisplayObject('TintableSquare', {
        tint: mainColor,
        position: pagePosition,
        where: 'hud'
    });
    graphicsUtils.makeSpriteSize(this.background, {
        x: pageWidth,
        y: pageHeight
    });
    graphicsUtils.addBorderToSprite({
        sprite: this.background
    });
};

Page.prototype.show = function() {
    graphicsUtils.addOrShowDisplayObject(this.background);
    graphicsUtils.addOrShowDisplayObject(this.title);
    this.pageObjects.forEach((obj) => {
        graphicsUtils.addOrShowDisplayObject(obj);
    });
};

Page.prototype.hide = function() {
    graphicsUtils.hideDisplayObject(this.background);
    graphicsUtils.hideDisplayObject(this.title);
    this.pageObjects.forEach((obj) => {
        graphicsUtils.hideDisplayObject(obj);
    });
};

Page.prototype._getNextLinePosition = function() {
    return mathArrayUtils.clonePosition(this.startingTextPosition, {
        y: this.currentBuffer
    });
};

Page.prototype.addLineTitle = function(options) {
    var text = options.text;
    var image = options.image;
    var imageOffset = options.imageOffset;

    var imageObj = null;
    var firstPosition = this._getNextLinePosition();
    if (image) {
        imageObj = graphicsUtils.createDisplayObject(image, {
            anchor: {
                x: 0,
                y: 0.5
            },
            position: mathArrayUtils.clonePosition(firstPosition, imageOffset),
            where: 'hudText'
        });
        this.pageObjects.push(imageObj);
    }

    var textPosition = imageObj ? mathArrayUtils.clonePosition(firstPosition, {
        x: 28
    }) : firstPosition;
    var textObj = graphicsUtils.createDisplayObject('TEX+:' + text, {
        anchor: {
            x: 0,
            y: 0.5
        },
        position: textPosition,
        where: 'hudText',
        style: styles.abilityTitle
    });
    this.pageObjects.push(textObj);

    this.currentBuffer += this.titleLineBuffer;
};

Page.prototype.addLine = function(options) {
    var text = options.text;

    var textPosition = this._getNextLinePosition();
    var textObj = graphicsUtils.createDisplayObject('TEX+:' + text, {
        anchor: {
            x: 0,
            y: 0.5
        },
        position: textPosition,
        where: 'hudText',
        style: styles.abilityText
    });
    this.pageObjects.push(textObj);

    this.currentBuffer += options.continuation ? this.smallLineBuffer : this.lineBuffer;
};

var HelpMenu = function(unitPanel) {
    this.unitPanelRef = unitPanel;
};

HelpMenu.prototype.initialize = function() {
    this.helpButton = graphicsUtils.createDisplayObject('InfoButton', {
        where: 'hud',
        position: {
            x: -300,
            y: -300
        }
    });
    this.helpButton.interactive = true;
    graphicsUtils.makeSpriteSize(this.helpButton, 28);

    var self = this;

    this.helpButton.on('mouseover', function(event) {
        self.helpButton.tint = 0x78de8e;
    });

    this.helpButton.on('mouseout', function(event) {
        self.helpButton.tint = 0xFFFFFF;
    });

    $('body').on('keydown.help', function(event) {
        var key = event.key.toLowerCase();
        if (key == 'escape' && this.isVisible()) {
            this.hideMenu();
        }
    }.bind(this));

    this.helpButton.on('mousedown', function(event) {
        if (self.isVisible()) {
            self.hideMenu();
        } else {
            self.showMenu();
        }
    });

    //create arrows
    var pagePosition = {
        x: gameUtils.getPlayableWidth() / 2.0,
        y: gameUtils.getPlayableHeight() / 2.0
    };
    var arrowBoxSize = 50;
    var arrowBoxOffset = 325;
    // this.rightArrowBackground = graphicsUtils.createDisplayObject('TintableSquare', {tint: 0x170057, position: mathArrayUtils.clonePosition(pagePosition, {x: arrowBoxOffset}), where: 'hud'});
    this.rightArrow = graphicsUtils.createDisplayObject('TEX+:>>', {
        position: mathArrayUtils.clonePosition(pagePosition, {
            x: arrowBoxOffset
        }),
        where: 'hudText',
        style: styles.pageArrowStyleLarge
    });
    // graphicsUtils.makeSpriteSize(this.rightArrowBackground, {x: arrowBoxSize, y: arrowBoxSize});
    // graphicsUtils.addBorderToSprite({sprite: this.rightArrowBackground});

    // this.leftArrowBackground = graphicsUtils.createDisplayObject('TintableSquare', {tint: 0x170057, position: mathArrayUtils.clonePosition(pagePosition, {x: -arrowBoxOffset}), where: 'hud'});
    this.leftArrow = graphicsUtils.createDisplayObject('TEX+:<<', {
        position: mathArrayUtils.clonePosition(pagePosition, {
            x: -arrowBoxOffset
        }),
        where: 'hudText',
        style: styles.pageArrowStyleLarge
    });
    // graphicsUtils.makeSpriteSize(this.leftArrowBackground, {x: arrowBoxSize, y: arrowBoxSize});
    // graphicsUtils.addBorderToSprite({sprite: this.leftArrowBackground});

    this.rightArrow.interactive = true;
    this.leftArrow.interactive = true;

    this.rightArrow.on('mouseover', function(event) {
        if (self.hasNextPage()) {
            self.rightArrow.scale = {
                x: 1.1,
                y: 1.1
            };
        }
    });

    this.rightArrow.on('mouseout', function(event) {
        self.rightArrow.scale = {
            x: 1.0,
            y: 1.0
        };
    });

    this.leftArrow.on('mouseover', function(event) {
        if (self.hasPreviousPage()) {
            self.leftArrow.scale = {
                x: 1.1,
                y: 1.1
            };
        }
    });

    this.leftArrow.on('mouseout', function(event) {
        self.leftArrow.scale = {
            x: 1.0,
            y: 1.0
        };
    });

    this.rightArrow.on('mousedown', function(event) {
        self.showPage(self.getNextPage());
    });

    this.leftArrow.on('mousedown', function(event) {
        self.showPage(self.getPreviousPage());
    });

    this.pages = [];

    //default pages
    var BuffPage1 = new Page({
        title: 'Buff Key (1/3)',
        lineBuffer: 40,
        titleLineBuffer: 20
    });
    BuffPage1.addLineTitle({
        text: 'Petrify',
        image: 'PetrifyBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Immobilizes unit. Unit becomes immune to normal',
        continuation: true
    });
    BuffPage1.addLine({
        text: 'attacks but takes 2x ability damage.'
    });

    BuffPage1.addLineTitle({
        text: 'Stun',
        image: 'StunBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Immobilizes unit.'
    });

    BuffPage1.addLineTitle({
        text: 'Speed',
        image: 'SpeedBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Increases movement speed.'
    });

    BuffPage1.addLineTitle({
        text: 'Enrage',
        image: 'EnrageBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Increases damage/healing.'
    });

    BuffPage1.addLineTitle({
        text: 'Range',
        image: 'RangeBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Increases attack/heal range.'
    });

    BuffPage1.addLineTitle({
        text: 'Berserk',
        image: 'BerserkBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Adds multiplier to attack speed.'
    });

    BuffPage1.addLineTitle({
        text: 'Maim',
        image: 'MaimBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Slows unit.'
    });

    BuffPage1.addLineTitle({
        text: 'Armor',
        image: 'DefensiveBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Increases unit armor.'
    });

    BuffPage1.addLineTitle({
        text: 'Soften',
        image: 'SoftenBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage1.addLine({
        text: 'Decreases unit armor to 0.'
    });

    this.addPage(BuffPage1);

    //default pages
    var BuffPage2 = new Page({
        title: 'Buffs Cont... (2/3)',
        lineBuffer: 40,
        titleLineBuffer: 20
    });

    BuffPage2.addLineTitle({
        text: 'Dodge',
        image: 'DodgeBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Increases dodge.'
    });

    BuffPage2.addLineTitle({
        text: 'Sure Dodge',
        image: 'SureDodgeBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Grants 100% chance to dodge the next attack.'
    });

    BuffPage2.addLineTitle({
        text: 'Free Mine',
        image: 'MineBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Changes cost of next mine to 0 energy.'
    });

    BuffPage2.addLineTitle({
        text: 'Free Vanish',
        image: 'SecretStepBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Changes cost of next vanish to 0 energy.'
    });

    BuffPage2.addLineTitle({
        text: 'Free Knife',
        image: 'FreeKnifeBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Changes cost of next knife to 0 energy.'
    });

    BuffPage2.addLineTitle({
        text: 'Health Gem',
        image: 'WickedWaysHealingBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Increases health regeneration.'
    });

    BuffPage2.addLineTitle({
        text: 'Energy Gem',
        image: 'SpiritualStateEnergyGainBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Increases energy regeneration.'
    });

    BuffPage2.addLineTitle({
        text: 'Plague Gem',
        image: 'PlagueBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Prevents health and energy regeneration.'
    });

    BuffPage2.addLineTitle({
        text: 'Rush of Blood',
        image: 'RushOfBloodBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage2.addLine({
        text: 'Doubles healing received by unit.'
    });

    this.addPage(BuffPage2);

    //default pages
    var BuffPage3 = new Page({
        title: 'Buffs Cont... (3/3)',
        lineBuffer: 40,
        titleLineBuffer: 20
    });

    BuffPage3.addLineTitle({
        text: 'Spiritual State',
        image: 'SpiritualStateBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage3.addLine({
        text: 'Grants energy per hp received.'
    });

    BuffPage3.addLineTitle({
        text: 'Condemn',
        image: 'CondemnBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage3.addLine({
        text: 'Death of condemned unit heals condemning unit.'
    });

    BuffPage3.addLineTitle({
        text: 'Accuse',
        image: 'DoomBuff',
        imageOffset: {
            x: -6
        }
    });
    BuffPage3.addLine({
        text: 'Death of accused unit either heals accusing unit',
        continuation: true
    });
    BuffPage3.addLine({
        text: 'or grants a killing blow block..'
    });

    this.addPage(BuffPage3);

    //default page 2
    var HotkeyPage = new Page({
        title: 'Hotkeys',
        lineBuffer: 40,
        titleLineBuffer: 20
    });
    HotkeyPage.addLineTitle({
        text: 'Alt'
    });
    HotkeyPage.addLine({
        text: 'Display unit health/energy bars. Show item titles.'
    });

    HotkeyPage.addLineTitle({
        text: 'A'
    });
    HotkeyPage.addLine({
        text: 'Attack-move.'
    });

    HotkeyPage.addLineTitle({
        text: 'S'
    });
    HotkeyPage.addLine({
        text: 'Stop.'
    });

    HotkeyPage.addLineTitle({
        text: 'SS or H'
    });
    HotkeyPage.addLine({
        text: 'Hold Position.'
    });

    HotkeyPage.addLineTitle({
        text: 'W'
    });
    HotkeyPage.addLine({
        text: 'Swap aggression/defensive states of mind.'
    });

    HotkeyPage.addLineTitle({
        text: 'C'
    });
    HotkeyPage.addLine({
        text: 'Swap numeric/chart stat view.'
    });

    HotkeyPage.addLineTitle({
        text: 'Tab'
    });
    HotkeyPage.addLine({
        text: 'Cycle focused unit of current selection.'
    });

    HotkeyPage.addLineTitle({
        text: 'Escape'
    });
    HotkeyPage.addLine({
        text: 'Close map/help. Fast forward dialogue.'
    });
    this.addPage(HotkeyPage);
};

HelpMenu.prototype.addPage = function(page) {
    page.index = this.pages.length;
    this.pages.push(page);
};

HelpMenu.prototype.hasNextPage = function(page) {
    return this.pages[this.currentPage.index + 1];
};

HelpMenu.prototype.hasPreviousPage = function(page) {
    return this.pages[this.currentPage.index - 1];
};

HelpMenu.prototype.getNextPage = function() {
    if (this.hasNextPage()) {
        return this.pages[this.currentPage.index + 1];
    } else {
        return null;
    }
};

HelpMenu.prototype.getPreviousPage = function(page) {
    if (this.hasPreviousPage()) {
        return this.pages[this.currentPage.index - 1];
    } else {
        return null;
    }
};

HelpMenu.prototype.updateArrows = function(page) {
    var availableColor = 0x24e705;
    var normalColor = 0xFFFFFF;
    var unAlpha = 0.15;
    if (this.hasNextPage()) {
        this.rightArrow.alpha = 1.0;
        this.rightArrow.tint = availableColor;
        // this.rightArrowBackground.alpha = 1.0;
        // this.rightArrowBackground.addedBorder.alpha = 1.0;
    } else {
        this.rightArrow.alpha = unAlpha;
        this.rightArrow.tint = normalColor;
        // this.rightArrowBackground.alpha = 0.5;
        // this.rightArrowBackground.addedBorder.alpha = 0.5;
    }

    if (this.hasPreviousPage()) {
        this.leftArrow.alpha = 1.0;
        this.leftArrow.tint = availableColor;
        // this.leftArrowBackground.alpha = 1.0;
        // this.leftArrowBackground.addedBorder.alpha = 1.0;
    } else {
        this.leftArrow.alpha = unAlpha;
        this.leftArrow.tint = normalColor;
        // this.leftArrowBackground.alpha = 0.5;
        // this.leftArrowBackground.addedBorder.alpha = 0.5;
    }
};

HelpMenu.prototype.getButton = function() {
    return this.helpButton;
};

HelpMenu.prototype.hideButton = function() {
    graphicsUtils.hideDisplayObject(this.helpButton);
};

HelpMenu.prototype.showButton = function(position) {
    if (position) {
        this.helpButton.position = position;
    }
    graphicsUtils.addOrShowDisplayObject(this.helpButton);
};

HelpMenu.prototype.showMenu = function(index) {
    index = index || 0;
    this.showPage(this.pages[index]);

    // graphicsUtils.addOrShowDisplayObject(this.rightArrowBackground);
    graphicsUtils.addOrShowDisplayObject(this.rightArrow);
    // graphicsUtils.addOrShowDisplayObject(this.leftArrowBackground);
    graphicsUtils.addOrShowDisplayObject(this.leftArrow);
};

HelpMenu.prototype.showPage = function(page) {
    if (!page) {
        return;
    }

    if (this.currentPage) {
        this.currentPage.hide();
    }
    this.currentPage = page;
    this.currentPage.show();
    this.updateArrows();
    globals.currentGame.soundPool.keypressSound.play();
};

HelpMenu.prototype.isVisible = function() {
    return this.currentPage;
};

HelpMenu.prototype.hideMenu = function() {
    this.currentPage.hide();
    this.currentPage = null;
    // graphicsUtils.hideDisplayObject(this.rightArrowBackground);
    graphicsUtils.hideDisplayObject(this.rightArrow);
    // graphicsUtils.hideDisplayObject(this.leftArrowBackground);
    graphicsUtils.hideDisplayObject(this.leftArrow);
};

HelpMenu.prototype.cleanUp = function() {
    graphicsUtils.removeSomethingFromRenderer(this.background);
    graphicsUtils.removeSomethingFromRenderer(this.rightArrow);
    graphicsUtils.removeSomethingFromRenderer(this.leftArrow);
    this.pages.forEach((page) => {
        page.pageObjects.forEach((obj) => {
            graphicsUtils.removeSomethingFromRenderer(obj);
        });
    });
};

export default HelpMenu;
