import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {Dialogue, DialogueChain} from '@core/Dialogue.js';
import {globals, keyStates} from '@core/Fundamental/GlobalState.js';
import Scene from '@core/Scene.js';
import styles from '@utils/Styles.js';

var DialogueScene = {
    initialize: function(options) {
        options = options || {};
        this.id = mathArrayUtils.getId();
        var dialogueScene = new Scene();
        var dialogChain = this.createChain(dialogueScene);
        dialogueScene.addBlackBackground();

        Matter.Events.on(dialogueScene, 'afterSnapshotRender', () => {
            globals.currentGame.closeMap();
            globals.currentGame.unitSystem.pause();
        });

        var skipText;

        if(this.initExtension) {
            this.initExtension(dialogueScene);
        }

        //indicate skipping behavior
        if(!this.dontShowEscText) {
            Matter.Events.on(dialogueScene, 'sceneFadeInDone', () => {
                skipText = graphicsUtils.addSomethingToRenderer("TEX+:Esc to fast-forward", {where: 'hudText', style: styles.titleOneStyle, anchor: {x: 1, y: 1}, alpha: 0.1, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}});
                dialogueScene.add(skipText);
            });
        }

        //init the escape-to-continue functionality
        dialogChain.done = function() {
            graphicsUtils.removeSomethingFromRenderer(skipText);
            var spacetoContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {where: 'hudText', alpha: 0.5, style: styles.titleOneStyle, anchor: {x: 1, y: 1}, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}});
            dialogueScene.add(spacetoContinue);
            graphicsUtils.graduallyTint(spacetoContinue, 0xFFFFFF, 0xc72efb, 125, null, false, 3);
            $('body').on('keydown.' + 'DScene:' + this.id, function( event ) {
                var key = event.key.toLowerCase();
                if(key == ' ') {
                    //clear dialogue and start initial level
                    globals.currentGame.unitSystem.unpause();
                    this.escape();
                    $('body').off('keydown.' + 'DScene:' + this.id);
                }
            }.bind(this));
        }.bind(this);

        this.scene = dialogueScene;

        this.play = function() {
            dialogueScene.add(dialogChain);
            dialogChain.play();
        };
    }
};

export {DialogueScene};
