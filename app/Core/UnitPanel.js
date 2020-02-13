define(['jquery', 'utils/GameUtils', 'matter-js', 'utils/Styles', 'core/Tooltip'], function($, utils, Matter, styles, Tooltip) {

    //This module represents a tile map. This is produced by the tile mapper
    var unitPanel = function(options) {
        this.unitSystem = options.systemRef;
        this.position = options.position;
        this.prevailingUnit = null; //the unit in focus
        this.currentPortrait = null;
        this.selectedUnits = [];
        this.currentAbilities = [];
        this.currentCommands = [];

        this.barOffset = 9; //top bar offset;
        this.centerX = utils.getUnitPanelCenter().x;
        this.centerY = utils.getUnitPanelCenter().y + this.barOffset/2;

        //position variables
        this.unitPortraitPosition = {x: this.centerX, y: this.centerY};

        //unit status variables
        this.unitStatSpacing = 26;
        this.unitFrameCenterX = this.centerX - 115;
        this.unitNamePosition = {x: this.unitFrameCenterX, y: this.centerY - this.unitStatSpacing};
        this.unitHealthPosition = {x: this.unitFrameCenterX, y: this.centerY};
        this.unitEnergyPosition = {x: this.unitFrameCenterX, y: this.centerY + this.unitStatSpacing};
        this.unitNameText = utils.addSomethingToRenderer('TEXT: --', {position: this.unitNamePosition, where: 'hudOne', style: styles.unitNameStyle});
        this.unitHealthText = utils.addSomethingToRenderer('TEXT: --', {position: this.unitHealthPosition, where: 'hudOne', style: styles.unitHealthStyle});
        this.unitEnergyText = utils.addSomethingToRenderer('TEXT: --', {position: this.unitEnergyPosition, where: 'hudOne', style: styles.unitEnergyStyle});

        //unit ability variables
        this.abilitySpacing = 77;
        this.abilityOneCenterX = this.centerX + 185
        this.abilityOneCenterY = this.centerY;

        //basic command variables
        this.commandSpacing = 35;
        this.commandOneCenterX = this.centerX + 413;
        this.commandOneCenterY = this.centerY - 25;

        //selected-group variables
        this.wireframeSize = 32;
        this.groupCenterY = this.centerY;
        this.groupCenterX = 0 + 8 + this.wireframeSize/2;
        this.groupSpacing = 8 + this.wireframeSize;

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

        //listen for when the selected group changes
        Matter.Events.on(this.unitSystem, 'executeSelection', function(event) {
            this.updateUnitGroup(event.orderedSelection);
        }.bind(this))

        Matter.Events.on(this.unitSystem, 'unitSystemEventDispatch', function(event) {
            var abilityTint = 0x80ba80;
            $.each(this.prevailingUnit.abilities, function(i, ability) {
                if(ability.key == event.id && ability.type == event.type) {
                    utils.makeSpriteBlinkTint({sprite: ability.icon, tint: abilityTint, speed: 100})
                }
            }.bind(this))

            var commandTint = 0xa2fa93;
            $.each(this.prevailingUnit.commands, function(name, command) {
                if(command.key == event.id && command.type == event.type) {
                    if(name == 'attack') {
                        utils.makeSpriteBlinkTint({sprite: this.attackMoveIcon, tint: commandTint, speed: 100});
                    } else if(name == 'move') {
                        utils.makeSpriteBlinkTint({sprite: this.moveIcon, tint: commandTint, speed: 100})
                    } else if(name == 'stop') {
                        utils.makeSpriteBlinkTint({sprite: this.stopIcon, tint: commandTint, speed: 100})
                    } else if(name == 'holdPosition') {
                        utils.makeSpriteBlinkTint({sprite: this.holdPositionIcon, tint: commandTint, speed: 100})
                    }
                }
            }.bind(this))
        }.bind(this))
    };

    //unit group
    unitPanel.prototype.updateUnitGroup = function(units) {
        this.clearUnitGroup();
        this.selectedUnits = units;
        $.each(this.selectedUnits, function(i, unit) {
            if(unit.wireframe) {
                var wireframe = unit.wireframe;
                if(!wireframe.parent) {
                    utils.addSomethingToRenderer(wireframe, 'hudOne');
                }
                wireframe.position = {x: this.groupCenterX + i * this.groupSpacing, y: this.groupCenterY};
                utils.makeSpriteSize(wireframe, this.wireframeSize);
                wireframe.visible = true;
            }
        }.bind(this))

        this.highlightGroupUnit(this.prevailingUnit);
    };


    unitPanel.prototype.clearUnitGroup = function() {
        $.each(this.selectedUnits, function(i, unit) {
            if(unit.wireframe) {
                unit.wireframe.visible = false;
            }
        })
    };

    unitPanel.prototype.highlightGroupUnit = function(prevailingUnit) {
        $.each(this.selectedUnits, function(i, unit) {
            if(unit == prevailingUnit && unit.wireframe) {
                utils.makeSpriteSize(unit.wireframe, this.wireframeSize*1.6);
            } else {
                utils.makeSpriteSize(unit.wireframe, this.wireframeSize);
            }
        }.bind(this))
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
            this.highlightGroupUnit(unit);
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
        if(!this.prevailingUnit.abilities) return;

        this.currentAbilities = this.prevailingUnit.abilities;

        //place, scale and enable abilility icons
        $.each(this.currentAbilities, function(i, ability) {
            ability.icon.scale = utils.makeSpriteSize(ability.icon, 61);
            ability.icon.position = {x: this.abilityOneCenterX + (this.abilitySpacing * i), y: this.abilityOneCenterY};
            ability.icon.visible = true;
            if(!ability.icon.parent) {
                utils.addSomethingToRenderer(ability.icon, 'hudOne');
                Tooltip.makeTooltippable(ability.icon, ability);
            }
        }.bind(this))
    };

    unitPanel.prototype.displayCommands = function() {
        if(!this.attackMoveIcon) {
            this.moveIcon = utils.addSomethingToRenderer('MoveIcon', 'hudOne', {position: {x: this.commandOneCenterX, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.moveIcon, 25);
            this.currentCommands.push({name: 'attack', icon: this.moveIcon});
            Tooltip.makeTooltippable(this.moveIcon, {title: 'Move', hotkey: 'M', description: "Move to a destination."})

            this.attackMoveIcon = utils.addSomethingToRenderer('AttackIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.attackMoveIcon, 25);
            this.currentCommands.push({name: 'move', icon: this.attackMoveIcon});
            Tooltip.makeTooltippable(this.attackMoveIcon, {title: 'Attack-move', hotkey: 'A', description: "Attack-move to a destination."})

            this.holdPositionIcon = utils.addSomethingToRenderer('HoldPositionIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*2, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.holdPositionIcon, 25);
            this.currentCommands.push({name: 'holdPosition', icon: this.holdPositionIcon});
            Tooltip.makeTooltippable(this.holdPositionIcon, {title: 'Hold Position', hotkey: 'H', description: "Prevent any automatic movement."})

            this.stopIcon = utils.addSomethingToRenderer('StopIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*3, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.stopIcon, 25);
            this.currentCommands.push({name: 'stop', icon: this.stopIcon});
            Tooltip.makeTooltippable(this.stopIcon, {title: 'Stop', hotkey: 'S', description: "Halt current command."})
        } else {
            $.each(this.currentCommands, function(i, command) {
                command.icon.visible = false;
                $.each(this.prevailingUnit.commands, function(j, unitCommand) {
                    if(unitCommand.name == command.name) {
                        command.icon.visible = true;
                    }
                }.bind(this))
            }.bind(this))
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
                command.icon.visible = false;
            })
        }
    };

    unitPanel.prototype.cleanUp = function() {
        currentGame.removeTickCallback(this.updateUnitStatTick);
    };

    return unitPanel;
})
