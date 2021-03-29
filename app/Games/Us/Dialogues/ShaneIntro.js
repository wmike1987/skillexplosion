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

var ShaneIntro = function(options) {
    this.escape = options.done;
    this.createChain = function() {
        //begin dialogue
        var ds = [];
        ds.push(new Dialogue({
            blinkLastLetter: false,
            title: true,
            text: "Somewhere on planet Mega...",
            delayAfterEnd: 2000
        }));
        ds.push(new Dialogue({
            actor: "MacMurray",
            text: "Shane, your pod must have touched down by now... do you read me?",
            letterSpeed: 30
        }));
        ds.push(new Dialogue({
            text: "...",
            delayAfterEnd: 1000
        }));
        ds.push(new Dialogue({
            text: "...",
            delayAfterEnd: 4500,
            picture: 'HappyLanding.png',
            pictureDelay: 2250,
            pictureSize: 256,
            pictureFadeSpeed: 25,
            pictureOffset: {
                x: 50,
                y: -150
            }
        }));
        ds.push(new Dialogue({
            actor: "Shane",
            actionText: {
                word: "Grunts",
                actionDuration: 1500,
                leaveTrace: true
            }
        }));
        ds.push(new Dialogue({
            actor: "MacMurray",
            text: "There you are, are you intact?",
            actionText: {
                word: "Sighs",
                actionDuration: 1200,
                fadeOutOnly: true
            },
            delayAfterEnd: 0,
            pauseAfterWord: {
                word: 'are,',
                duration: 650
            }
        }));
        ds.push(new Dialogue({
            actor: "Shane",
            actorIdleSpeed: 500,
            actorIdleTime: 3,
            letterSpeed: 90,
            text: "Mac, I'm here, but I haven't been... intact... since-",
            pauseAfterWord: [{
                word: 'intact...',
                duration: 100
            }],
            speedChangeAfterWord: {
                word: 'intact...',
                speed: 100
            },
            delayAfterEnd: 0
        }));
        ds.push(new Dialogue({
            actor: "MacMurray",
            interrupt: true,
            pauseAfterWord: {
                word: 'know.',
                duration: 950
            },
            text: "I know. That's why I've sent you to Mega.",
            picture: 'ThePlanet.png',
            pictureWordTrigger: 'Mega',
            pictureSize: 256,
            pictureFadeSpeed: 10,
            pictureOffset: {
                x: 50,
                y: -150
            },
            delayAfterEnd: 700,
            speedChangeAfterWord: {
                word: 'know.',
                speed: 80
            }
        }));
        ds.push(new Dialogue({
            actor: "Shane",
            text: "This place? 150 degrees and... bugs? You shouldn't have.",
            duration: 1300,
            pauseAfterWord: [{
                word: 'place?',
                duration: 700
            }, {
                word: 'bugs?',
                duration: 600
            }],
            delayAfterEnd: 350
        }));
        ds.push(new Dialogue({
            actor: "MacMurray",
            interrupt: true,
            speedChangeAfterWord: {
                word: 'not...',
                speed: 80
            },
            pauseAfterWord: {
                word: 'not...',
                duration: 500
            },
            text: "Maybe not... but Mega is hot as hell and you're the best Diplomat I've got.",
            delayAfterEnd: 850
        }));
        ds.push(new Dialogue({
            continuation: true,
            text: "I packed your gear, get it and get moving."
        }));

        var chain = new DialogueChain(ds, {
            startDelay: 2000
        });

        return chain;
    };

    this.initialize();
};

ShaneIntro.prototype = DialogueScene;
export {
    ShaneIntro
};
