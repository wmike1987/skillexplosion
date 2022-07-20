import ic from '@core/Unit/ItemConstructor.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';
import * as Matter from 'matter-js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';

var dodgeAddition = 6;
var sureDodgeAmount = 2;
var eventName = 'silverDogTagsEvent';

var manipulations = {
    dodgeAddition: dodgeAddition,
    events: {
        killingBlowBlock: {
            callback: function(event) {
                var blockingUnit = event.performingUnit;
                mathArrayUtils.repeatXTimes(() => {
                    blockingUnit.applySureDodgeBuff();
                }, sureDodgeAmount);

                event.sureDodges = 2;
                Matter.Events.trigger(globals.currentGame, eventName, event);
            }
        }
    }
};
export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Silver Dog Tags",
        description: ["Gain two sure-dodges after blocking a killing blow.", "Add 6 to dodge"],
        collector: {
            eventName: eventName,
            collectorFunction: function(event) {
                this.value += event.sureDodges;
            },
            presentation: {
                labels: ["Sure-dodges gained"],
                values: ["value"]
            }
        },
        icon: 'Dogtags1',
    }, options, shaneOnly);
    return new ic(item);
}
