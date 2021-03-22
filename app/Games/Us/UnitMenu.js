import EnemyMarine from '@games/Us/Units/EnemyMarine.js'
import Critter from '@games/Us/Units/Critter.js'
import AlienGuard from '@games/Us/Units/AlienGuard.js'
import Marine from '@games/Us/Units/Marine.js'
import Medic from '@games/Us/Units/Medic.js'
import Sentinel from '@games/Us/Units/Sentinel.js'
import Eruptlet from '@games/Us/Units/Eruptlet.js'
import Gargoyle from '@games/Us/Units/Gargoyle.js'
import Scout from '@games/Us/Units/Scout.js'
import Ghost from '@games/Us/Units/Ghost.js'
import DestructibleBox from '@games/Us/Units/DestructibleBox.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'

var unitMenu = {};
unitMenu['EnemyMarine'] = {c: EnemyMarine, p: 'MarinePortrait'},
unitMenu['Critter'] = {c: Critter, p: 'CritterPortrait'};
unitMenu['AlienGuard'] = {c: AlienGuard, p: 'AlienGuardPortrait'};
unitMenu['Marine'] = {c: Marine, p: 'MarinePortrait'};
unitMenu['Medic'] = {c: Medic, p: 'MedicPortrait'};
unitMenu['Sentinel'] = {c: Sentinel, p: 'SentinelPortrait'};
unitMenu['Eruptlet'] = {c: Eruptlet, p: 'EruptletPortrait'};
unitMenu['Gargoyle'] = {c: Gargoyle, p: 'GargoylePortrait'};
unitMenu['Scout'] = {c: Scout, p: 'GargoylePortrait'};
unitMenu['Ghost'] = {c: Ghost, p: 'GargoylePortrait'};
unitMenu['DestructibleBox'] = {c: DestructibleBox, p: 'GargoylePortrait'};

unitMenu.createUnit = function(constructor, options) {
    var unit = this[constructor].c(options);

    gameUtils.moveUnitOffScreen(unit);
    return unit;
}

export default unitMenu;
