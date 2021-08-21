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
import {Doodad} from '@utils/Doodad.js';
import {Dialogue, DialogueChain} from '@core/Dialogue.js';
import MapNode from '@games/Us/MapAndLevel/Map/MapNode.js';
import UnitMenu from '@games/Us/UnitMenu.js';

var pauseAfterCompletionTime = 750;
var completeTaskAndRelease = function(dialogue) {
    if(dialogue.isTask) {
        dialogue.completeTask();
    }
};

var shaneLearning = function(options) {
    var enter = gameUtils.getSound('entershanelearn.wav', {volume: 0.14, rate: 1.0});
    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});
    var podPosition = {x: gameUtils.getCanvasCenter().x-200, y: gameUtils.getPlayableHeight()-500};

    this.initExtension = function() {
        this.completeUponEntry = true;
        this.mode = this.possibleModes.CUSTOM;
        this.noZones = {center: podPosition, radius: 250};
    };

    this.fillLevelSceneExtension = function(scene) {
        var podDoodad = new Doodad({drawWire: false, autoAdd: false, radius: 130, texture: ['LandingPod'], stage: 'stage',
        scale: {x: 0.6, y: 0.6}, bodyScale: {y: 0.65}, offset: {x: 0, y: 30}, sortYOffset: 10,
        shadowIcon: 'IsoShadowBlurred', shadowScale: {x: 1.0, y: 1.0}, shadowOffset: {x: 0, y: 18},
        position: podPosition});
        scene.add(podDoodad);

        this.box = UnitMenu.createUnit('DestructibleBox', {team: this.neutralTeam, isTargetable: false, canTakeAbilityDamage: false});
        ItemUtils.giveUnitItem({gamePrefix: "Us", className: 'worn', itemType: 'item', unit: this.box, immortal: true});
        globals.currentGame.addUnit(this.box);
        this.box.position = {x: 750, y: 300};

        this.createMapTable(scene, {position: mathArrayUtils.clonePosition(podDoodad.body.position, {x: -80, y: 100})});

        var flameSpeed = 0.15;
        var flameVariation = 0.1;
        var fadeTime = 20000;
        var fadeTimeVariation = 80000;
        var flpos = mathArrayUtils.clonePosition(podPosition, {x: 300, y: 0});
        //play animation
        var flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_1',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flameAnim.sortYOffset = 100;
        flameAnim.position = flpos;
        flameAnim.play();
        flameAnim.myName = 'mike';
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 100, y: 50});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_2',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.75, 0.75]
        });
        flameAnim.sortYOffset = 75;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 200, y: -30});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_3',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.5, 0.5]
        });
        flameAnim.sortYOffset = 50;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -50, y: 0});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_4',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flameAnim.sortYOffset = 100;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -90, y: -75});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_1',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 1, 1]
        });
        flameAnim.sortYOffset = 100;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -10, y: 150});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_2',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.5, 0.5]
        });
        flameAnim.sortYOffset = 50;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 0, y: 150});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_3',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.25, 0.25]
        });
        flameAnim.sortYOffset = 25;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: -85, y: 120});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_3',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.25, 0.25]
        });
        flameAnim.sortYOffset = 25;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 300, y: 0});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_2',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.25, 0.25]
        });
        flameAnim.sortYOffset = 25;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 350, y: 150});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_1',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.25, 0.25]
        });
        flameAnim.sortYOffset = 25;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 60, y: 185});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_1',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 0.25, 0.25]
        });
        flameAnim.sortYOffset = 25;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);

        flpos = mathArrayUtils.clonePosition(podPosition, {x: 250, y: -350});
        //play animation
        flameAnim = gameUtils.getAnimation({
            spritesheetName: 'UtilityAnimations3',
            animationName: 'flames_and_smokes_3',
            speed: flameSpeed + Math.random() * flameVariation,
            loop: true,
            transform: [0, 0, 3.0, 3.0]
        });
        flameAnim.sortYOffset = 300;
        flameAnim.position = flpos;
        flameAnim.play();
        graphicsUtils.fadeSpriteOverTimeLegacy(flameAnim, fadeTime + Math.random() * fadeTimeVariation);
        scene.add(flameAnim);
    };

    this.onLevelPlayable = function(scene) {
        var pauseAfterCompleteTime = 0;

        globals.currentGame.setUnit(globals.currentGame.shane, {position: mathArrayUtils.clonePosition(gameUtils.getCanvasCenter()), moveToCenter: false});
        enter.play();
        //begin dialogue
        var title = new Dialogue({blinkLastLetter: false, title: true, text: "Mega", delayAfterEnd: 1750});
        var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Shane.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30});
        var a1a = new Dialogue({text: "Your unit panel is at the bottom of the screen.", isInfo: true, backgroundBox: true, letterSpeed: 30, delayAfterEnd: 2000});
        var a1b = new Dialogue({text: "Tooltips are available by hovering over parts of the panel.", continuation: true, isInfo: true, backgroundBox: true, letterSpeed: 30, delayAfterEnd: 2000});
        var a1c = new Dialogue({text: "Press 'escape' to acknowledge.", continuation: true, isInfo: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true, needsDoubleEscape: true});
        var a2 = new Dialogue({actor: "Task", text: "Right click to move Shane to the beacon.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a3 = new Dialogue({actor: "Task", text: "Hover over your attack ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a3a = new Dialogue({actor: "Task", text: "Press 'A' then left click on the box to attack it.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a4 = new Dialogue({actor: "Task", text: "Right click on the item to pick it up.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a4a = new Dialogue({actor: "Task", text: "Hover over your item to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a5 = new Dialogue({actor: "Task", text: "Press 'A' then left click near the enemies to attack-move to them.", newBreak: true, fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a6 = new Dialogue({actor: "Task", text: "Hover over your dash ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a6a = new Dialogue({actor: "Task", text: "Press 'D' then left click to perform a dash in that direction.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a7 = new Dialogue({actor: "Task", text: "Hover over your knife ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a7a = new Dialogue({actor: "Task", text: "Press 'F' then left click to throw a knife in that direction.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
        var a8 = new Dialogue({actor: "Task", text: "Kill a critter by throwing a knife at it.", fadeOutAfterDone: true, backgroundBox: true, isTask: true, letterSpeed: 30, preventAutoEnd: true});
        var self = this;
        var firstBox = this.box;
        this.mapTableActive = false;
        // this.mapTableActive = true;
        var chain = new DialogueChain([title, a1, a1a, a1b, a1c, a2, a3, a3a, a4, a4a, a5, a6, a6a, a7, a7a, a8], {startDelay: 200, done: function() {
            chain.cleanUp();
            var b1 = new Dialogue({text: "Click on the satellite computer to open the map.", isTask: true, backgroundBox: true, });
            var b2 = new Dialogue({text: "Click on a node to travel to it.", isTask: true, backgroundBox: true, delayAfterEnd: 500});
            var b3 = new Dialogue({text: "Clear all nodes then head to camp.", continuation: true, isTask: true, backgroundBox: true});
            var bchain = new DialogueChain([b1, b2, b3], {startDelay: 1000, done: function() {
                bchain.cleanUp();
            }});

            b1.onStart = function() {
                this.mapTableActive = true;
                var arrow = graphicsUtils.pointToSomethingWithArrow(this.mapTableSprite, -20, 0.5);
                gameUtils.matterOnce(globals.currentGame, 'showMap', () => {
                    graphicsUtils.removeSomethingFromRenderer(arrow);
                    achieve.play();
                    completeTaskAndRelease(b1);
                    b2.onStart = function() {
                        gameUtils.matterOnce(globals.currentGame, 'travelStarted', () => {
                            achieve.play();
                            completeTaskAndRelease(b2);
                        });
                    };
                });
            }.bind(this);

            b3.onStart = function() {
                globals.currentGame.removeAllLevelLocalEntities();
            };
            bchain.play();
            scene.add(bchain);
        }.bind(this)});

        //First dialogue chain
        var moveBeaconLocation = {x: 275, y: 500};

        var initConditions = function() {
            var arrow = null;
            a1.onStart = function() {
                arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.shane, -35, 0.5);
                gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
                    if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Shane') {
                        graphicsUtils.removeSomethingFromRenderer(arrow);
                        achieve.play();
                        gameUtils.doSomethingAfterDuration(() => {
                            completeTaskAndRelease(a1);
                            var arrow1, arrow2, arrow3;
                            a1a.onFullyShown = function() {
                                var commonY = globals.currentGame.unitSystem.unitPanel.unitNamePosition.y - 5;
                                arrow1 = graphicsUtils.pointToSomethingWithArrow({position: {x: globals.currentGame.unitSystem.unitPanel.unitNamePosition.x, y: commonY}}, -20, 0.75);
                                Tooltip.makeTooltippable(arrow1, {title: 'Unit stat panel', descriptions: ['Displays unit attributes.'], manualHandling: true});
                                arrow1.tooltipObj.display(mathArrayUtils.clonePosition(globals.currentGame.unitSystem.unitPanel.unitNamePosition, {y: -136}), {middleAnchor: true});

                                arrow2 = graphicsUtils.pointToSomethingWithArrow({position: {x: globals.currentGame.unitSystem.unitPanel.unitPortraitPosition.x, y: commonY}}, -20, 0.75);
                                Tooltip.makeTooltippable(arrow2, {title: 'Unit portrait', descriptions: ['Life bar is on the left.', 'Energy bar is on the right.'], manualHandling: true});
                                arrow2.tooltipObj.display(mathArrayUtils.clonePosition({x: globals.currentGame.unitSystem.unitPanel.unitPortraitPosition.x, y: commonY}, {y: -140}), {middleAnchor: true});

                                var attackMoveIcon = globals.currentGame.unitSystem.unitPanel.attackMoveIcon.position;
                                var stopIcon = globals.currentGame.unitSystem.unitPanel.stopIcon.position;
                                var myx = (stopIcon.x + attackMoveIcon.x)/2.0;
                                var basicFunctionPosition = {x: myx, y: commonY};
                                arrow3 = graphicsUtils.pointToSomethingWithArrow({position: basicFunctionPosition}, -20, 0.75);
                                Tooltip.makeTooltippable(arrow3, {title: 'Basic unit functions', descriptions: ['Move, Attack-Move,', 'Stop, and Hold Position.'], manualHandling: true});
                                arrow3.tooltipObj.display(mathArrayUtils.clonePosition(basicFunctionPosition, {y: -140}), {middleAnchor: true});
                            };

                            a1c.onEndExtension = () => {
                                achieve.play();
                            };

                            a2.onStart = function() {
                                graphicsUtils.removeSomethingFromRenderer(arrow1);
                                graphicsUtils.removeSomethingFromRenderer(arrow2);
                                graphicsUtils.removeSomethingFromRenderer(arrow3);
                                var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
                                graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 15});
                                gameUtils.matterConditionalOnce(globals.currentGame.shane, 'destinationReached', (event) => {
                                    var destination = event.destination;
                                    if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
                                    graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTimeLegacy(moveBeacon, 500);}});
                                    achieve.play();
                                    var boxItem = firstBox.getAllItems()[0];
                                    gameUtils.doSomethingAfterDuration(() => {
                                        completeTaskAndRelease(a2);
                                        a3.onStart = function() {
                                            var attackAbility = globals.currentGame.shane.getAbilityByName('Rifle');
                                            arrow = graphicsUtils.pointToSomethingWithArrow(attackAbility.icon, -30, 0.75);
                                            gameUtils.matterOnce(attackAbility.icon, 'tooltipShown', () => {
                                                firstBox.isTargetable = true;
                                                achieve.play();
                                                graphicsUtils.removeSomethingFromRenderer(arrow);
                                                gameUtils.doSomethingAfterDuration(() => {
                                                    completeTaskAndRelease(a3);
                                                    a3a.onStart = function() {
                                                        gameUtils.matterConditionalOnce(firstBox, 'death',(event) => {
                                                            achieve.play();
                                                            gameUtils.doSomethingAfterDuration(() => {
                                                                completeTaskAndRelease(a3a);
                                                                a4.onStart = function() {
                                                                    arrow = graphicsUtils.pointToSomethingWithArrow(boxItem, -20, 0.5);
                                                                    gameUtils.matterConditionalOnce(globals.currentGame.shane, 'pickupItem', (event) => {
                                                                        graphicsUtils.removeSomethingFromRenderer(arrow);
                                                                        gameUtils.doSomethingAfterDuration(() => {
                                                                            var myItem = globals.currentGame.shane.getAllItems()[0];
                                                                            completeTaskAndRelease(a4);
                                                                            a4a.onStart = function() {
                                                                                arrow = graphicsUtils.pointToSomethingWithArrow(myItem, -5, 0.5);
                                                                                gameUtils.matterOnce(myItem.icon, 'tooltipShown', () => {
                                                                                    achieve.play();
                                                                                    graphicsUtils.removeSomethingFromRenderer(arrow);
                                                                                    gameUtils.doSomethingAfterDuration(() => {
                                                                                        completeTaskAndRelease(a4a);
                                                                                        a5.onStart = function() {
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
                                                                                                    completeTaskAndRelease(a5);
                                                                                                    a6.onStart = function() {
                                                                                                        var dashAbility = globals.currentGame.shane.getAbilityByName('Dash');
                                                                                                        arrow = graphicsUtils.pointToSomethingWithArrow(dashAbility.icon, -30, 0.75);
                                                                                                        gameUtils.matterOnce(dashAbility.icon, 'tooltipShown', () => {
                                                                                                            graphicsUtils.removeSomethingFromRenderer(arrow);
                                                                                                            achieve.play();
                                                                                                            gameUtils.doSomethingAfterDuration(() => {
                                                                                                                completeTaskAndRelease(a6);
                                                                                                                a6a.onStart = function() {
                                                                                                                    gameUtils.matterConditionalOnce(globals.currentGame.shane, 'dash', (event) => {
                                                                                                                        achieve.play();
                                                                                                                        gameUtils.doSomethingAfterDuration(() => {
                                                                                                                            completeTaskAndRelease(a6a);
                                                                                                                            a7.onStart = function() {
                                                                                                                                var knifeAbility = globals.currentGame.shane.getAbilityByName('Throw Knife');
                                                                                                                                arrow = graphicsUtils.pointToSomethingWithArrow(knifeAbility.icon, -30, 0.75);
                                                                                                                                gameUtils.matterOnce(knifeAbility.icon, 'tooltipShown', () => {
                                                                                                                                    achieve.play();
                                                                                                                                    graphicsUtils.removeSomethingFromRenderer(arrow);
                                                                                                                                    gameUtils.doSomethingAfterDuration(() => {
                                                                                                                                        completeTaskAndRelease(a7);
                                                                                                                                        a7a.onStart = function() {
                                                                                                                                            gameUtils.matterConditionalOnce(globals.currentGame.shane, 'knifeThrow',(event) => {
                                                                                                                                                achieve.play();
                                                                                                                                                gameUtils.doSomethingAfterDuration(() => {
                                                                                                                                                    completeTaskAndRelease(a7a);
                                                                                                                                                    a8.onStart = function() {
                                                                                                                                                        var critter1 = UnitMenu.createUnit('Critter', {team: globals.currentGame.enemyTeam, noWall: true});
                                                                                                                                                        globals.currentGame.addUnit(critter1);
                                                                                                                                                        critter1.setHealth(12);
                                                                                                                                                        critter1.position = {x: -50, y: 550};
                                                                                                                                                        critter1.move({x: 200, y: 550});
                                                                                                                                                        critter1.honeRange = 200;
                                                                                                                                                        gameUtils.matterOnce(globals.currentGame.shane, 'knifeKill', (event) => {
                                                                                                                                                            achieve.play();
                                                                                                                                                            completeTaskAndRelease(a8);
                                                                                                                                                        });
                                                                                                                                                    }
                                                                                                                                                }, pauseAfterCompleteTime);
                                                                                                                                                return true;
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    }, pauseAfterCompleteTime);
                                                                                                                                });
                                                                                                                            }
                                                                                                                        }, pauseAfterCompleteTime);
                                                                                                                        return true;
                                                                                                                    });
                                                                                                                }
                                                                                                            }, pauseAfterCompleteTime);
                                                                                                        });
                                                                                                    };
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
                                                                                        };
                                                                                    });
                                                                                });
                                                                            };
                                                                        }, pauseAfterCompleteTime);
                                                                        achieve.play();
                                                                        return true;
                                                                    });
                                                                };
                                                            }, pauseAfterCompleteTime);
                                                            return true;
                                                        });
                                                    };
                                                }, pauseAfterCompleteTime);
                                            });
                                        };
                                    }, pauseAfterCompleteTime);
                                    return true;
                                });
                            };
                        }, pauseAfterCompleteTime);
                        return true;
                    }
                });
            }.bind(this);
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
