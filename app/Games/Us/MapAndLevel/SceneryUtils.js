import * as $ from 'jquery';
import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import {
    CommonGameMixin
} from '@core/Fundamental/CommonGameMixin.js';
import {
    globals,
    mousePosition
} from '@core/Fundamental/GlobalState.js';
import {
    gameUtils,
    graphicsUtils,
    mathArrayUtils
} from '@utils/UtilityMenu.js';
import campfireShader from '@shaders/CampfireAtNightShader.js';
import valueShader from '@shaders/ValueShader.js';
import TileMapper from '@core/TileMapper.js';
import TileMap from '@core/TileMap';
import {
    Doodad
} from '@utils/Doodad.js';
import {
    Scene,
    SceneContainer
} from '@core/Scene.js';

/* options
 * start {x: , y: }
 * width, height
 * density (0-1)
 * possibleTrees []
 */
var sceneryUtils = {
    fillAreaWithTrees: function(options) {
        var trees = [];
        for (var x = options.start.x; x < options.start.x + options.width; x += (220 - options.density * 200)) {
            for (var y = options.start.y; y < options.start.y + options.height; y += (220 - options.density * 200)) {
                var tree = new Doodad({
                    collides: true,
                    autoAdd: false,
                    radius: 120,
                    texture: 'Doodads/' + mathArrayUtils.getRandomElementOfArray(options.possibleTrees),
                    stage: 'stageTrees',
                    scale: {
                        x: 1.1,
                        y: 1.1
                    },
                    offset: {
                        x: 0,
                        y: -75
                    },
                    sortYOffset: 75,
                    shadowIcon: 'IsoTreeShadow1',
                    shadowScale: {
                        x: 4,
                        y: 4
                    },
                    shadowOffset: {
                        x: -6,
                        y: 20
                    },
                    position: {
                        x: x + (Math.random() * 200 - 50),
                        y: y + (Math.random() * 300 - 40)
                    }
                });
                trees.push(tree);
            }
        }
        return trees;
    },

    createRock: function(options) {
        options = Object.assign({
            where: 'stage',
            randomHFlip: true,
        }, options);

        var rockDetails = {
            Rock1: {
                radius: 5
            },
            Rock3: {
                radius: 4,
                offset: {
                    x: 10,
                    y: 0
                },
                bodyScale: {
                    x: 2,
                    y: 1
                }
            },
            Rock4: {
                scale: {
                    x: 1.5,
                    y: 1.5
                },
                radius: 5
            },
            Rock6: {
                scale: {
                    x: 1.0,
                    y: 1.0
                },
                radius: 4,
                bodyScale: {
                    x: 2,
                    y: 1
                },
                offset: {
                    x: 0,
                    y: 5
                },
            },
            Rock7: {
                scale: {
                    x: 1.0,
                    y: 1.0
                },
                radius: 4,
                offset: {
                    x: 0,
                    y: 8
                },
                bodyScale: {
                    x: 2,
                    y: 1
                }
            },
            Rock2: {
                collides: false
            },
            Rock2a: {
                textureName: 'Rock1',
                collides: false,
                scale: {
                    x: 0.35,
                    y: 0.35
                }
            },
            Rock2b: {
                textureName: 'Rock5',
                scale: {
                    x: 1.0,
                    y: 1.0
                },
                collides: false
            },
        };

        var possibleRocks = Object.keys(rockDetails);

        if (options.names) {
            possibleRocks = options.names;
        }

        var randomRockName = mathArrayUtils.getRandomElementOfArray(possibleRocks);

        //mixin the default options
        var myDetails = Object.assign({
            collides: true,
            offset: {
                x: 0,
                y: 0
            },
            scale: {
                x: 1,
                y: 1
            },
            bodyScale: null,
            textureName: randomRockName
        }, rockDetails[randomRockName]);
        var rock = new Doodad({
            collides: myDetails.collides,
            autoAdd: false,
            radius: myDetails.radius || 1,
            // drawWire: true,
            texture: 'Doodads/' + myDetails.textureName,
            stage: options.where,
            tint: options.tint,
            randomHFlip: options.randomHFlip,
            scale: myDetails.scale,
            offset: myDetails.offset,
            bodyScale: myDetails.bodyScale,
            sortYOffset: 0,
            shadowIcon: 'IsoTreeShadow1',
            shadowScale: {
                x: 0,
                y: 0
            },
            shadowOffset: {
                x: -6,
                y: 20
            },
            // position: {
            //     x: x + (Math.random() * 200 - 50),
            //     y: y + (Math.random() * 300 - 40)
            // }
        });

        return rock;
    },

    createTree: function(options) {
        options = Object.assign({
            where: 'stage',
            randomHFlip: true
        }, options);

        var randomScale = mathArrayUtils.getRandomNumberBetween(0.9, 1.1);
        var treeDetails = {
            avdeadtree1: {
                radius: 10 * randomScale,
                scale: 0.5 * randomScale,
                alpha: 0.8,
                noZone: {
                    offset: {
                        x: 0,
                        y: 15 * randomScale
                    },
                    radius: 80 * randomScale
                },
                offset: {
                    x: 0,
                    y: -130 * randomScale
                },
                shadowScale: {
                    x: 2.0 * randomScale,
                    y: 2.0 * randomScale
                },
                shadowOffset: {
                    x: 0,
                    y: 18 * randomScale
                },
                sortYOffset: 130 * randomScale
            },
            avdeadtree2: {
                radius: 10 * randomScale,
                scale: 0.5 * randomScale,
                alpha: 0.8,
                noZone: {
                    offset: {
                        x: 0,
                        y: 10 * randomScale
                    },
                    radius: 50
                },
                offset: {
                    x: 0,
                    y: -85 * randomScale
                },
                shadowScale: {
                    x: 1.0 * randomScale,
                    y: 1.0 * randomScale
                },
                shadowOffset: {
                    x: 0,
                    y: 18 * randomScale
                },
                sortYOffset: 90 * randomScale
            },
            avgoldtree1: {
                radius: 5 * randomScale,
                scale: 0.8 * randomScale,
                alpha: 0.7,
                noZone: {
                    offset: {
                        x: 0,
                        y: 10 * randomScale
                    },
                    radius: 25
                },
                offset: {
                    x: -4,
                    y: -125 * randomScale
                },
                shadowScale: {
                    x: 1.0 * randomScale,
                    y: 1.0 * randomScale
                },
                shadowOffset: {
                    x: -4,
                    y: 3 * randomScale
                },
                sortYOffset: 128 * randomScale
            },
            avpinktree2: {
                radius: 8 * randomScale,
                scale: 0.8 * randomScale,
                alpha: 0.7,
                noZone: {
                    offset: {
                        x: 0,
                        y: 10 * randomScale
                    },
                    radius: 25
                },
                offset: {
                    x: 2,
                    y: -50 * randomScale
                },
                shadowScale: {
                    x: 1.0 * randomScale,
                    y: 1.0 * randomScale
                },
                shadowOffset: {
                    x: 2,
                    y: 10 * randomScale
                },
                sortYOffset: 90 * randomScale
            },
        };

        var possibleTrees = Object.keys(treeDetails);

        if (options.names) {
            possibleTrees = options.names;
        }

        var randomTreeName = mathArrayUtils.getRandomElementOfArray(possibleTrees);

        //mixin the default options
        var myDetails = Object.assign({
            collides: true,
            offset: {
                x: 0,
                y: 0
            },
            scale: {
                x: 1,
                y: 1
            },
            bodyScale: null,
            textureName: randomTreeName
        }, treeDetails[randomTreeName]);
        var tree = new Doodad({
            collides: myDetails.collides,
            autoAdd: false,
            radius: myDetails.radius || 1,
            // drawWire: true,
            texture: 'Doodads/' + myDetails.textureName,
            stage: options.where,
            tint: options.tint,
            noZone: myDetails.noZone,
            alpha: myDetails.alpha || 1.0,
            randomHFlip: options.randomHFlip,
            scale: myDetails.scale,
            offset: myDetails.offset,
            bodyScale: myDetails.bodyScale,
            sortYOffset: myDetails.sortYOffset || 0,
            shadowIcon: 'IsoTreeShadow1',
            shadowScale: myDetails.shadowScale || {
                x: 1,
                y: 1
            },
            shadowOffset: myDetails.shadowOffset || {
                x: -6,
                y: 20
            },
        });

        return tree;
    },

    decorateTerrain: function(options) {
        var container = new SceneContainer();
        var doodadArray = options.possibleDoodads || [];

        var textureArray = options.possibleTextures || [];
        textureArray = mathArrayUtils.convertToArray(textureArray);

        var bounds = options.bounds || gameUtils.getCanvasWH();
        var tileWidth = options.tileWidth;
        var tileHeight = tileWidth / 2;
        var tileStart = options.tileStart || {
            x: 0,
            y: 0
        };
        var globalScale = options.scale;
        var globalTint = options.tint;
        var globalAlpha = options.alpha;
        var globalSortYOffset = options.sortYOffset;
        var globalUnique = options.unique;
        var where = options.where || 'background';
        var frequency = options.hz || 1;
        var maxNumber = options.maxNumber || null;
        var nonTilePosition = options.nonTilePosition || false;
        if (maxNumber) {
            nonTilePosition = true;
        }
        var groupings = options.groupings || {
            hz: 0
        };
        var r = options.r || 0; //r is 0-1 (random scale)

        //build no zones
        var sceneNoZones = options.scene || globals.currentGame.upcomingScene.getNoZones();
        var noZones = sceneNoZones.concat(options.noZones || []);
        noZones = mathArrayUtils.convertToArray(noZones);

        var column = 0;
        var hits = 0;
        for (var x = tileStart.x; x <= bounds.x + tileWidth;) {

            //alter the y when we're on an odd column
            var yOffset = 0;
            if (column % 2 != 0) {
                yOffset = tileHeight / 2;
            }

            //draw columns
            for (var y = tileStart.y; y <= bounds.y + tileHeight / 2;) {
                if (Math.random() < frequency) {

                    //determine a position
                    var randomnessX = ((Math.random() * 200) - 100) * r;
                    randomnessX = Math.floor(randomnessX);

                    var randomnessY = ((Math.random() * 200) - 100) * r;
                    randomnessY = Math.floor(randomnessY);

                    var positionX = x + randomnessX;
                    var positionY = y + yOffset + randomnessY;

                    if (nonTilePosition) {
                        var position = gameUtils.getRandomPlacementWithinPlayableBounds({
                            buffer: 30
                        });
                        positionX = position.x;
                        positionY = position.y;
                    }

                    //test for no zones
                    var skip = false;
                    if (noZones) {
                        noZones.forEach((nz) => {
                            if (mathArrayUtils.distanceBetweenPoints(nz.center, {
                                    x: positionX,
                                    y: positionY
                                }) < nz.radius) {
                                skip = true;
                            }
                        });
                    }
                    if (skip) {
                        y += tileHeight;
                        continue;
                    }

                    if (maxNumber && hits == maxNumber) {
                        y += tileHeight;
                        continue;
                    }

                    //record our hits
                    hits += 1;

                    //combine our things
                    var arrayOfThings = doodadArray.concat(textureArray);

                    //comprehend groupings
                    var doGrouping = Math.random() < groupings.hz;
                    var numberInGrouping = doGrouping ? mathArrayUtils.getRandomElementOfArray(groupings.possibleAmounts) : 1;
                    var possibleAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

                    //process groupings
                    for (var j = 0; j < numberInGrouping; j++) {
                        if (j > 0) {
                            var angle = mathArrayUtils.getRandomElementOfArray(possibleAngles);
                            mathArrayUtils.removeObjectFromArray(angle, possibleAngles);
                            var newPosition = mathArrayUtils.addScalarToVectorAtAngle({
                                x: positionX,
                                y: positionY
                            }, angle, groupings.scalar || 30);
                            positionX = newPosition.x;
                            positionY = newPosition.y;
                        }

                        //expand possible things for proportional choosing of objects
                        let expandedThings = [];
                        arrayOfThings.forEach(function(thing) {
                            if(thing.possibleTextures) {
                                thing.possibleTextures.forEach(function(t) {
                                    expandedThings.push(thing); //add the same array multiple times so that it's chosen properly
                                });
                            } else {
                                expandedThings.push(thing);
                            }
                        });
                        let randomThing = mathArrayUtils.getRandomElementOfArray(expandedThings);

                        let newDO = null;

                        //handle doodads
                        if (randomThing.isDoodad) {
                            newDO = randomThing.clone();
                            newDO.setPosition({
                                x: positionX,
                                y: positionY
                            });
                        } else {
                            //assume our random thing is a texture name, but it could be a grouping of sub textures with explicit tints
                            let resolvedThing = null;
                            let localTint = null;
                            let localScale = null;
                            let localSortYOffset = null;
                            let localAlpha = null;

                            //check if we are a grouping of textures with their own tints etc
                            if (randomThing.possibleTextures) {
                                resolvedThing = mathArrayUtils.getRandomElementOfArray(randomThing.possibleTextures);
                                if (globalUnique || resolvedThing.unique) {
                                    mathArrayUtils.removeObjectFromArray(resolvedThing, randomThing.possibleTextures);
                                }

                            } else { //else we have something else (either a string of an animation object)
                                resolvedThing = randomThing;
                                if (globalUnique || resolvedThing.unique) {
                                    mathArrayUtils.removeObjectFromArray(resolvedThing, arrayOfThings);
                                }
                            }

                            localTint = randomThing.tint || globalTint || 0xFFFFFF;
                            localScale = randomThing.scale || globalScale || {x: 1, y: 1};
                            if(randomThing.randomHFlip && mathArrayUtils.flipCoin()) {
                                localScale.x *= -1;
                            }
                            localSortYOffset = randomThing.sortYOffset || globalSortYOffset || 0;
                            localAlpha = randomThing.alpha || globalAlpha || 1;

                            //if our thing is an animation object
                            if (resolvedThing.animationName) {
                                newDO = gameUtils.getAnimation({
                                    spritesheetName: resolvedThing.spritesheetName,
                                    animationName: resolvedThing.animationName,
                                    speed: resolvedThing.speed || 1.0,
                                    loop: true,
                                    transform: [positionX, positionY, localScale.x, localScale.y]
                                });
                                if (resolvedThing.decorate) {
                                    resolvedThing.decorate(newDO);
                                }
                                if (resolvedThing.playDelay) {
                                    let myDO = newDO;
                                    myDO.sceneInit = function() {
                                        var self = this;
                                        gameUtils.doSomethingAfterDuration(function() {
                                            if (!self._destroyed) {
                                                self.play();
                                            }
                                        }, resolvedThing.playDelay);
                                    };
                                } else {
                                    newDO.play();
                                }
                            } else { //else we have a straight texture name
                                newDO = graphicsUtils.createDisplayObject(resolvedThing, {
                                    position: {
                                        x: positionX,
                                        y: positionY
                                    },
                                    where: where,
                                    scale: {
                                        x: localScale.x,
                                        y: localScale.y
                                    }
                                });
                            }

                            newDO.tint = localTint;
                            newDO.sortYOffset = localSortYOffset;
                            newDO.alpha = localAlpha;
                        }

                        container.addObject(newDO);
                    }
                }
                y += tileHeight;
            }
            x += tileWidth / 2;
            column++;
        }
        return container;
    }
};

export default sceneryUtils;
