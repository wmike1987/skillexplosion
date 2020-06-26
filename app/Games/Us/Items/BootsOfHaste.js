define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var manipulations = {
        moveSpeed: .2,
    }

    return function() {
        return ic({
            manipulations: manipulations,
            name: "Boots Of Haste",
            description: "Increase movement speed.",
            icon: 'BootsOfHaste'
        })
    };
})
