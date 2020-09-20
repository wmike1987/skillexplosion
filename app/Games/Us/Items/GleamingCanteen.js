import ic from '@core/Unit/ItemConstructor'

var manipulations = {
    maxHealth: 25,
}

export default function() {
    return ic({
        manipulations: manipulations,
        name: "Gleaming Canteen",
        description: "Add +" + manipulations.maxHealth + " to maximum health.",
        icon: 'GleamingCanteen'
    })
};
