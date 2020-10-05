var globals = {currentGame: null};
var keyStates = {};
var mouseStates = {};

window.addEventListener("keydown", function(event) {
    keyStates[event.key] = true;
});

window.addEventListener("keyup", function(event) {
    keyStates[event.key] = false;
})

window.addEventListener("mousedown", function(event) {
    mouseStates.leftDown = true;
})

window.addEventListener("mouseup", function(event) {
    mouseStates.leftDown = false;
})

export {globals, keyStates, mouseStates};
