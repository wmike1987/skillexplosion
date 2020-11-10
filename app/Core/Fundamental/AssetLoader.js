import * as PIXI from 'pixi.js'
import * as $ from 'jquery'

var load = function(assets) {
    var loader = PIXI.Loader.shared;
    loader.reset();
    loader.loaderDeferred = $.Deferred();

    var loadedSomething = false;
    assets.forEach((asset) => {
        if(!loader.resources[asset.name]) {
            loader.add(asset.name, asset.target);
            loadedSomething = true;
        }
    });

    if(loadedSomething) {
        loader.load();
        loader.onComplete.add(() => {
            loader.loaderDeferred.resolve();
        });
    } else {
        loader.loaderDeferred.resolve();
    }

    return loader;
}

export default load;
