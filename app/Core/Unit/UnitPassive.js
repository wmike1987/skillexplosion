import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import styles from '@utils/Styles.js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'

export default function(options) {
    Object.assign(this, options);

    this.slaves = [];

    //Manage tooltip options
    this.descriptionStyle = [styles.passiveDStyle, styles.abilityText, styles.systemMessageText, styles.systemMessageText, styles.passiveAStyle, styles.abilityText, styles.systemMessageText];

    this.cooldownTimer = null;
    this.start = function() {
        // this.cooldownTimer = globals.currentGame.addTimer({
        //     name: 'cooldown-' + this.title + self.unitId,
        //     runs: 1,
        //     timeLimit: 280,
        //     callback: function() {
        //         if(self.commandQueue.getCurrentCommand().id == commandObj.command.id) {
        //             //only stop if we're still on the current dash command
        //             self.stop();
        //         }
        //         commandObj.command.done();
        //     }
        // })
    }

    this.stop = function() {
        globals.currentGame.invalidateTimer(this.cooldownTimer);
    }

    this.addSlave = function(...slaves) {
        slaves.forEach((sl) => {
            this.slaves.push(sl);
        })
    }
}
