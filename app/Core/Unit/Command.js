define(['jquery', 'utils/GameUtils'], function($, utils) {

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
        newCommand.id = utils.uuidv4();
        newCommand.queue = options.queue;
        newCommand.method = options.method;
        newCommand.context = options.context;
        newCommand.target = options.target;
        newCommand.type = options.type;
        newCommand.state = options.state;
        newCommand.predicates = options.predicates || []; //needs to be an array
        newCommand.preExecuteInterceptors = options.preExecuteInterceptors || []; //needs to be an array
        newCommand.postExecuteInterceptors = options.postExecuteInterceptors || []; //needs to be an array
        newCommand.done = function() {
            options.queue.next(this);
        }

        return newCommand;
    }

    return commandFactory;
})
