import EnemyMarine from '@games/Us/Units/EnemyMarine.js'
import Critter from '@games/Us/Units/Critter.js'
import AlienGuard from '@games/Us/Units/AlienGuard.js'
import Marine from '@games/Us/Units/Marine.js'
import Medic from '@games/Us/Units/Medic.js'
import Sentinel from '@games/Us/Units/Sentinel.js'
import Eruptlet from '@games/Us/Units/Eruptlet.js'

var unitMenu = {};
unitMenu[EnemyMarine.name] = EnemyMarine;
unitMenu[Critter.name] = Critter;
unitMenu[AlienGuard.name] = AlienGuard;
unitMenu[Marine.name] = Marine;
unitMenu[Medic.name] = Medic;
unitMenu[Sentinel.name] = Sentinel;
unitMenu[Eruptlet.name] = Eruptlet;

export default unitMenu;
