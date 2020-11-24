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
    this.decoratedAggressionDescription[len-1] = this.decoratedAggressionDescription[len-1] + ' (' + this.aggressionCooldown/1000 + 's cooldown)'

    this.decoratedDefenseDescription = [].concat(this.defenseDescription);
    var len = this.decoratedDefenseDescription.length;
    this.decoratedDefenseDescription[len-1] = this.decoratedDefenseDescription[len-1] + ' (' + this.defenseCooldown/1000 + 's cooldown)'

    //this is the main description used by the config panel (as opposed to the unit panel which strips down the description)
    this.description = this.decoratedAggressionDescription.concat(['Click to activate']).concat([' ']).concat(this.decoratedDefenseDescription.concat(['Ctrl+Click to activate']));
    this.aggressionDescrStyle = [styles.passiveAStyle, styles.abilityText, styles.systemMessageText];
    this.defensiveDescrStyle = [styles.passiveDStyle, styles.abilityText, styles.systemMessageText];
    this.descriptionStyle = this.aggressionDescrStyle.concat([styles.systemMessageText].concat(this.defensiveDescrStyle));

    this.cooldownTimer = null;
    this.start = function(mode) {
        //stop previous
        this.stop();

        //start new
        var cooldown = 0.01;
        if(mode == attackPassive) {
            cooldown = this.aggressionCooldown;
            var f = Matter.Events.on(this.unit, this.aggressionEventName, function(event) {
                if(!this.active || this.inProcess) return;
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
            cooldown = this.defenseCooldown;
            var f = Matter.Events.on(this.unit, this.defenseEventName, function(event) {
                if(!this.active || this.inProcess) return;
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
