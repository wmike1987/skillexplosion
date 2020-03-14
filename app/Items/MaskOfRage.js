define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        damage: 5,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Mask Of Rage",
            description: "Add +5 to base damage.",
            icon: 'MaskOfRage'
        })
    };
})
