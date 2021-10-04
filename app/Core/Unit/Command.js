import * as $ from 'jquery';
import {gameUtils, graphicsUtils, mathArrayUtils} from '@utils/UtilityMenu.js';

/*
 * options = {
 *   queue: a CommandQueue
 *   method: function
 *   context: function context
 *   target: event target (usually a mouse click point or the like)
 * }
 */
var commandFactory = function(options) {
    var newCommand = {};
    newCommand.id = mathArrayUtils.uuidv4();
    $.extend(newCommand, options);
    newCommand.predicates = options.predicates || []; //needs to be an array
    newCommand.preExecuteInterceptors = options.preExecuteInterceptors || []; //needs to be an array
    newCommand.postExecuteInterceptors = options.postExecuteInterceptors || []; //needs to be an array
    newCommand.done = function() {
        this.queue.next(this);
    };

    return newCommand;
};

export default commandFactory;
