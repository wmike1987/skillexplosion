define(['jquery', 'utils/GameUtils', 'matter-js'], function($, utils, Matter) {

    var _requestAnimationFrame;
    var _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };

        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    //This module manages stepping the physics engine forward
    var FixedRunner = function(options) {
        //for backwards compatibility
        options.engine.runner = this;

        this.fps = options.fps || 60;
        this.desiredFrameTime = 1000/this.fps;

        this.lastTime = 0;
        this.deltaAccumulator = 0;
        this.frameRequestId = null;
        var tick = function(time) {
            frameRequestId = _requestAnimationFrame(tick);

            if(!this.lastTime) { //initial frame
                this.lastTime = time - this.desiredFrameTime;
            }

            var event = {
                timestamp: options.engine.timing.timestamp
            };

            this.deltaTime = time - this.lastTime;
            this.lastTime = time;

            Matter.Events.trigger(this, 'beforeUpdate', event);
            if(options.isFixed) {
                this.deltaAccumulator += this.deltaTime;
                while(this.deltaAccumulator >= this.desiredFrameTime) {
                    this.deltaAccumulator -= this.desiredFrameTime;
                    Matter.Events.trigger(options.engine, 'beforeSubstep', event);
                    Matter.Engine.update(options.engine, this.desiredFrameTime);
                    Matter.Events.trigger(options.engine, 'afterSubstep', event);
                }
            } else {
                Matter.Engine.update(options.engine, this.deltaTime);
            }
            Matter.Events.trigger(this, 'afterUpdate', event);
            Matter.Events.trigger(this, 'renderWorld', event);
        }.bind(this);

        this.start = function() {
            _requestAnimationFrame(tick);
        }

        this.stop = function() {
            _cancelAnimationFrame(this.frameRequestId);
        }
    };

    return FixedRunner;
})
