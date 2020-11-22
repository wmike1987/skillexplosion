import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import styles from '@utils/Styles.js'

export default function(options) {
    Object.assign(this, options);

    this.costs = [];
    this.disables = {};

    //Manage tooltip options
    this.descriptionStyle = [styles.passiveDStyle, styles.abilityText, styles.systemMessageText, styles.systemMessageText, styles.passiveAStyle, styles.abilityText, styles.systemMessageText];
}
