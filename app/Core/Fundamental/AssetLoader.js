import * as PIXI from 'pixi.js';
import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {
    globals
} from '@core/Fundamental/GlobalState.js';
import * as Matter from 'matter-js';

var load = function(assets) {
    assets = mathArrayUtils.convertToArray(assets);

    var loader = new PIXI.Loader();

    loader.loaderDeferred = $.Deferred();
    loader.totalItems = assets.length;
    loader.itemsLoaded = 0;
    loader.percentDone = 0;

    var loadedSomething = false;

    //queue the assets to be laoded
    assets.forEach((asset) => {
        if (!loader.resources[asset.name]) {
            loader.add(asset.name, asset.target);
            loadedSomething = true;
        }
    });

    //actually load the requested resources
    if (loadedSomething) {
        loader.load();
        loader.onProgress.add(() => {
            //progress tracker
            loader.itemsLoaded += 1;
            loader.percentDone = Math.ceil(loader.progress);
        });
        loader.onComplete.add(() => {
            //on complete, register the assets with the pixi renderer
            Matter.Events.trigger(globals.currentGame, 'assetsLoaded', {resources: loader.resources});
            loader.loaderDeferred.resolve();
        });
    } else {
        loader.loaderDeferred.resolve();
    }

    return loader;
};

export default {load: load};
