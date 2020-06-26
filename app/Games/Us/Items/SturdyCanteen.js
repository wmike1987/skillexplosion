define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        maxHealth: 5,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Sturdy Canteen",
            description: "Add +5 to maximum health.",
            icon: 'SturdyCanteen'
        })
    };
})
