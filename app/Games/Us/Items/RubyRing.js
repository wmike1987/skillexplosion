import ic from '@core/Unit/ItemConstructor.js';
import * as Matter from 'matter-js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';
import {shaneOnly, ursulaOnly} from '@games/Us/Items/SpecialtyValues.js';

var manipulations = {
    healthRegenerationRate: 1,
    condemnedLifeGain: 10,
    maxHealth: 10
};

export default function(options) {
    var item = Object.assign({
        manipulations: manipulations,
        name: "Ruby Ring",
        description: ["Add 10 to max health.", "Regenerate +1 hp per second.", "Add 10 to life gained from killing a condemned enemy."],
        icon: 'RubyRing',
        type: 'Medic',
        fontType: 'ursula'
    }, options, ursulaOnly);
    return new ic(item);
}
