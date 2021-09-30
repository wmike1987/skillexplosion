import * as Matter from 'matter-js';
import * as $ from 'jquery';
import * as PIXI from 'pixi.js';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/GameUtils.js';
import {globals, mousePosition} from '@core/Fundamental/GlobalState.js';
import levelBase from '@games/Us/MapAndLevel/Levels/LevelBase.js';
import SceneryUtils from '@games/Us/MapAndLevel/SceneryUtils.js';
import Tooltip from '@core/Tooltip.js';
import TileMapper from '@core/TileMapper.js';
import ItemUtils from '@core/Unit/ItemUtils.js';
import {Doodad} from '@utils/Doodad.js';
import {Dialogue, DialogueChain} from '@core/Dialogue.js';
import {levelFactory} from '@games/Us/MapAndLevel/Levels/LevelFactory.js';
import tokenMappings from '@games/Us/MapAndLevel/Map/TokenMappings.js';
import MapLevelNode from '@games/Us/MapAndLevel/Map/MapNode.js';

var multiLevel = function(options) {
    var multiRef = this;
    var backgroundNodeTint = 0x3c002f;
    this.chain = [];

    //default
    this.enemyDefList = ['basic', 'basic', 'basic'];

    this.initExtension = function(type, worldSpecs, options) {
        this.enemyDefList.forEach((type) => {
            let newOptions = Object.assign({}, options);
            let newLevel = levelFactory.create(type, worldSpecs, newOptions);
            this.chain.push(newLevel);
        });

        //modify the each level to comprehend that it's part of a chain
        this.chain.forEach((level, index) => {

            //if we not the last node, have the win behavior start the next level
            if(index < this.chain.length-1) {
                var nextLevel = this.chain[index + 1];
                level.customWinBehavior = function() {
                    this.spawner.cleanUp();
                    nextLevel.scene = this.scene;
                    globals.currentGame.setCurrentLevel(nextLevel, {immediatePool: true});
                    nextLevel.startLevelSpawn({keepCurrentCollector: true});
                };
            } else {

            }
        });
    };

    this.getOutingCompatibleNode = function() {
        return this.mapNodes[this.mapNodes.length-1];
    };

    //process the chain on the first node
    this.tokenSize = 40;
    this.largeTokenSize = 50;
    this.mapNodes = [];

    var highlightAllNodes = function() {
        multiRef.mapNodes.forEach(node => {
            node.tintNode(backgroundNodeTint);
        });
        return true;
    };

    var unhighlightAllNodes = function() {
        multiRef.mapNodes.forEach(node => {
            node.untintNode();
        });
        return true;
    };

    var mouseDown = function() {
        this.sizeNode();
        multiRef.mapNodes.forEach(node => {
            node.tintNode(backgroundNodeTint);
        });
        multiRef.mapNodes[0].untintNode();
        multiRef.mapNodes[0].flashNode();
        multiRef.mapNodes[0].sizeNode(multiRef.mapNodes[0].enlargedTokenSize);
        return {flash: false, sound: true, customPosition: multiRef.centerPosition, nodeToEnter: multiRef.mapNodes[0]};
    };

    this.createMapNode = function(options) {
        this.chain.forEach((level) => {
            let mln = new MapLevelNode({levelDetails: level, mapRef: options.mapRef,
                hoverCallback: highlightAllNodes,
                unhoverCallback: unhighlightAllNodes,
                mouseDownCallback: mouseDown});
            this.mapNodes.push(mln);
            level.mapNode = mln;
        });

        this.mapNodes[0].getOutingCompatibleNode = this.getOutingCompatibleNode.bind(this);

        //disallow these from being prereqs
        multiRef.mapNodes.forEach(node => {
            node.canBePrereq = function() {
                return false;
            };
        });

        //alter the last node's completion behavior (if we are the last level, have the node completion trigger the other nodes' completion)
        var lastNodeIndex = this.chain.length-1;
        var lastNode = this.mapNodes[lastNodeIndex];
        lastNode._nodeCompleteExtension = function() {
            this.mapNodes.forEach((node, jndex) => {
                if(jndex != lastNodeIndex) {
                    node.complete();
                }
            });
        }.bind(this);

        lastNode._playCompleteAnimationExtension = function() {
            this.mapNodes.forEach((node, jndex) => {
                if(jndex != lastNodeIndex) {
                    node.playCompleteAnimation();
                }
            });
        }.bind(this);

        return null;
    };

    var spacing = 20;
    this.manualNodePosition = function(position) {

        var i = -spacing;
        this.mapNodes.forEach((node, index) => {
            node.setPosition(mathArrayUtils.clonePosition(position, {x: i}));
            node.travelPosition = position;
            i += spacing;

            //sort them appropriately
            node.setNodeZ(-index);
        });
    };

    this.manualAddToGraph = function(graph) {
        this.mapNodes.forEach((node) => {
            graph.push(node);
        });
    };

    this.manualRemoveFromGraph = function(graph) {
        this.mapNodes.forEach((node) => {
            mathArrayUtils.removeObjectFromArray(node, graph);
        });
    };
};
multiLevel.prototype = levelBase;

export {multiLevel};
