import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/GameUtils.js';
import {
    Dialogue,
    DialogueChain
} from '@core/Dialogue.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';
import {
    DialogueScene
} from '@games/Us/Dialogues/DialogueScene.js';
import UnitMenu from '@games/Us/UnitMenu.js';
import ItemUtils from '@core/Unit/ItemUtils.js';

var UrsulaTasks = function(scene) {

    var achieve = gameUtils.getSound('fullheal.wav', {volume: 0.045, rate: 0.75});

    this.box = UnitMenu.createUnit('DestructibleBox', {team: this.neutralTeam, isTargetable: false, canTakeAbilityDamage: false});
    ItemUtils.giveUnitItem({gamePrefix: "Us", itemName: ["SturdyCanteen"], unit: this.box, immortal: true});
    globals.currentGame.addUnit(this.box);
    this.box.position = {x: 750, y: 300};

    var a1 = new Dialogue({actor: "Task", text: "Use your mouse to select Ursula.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a2 = new Dialogue({actor: "Task", text: "Right click to move Ursula to the beacon.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a3a = new Dialogue({actor: "Task", text: "Hover over your Heal ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a3b = new Dialogue({actor: "Task", text: "Press 'A' then left click near (or on) Shane to heal him.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a4a = new Dialogue({actor: "Task", text: "Hover over your Secret Step ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a4b = new Dialogue({actor: "Task", text: "Press 'D' then left click on the beacon to secret-step to that point.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a5a = new Dialogue({actor: "Task", text: "Hover over your Mine ability to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a5b = new Dialogue({actor: "Task", text: "Move next to the box then press 'F' to lay a mine.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var a6 = new Dialogue({actor: "Task", text: "Lay a mine then trigger it by making Shane throw a knife at it.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});

    var chain = new DialogueChain([a1, /*a2, a3a, a3b, a4a, a4b, a5a, a5b, a6*/], {startDelay: 200, done: function() {
        chain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            finalLearningChain.play();
            // augmentChain.play();
        }, 1000);
    }});

    var pauseAfterCompleteTime = 750;
    var moveBeaconLocation = {x: 1000, y: 550};

    a1.onStart = function() {
        var arrow = graphicsUtils.pointToSomethingWithArrow(globals.currentGame.ursula, -35, 0.5);
        gameUtils.matterConditionalOnce(globals.currentGame.unitSystem, 'executeSelection', (event) => {
            if(event.orderedSelection.length > 0 && event.orderedSelection[0].name == 'Ursula') {
                achieve.play();
                graphicsUtils.removeSomethingFromRenderer(arrow);

                gameUtils.doSomethingAfterDuration(() => {
                    a1.preventAutoEnd = false;
                }, pauseAfterCompleteTime);
                return true;
            }
        });
    };

    a2.onStart = function() {
        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
        gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'destinationReached', (event) => {
            var destination = event.destination;
            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
            achieve.play();
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});

            gameUtils.doSomethingAfterDuration(() => {
                a2.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
            return true;
        });
    };

    a3a.onStart = function() {
        var healAbility = globals.currentGame.ursula.getAbilityByName('Heal');
        var arrow = graphicsUtils.pointToSomethingWithArrow(healAbility.icon, -30, 0.75);
        gameUtils.matterOnce(healAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            gameUtils.doSomethingAfterDuration(() => {
                a3a.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    var allHealed = false;
    a3b.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.ursula, 'performHeal', (event) => {
            globals.currentGame.shane.ignoreHealthRegeneration = false;
            var healme = gameUtils.matterOnce(globals.currentGame.shane, 'healedFully', (event) => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    gameUtils.doSomethingAfterDuration(() => {
                        a3b.preventAutoEnd = false;
                    }, pauseAfterCompleteTime);
                }
            });

            //safety net
            gameUtils.doSomethingAfterDuration(() => {
                if(!allHealed) {
                    achieve.play();
                    allHealed = true;
                    healme.removeHandler();
                    a3b.preventAutoEnd = false;
                }
            }, 15000);
        });
    };

    a4a.onStart = function() {
        var ssAbility = globals.currentGame.ursula.getAbilityByName('Secret Step');
        var arrow = graphicsUtils.pointToSomethingWithArrow(ssAbility.icon, -30, 0.75);
        gameUtils.matterOnce(ssAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            gameUtils.doSomethingAfterDuration(() => {
                a4a.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    a4b.onStart = function() {
        var moveBeacon = graphicsUtils.addSomethingToRenderer('FocusZone', 'stageNOne', {scale: {x: 1.25, y: 1.25}, position: moveBeaconLocation});
        graphicsUtils.flashSprite({sprite: moveBeacon, duration: 300, times: 8});
        gameUtils.matterConditionalOnce(globals.currentGame.ursula, 'secretStepLand', (event) => {
            var destination = event.destination;
            if(mathArrayUtils.distanceBetweenPoints(destination, moveBeaconLocation) > 80) return;
            graphicsUtils.flashSprite({sprite: moveBeacon, onEnd: () => {graphicsUtils.fadeSpriteOverTime(moveBeacon, 500);}});
            achieve.play();
            gameUtils.doSomethingAfterDuration(() => {
                a4b.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
            return true;
        });
    };

    a5a.onStart = function() {
        var mineAbility = globals.currentGame.ursula.getAbilityByName('Mine');
        var arrow = graphicsUtils.pointToSomethingWithArrow(mineAbility.icon, -30, 0.75);
        gameUtils.matterOnce(mineAbility.icon, 'tooltipShown', () => {
            achieve.play();
            graphicsUtils.removeSomethingFromRenderer(arrow);

            gameUtils.doSomethingAfterDuration(() => {
                a5a.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    var box = this.box;
    a5b.onStart = function() {
        box.isTargetable = true;
        box.canTakeAbilityDamage = true;
        gameUtils.matterOnce(box, 'death', (event) => {
            achieve.play();
            gameUtils.doSomethingAfterDuration(() => {
                a5b.preventAutoEnd = false;
            }, pauseAfterCompleteTime);
        });
    };

    a6.onStart = function() {
        gameUtils.matterOnce(globals.currentGame.shane, 'knifeMine', (event) => {
            achieve.play();
            a6.preventAutoEnd = false;
        });
    };

    scene.addCleanUpTask(() => {
        achieve.unload();
    });

    var b1 = new Dialogue({actor: "MacMurray", text: "One more thing, you live and die by your wits out here.", pauseAfterWord: {word: 'thing,', duration: 300}, backgroundBox: true, letterSpeed: 30});
    var b2 = new Dialogue({actor: "MacMurray", text: "I'm delivering a microchip and a book. Collect them and learn to use them.", isTask: false, backgroundBox: true, letterSpeed: 30, continuation: true, preventAutoEnd: true});

    var augmentChain = new DialogueChain([b1, b2], {startDelay: 200, done: function() {
        augmentChain.cleanUp();
        gameUtils.doSomethingAfterDuration(() => {
            finalLearningChain.play();
        }, 1000);
    }});

    b2.fullyShownCallback = function() {
        globals.currentGame.flyover(() => {
            globals.currentGame.dustAndItemBox(gameUtils.getPlayableCenterPlus({x: 100}), ['BasicMicrochip', 'Book'], true);
            b2.preventAutoEnd = false;
        });
    };

    var c1 = new Dialogue({text: "Collect both the microchip and the book.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var c2 = new Dialogue({text: "Hover over the microchip to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var c3 = new Dialogue({text: "Grab the microchip and place it on one of your ability augments.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var c4 = new Dialogue({text: "Unseat the microchip and place it on a different augment.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var c5 = new Dialogue({text: "Collect the book.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, continuation: true, preventAutoEnd: true});
    var c6 = new Dialogue({text: "Hover over the book to read its description.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var c7 = new Dialogue({text: "Grab the book and drop it on an unlearned state of mind.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});
    var c8 = new Dialogue({text: "Activate the desired mode of your learned state of mind.", fadeOutAfterDone: true, isTask: true, backgroundBox: true, letterSpeed: 30, preventAutoEnd: true});

    var microchip = null;
    var book = null;
    c1.onStart = function() {
        globals.currentGame.dustAndItemBox(gameUtils.getPlayableCenterPlus({x: 100}), ['BasicMicrochip', 'Book'], true);
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, 'pickupItem', (event) => {
            if(event.unit.name != 'Ursula' && event.unit.name != 'Shane') return;
            var item = event.item;
            if(item.name == "Gen-1 Microchip") {
                microchip = item;
                if(book && microchip) {
                    achieve.play();
                    c1.preventAutoEnd = false;
                }
                return true;
            }
        });

        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, 'pickupItem', (event) => {
            if(event.unit.name != 'Ursula' && event.unit.name != 'Shane') return;
            var item = event.item;
            if(item.name == "Book") {
                book = item;
                if(book && microchip) {
                    achieve.play();
                    c1.preventAutoEnd = false;
                }
                return true;
            }
        });
    };

    var arrow;
    c2.onStart = function() {
        arrow = graphicsUtils.pointToSomethingWithArrow(microchip, -5, 0.5);
        gameUtils.matterOnce(microchip.icon, 'tooltipShown', () => {
            graphicsUtils.removeSomethingFromRenderer(arrow);
            achieve.play();
            gameUtils.doSomethingAfterDuration(() => {
                c2.preventAutoEnd = false;
            }, 2250);
        });
    };

    c3.onStart = function() {
        gameUtils.matterConditionalOnce(globals.currentGame.itemSystem, "usergrab", function(event) {
            var item = event.item;
            var unit = event.unit;
            if(item == microchip) {
                c3.preventAutoEnd = false;
                return true;
            }
        });
    };

    var finalLearningChain = new DialogueChain([c1, c2, c3, c4], {startDelay: 200, done: function() {
        finalLearningChain.cleanUp();
    }});

    return chain;
};

export {
    UrsulaTasks
};
