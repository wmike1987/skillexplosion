import * as PIXI from 'pixi.js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import styles from '@utils/Styles.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';

var load = function() {

    //hard-coded important styles
    var importantStyles = [];
    importantStyles.push(styles.statTitleStyle);
    importantStyles.push(styles.statTextStyle);
    importantStyles.push(styles.statDividerStyle);
    importantStyles.push(styles.unitGeneralHPStyle);
    importantStyles.push(styles.unitDamageStyle);
    importantStyles.push(styles.unitDefenseStyle);
    importantStyles.push(styles.unitGritStyle);
    importantStyles.push(styles.unitDodgeStyle);
    importantStyles.push(styles.unitDefenseAdditionsStyle);
    importantStyles.push(styles.unitGeneralEnergyStyle);
    importantStyles.push(styles.adrenalineTextLarge);
    importantStyles.push(styles.rewardTextLarge);
    importantStyles.push(styles.statScreenDefeatTitleStyle);
    importantStyles.push(styles.statScreenVictoryTitleStyle);

    var killMe = [];
    importantStyles.forEach(function(style) {
        var a = graphicsUtils.addSomethingToRenderer("TEX+:a", {style: style});
        killMe.push(a);
    });

    killMe.forEach(function(obj) {
        graphicsUtils.removeSomethingFromRenderer(obj);
    });
};

export default {load: load};
