import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'
import {globals} from '@core/Fundamental/GlobalState.js'
import Scene from '@core/Scene.js'
import styles from '@utils/Styles.js'

var ShaneIntro = {
    create: function() {
        var dialogueScene = new Scene();
        dialogueScene.addBlackBackground();

        //begin dialogue
        var ds = [];
        ds.push(new Dialogue({blinkLastLetter: false, title: true, text: "Somewhere on planet Mega...", delayAfterEnd: 2000}));
        ds.push(new Dialogue({actor: "MacMurray", text: "Shane, your pod must have touched down by now... do you read me?", letterSpeed: 40}));
        ds.push(new Dialogue({text: "...", delayAfterEnd: 1000}));
        ds.push(new Dialogue({text: "...", delayAfterEnd: 2000}));
        ds.push(new Dialogue({actor: "Shane", text: "*Grunts*"}));
        ds.push(new Dialogue({actor: "MacMurray", text: "*Sighs* There you are, are you intact?", delayAfterEnd: 0, pauseAfterWord: {word: 'are,', duration: 800}}));
        ds.push(new Dialogue({actor: "Shane", actorIdleSpeed: 500, actorIdleTime: 3, letterSpeed: 90, text: "Mac, I'm here, but I haven't been... intact... since--", delayAfterEnd: 0}));
        ds.push(new Dialogue({actor: "MacMurray", interrupt: true, pauseAfterWord: {word: 'know.', duration: 1100}, text: "I know. That's why I've sent you to Mega.", delayAfterEnd: 800, speedChangeAfterWord: {word: 'know.', speed: 80}}));
        ds.push(new Dialogue({actor: "Shane", text: "This place? 150 degrees and... bugs? You shouldn't have.", duration: 1300, pauseAfterWord: [{word: 'place?', duration: 700}, {word: 'bugs?', duration: 600}], delayAfterEnd: 350}));
        ds.push(new Dialogue({actor: "MacMurray", interrupt: true, speedChangeAfterWord: {word: 'not...', speed: 80}, pauseAfterWord: {word: 'not...', duration: 800}, text: "Maybe not... but Mega is hot and you're the best Diplomat I've got.", delayAfterEnd: 1000}));
        ds.push(new Dialogue({continuation: true, text: "I packed your gear, get it and get moving."}));

        var chain = new DialogueChain(ds, {startDelay: 2000, done: function() {
            dialogueScene.add(graphicsUtils.addSomethingToRenderer("TEX+:ESC to continue", {where: 'hudText', style: styles.titleOneStyle, anchor: {x: 1, y: 1}, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}}));
        }});

        return {scene: dialogueScene, play: function() {
            dialogueScene.add(chain);
            chain.play();
        }};
    }
}

export {ShaneIntro}
