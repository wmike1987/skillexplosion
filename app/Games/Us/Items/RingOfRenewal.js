import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    healthRegenerationRate: 1,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Ring Of Renewal",
        description: "Regenerate +1 hp per second.",
        icon: 'RingOfWellBeing'
    })
};
