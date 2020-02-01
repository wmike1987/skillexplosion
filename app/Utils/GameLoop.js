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

    var debug = false;

    //This module manages stepping the physics engine forward
    var FixedRunner = function(options) {
        //for backwards compatibility
        options.engine.runner = this;

        this.fps = options.fps || 60;
        this.desiredFrameTime = 1000/this.fps;
        this.isFixed = options.isFixed;

        if(options.interpolate === false) {
            this.interpolate = false;
        }
        else {
            this.interpolate = options.interoplate || this.isFixed;
        }

        this.lastTime = 0;
        this.deltaAccumulator = 0;
        this.frameRequestId = null;

        //if(debug) {
            console.info("Runner configuration:");
            console.info("fixed: " + this.isFixed);
            console.info("interpolating: " + this.interpolate);
            console.info("desired fps: " + this.fps);
        //}

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

            var missedFrame = null;
            if(debug && this.deltaTime < this.desiredFrameTime) {
                console.info("missed frame");
                console.info(this.deltaTime + " is less than the desire " + this.desiredFrameTime);
                missedFrame = true;
            }

            var willUpdate = (this.deltaAccumulator + this.deltaTime >= this.desiredFrameTime)
            if(willUpdate) {
                Matter.Events.trigger(this, 'beforeUpdate', event);
            }

            var hasUpdated = false;

            if(this.isFixed) {
                this.deltaAccumulator += this.deltaTime;
                while(this.deltaAccumulator >= this.desiredFrameTime) {
                    this.deltaAccumulator -= this.desiredFrameTime;
                    Matter.Events.trigger(this, 'beforeStep', event);
                    Matter.Engine.update(options.engine, this.desiredFrameTime);
                    Matter.Events.trigger(this, 'afterStep', event);
                    hasUpdated = true;
                }

            } else {
                Matter.Events.trigger(this, 'beforeStep', event);
                Matter.Engine.update(options.engine, this.deltaTime);
                Matter.Events.trigger(this, 'afterStep', event);
                hasUpdated = true;
            }

            if(hasUpdated)
                Matter.Events.trigger(this, 'afterUpdate', event);

            //render the world (actually just update sprite position) with the leftover delta time
            if(missedFrame) {
                console.info("last frame %: " + this.lastRenderDelta);
                console.info("this frame %: " + this.deltaAccumulator/this.desiredFrameTime);
            }
            this.lastRenderDelta = this.deltaAccumulator/this.desiredFrameTime;
            event.percentOfNextFrame = this.deltaAccumulator/this.desiredFrameTime;
            event.interpolate = this.interpolate;
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

    return FixedRunner;
})
