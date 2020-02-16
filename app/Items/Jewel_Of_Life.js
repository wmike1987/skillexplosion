define(['jquery', 'utils/GameUtils', 'unitcore/ItemConstructor'], function($, utils, ic) {

    var equip = function(unit) {
        unit.maxHealth += 10;
    };

    var unequip = function(unit) {
        unit.maxHealth -= 10;
    };

    return function() {
        return ic({
            equip: equip,
            unequip: unequip,
            name: "Jewel Of Life",
            description: "Add 10 to maximum health.",
            icon: 'JewelOfLife'
        })
    };
})
