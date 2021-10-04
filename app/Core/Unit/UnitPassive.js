import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import styles from '@utils/Styles.js';
import {
    globals,
    keyStates,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';
import Tooltip from '@core/Tooltip.js';

var attackPassive = 'attackPassive';
var defensePassive = 'defensePassive';

export default function(options) {
    Object.assign(this, options);
    this.isEquipped = false;

    //Automate some of the panel tooltip text
    this.decoratedAggressionDescription = [].concat(this.aggressionDescription);
    var aggCooldown = this.aggressionCooldown / 1000 + ' second cooldown';

    this.decoratedDefenseDescription = [].concat(this.defenseDescription);
    var defCooldown = this.defenseCooldown / 1000 + ' second cooldown';

    this.decoratedPassiveDescription = [].concat(this.unequippedDescription);

    //this is the main description used by the config panel (as opposed to the unit panel which strips down the description)
    this.descriptions = this.decoratedAggressionDescription.concat([aggCooldown])
        .concat([' ']).concat(this.decoratedDefenseDescription.concat([defCooldown]).concat([' ']).concat(this.decoratedPassiveDescription));

    this.aggressionDescrStyle = options.aggressionDescStyle || [styles.passiveAStyle, styles.abilityText, styles.cooldownText];
    this.defensiveDescrStyle = options.defensiveDescrStyle || [styles.passiveDStyle, styles.abilityText, styles.cooldownText];
    this.passiveDescrStyle = [styles.passivePStyle, styles.abilityTextFaded];
    this.descriptionStyle = this.aggressionDescrStyle.concat([styles.systemMessageText]).concat(this.defensiveDescrStyle).
    concat([styles.systemMessageText]).concat(this.passiveDescrStyle);
    this.systemMessage = options.passiveSystemMessage;

    var setTooltip = function(eventName, options) {
        options = options || {};
        var agressionActive = this.attackPassive ? 'Active' : 'Click to activate';
        var defensiveActive = this.defensePassive ? 'Active' : 'Ctrl+Click to activate';
        var activeOrInactive = this.defensePassive || this.attackPassive ? "Inactive" : "Active";
        this.descriptions = this.decoratedAggressionDescription.concat([aggCooldown]).concat([agressionActive])
            .concat([' ']).concat(this.decoratedDefenseDescription.concat([defCooldown])).concat([defensiveActive])
            .concat([' '].concat(this.decoratedPassiveDescription).concat([activeOrInactive]));
        this.aggressionDescrStyle = options.aggressionDescStyle || [styles.passiveAStyle, styles.abilityText, styles.cooldownText, styles.systemMessageText];
        this.defensiveDescrStyle = options.defensiveDescrStyle || [styles.passiveDStyle, styles.abilityText, styles.cooldownText, styles.systemMessageText];
        this.passiveDescrStyle = [styles.passivePStyle, styles.abilityTextFaded, styles.systemMessageText];
        this.descriptionStyle = this.aggressionDescrStyle.concat([styles.systemMessageText]).concat(this.defensiveDescrStyle).concat([styles.systemMessageText]).concat(this.passiveDescrStyle);
        this.systemMessage = options.passiveSystemMessage;
        Tooltip.makeTooltippable(this.actionBox, this);

        var showTooltip = !this.unit.swappingStatesOfMind && (eventName != 'Unequip' || options.manual);

        if (showTooltip) {
            this.actionBox.tooltipObj.display(mousePosition);
        }
    }.bind(this);

    Matter.Events.on(this, 'unlockedSomething', function(event) {
        this.unlocked = true;
        setTooltip("Unlock");
    }.bind(this));

    Matter.Events.on(this, 'Equip', function(event) {
        setTooltip("Equip", event.type);
    }.bind(this));

    Matter.Events.on(this, 'Unequip', function(event) {
        setTooltip("Unequip", {
            manual: event.manual
        });
    }.bind(this));

    Matter.Events.on(globals.currentGame, 'EnterLevel', function(event) {
        if (!this.isEquipped && event.level.isLevelNonConfigurable() && this.unlocked) {
            var order = ++this.unit.passiveOrder;
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
                graphicsUtils.floatSprite(iconUp, {
                    direction: 1,
                    runs: 50
                });
                graphicsUtils.floatSprite(border, {
                    direction: 1,
                    runs: 50
                });
                if (this.passiveAction) {
                    this.passiveAction();
                }
            }, 1800 + order * 750);
        }
    }.bind(this));

    this.cooldownTimer = null;
    this.start = function(mode) {
        //stop previous
        this.stop();

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
                this.aggressionAction(event);
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'attackPassiveActivated', {
                    duration: this.aggressionDuration || 32
                });
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false;
                    this.inProcess = false;
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
                this.defenseAction(event);
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'defensePassiveActivated', {
                    duration: this.defenseDuration || 32
                });
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false;
                    this.inProcess = false;
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
                if (this.active) return;
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

    this.stop = function() {
        if (this.preStop) {
            this.preStop();
        }
        this.active = false;
        this.inProcess = false;
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
