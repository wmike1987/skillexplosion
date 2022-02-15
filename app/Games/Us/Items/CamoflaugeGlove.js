import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils, unitUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    knifeDamage: 3,
    dodgeAddition: 3,
    ignoreCallback: function(equipped) {
        if(equipped) {
            this.trueKnife = true;
        } else {
            this.trueKnife = false;
        }
    }
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Camoflauge Glove",
        description: ["Add 3 to knife damage.", "Knives ignore armor and cannot be dodged.", "Add 3 to dodge."],
        icon: 'CamoGlove',
    }, options, shaneOnly);
    return new ic(item);
}
