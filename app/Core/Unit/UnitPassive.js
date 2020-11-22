import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import styles from '@utils/Styles.js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'
import * as Matter from 'matter-js'

var attackPassive = 'attackPassive';
var defensePassive = 'defensePassive';

export default function(options) {
    Object.assign(this, options);

    //Manage tooltip options
    this.descriptionStyle = [styles.passiveDStyle, styles.abilityText, styles.systemMessageText, styles.systemMessageText, styles.passiveAStyle, styles.abilityText, styles.systemMessageText];

    this.cooldownTimer = null;
    this.start = function(mode) {
        //stop previous
        this.stop();

        //start new
        if(mode == attackPassive) {
            var f = Matter.Events.on(this.unit, this.aggressionEventName, function(event) {
                if(!this.active || this.inProcess) return;
                this.inProcess = true;
                this.newCharge = false; //indicates to the unit panel that the charge has been used
                this.aggressionAction(event);
                Matter.Events.trigger(globals.currentGame.unitSystem.unitPanel, 'attackPassiveActivated', {duration: this.attackDuration || 32});
                gameUtils.doSomethingAfterDuration(function() {
                    this.active = false;
                    this.inProcess = false;
                }.bind(this), this.agressionDuration);
            }.bind(this));
            this.clearListener = function() {
                Matter.Events.off(this.unit, this.aggressionEventName, f);
            }
        } else if(mode == defensePassive) {
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
                this.coolDownMeterPercent = Math.min(1, progress/this.cooldown);
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
