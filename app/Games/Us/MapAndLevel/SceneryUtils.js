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
            // Rock4: {
            //     scale: {
            //         x: 1.5,
            //         y: 1.5
            //     },
            //     radius: 5
            // },
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

        //get all rocks
        var possibleRocks = Object.keys(rockDetails);

        //or get rocks based on collision
        if(options.collidableRocks) {
            possibleRocks = possibleRocks.filter(function(key, index) {
                if(rockDetails[key].collides !== false) {
                    return true;
                } else {
                    return false;
                }
            });
        }

        //or get rocks based on collision
        if(options.nonCollidableRocks) {
            possibleRocks = possibleRocks.filter(function(key, index) {
                if(rockDetails[key].collides === false) {
                    return true;
                } else {
                    return false;
                }
            });
        }

        //or the user specified the rocks
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
                        x: -2,
                        y: 10 * randomScale
                    },
                    radius: 50
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
                    radius: 35
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

        tree.isTree = true;

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
        var globalRotate = options.rotate || null;

        var maxNumber = options.maxNumber || null;
        var nonTilePosition = options.nonTilePosition || false;
        if (maxNumber) {
            nonTilePosition = true;
        }
        var explicitPosition = null;
        if(nonTilePosition) {
            explicitPosition = options.explicitPosition;
        }

        var buffer = options.buffer || 30;
        var groupings = options.groupings || {
            hz: 0
        };
        var r = options.r || 0; //r is 0-1 (random scale)

        //build no zones
        var sceneNoZones = options.scene ? options.scene.getNoZones() : globals.currentGame.upcomingScene.getNoZones();
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
                        var position = explicitPosition instanceof Function ? explicitPosition() : explicitPosition;
                        position = position || gameUtils.getRandomPlacementWithinPlayableBounds({
                            buffer: buffer
                        });
                        positionX = position.x;
                        positionY = position.y;
                    }

                    //combine our things
                    var arrayOfThings = doodadArray.concat(textureArray);

                    //comprehend groupings
                    var doGrouping = Math.random() < groupings.hz;
                    var numberInGrouping = doGrouping ? mathArrayUtils.getRandomElementOfArray(groupings.possibleAmounts) : 1;
                    var possibleAngles = [12, 32, 63, 95, 122, 150, 192, 219, 240, 270, 286, 330];

                    //check max
                    if (maxNumber && hits == maxNumber) {
                        y += tileHeight;
                        break;
                    }

                    //variable for if we placed at least something in the group
                    var hit = false;

                    var lastAngleChosen = null;
                    var findGroupingPosition = function(originalPosition, scalarOverride, retry) {
                        var myScalar = scalarOverride || groupings.scalar || 30;
                        if(myScalar.min) {
                            myScalar = mathArrayUtils.getRandomIntInclusive(myScalar.min, myScalar.max);
                        }

                        if(retry) {
                            possibleAngles.push(lastAngleChosen);
                        }

                        var angle = mathArrayUtils.getRandomElementOfArray(possibleAngles);
                        lastAngleChosen = angle;
                        if(possibleAngles.length > 1) {
                            mathArrayUtils.removeObjectFromArray(angle, possibleAngles);
                        }
                        var newPosition = mathArrayUtils.addScalarToVectorAtAngle({
                            x: originalPosition.x,
                            y: originalPosition.y
                        }, angle, myScalar);
                        newPosition = mathArrayUtils.roundPositionToWholeNumbers(newPosition);
                        return {x: newPosition.x, y: newPosition.y};
                    };

                    var checkCollision = function(options) {
                        var myThing = options.myThing;
                        var myPosition = options.position;
                        var noZones = options.noZones;
                        return noZones.some((nz) => {
                            if(myThing && myThing.isDoodad) {
                                return myThing.collidesInTheory(myPosition, nz);
                            } else {
                                let myNoZone = {center: myPosition, radius: myThing.loneNZRadius || 0};
                                return gameUtils.detectNoZoneCollision(nz, myNoZone);
                            }
                        });
                    };

                    //process groupings (always at least 1)
                    var centerPosition = {x: positionX, y: positionY};
                    for (var j = 0; j < numberInGrouping; j++) {
                        var myPosition = null;
                        var placingCenter = false;
                        if (j == 0) {
                            myPosition = centerPosition;
                            placingCenter = true;
                        }

                        //expand possible things for proportional choosing of objects
                        let expandedThings = [];
                        arrayOfThings.forEach(function(thing) {
                            if (thing.possibleTextures) {
                                thing.possibleTextures.forEach(function(t) {
                                    expandedThings.push(thing); //add the same array multiple times so that it's chosen properly
                                });
                            } else {
                                expandedThings.push(thing);
                            }
                        });
                        let randomThing = mathArrayUtils.getRandomElementOfArray(expandedThings);

                        //find priority grouping items
                        var priorityItems = expandedThings.filter((item) => {
                            var groupingOptions = item.groupingOptions;
                            if(!groupingOptions) {
                                return false;
                            } else {
                                return groupingOptions.priority || groupingOptions.priority === 0;
                            }
                        });

                        var sortedPriorityItems = priorityItems.sort((a, b) => {
                            return a.groupingOptions.priority - b.groupingOptions.priority;
                        });

                        if(priorityItems.length > 0) {
                            randomThing = sortedPriorityItems.shift();
                        }


                        //force the center object if specified (this is the ultimate priority item)
                        if(placingCenter && groupings.center) {
                            randomThing = groupings.center;
                        }

                        var rotateTowardCenter = false;
                        if(randomThing.groupingOptions && randomThing.groupingOptions.rotateTowardCenter) {
                            rotateTowardCenter = true;
                        }

                        var wholeSkip = false;
                        var tries = 0;
                        var maxTries = randomThing.reallyTry ? 150 : 60;

                        if(placingCenter) {
                            if (noZones) {
                                wholeSkip = checkCollision({myThing: randomThing, position: myPosition, noZones: noZones});
                            }
                        } else {
                            do {
                                //check scalar overrides
                                var scalarOverride = null;
                                if(randomThing.groupingOptions) {
                                    let min = randomThing.groupingOptions.min;
                                    let max = randomThing.groupingOptions.max;
                                    if(min) {
                                        scalarOverride = mathArrayUtils.getRandomIntInclusive(min, max);
                                    }
                                }
                                myPosition = findGroupingPosition(centerPosition, scalarOverride, tries != 0);
                                tries++;
                            } while(checkCollision({myThing: randomThing, position: myPosition, noZones: noZones}) && tries < maxTries);
                        }

                        //if we can't place an auxilary thing, just continue
                        if(tries >= maxTries) {
                            console.info('skipping due to too many tries')
                            y += tileHeight;
                            continue;
                        }

                        //if we can't place the center, skip
                        if (wholeSkip) {
                            y += tileHeight;
                            break;
                        } else {
                            //record our hits
                            hit = true;
                        }

                        let newDO = null;

                        //handle doodads
                        if (randomThing.isDoodad) {
                            newDO = randomThing.clone();
                            newDO.setPosition(mathArrayUtils.clonePosition(myPosition));
                            if (randomThing.unique) {
                                mathArrayUtils.removeObjectFromArray(randomThing, arrayOfThings);
                            }
                            noZones.push(newDO.getNoZone());
                        } else {
                            let resolvedThing = null;

                            //set some explicitly passed in variables, or use the global values
                            let localTint = randomThing.tint || globalTint || 0xFFFFFF;
                            let localScale = randomThing.scale || globalScale || {x: 1, y: 1};
                            if(randomThing.randomScale) {
                                let sc = mathArrayUtils.getRandomNumberBetween(randomThing.randomScale.min, randomThing.randomScale.max);
                                localScale = {x: sc, y: sc};
                            }

                            if (randomThing.randomHFlip && mathArrayUtils.flipCoin()) {
                                localScale.x *= -1;
                            }
                            let localSortYOffset = randomThing.sortYOffset || globalSortYOffset || 0;
                            let localAlpha = randomThing.alpha || globalAlpha || 1;
                            let localWhere = randomThing.where || where;
                            let localRotate = (randomThing.rotate || globalRotate) == 'random' ? Math.random() * (2 * Math.PI) : 0;

                            //check if we are a grouping of textures with their own tints etc
                            if (randomThing.possibleTextures) {
                                resolvedThing = mathArrayUtils.getRandomElementOfArray(randomThing.possibleTextures);
                                if (globalUnique || resolvedThing.unique) {
                                    mathArrayUtils.removeObjectFromArray(resolvedThing, randomThing.possibleTextures);
                                }
                            } else { //else we have "something else" TM
                                resolvedThing = randomThing;
                                if (globalUnique || resolvedThing.unique) {
                                    mathArrayUtils.removeObjectFromArray(resolvedThing, arrayOfThings);
                                }
                            }

                            //if our thing is an animation object
                            if (resolvedThing.animationName) {
                                newDO = gameUtils.getAnimation({
                                    spritesheetName: resolvedThing.spritesheetName,
                                    animationName: resolvedThing.animationName,
                                    speed: resolvedThing.speed || 1.0,
                                    loop: true,
                                    transform: [myPosition.x, myPosition.y, localScale.x, localScale.y]
                                });
                                newDO.where = localWhere;
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
                            } else { //else we have a straight texture name (or simple object)
                                var tName = resolvedThing;
                                if(resolvedThing.textureName) {
                                    tName = resolvedThing.textureName;
                                }
                                newDO = graphicsUtils.createDisplayObject(tName, {
                                    position: mathArrayUtils.clonePosition(myPosition),
                                    where: localWhere,
                                    scale: {
                                        x: localScale.x,
                                        y: localScale.y
                                    }
                                });
                            }

                            newDO.tint = localTint;
                            newDO.rotation = localRotate;
                            newDO.sortYOffset = localSortYOffset;
                            newDO.alpha = localAlpha;
                        }

                        if(rotateTowardCenter) {
                            var rotateAngle = mathArrayUtils.pointInDirection(newDO.position, centerPosition);
                            if(newDO.isDoodad) {
                                newDO.body.renderChildren.forEach((child) => {
                                    child.rotate = rotateAngle;
                                    if(child.id == 'shadow' &&
                                    ((newDO.position.x > centerPosition.x && newDO.position.y < centerPosition.y) ||
                                     (newDO.position.x < centerPosition.x && newDO.position.y > centerPosition.y))) {
                                        child.offset.x = 0-child.offset.x;
                                    }
                                });
                            }
                        }

                        container.addObject(newDO);
                    }

                    if (hit) {
                        hits++;
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
