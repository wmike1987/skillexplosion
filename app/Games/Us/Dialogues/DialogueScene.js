import * as Matter from 'matter-js'
import * as $ from 'jquery'
import * as PIXI from 'pixi.js'
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js'
import {Dialogue, DialogueChain} from '@core/Dialogue.js'
import {globals, keyStates} from '@core/Fundamental/GlobalState.js'
import Scene from '@core/Scene.js'
import styles from '@utils/Styles.js'

var DialogueScene = {
    initialize: function(options) {
        this.id = mathArrayUtils.getId();
        var dialogChain = this.createChain(options);
        var dialogueScene = new Scene();
        dialogueScene.addBlackBackground();

        var skipText;
        //indicate skipping behavior
        Matter.Events.on(dialogueScene, 'sceneFadeInDone', () => {
            skipText = graphicsUtils.addSomethingToRenderer("TEX+:Esc to skip", {where: 'hudText', style: styles.titleOneStyle, anchor: {x: 1, y: 1}, alpha: .05, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}})
            dialogueScene.add(skipText);
        });

        //init the escape-to-continue functionality
        dialogChain.done = function() {
            graphicsUtils.removeSomethingFromRenderer(skipText);
            var spacetoContinue = graphicsUtils.addSomethingToRenderer("TEX+:Space to continue", {where: 'hudText', alpha: .5, style: styles.titleOneStyle, anchor: {x: 1, y: 1}, position: {x: gameUtils.getPlayableWidth() - 20, y: gameUtils.getCanvasHeight() - 20}})
            dialogueScene.add(spacetoContinue);
            graphicsUtils.graduallyTint(spacetoContinue, 0xFFFFFF, 0xc72efb, 125, null, false, 3);
            $('body').on('keydown.' + 'DScene:' + this.id, function( event ) {
                var key = event.key.toLowerCase();
                if(key == ' ') {
                    //clear dialogue and start initial level
                    this.escape();
                    $('body').off('keydown.' + 'DScene:' + this.id);
                }
            }.bind(this))
        }.bind(this)

        this.scene = dialogueScene;

        this.play = function() {
            dialogueScene.add(dialogChain);
            dialogChain.play();
        }
    }
}

export {DialogueScene}
