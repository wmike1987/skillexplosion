define(['jquery', 'utils/GameUtils', 'matter-js', 'utils/Styles'], function($, utils, Matter, styles) {

    //This module represents a tile map. This is produced by the tile mapper
    var unitPanel = function(options) {
        this.unitSystem = options.systemRef;
        this.position = options.position;
        this.prevailingUnit = null; //the unit in focus
        this.currentPortrait = null;
        this.selectedFrames = {};
        this.currentAbilities = [];
        this.currentCommands = [];

        this.barOffset = 9; //top bar offset;
        this.centerX = utils.getUnitPanelCenter().x;
        this.centerY = utils.getUnitPanelCenter().y + this.barOffset/2;

        //position variables
        this.unitPortraitPosition = {x: this.centerX, y: this.centerY};

        //unit status variables
        this.unitStatSpacing = 26;
        this.unitFrameCenterX = this.centerX - 108;
        this.unitNamePosition = {x: this.unitFrameCenterX, y: this.centerY - this.unitStatSpacing};
        this.unitHealthPosition = {x: this.unitFrameCenterX, y: this.centerY};
        this.unitEnergyPosition = {x: this.unitFrameCenterX, y: this.centerY + this.unitStatSpacing};
        this.unitNameText = utils.addSomethingToRenderer('TEXT: --', {position: this.unitNamePosition, where: 'hudOne', style: styles.unitNameStyle});
        this.unitHealthText = utils.addSomethingToRenderer('TEXT: --', {position: this.unitHealthPosition, where: 'hudOne', style: styles.unitHealthStyle});
        this.unitEnergyText = utils.addSomethingToRenderer('TEXT: --', {position: this.unitEnergyPosition, where: 'hudOne', style: styles.unitEnergyStyle});

        //unit ability variables
        this.abilitySpacing = 77;
        this.abilityOneCenterX = this.centerX + 169
        this.abilityOneCenterY = this.centerY;

        //basic command variables
        this.commandSpacing = 35;
        this.commandOneCenterX = this.centerX + 397;
        this.commandOneCenterY = this.centerY - 25;

        //create frame
        this.frame = utils.createDisplayObject('UnitPanelFrame', {persists: true, position: this.position});
    };

    unitPanel.prototype.initialize = function(options) {

        //add frame to world
        utils.addSomethingToRenderer(this.frame, 'hud');

        //listen for when the prevailing unit changes
        Matter.Events.on(this.unitSystem, 'prevailingUnitChange', function(event) {
            this.updatePrevailingUnit(event.unit);
        }.bind(this))
    };

    //unit group
    unitPanel.prototype.updateUnitGroup = function(units) {

    };

    unitPanel.prototype.clearUnitGroup = function() {

    };

    unitPanel.prototype.highlightGroupUnit = function() {

    };

    //unit specific display
    unitPanel.prototype.updatePrevailingUnit = function(unit) {

        //flush
        if(this.prevailingUnit)
            this.clearPrevailingUnit();

        //fill
        if(unit) {
            this.prevailingUnit = unit;
            this.displayUnitPortrait();
            this.displayUnitStats();
            this.displayUnitAbilities();
            this.displayCommands();
        }
    };

    unitPanel.prototype.displayUnitPortrait = function() {
        this.currentPortrait = this.prevailingUnit.portrait;

        if(!this.currentPortrait.parent) {
            utils.addSomethingToRenderer(this.currentPortrait, 'hudOne');
        } else {
            this.currentPortrait.visible = true;
        }
        utils.makeSpriteSize(this.currentPortrait, 90);
        this.currentPortrait.position = this.unitPortraitPosition;
    };

    unitPanel.prototype.displayUnitStats = function() {
        //Unit Stats Ticker
        if(!this.updateUnitStatTick) {
            this.updateUnitStatTick = currentGame.addTickCallback(function() {
                if(this.prevailingUnit) {
                    //name
                    this.unitNameText.text = this.prevailingUnit.name;

                    //health
                    this.unitHealthText.text = this.prevailingUnit.currentHealth + "/" + this.prevailingUnit.maxHealth;
                    this.unitHealthText.style.fill = utils.percentAsHexColor(this.prevailingUnit.currentHealth/this.prevailingUnit.maxHealth);

                    //energy
                    this.unitEnergyText.text = this.prevailingUnit.currentEnergy + "/" + this.prevailingUnit.maxEnergy;
                }
            }.bind(this));
        }
    };

    unitPanel.prototype.displayUnitAbilities = function() {
        if(!this.prevailingUnit.abilityInfo) return;

        this.currentAbilities = this.prevailingUnit.abilityInfo;

        //place, scale and enable abilility icons
        $.each(this.currentAbilities, function(i, ability) {
            ability.icon.scale = utils.makeSpriteSize(ability.icon, 61);
            ability.icon.position = {x: this.abilityOneCenterX + (this.abilitySpacing * i), y: this.abilityOneCenterY};
            ability.icon.visible = true;
            if(!ability.icon.parent) {
                utils.addSomethingToRenderer(ability.icon, 'hudOne');
            }
        }.bind(this))
    };

    unitPanel.prototype.displayCommands = function() {
        if(!this.attackMoveIcon) {
            this.moveCommandIcon = utils.addSomethingToRenderer('MoveIcon', 'hudOne', {position: {x: this.commandOneCenterX, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.moveCommandIcon, 25);
            this.currentCommands.push(this.moveCommandIcon);

            this.attackMoveIcon = utils.addSomethingToRenderer('AttackIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.attackMoveIcon, 25);
            this.currentCommands.push(this.attackMoveIcon);

            this.HoldPositionIcon = utils.addSomethingToRenderer('HoldPositionIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*2, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.HoldPositionIcon, 25);
            this.currentCommands.push(this.HoldPositionIcon);

            this.stopIcon = utils.addSomethingToRenderer('StopIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*3, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.stopIcon, 25);
            this.currentCommands.push(this.stopIcon);
        } else {
            $.each(this.currentCommands, function(i, command) {
                command.visible = true;
            })
        }
    };

    unitPanel.prototype.clearPrevailingUnit = function(unit) {
        this.prevailingUnit = null;

        //turn off portrait
        this.currentPortrait.visible = false;

        //blank out unit stat panel
        this.unitNameText.text = '--';
        this.unitHealthText.style.fill = "#2EA003";
        this.unitHealthText.text = '--';
        this.unitEnergyText.text = '--';

        //clear unit ability icons
        if(this.currentAbilities) {
            $.each(this.currentAbilities, function(i, ability) {
                ability.icon.visible = false;
            })
        }
        this.currentAbilities = null;

        //clear commands
        if(this.currentCommands) {
            $.each(this.currentCommands, function(i, command) {
                command.visible = false;
            })
        }
    };

    unitPanel.prototype.cleanUp = function() {
        currentGame.removeTickCallback(this.updateUnitStatTick);
        Matter.Events.off(this);
    };

    return unitPanel;
})
