define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxHealth: 10,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Jewel Of Life",
            description: "Add +10 to maximum health.",
            icon: 'JewelOfLife'
        })
    };
})
