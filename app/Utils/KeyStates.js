window.keyStates = {};
window.mouseStates = {};
keyStates.pressed = {};

window.addEventListener("keydown", function(event) {
    window.keyStates[event.key] = true;
});

window.addEventListener("keyup", function(event) {
    window.keyStates[event.key] = false;
})

window.addEventListener("mousedown", function(event) {
    window.mouseStates.leftDown = true;
})

window.addEventListener("mouseup", function(event) {
    window.mouseStates.leftDown = false;
})