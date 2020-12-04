import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import styles from '@utils/Styles.js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'
import * as Matter from 'matter-js'

var attackPassive = 'attackPassive';
var defensePassive = 'defensePassive';

export default function(options) {
    Object.assign(this, options);

    //Automate some of the panel tooltip text
    this.decoratedAggressionDescription = [].concat(this.aggressionDescription);
    var len = this.decoratedAggressionDescription.length;
    var aggCooldown = this.aggressionCooldown/1000 + ' second cooldown';

    this.decoratedDefenseDescription = [].concat(this.defenseDescription);
    var len = this.decoratedDefenseDescription.length;
    var defCooldown = this.defenseCooldown/1000 + ' second cooldown';

    //this is the main description used by the config panel (as opposed to the unit panel which strips down the description)
    this.description = this.decoratedAggressionDescription.concat([aggCooldown]).concat(['Click to activate'])
                        .concat([' ']).concat(this.decoratedDefenseDescription.concat([defCooldown])).concat(['Ctrl+Click to activate']);
    this.aggressionDescrStyle = options.aggressionDescStyle || [styles.passiveAStyle, styles.abilityText, styles.cooldownText, styles.systemMessageText];
    this.defensiveDescrStyle = options.defensiveDescrStyle || [styles.passiveDStyle, styles.abilityText, styles.cooldownText, styles.systemMessageText];
    this.descriptionStyle = this.aggressionDescrStyle.concat([styles.systemMessageText].concat(this.defensiveDescrStyle));
    this.systemMessage = options.passiveSystemMessage;

    this.cooldownTimer = null;
    this.start = function(mode) {
        //stop previous
        this.stop();

        if(this.preStart) {
            this.preStart(mode);
        }

        //start new
        var cooldown = 0.01;
        if(mode == attackPassive) {
            if(!this.aggressionAction) return;
            cooldown = this.aggressionCooldown;
            var f = Matter.Events.on(this.unit, this.aggressionEventName, function(event) {
                if(!this.active || this.inProcess) return;
                if(this.aggressionPredicate && !this.aggressionPredicate(event)) {
                    return;
                }
                this.inProcess = true;
                this.newCharge = false; //indicates to the unit panel that the charge has been used
                this.aggressionAction(event);
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'attackPassiveActivated', {duration: this.aggressionDuration || 32});
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false;
                    this.inProcess = false;
                }.bind(this), this.aggressionDuration);
            }.bind(this));
            this.clearListener = function() {
                Matter.Events.off(this.unit, this.aggressionEventName, f);
            }
        } else if(mode == defensePassive) {
            if(!this.defenseAction) return;
            cooldown = this.defenseCooldown;
            var f = Matter.Events.on(this.unit, this.defenseEventName, function(event) {
                if(!this.active || this.inProcess) return;
                if(this.defensePredicate && !this.defensePredicate(event)) {
                    return;
                }
                this.inProcess = true;
                this.newCharge = false; //indicates to the unit panel that the charge has been used
                this.defenseAction(event);
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'defensePassiveActivated', {duration: this.defenseDuration || 32});
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false
                    this.inProcess = false;
                }.bind(this), this.defenseDuration);
            }.bind(this));
            this.clearListener = function() {
                Matter.Events.off(this.unit, this.defenseEventName, f);
            }
        }
        var progress = 0;
        var timerIncrement = 32;
        this.coolDownMeterPercent = 0;
        this.cooldownTimer = globals.currentGame.addTimer({
            name: 'cooldownMeter-' + this.title,
            gogogo: true,
            timeLimit: timerIncrement,
            callback: function() {
                if(this.active) return;
                this.newCharge = true;
                progress += timerIncrement;
                this.coolDownMeterPercent = Math.min(1, progress/cooldown);
                if(this.coolDownMeterPercent == 1) {
                    this.active = true;
                    progress = 0;
                }
            }.bind(this)
        })

        gameUtils.deathPact(this, this.cooldownTimer, 'cooldownTimer');
    }

    this.stop = function() {
        if(this.preStop) {
            this.preStop();
        }
        this.active = false;
        this.inProcess = false;
        if(this.clearListener) {
            this.clearListener();
        }
        globals.currentGame.invalidateTimer(this.cooldownTimer);
    }

    this.addSlave = function(...slaves) {
        slaves.forEach((sl) => {
            gameUtils.deathPact(this, sl);
        })
    }
}
