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

var shaneLearning = function(options) {
    var enter = gameUtils.getSound('entershanelearn.wav', {volume: 0.14, rate: 1.0});
    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});
    var podPosition = {x: gameUtils.getCanvasCenter().x-200, y: gameUtils.getPlayableHeight()-500};

    this.initExtension = function() {
        this.completeUponEntry = true;
        this.mode = this.possibleModes.CUSTOM;
        this.ornamentNoZones = {center: podPosition, radius: 250};
    };

    this.fillLevelSceneExtension = function(scene) {
        var podDoodad = new Doodad({drawWire: false, autoAdd: false, radius: 130, texture: ['LandingPod'], stage: 'stage',
        scale: {x: 0.6, y: 0.6}, bodyScale: {y: 0.65}, offset: {x: 0, y: 30}, sortYOffset: 10,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: podPosition});
        scene.add(podDoodad);

        this.box = UnitMenu.createUnit('DestructibleBox', {team: this.neutralTeam, isTargetable: false});
        ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["RingOfThought"], unit: this.box, immortal: true});
        globals.currentGame.addUnit(this.box);
        this.box.position = {x: 750, y: 300};

        this.createMapTable(scene, {position: mathArrayUtils.clonePosition(podDoodad.body.position, {x: -80, y: 100})});

        var flameSpeed = 0.20;
        var flameVariation = 0.05;
        var fadeTime = 30000;
        var fadeTimeVariation = 60000;
        var flpos = mathArrayUtils.clonePosition(podPosition, {x: 300, y: 0});
        //play animation
        var flameAnim1 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_1',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flameAnim1.sortYOffset = 100;
        flameAnim1.position = flpos;
        flameAnim1.play();
        flameAnim1.myName = 'mike';
        graphicsUtils.fadeSpriteOverTime(flameAnim1, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim1);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 100, y: 50});
        //play animation
        var flameAnim2 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_2',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.75, 0.75]
        });
        flameAnim2.sortYOffset = 75;
        flameAnim2.position = flpos;
        flameAnim2.play();
        graphicsUtils.fadeSpriteOverTime(flameAnim2, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim2);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 200, y: -30});
        //play animation
        var flameAnim3 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_3',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.5, 0.5]
        });
        flameAnim3.sortYOffset = 50;
        flameAnim3.position = flpos;
        flameAnim3.play();
        graphicsUtils.fadeSpriteOverTime(flameAnim3, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim3);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -50, y: 0});
        //play animation
        var flameAnim4 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_4',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flameAnim4.sortYOffset = 100;
        flameAnim4.position = flpos;
        flameAnim4.play();
        graphicsUtils.fadeSpriteOverTime(flameAnim4, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim4);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -90, y: -75});
        //play animation
        var flameAnim5 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_1',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flameAnim5.sortYOffset = 100;
        flameAnim5.position = flpos;
        flameAnim5.play();
        graphicsUtils.fadeSpriteOverTime(flameAnim5, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim5);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -10, y: 150});
        //play animation
        var flameAnim6 = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_2',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.5, 0.5]
        });
        flameAnim6.sortYOffset = 50;
        flameAnim6.position = flpos;
        flameAnim6.play();
        graphicsUtils.fadeSpriteOverTime(flameAnim6, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim6);
    };

    this.onLevelPlayable = function(scene) {
        var pauseAfterCompleteTime = 750;

        globals.currentGame.setUnit(globals.currentGame.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter()), moveToCenter: false});
        enter.play();
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Mega", delayAfterEnd: 1750});
        var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Shane.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30});
        var a2 = new Dialogue({actor: "Task", text: "Right click to move Shane to the beacon.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a3 = new Dialogue({actor: "Task", text: "Hover over your attack ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a3a = new Dialogue({actor: "Task", text: "Press 'A' then left click on the box to attack it.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a4 = new Dialogue({actor: "Task", text: "Right click on the item to pick it up.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a4a = new Dialogue({actor: "Task", text: "Hover over your item to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a5 = new Dialogue({actor: "Task", text: "Press 'A' then left click near the enemies to attack-move to them.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a6 = new Dialogue({actor: "Task", text: "Hover over your dash ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a6a = new Dialogue({actor: "Task", text: "Press 'D' then left click to perform a dash in that direction.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a7 = new Dialogue({actor: "Task", text: "Hover over your knife ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a7a = new Dialogue({actor: "Task", text: "Press 'F' then left click to throw a knife in that direction.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true});
        var a8 = new Dialogue({actor: "Task", text: "Kill a critter by throwing a knife at it.", fadeOutAfterDone: true, backgroundBox: true, isTask: true, letterSpeed: 30, preventAutoStart: true, preventAutoEnd: true});
        var self = this;
        this.mapTableActive = true;
        var chain = new DialogueChain([title, a1, a2, a3, a3a, a4, a4a, a5, a6, a6a, a7, a7a, a8], {startDelay: 200, done: function() {
            chain.cleanUp();
            this.mapTableActive = true;
            var b1 = new Dialogue({actor: "Task", text: "Click on the satellite computer to open the map.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30});
            var b2 = new Dialogue({actor: "Task", text: "Click on a token to travel to it.", isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoStart: true, delayAfterEnd: 250});
            var b3 = new Dialogue({continuation: true, text: "Make your way to camp.", isTask: true, backgroundBox: true, letterSpeed: 30, delayAfterEnd: 4500});
            var bchain = new DialogueChain([b1, b2, b3], {startDelay: 1000, done: function() {
                bchain.cleanUp();
            }});

            var arrow = graphicsUtils.pointToSomethingWithArrow(this.mapTableSprite, -20, 0.5);
            gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                achieve.play();
                gameUtils.doSomethingAfterDuration(() => {
                    graphicsUtils.removeSomethingFromRenderer(arrow);
                    b2.preventAutoStart = false;
                    gameUtils.matterOnce(globals.currentGame, 'travelStarted', () => {
                        achieve.play();
                    });
                });
            });
            bchain.play();
            scene.add(bchain);
        }.bind(this)});

        //First dialogue chain
        var moveBeaconLocation = {x: 275, y: 500};

        var initConditions = function() {
            var arrow = null;
            a1.onStart = function() {
                arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.shane, -35, 0.5);
            }
            gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
                if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Shane') {
                    graphicsUtils.removeSomethingFromRenderer(arrow);
                    achieve.play();
                    gameUtils.doSomethingAfterDuration(() => {
                        a2.preventAutoStart = false;

                        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.5, y: 1.5}, position: moveBeaconLocation});
                        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 15});
                        gameUtils.matterConditionalOnce(globals.currentGame.shane, 'destinationReached', (event) => {
                            var destination = event.destination;
                            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
                            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
                            achieve.play();
                            var boxItem = this.box.getAllItemsByName('Ring Of Thought')[0];
                            this.box.isTargetable = true;
                            gameUtils.doSomethingAfterDuration(() => {
                                a3.preventAutoStart = false;
                                var attackAbility = globals.currentGame.shane.getAbilityByName('Rifle');
                                arrow = graphicsUtils.pointToSomethingWithArrow(attackAbility.icon, -30, 0.75);
                                gameUtils.matterOnce(attackAbility.icon, 'tooltipShown', () => {
                                    achieve.play();
                                    graphicsUtils.removeSomethingFromRenderer(arrow);
                                    gameUtils.doSomethingAfterDuration(() => {
                                        a3a.preventAutoStart = false;
                                        gameUtils.matterConditionalOnce(this.box, 'death',(event) => {
                                            achieve.play();
                                            gameUtils.doSomethingAfterDuration(() => {
                                                a4.preventAutoStart = false;
                                                arrow = graphicsUtils.pointToSomethingWithArrow(boxItem, -20, 0.5);
                                                gameUtils.matterConditionalOnce(globals.currentGame.shane, 'pickupItem', (event) => {
                                                    graphicsUtils.removeSomethingFromRenderer(arrow);
                                                    gameUtils.doSomethingAfterDuration(() => {
                                                        var myItem = globals.currentGame.shane.getAllItemsByName('Ring Of Thought')[0];
                                                        arrow = graphicsUtils.pointToSomethingWithArrow(myItem, -5, 0.5);
                                                        a4a.preventAutoStart = false;
                                                        gameUtils.matterOnce(myItem.icon, 'tooltipShown', () => {
                                                            achieve.play();
                                                            graphicsUtils.removeSomethingFromRenderer(arrow);
                                                            gameUtils.doSomethingAfterDuration(() => {
                                                                a5.preventAutoStart = false;
                                                                var critter1 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                                                var critter2 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                                                globals.currentGame.addUnit(critter1);
                                                                globals.currentGame.addUnit(critter2);
                                                                critter1.position = {x: 1600, y: 200};
                                                                critter2.position = {x: 1600, y: 600};
                                                                critter1.move({x: 1300, y: 200});
                                                                critter2.move({x: 1300, y: 600});
                                                                critter1.honeRange = 200;
                                                                critter2.honeRange = 200;

                                                                var done = function() {
                                                                    achieve.play();
                                                                    gameUtils.doSomethingAfterDuration(() => {
                                                                        a6.preventAutoStart = false;
                                                                        var dashAbility = globals.currentGame.shane.getAbilityByName('Dash');
                                                                        arrow = graphicsUtils.pointToSomethingWithArrow(dashAbility.icon, -30, 0.75);
                                                                        gameUtils.matterOnce(dashAbility.icon, 'tooltipShown', () => {
                                                                            graphicsUtils.removeSomethingFromRenderer(arrow);
                                                                            achieve.play();
                                                                            gameUtils.doSomethingAfterDuration(() => {
                                                                                a6a.preventAutoStart = false;
                                                                                gameUtils.matterConditionalOnce(globals.currentGame.shane, 'dash', (event) => {
                                                                                    achieve.play();
                                                                                    gameUtils.doSomethingAfterDuration(() => {
                                                                                        a7.preventAutoStart = false;
                                                                                        var knifeAbility = globals.currentGame.shane.getAbilityByName('Throw Knife');
                                                                                        arrow = graphicsUtils.pointToSomethingWithArrow(knifeAbility.icon, -30, 0.75);
                                                                                        gameUtils.matterOnce(knifeAbility.icon, 'tooltipShown', () => {
                                                                                            achieve.play();
                                                                                            graphicsUtils.removeSomethingFromRenderer(arrow);
                                                                                            gameUtils.doSomethingAfterDuration(() => {
                                                                                                a7a.preventAutoStart = false;
                                                                                                gameUtils.matterConditionalOnce(globals.currentGame.shane, 'knifeThrow',(event) => {
                                                                                                    achieve.play();
                                                                                                    gameUtils.doSomethingAfterDuration(() => {
                                                                                                        a8.preventAutoStart = false;
                                                                                                        var critter1 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                                                                                        critter1.currentHealth = 15;
                                                                                                        globals.currentGame.addUnit(critter1);
                                                                                                        critter1.position = {x: -50, y: 550};
                                                                                                        critter1.move({x: 200, y: 550});
                                                                                                        critter1.honeRange = 200;
                                                                                                        gameUtils.matterOnce(globals.currentGame.shane, 'knifeKill', (event) => {
                                                                                                            achieve.play();
                                                                                                            a8.preventAutoEnd = false;
                                                                                                        });
                                                                                                    }, pauseAfterCompleteTime);
                                                                                                    return true;
                                                                                                });
                                                                                            }, pauseAfterCompleteTime);
                                                                                        });
                                                                                    }, pauseAfterCompleteTime);
                                                                                    return true;
                                                                                });
                                                                            }, pauseAfterCompleteTime);
                                                                        });
                                                                    }, pauseAfterCompleteTime);
                                                                };

                                                                var crittersKilled = 0;
                                                                gameUtils.matterConditionalOnce(critter1, 'death', (event) => {
                                                                    crittersKilled++;
                                                                    if(crittersKilled == 2) {
                                                                        done();
                                                                    }
                                                                    return true;
                                                                });

                                                                gameUtils.matterConditionalOnce(critter2, 'death', (event) => {
                                                                    crittersKilled++;
                                                                    if(crittersKilled == 2) {
                                                                        done();
                                                                    }
                                                                    return true;
                                                                });
                                                            });
                                                        });
                                                    }, pauseAfterCompleteTime);
                                                    achieve.play();
                                                    return true;
                                                });
                                            }, pauseAfterCompleteTime);
                                            return true;
                                        });
                                    }, pauseAfterCompleteTime);
                                });

                            }, pauseAfterCompleteTime);
                            return true;
                        });
                    }, pauseAfterCompleteTime);
                    return true;
                }
            });
        };
        scene.add(chain);
        scene.addCleanUpTask(() => {
            enter.unload();
            achieve.unload();
        });
        gameUtils.doSomethingAfterDuration(() => {
            initConditions.call(this);
            chain.play();
        }, 1500);
    };
};
shaneLearning.prototype = levelBase;

export {shaneLearning};
