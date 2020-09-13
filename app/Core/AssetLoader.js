import * as PIXI from 'pixi.js'
import * as $ from 'jquery'

var load = function(assets) {
    var loader = PIXI.Loader.shared;
    loader.loaderDeferred = $.Deferred();

    assets.forEach((asset) => {
        // import('@textures/' + asset.target).then((bundle) => {
            loader.add(asset.name, asset.target);
        // })
    });

    loader.load();
    loader.onComplete.add(() => {
      loader.loaderDeferred.resolve();
    });
}

export default load;
