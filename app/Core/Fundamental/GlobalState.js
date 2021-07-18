import * as $ from 'jquery';

var globals = {currentGame: null};
var keyStates = {};
var mouseStates = {};
var mousePosition = {x: 0, y: 0};

keyStates.initializeListeners = function() {
    if(this.initialized) return;
    
    $('body').on("keydown", function(event) {
        keyStates[event.key] = true;
    });

    $('body').on("keyup", function(event) {
        keyStates[event.key] = false;
    });

    $('body').on("mousedown", function(event) {
        mouseStates.leftDown = true;
    });

    $('body').on("mouseup", function(event) {
        mouseStates.leftDown = false;
    });
    this.initialized = true;
};

export {globals, keyStates, mouseStates, mousePosition};
