define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {

    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "EMPTY",
            description: [],
            isEmptySlot: true,
        })
    };
})
