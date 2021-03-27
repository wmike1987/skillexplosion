import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Tooltip from '@core/Tooltip.js';
import TileMapper from '@core/TileMapper.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import Doodad from '@utils/Doodad.js';
import {Dialogue, DialogueChain} from '@core/Dialogue.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import UnitMenu from '@games/Us/UnitMenu.js';

//Create the air drop base
var ursulaDialogue = function(options) {
    var title = new Dialogue({blinkLastLetter: false, title: true, text: "Camp Noir", delayAfterEnd: 1750});
    var a1 = new Dialogue({actor: "Shane", text: "Use your mouse to select Shane.", fadeOutAfterDone: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a2 = new Dialogue({actor: "Task", text: "Right click to move shane to the beacon.", fadeOutAfterDone: true, isTask: false, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a3 = new Dialogue({actor: "Task", text: "Press 'A' then left click on the box to attack it.", fadeOutAfterDone: true, isTask: false, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a4 = new Dialogue({actor: "Task", text: "Right click on the item to pick it up.", fadeOutAfterDone: true, isTask: false, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a5 = new Dialogue({actor: "Task", text: "Press 'A' then left click near the enemies to attack-move to them.", fadeOutAfterDone: true, isTask: false, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a6 = new Dialogue({actor: "Task", text: "Press 'D' then left click to perform a dash in that direction.", fadeOutAfterDone: true, isTask: false, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a7 = new Dialogue({actor: "Task", text: "Press 'F' then left click to throw a knife in that direction.", fadeOutAfterDone: true, isTask: false, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
    var a8 = new Dialogue({actor: "Task", text: "Kill a critter by throwing a knife at it.", fadeOutAfterDone: true, backgroundBox: true, isTask: false, letterSpeed: 30, withholdResolve: true});
    this.start = function() {
    };
};

export {ursulaDialogue};
