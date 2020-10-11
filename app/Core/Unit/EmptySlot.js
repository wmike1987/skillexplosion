import * as $ from 'jquery'
import utils from '@utils/GameUtils.js'
import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {

}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "EMPTY",
        description: [],
        isEmptySlot: true,
    })
};
