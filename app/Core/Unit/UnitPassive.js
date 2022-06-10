import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils,
    unitUtils
} from '@utils/UtilityMenu.js';
import styles from '@utils/Styles.js';
import {
    globals,
    keyStates,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';
import Tooltip from '@core/Tooltip.js';
import {
    CustomCollector
} from '@games/Us/StatCollector.js';

var attackPassive = 'attackPassive';
var defensePassive = 'defensePassive';
var unequippedPassive = 'unequippedPassive';

export default function(options) {
    Object.assign(this, options);
    this.isEquipped = false;
    this.canUpgrade = 2;
    this.customTitleBuffer = 5;
    this.titleExtension = ' - Lv. 1';
    this.originalTitle = this.title;

    //Automate some of the panel tooltip text
    this.renewTooltipAttributes = function() {
        this.decoratedAggressionDescription = [].concat(this.getAggressionDescription());
        this.aggCooldownText = this.aggressionCooldown / 1000 + ' second cooldown';

        this.decoratedDefenseDescription = [].concat(this.getDefenseDescription());
        this.defCooldownText = this.defenseCooldown / 1000 + ' second cooldown';

        this.decoratedPassiveDescription = [].concat(this.getUnequippedDescription());

        //this is the main description used by the config panel (as opposed to the unit panel which strips down the description)
        this.descriptions = this.decoratedPassiveDescription.concat([' '])
        .concat(this.decoratedAggressionDescription.concat([' ']))
        .concat(this.decoratedDefenseDescription);

        this.aggressionDescrStyle = options.aggressionDescStyle || [styles.passiveAStyle, styles.passiveMultiTextStyle];
        this.defensiveDescrStyle = options.defensiveDescrStyle || [styles.passiveDStyle, styles.passiveMultiTextStyle];
        this.passiveDescrStyle = [styles.passivePStyle, styles.passiveMultiTextStyle];
        this.descriptionStyle = this.passiveDescrStyle.concat([styles.systemMessageText])
        .concat(this.aggressionDescrStyle.concat([styles.systemMessageText]))
        .concat(this.defensiveDescrStyle);
        this.systemMessage = options.passiveSystemMessage;
        this.title = this.originalTitle + this.titleExtension;
    };

    var setTooltip = function(eventName, options) {
        options = options || {};
        this.renewTooltipAttributes();
        var aggressionActive = this.attackPassive ? ('Active - ' + this.aggCooldownText) : 'Inactive - Click to activate';
        var defensiveActive = this.defensePassive ? ('Active - ' + this.defCooldownText) : 'Inactive - Ctrl+Click to activate';
        this.descriptions = this.decoratedPassiveDescription.concat([' ']).concat(this.decoratedAggressionDescription.concat([aggressionActive])
            .concat([' ']).concat(this.decoratedDefenseDescription).concat([defensiveActive]));

        this.aggressionDescrStyle = options.aggressionDescStyle || [styles.passiveAStyle, styles.passiveMultiTextStyle, this.attackPassive ? styles.systemMessageText : styles.systemMessageTextWhite];
        this.defensiveDescrStyle = options.defensiveDescrStyle || [styles.passiveDStyle, styles.passiveMultiTextStyle, this.defensePassive ? styles.systemMessageText : styles.systemMessageTextWhite];
        this.passiveDescrStyle = [styles.passivePStyle, styles.passiveMultiTextStyle];
        this.descriptionStyle = this.passiveDescrStyle.concat([styles.systemMessageText]
            .concat(this.aggressionDescrStyle)
            .concat([styles.systemMessageText])
            .concat(this.defensiveDescrStyle));
        this.systemMessage = options.passiveSystemMessage;

        var newTint = 0x005518;
        if (this.attackPassive) {
            newTint = 0x9f2222;
        } else if (this.defensePassive) {
            newTint = 0x2467b6;
        }
        this.borderTint = newTint;

        //if we're in the process of reequiping, aka unequipping by equipping a passive to the other mode, avoid retooltipping here since
        //the subsequent equip will handle it
        if (options.reequipping) {
            return;
        }

        var tooltipPosition = mousePosition;
        if (this.actionBox.tooltipObj && this.actionBox.tooltipObj.position) {
            tooltipPosition = this.actionBox.tooltipObj.position;
        }

        Tooltip.makeTooltippable(this.actionBox, this);

        var showTooltip = !this.unit.swappingStatesOfMind && (eventName != 'Unequip' || options.manual) && !options.preventTooltipShow;

        if (showTooltip) {
            this.actionBox.tooltipObj.display(tooltipPosition);
        }
    }.bind(this);

    this.upgradeWrapper = function() {
        //call upgrade
        this.upgrade();

        //lower cooldowns
        this.aggressionCooldown -= 500;
        this.defenseCooldown -= 500;
        this.canUpgrade -= 1;
        if(this.canUpgrade == 1) {
            this.titleExtension = ' - Lv. 2';
        } else if(this.canUpgrade == 0) {
            this.titleExtension = ' - Mastered';
        }

        //reset the tooltip
        setTooltip();

        //trigger a refresh of the panel
        this.start(this.activeMode);
        Matter.Events.trigger(globals.currentGame.unitSystem, 'unitPassiveRefresh', {});
    }.bind(this);

    Matter.Events.on(this, 'unlockedSomething', function(event) {
        if(event.id == 'mindMaster') {
            this.upgradeWrapper();
            return;
        }

        this.unlocked = true;
        setTooltip("Unlock", {
            preventTooltipShow: true
        });

        //register the collector
        this.collectorEventName = this.originalTitle.replace(/\s+/g, '') + 'Collector';
        this.customCollector = new CustomCollector(Object.assign({
            eventName: this.collectorEventName,
            priority: 25,
            init: function() {
                this.attackPassive = 0;
                this.defensePassive = 0;
                this.presentation.variableLabels = ["none", "none"];
                if (this._init) {
                    this._init();
                }
            },
            canPresent: function() {
                return !(this.presentation.variableLabels[0] == "none" && this.presentation.variableLabels[1] == "none");
            },
            presentation: {
                tint: 0xbf0a81,
                iconTextureName: this.textureName,
                labels: ["active placeholder", 'defense placeholder'],
                values: [attackPassive, defensePassive],
                formats: [null, null],
                suffixes: ["", ""]
            },
            collectorFunction: function(event) {
                if (this.attackCollectorFunction && event.mode == attackPassive) {
                    this.attackCollectorFunction(event.collectorPayload.value);
                } else if (this.defenseCollectorFunction && event.mode == defensePassive) {
                    this.defenseCollectorFunction(event.collectorPayload.value);
                } else {
                    this[event.mode] += event.collectorPayload.value;
                }
            },
            entity: {
                name: this.title.replace(/\s+/g, '')
            }
        }, this.collector));

        //propagate active/passive labels onto the collector
        if (this.collector.aggressionLabel) {
            this.customCollector.presentation.labels[0] = this.collector.aggressionLabel;
        }

        if (this.collector.defensiveLabel) {
            this.customCollector.presentation.labels[1] = this.collector.defensiveLabel;
        }

        if (this.collector.aggressionSuffix) {
            this.customCollector.presentation.suffixes[0] = this.collector.aggressionSuffix;
        }

        if (this.collector.aggressionFormat) {
            this.customCollector.presentation.formats[0] = this.collector.aggressionFormat;
        }

        if (this.collector.defensiveSuffix) {
            this.customCollector.presentation.suffixes[1] = this.collector.defensiveSuffix;
        }

        if (this.collector.defensiveFormat) {
            this.customCollector.presentation.formats[1] = this.collector.defensiveFormat;
        }

        if (this.collector._init) {
            this.customCollector._init = this.collector._init;
        }

        if (this.collector._onStop) {
            this.customCollector.onStop = this.collector._onStop;
        }

        if (this.collector.attackCollectorFunction) {
            this.customCollector.attackCollectorFunction = this.collector.attackCollectorFunction;
        }

        if (this.collector.defenseCollectorFunction) {
            this.customCollector.defenseCollectorFunction = this.collector.defenseCollectorFunction;
        }

        if(this.collector.collectorManipulator) {
            this.collector.collectorManipulator(this.customCollector);
        }

        this.unit.statCollector.registerCustomCollector(this.customCollector);
    }.bind(this));

    Matter.Events.on(this, 'Equip', function(event) {
        setTooltip("Equip", event.type);
    }.bind(this));

    Matter.Events.on(this, 'Unequip', function(event) {
        setTooltip("Unequip", {
            manual: event.manual,
            reequipping: event.reequipping
        });
    }.bind(this));

    Matter.Events.on(globals.currentGame, 'NewCollectorStarted', function(event) {
        if (!this.activeMode) {
            return;
        }

        var collector = event.newCollectorManager.getCustomCollector(this.customCollector.name);
        if (!collector) {
            return;
        }

        if(collector.presentation.customVariableLabels) {
            collector.presentation.customVariableLabels(this.activeMode == attackPassive, collector);
        } else if (this.activeMode == attackPassive) {
            collector.presentation.variableLabels[0] = this.customCollector.presentation.labels[0];
        } else {
            collector.presentation.variableLabels[1] = this.customCollector.presentation.labels[1];
        }
    }.bind(this));

    Matter.Events.on(globals.currentGame, 'EnterLevel MultiLevelCampComplete', function(event) {
        if ( /*!this.isEquipped &&*/ event.level.isBattleLevel() && this.unlocked) {
            var order = ++this.unit.passiveOrder;
            var timingOffset = this.unit.passiveOffset || 0;
            gameUtils.doSomethingAfterDuration(() => {
                var iconUp = graphicsUtils.addSomethingToRenderer(this.textureName, {
                    where: 'stageTwo',
                    position: mathArrayUtils.clonePosition(this.unit.position)
                });
                graphicsUtils.makeSpriteSize(iconUp, {
                    x: 25,
                    y: 25
                });
                var border = graphicsUtils.addBorderToSprite({
                    sprite: iconUp
                });
                gameUtils.attachSomethingToBody({
                    something: iconUp,
                    body: this.unit.body
                });
                gameUtils.attachSomethingToBody({
                    something: border,
                    body: this.unit.body
                });
                graphicsUtils.floatSpriteNew(iconUp,
                    {x: 0, y: 0}, {
                    duration: 1750,
                    stationary: true
                });
                if (this.passiveAction) {
                    this.passiveAction();
                    globals.currentGame.soundPool.softBeep.play();
                    // Matter.Events.trigger(globals.currentGame, this.collectorEventName, {mode: unequippedPassive});
                }
            }, 500 + timingOffset + (order * 1450));
        }
    }.bind(this));

    this.cooldownTimer = null;

    this.start = function(mode) {
        //stop previous
        this.stop();
        this.activeMode = mode;

        //if we've started the passive, enable the collector
        if (this.unit.statCollector.isCollecting()) {
            var customCollector = this.unit.statCollector.currentCollectorManager.getCustomCollector(this.customCollector.name);

            if(customCollector.presentation.customVariableLabels) {
                customCollector.presentation.customVariableLabels(mode == attackPassive, customCollector);
            } else if (mode == attackPassive) {
                customCollector.presentation.variableLabels[0] = this.customCollector.presentation.labels[0];
            } else {
                customCollector.presentation.variableLabels[1] = this.customCollector.presentation.labels[1];
            }
        }

        if (this.preStart) {
            this.preStart(mode);
        }

        //start new
        var cooldown = 0.01;
        if (mode == attackPassive) {
            if (!this.aggressionAction) return;
            cooldown = this.aggressionCooldown;
            let f = Matter.Events.on(this.unit, this.aggressionEventName, function(event) {
                if (!this.active || this.inProcess) return;
                if (this.aggressionPredicate && !this.aggressionPredicate(event)) {
                    return;
                }
                this.inProcess = true;
                this.newCharge = false; //indicates to the unit panel that the charge has been used
                var collectorPayload = this.aggressionAction(event) || {
                    value: 0
                };
                Matter.Events.trigger(globals.currentGame, this.collectorEventName, {
                    mode: mode,
                    collectorPayload: collectorPayload
                });
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'attackPassiveActivated', {
                    duration: this.aggressionDuration || 32
                });
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false;
                    this.inProcess = false;
                    if (this.aggressionStopAction) {
                        this.aggressionStopAction();
                    }
                }.bind(this), this.aggressionDuration);
            }.bind(this));
            this.clearListener = function() {
                Matter.Events.off(this.unit, this.aggressionEventName, f);
            };
        } else if (mode == defensePassive) {
            if (!this.defenseAction) return;
            cooldown = this.defenseCooldown;
            let f = Matter.Events.on(this.unit, this.defenseEventName, function(event) {
                if (!this.active || this.inProcess) return;
                if (this.defensePredicate && !this.defensePredicate(event)) {
                    return;
                }
                this.inProcess = true;
                this.newCharge = false; //indicates to the unit panel that the charge has been used
                var collectorPayload = this.defenseAction(event) || {
                    value: 0
                };
                Matter.Events.trigger(globals.currentGame, this.collectorEventName, {
                    mode: mode,
                    collectorPayload: collectorPayload
                });
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'defensePassiveActivated', {
                    duration: this.defenseDuration || 32
                });
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false;
                    this.inProcess = false;
                    if (this.defenseStopAction) {
                        this.defenseStopAction();
                    }
                }.bind(this), this.defenseDuration);
            }.bind(this));
            this.clearListener = function() {
                Matter.Events.off(this.unit, this.defenseEventName, f);
            };
        }
        var progress = 0;
        this.coolDownMeterPercent = 0;
        this.cooldownTimer = globals.currentGame.addTimer({
            name: 'cooldownMeter-' + this.title,
            gogogo: true,
            timeLimit: 1,
            tickCallback: function(deltaTime) {
                if (this.active) {
                    return;
                }

                this.newCharge = true;
                progress += deltaTime;
                this.coolDownMeterPercent = Math.min(1, progress / cooldown);
                if (this.coolDownMeterPercent == 1) {
                    Matter.Events.trigger(this.unit, mode + 'Charged', {
                        passive: this
                    });
                    this.active = true;
                    progress = 0;
                }
            }.bind(this)
        });

        gameUtils.deathPact(this, this.cooldownTimer, 'cooldownTimer');
    };

    this.createAttackCollectorEvent = function(options) {
        let value = options.value;
        let predicate = options.predicate || function() {
            return true;
        };

        if (predicate.call(this)) {
            Matter.Events.trigger(globals.currentGame, this.collectorEventName, {
                mode: attackPassive,
                collectorPayload: {
                    value: value
                }
            });
        }
    };

    this.createDefenseCollectorEvent = function(options) {
        let value = options.value;
        let predicate = options.predicate || function() {
            return true;
        };

        if (predicate.call(this)) {
            Matter.Events.trigger(globals.currentGame, this.collectorEventName, {
                mode: defensePassive,
                collectorPayload: {
                    value: value
                }
            });
        }
    };

    this.stop = function() {
        if (this.preStop) {
            this.preStop();
        }
        this.active = false;
        this.inProcess = false;
        this.activeMode = null;
        if (this.defenseStopAction) {
            this.defenseStopAction();
        }
        if (this.aggressionStopAction) {
            this.aggressionStopAction();
        }
        if (this.clearListener) {
            this.clearListener();
        }
        globals.currentGame.invalidateTimer(this.cooldownTimer);
    };

    this.addSlave = function(...slaves) {
        slaves.forEach((sl) => {
            gameUtils.deathPact(this, sl);
        });
    };
}
