import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import * as $ from 'jquery'

var _requestAnimationFrame;
var _cancelAnimationFrame;

if (typeof window !== 'undefined') {
    _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                  || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
                                  || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };

    _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
                                  || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
}

var debug = false;

//This module manages stepping the physics engine forward
var Loop = function(options) {
    //for backwards compatibility
    options.engine.runner = this;

    this.fps = options.fps || 60;
    this.desiredFrameTime = 1000/this.fps;
    this.isFixed = options.isFixed;
    this.maxDelta = 100;
    this.paused = false;
    var frame = 0;

    if(options.interpolate === false) {
        this.interpolate = false;
    }
    else {
        this.interpolate = options.interpolate || this.isFixed;
    }

    this.lastTime = 0;
    this.deltaAccumulator = 0;
    this.frameRequestId = null;

    // if(true) {
    //     console.info("Runner configuration:");
    //     console.info("fixed: " + this.isFixed);
    //     console.info("interpolating: " + this.interpolate);
    //     console.info("desired fps: " + this.fps);
    // }

    var tick = function gameloopTick(time) {
        frame++;
        this.frameRequestId = _requestAnimationFrame(tick);

        if(!this.lastTime) { //initial frame
            this.lastTime = time - this.desiredFrameTime;
        }

        if(this.paused) {
            this.lastTime = time;
            return;
        }

        var event = {
            timestamp: options.engine.timing.timestamp
        };

        this.deltaTime = Math.min(time - this.lastTime, this.maxDelta);
        this.lastTime = time;

        Matter.Events.trigger(this, 'beforeTick', event);

        var willUpdate = (this.deltaAccumulator + this.deltaTime >= this.desiredFrameTime)
        if(willUpdate) {
            Matter.Events.trigger(this, 'beforeUpdate', event);
        }

        var hasUpdated = false;

        var stepCount = 0;
        var thisFrameDelta = 0;
        if(this.isFixed) {
            this.deltaAccumulator += this.deltaTime;
            while(this.deltaAccumulator >= this.desiredFrameTime) {
                this.deltaAccumulator -= this.desiredFrameTime;
                thisFrameDelta =+ this.desiredFrameTime;
                Matter.Events.trigger(this, 'beforeStep', event);
                Matter.Engine.update(options.engine, this.desiredFrameTime);
                stepCount++;
                Matter.Events.trigger(this, 'afterStep', event);
                hasUpdated = true;
            }

        } else {
            Matter.Events.trigger(this, 'beforeStep', event);
            Matter.Engine.update(options.engine, this.deltaTime);
            Matter.Events.trigger(this, 'afterStep', event);
            hasUpdated = true;
        }

        if(hasUpdated) {
            Matter.Events.trigger(this, 'afterUpdate', event);
        }

        Matter.Events.trigger(this, 'preTick', event);
        Matter.Events.trigger(this, 'tick', event);

        event.percentOfNextFrame = this.deltaAccumulator/this.desiredFrameTime;
        event.interpolate = this.interpolate;
        event.delta = thisFrameDelta;

        Matter.Events.trigger(this, 'renderWorld', event);

        //trigger event now that everything is in place
        Matter.Events.trigger(this, 'afterRenderWorld', event);
    }.bind(this);

    this.start = function() {
        _requestAnimationFrame(tick);
    }

    this.stop = function() {
        _cancelAnimationFrame(this.frameRequestId);
    }
};

export default Loop;
