import * as $ from 'jquery'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import ic from '@core/Unit/ItemConstructor.js'

var manipulations = {

}

export default function(title, description) {
    return ic({
        manipulations: manipulations,
        title: title,
        name: "EMPTY",
        description: [description],
        isEmptySlot: true,
    })
};
