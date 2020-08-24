define(['usunits/EnemyMarine', 'usunits/Baneling', 'usunits/Critter', 'usunits/AlienGuard', 'usunits/Marine', 'usunits/Medic',
'usunits/Sentinel', 'usunits/Eruptlet'],
function(EnemyMarine, Baneling, Critter, AlienGuard, Marine, Medic, Sentinel, Eruptlet) {

    var unitMenu = {};
    for(let unit of arguments) {
        unitMenu[unit.name] = unit;
    }

    return unitMenu;
})
