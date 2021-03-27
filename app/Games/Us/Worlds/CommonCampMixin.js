import * as $ from 'jquery';
import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import {CommonGameMixin} from '@core/Fundamental/CommonGameMixin.js';
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import Doodad from '@utils/Doodad.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Scene from '@core/Scene.js';

export default {
    initializeCampScene: function(scene) {
        
    },

    cleanUp: function() {

    }
};
