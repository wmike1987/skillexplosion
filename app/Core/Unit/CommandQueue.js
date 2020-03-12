define(['jquery', 'utils/GameUtils'], function($, utils) {

    var failedPredicate = utils.getSound('cantpickup.wav', {volume: .02, rate: 1.3});

    //Defines a Command queue
    var CommandQueue = function() {
        var queue = {};
        queue.queue = [];
        queue.enqueue = function(command) {
            this.queue.push(command);
            if(this.queue.length == 1) {
                var commandObj = {
                    command: this.queue[0],
                    queueContext: {}
                };
                this.executeCommand(commandObj);
            }
        },

        queue.next = function(command) {
            //ignore rogue next requests
            if(this.queue.length == 0 || (this.queue[0].id != command.id))
                return;

            var lastCommand = this.queue.shift();
            var queueContext = {last: lastCommand};
            if(this.queue.length > 0) {
                var commandObj = {
                    command: this.queue[0],
                    queueContext: queueContext
                }
                this.executeCommand(commandObj);
            }
        },

        //Execute the command, and pass the command object as a parameter
        queue.executeCommand = function(commandObj) {
            //run predicates
            var goForthAndExecute = true;
            $.each(commandObj.command.predicates, function(i, predicate) {
                goForthAndExecute = predicate(commandObj);
                return goForthAndExecute;
            })

            if(goForthAndExecute) {
                $.each(commandObj.command.preExecuteInterceptors, function(i, pre) {
                    pre();
                })

                if(commandObj.command.type == 'click') {
                    commandObj.command.method.call(commandObj.command.context, commandObj.command.target, commandObj);
                } else if(commandObj.command.type == 'key') {
                    commandObj.command.method.call(commandObj.command.context, commandObj);
                }

                $.each(commandObj.command.postExecuteInterceptors, function(i, post) {
                    post();
                })
            } else {
                failedPredicate.play();
                commandObj.command.done();
            }

        },
        queue.clear = function() {
            this.queue = [];
        }

        queue.getCurrentCommand = function() {
            return this.queue[0] || {id: 'empty'};
        }

        return queue;
    }

    return CommandQueue;
})
