define(['usunits/EnemyMarine', 'usunits/Baneling', 'usunits/Critter', 'usunits/AlienGuard', 'usunits/Marine', 'usunits/Medic',
'usunits/Sentinel'],
function(EnemyMarine, Baneling, Critter, AlienGuard, Marine, Medic, Sentinel) {

    var unitMenu = {};
    for(let unit of arguments) {
        unitMenu[unit.name] = unit;
    }

    return unitMenu;
})
