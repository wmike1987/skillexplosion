define(['jquery', 'matter-js', 'pixi', 'games/CommonGameMixin', 'mixins/_Moveable', 'mixins/_Attacker', 'units/IsoSpriteManager',
'utils/GameUtils', 'utils/CommandQueue', 'utils/Command'],

    function($, Matter, PIXI, CommonGameMixin, Moveable, Attacker, Iso, utils, CommandQueue, Command) {

        var hoverShader = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float r;
            uniform float g;
            uniform float b;
            uniform float a;
            uniform bool active;

            void main(){
                if(active) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    if(gl_FragColor.a > 0.3) {
                        if(r > 0.0) {
                            gl_FragColor.r = r;
                        }
                        if(g > 0.0) {
                            gl_FragColor.g = g;
                        }
                        if(b > 0.0) {
                            gl_FragColor.b = b;
                        }
                        if(a > 0.0) {
                            gl_FragColor.a = a;
                        }
                    }
                } else {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                }
            }
        `;

        //default unit attributes
        var UnitBase = {
            isUnit: true,
            isoManaged: true,
            maxHealth: 20,
            currentHealth: 20,
            maxEnergy: 0,
            currentEnergy: 0,
            isSelectable: true,
            isAttackable: true,
            team: 4,
            eventClickMappings: {},
            eventKeyMappings: {},

            sufferAttack: function(damage) {
                this.currentHealth -= damage;
                if (this.currentHealth <= 0) {
                    this.death();
                }
                Matter.Events.trigger(this, 'sufferedAttack', damage);
            },

            canTargetUnit: function(unit) {
                return unit.isAttackable && this.team != unit.team;
            },

            initUnit: function() {

                // setup health and energy
                if (this.health) {
                    this.maxHealth = this.health;
                    this.currentHealth = this.health;
                }

                if (this.energy) {
                    this.maxEnergy = this.energy;
                    this.currentEnergy = this.energy;
                }

                //event handling/dispatch queue
                this.commandQueue = CommandQueue();
                this.handleEvent = function(event) {
                    if(event.type == 'click') {
                        if(this.eventClickMappings[event.id]) {
                            var newCommand = Command({
                                queue: this.commandQueue,
                                method: this.eventClickMappings[event.id],
                                context: this,
                                target: event.target
                            })
                            if(keyStates['Shift']) {
                                this.commandQueue.enqueue(newCommand);
                            }
                            else {
                                this.commandQueue.clear();
                                this.commandQueue.enqueue(newCommand);
                            }
                        }
                    } else if(event.type == 'key') {
                        if(this.eventKeyMappings[event.id]) {
                            var newCommand = Command({
                                queue: this.commandQueue,
                                method: this.eventKeyMappings[event.id],
                                context: this,
                                target: event.target
                            })
                            if(keyStates['Shift']) {
                                this.commandQueue.enqueue(newCommand);
                            }
                            else {
                                this.commandQueue.clear();
                                this.commandQueue.enqueue(newCommand);
                            }
                        }
                    }
                };

                //add filter on the main render sprite
                var hoverFilter = new PIXI.Filter(undefined, hoverShader, {active: false, r: 0.0, g: 0.0, b: 0.0});
                // var hoverShad = new PIXI.Shader(hoverFrag.program, {});
                if(this.mainRenderSprite) {
                    if($.isArray(this.mainRenderSprite)) {
                        $.each(this.mainRenderSprite, function(i, spriteId) {
                            $.each(this.renderChildren, function(index, child) {
                                if(child.id == spriteId) {
                                    child.filter = hoverFilter;
                                }
                            }.bind(this))
                        }.bind(this))
                    } else {
                        $.each(this.renderChildren, function(index, child) {
                            if(child.id == this.mainRenderSprite) {
                                child.filter = hoverFilter;
                            }
                        }.bind(this))
                    }
                };

                //hover Method
                this.hover = function(event) {
                    hoverFilter.uniforms.active = true;
                    if(this.team != event.team) {
                        hoverFilter.uniforms.r = 1;
                        hoverFilter.uniforms.g = .3;
                        hoverFilter.uniforms.b = .1;
                    } else {
                        hoverFilter.uniforms.r = 0.0;
                        hoverFilter.uniforms.g = .4;
                        hoverFilter.uniforms.b = 0.0;
                    }
                };

                this.unhover = function(event) {
                    hoverFilter.uniforms.active = false;
                }

                Matter.Events.on(this, 'addUnit', function() {

                    //start unit as idling upon add
                    if (this.isoManaged)
                        this.isoManager.idle();

                    //establish the height of the unit
                    if (this.heightAnimation)
                        this.unitHeight = this.renderlings[this.heightAnimation].height;
                    else
                        this.unitHeight = this.body.circleRadius * 2;

                    //create health bar
                    var backgroundScaleX = 1.8;
                    var barScaleXMultiplier = .96;
                    var healthBorderScale = .16;
                    var healthBarScale = .08;
                    if (this.health && this.isAttackable) {
                        this.renderChildren.push({
                            id: 'healthbarbackground',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX,
                                y: healthBorderScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2,
                                y: -this.unitHeight / 2 - 13
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            tint: 0x000000,
                            avoidIsoMgr: true,
                            visible: false,
                        }, {
                            id: 'healthbar',
                            data: 'HealthEnergyBackground',
                            scale: {
                                x: backgroundScaleX * barScaleXMultiplier,
                                y: healthBarScale
                            },
                            offset: {
                                x: -32 * backgroundScaleX / 2 + 32 * backgroundScaleX * (1 - barScaleXMultiplier) / 2,
                                y: -this.unitHeight / 2 - 13
                            },
                            anchor: {
                                x: 0,
                                y: .5
                            },
                            stage: 'foreground',
                            rotate: 'none',
                            avoidIsoMgr: true,
                            tint: 0x00FF00,
                            visible: false
                        });

                        var updateHealthTick = currentGame.addTickCallback(function() {
                            var percentage = this.currentHealth / this.maxHealth;
                            if (this.renderlings['healthbar']) {
                                this.renderlings['healthbar'].scale = {
                                    x: backgroundScaleX * barScaleXMultiplier * percentage,
                                    y: healthBarScale
                                };
                                this.renderlings['healthbar'].tint = utils.rgbToHex(percentage >= .5 ? ((1-percentage) * 2 * 255) : 255, percentage <= .5 ? (percentage * 2 * 255) : 255, 0);
                            }
                        }.bind(this))

                        utils.deathPact(this, updateHealthTick);
                    }
                }.bind(this));


                //create energy bar
                if (this.energy) {

                }
            }
        }

        return UnitBase;
    }
)
