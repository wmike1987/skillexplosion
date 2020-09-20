import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    moveSpeed: .2,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Boots Of Haste",
        description: "Increase movement speed.",
        icon: 'BootsOfHaste'
    })
};
