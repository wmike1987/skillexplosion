define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        unit.moveSpeed += .2;
    };

    var unequip = function(unit) {
        unit.moveSpeed -= .2;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Boots Of Haste",
            description: "Increase movement speed.",
            icon: 'BootsOfHaste'
        })
    };
})
