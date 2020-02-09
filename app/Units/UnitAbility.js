define(['jquery', 'utils/GameUtils'], function($, utils) {

    return function(options) {
        this.name = options.name;
        this.key = options.key;
        this.type = options.type;
        this.icon = options.icon;
        this.method = options.method;
    }
})
