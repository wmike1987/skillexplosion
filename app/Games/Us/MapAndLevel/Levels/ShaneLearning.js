import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js'
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js'
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js'
import Tooltip from '@core/Tooltip.js'
import TileMapper from '@core/TileMapper.js'
import ItemUtils from '@core/Unit/ItemUtils.js'
import Doodad from '@utils/Doodad.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js'
import UnitMenu from '@games/Us/UnitMenu.js'

//Create the air drop base
var shaneLearning = function(options) {
    var enter = gameUtils.getSound('entershanelearn.wav', {volume: .14, rate: 1.0});
    var achieve = gameUtils.getSound('fullheal.wav', {volume: .06, rate: .65});

    this.createTerrainExtension = function(scene) {
        var podDoodad = new Doodad({drawWire: false, collides: true, autoAdd: false, radius: 130, texture: ['LandingPod'], stage: 'stage',
        scale: {x: .6, y: .6}, offset: {x: 0, y: 30}, sortYOffset: 10,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: {x: gameUtils.getCanvasCenter().x-200, y: gameUtils.getPlayableHeight()-500}})
        scene.add(podDoodad);

        this.box = UnitMenu.createUnit('DestructibleBox', this.neutralTeam);
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.box});
        globals.currentGame.addUnit(this.box);
        this.box.position = {x: 750, y: 300};
    }

    this.enterLevel = function() {
        Matter.Events.trigger(globals.currentGame, 'InitCustomLevel', {level: this});
    }

    this.onInitLevel = function(scene) {
        globals.currentGame.setUnit(globals.currentGame.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter()), moveToCenter: false});
        enter.play();
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Mega", delayAfterEnd: 2000})
        var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Shane.", fadeOutAfterDone: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a2 = new Dialogue({actor: "Task", text: "Right click to move shane.", fadeOutAfterDone: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a3 = new Dialogue({actor: "Task", text: "Press 'A' then left click on the box to attack it.", fadeOutAfterDone: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a4 = new Dialogue({actor: "Task", text: "Right click on the item to pick it up.", fadeOutAfterDone: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var a5 = new Dialogue({actor: "Task", text: "Press 'A' then left click near the enemies to attack-move to them.", fadeOutAfterDone: true, backgroundBox: true, letterSpeed: 30, withholdResolve: true});
        var self = this;
        var chain = new DialogueChain([title, a1, a2, a3, a4, a5], {startDelay: 200, done: function() {
            selection.presentChoices({numberOfChoices: 3, possibleChoices: ['SlipperySoup', 'StoutShot', 'Painkiller', 'LifeExtract', 'CoarseBrine', 'ChemicalConcentrate', 'AwarenessTonic']});
            chain.cleanUp();
        }});
        gameUtils.matterOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
            if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Shane') {
                achieve.play();
                gameUtils.doSomethingAfterDuration(() => {
                    a1.withholdResolve = false;

                    gameUtils.matterOnce(globals.currentGame.shane, 'unitMove', (event) => {
                        achieve.play();
                        gameUtils.doSomethingAfterDuration(() => {
                            a2.withholdResolve = false;

                            gameUtils.matterOnce(this.box, 'death',(event) => {
                                achieve.play();
                                gameUtils.doSomethingAfterDuration(() => {
                                    a3.withholdResolve = false;

                                    gameUtils.matterOnce(globals.currentGame.shane, 'pickupItem', (event) => {
                                        achieve.play();
                                        gameUtils.doSomethingAfterDuration(() => {
                                            a4.withholdResolve = false;

                                            gameUtils.matterOnce(globals.currentGame.shane, 'attackMove', (event) => {
                                                achieve.play();
                                                gameUtils.doSomethingAfterDuration(() => {
                                                    a5.withholdResolve = false;
                                                }, 1000);
                                                return true;
                                            }, {conditionalOff: true});
                                        }, 1000);
                                        return true;
                                    }, {conditionalOff: true});
                                }, 1000);
                                return true;
                            }, {conditionalOff: true});
                        }, 1000);
                        return true;
                    }, {conditionalOff: true});
                }, 1000);
                return true;
            }
        }, {conditionalOff: true});
        scene.add(chain);
        scene.addCleanUpTask(() => {
            enter.unload();
        })
        gameUtils.doSomethingAfterDuration(chain.play.bind(chain), 2000);
    }
}
shaneLearning.prototype = levelBase;

export {shaneLearning};
