define(['jquery'], function($) {

    //Defines a Command queue
    var CommandQueue = function() {
        var queue = {};
        queue.queue = [];
        queue.enqueue = function(command) {
            this.queue.push(command);
            if(this.queue.length == 1) {
                this.executeCommand(command);
            }
        },
        queue.next = function(command) {
            //ignore rogue next requests
            if(this.queue[0].id != command.id)
                return;

            this.queue.shift();
            if(this.queue.length > 0) {
                this.executeCommand(this.queue[0]);
            }
        },

        //Execute the command, and pass the command object as a parameter
        queue.executeCommand = function(command) {
            // console.info("executing command from queue: ")
            // console.info(command);
            command.method.call(command.context, command.target, command);
        },
        queue.clear = function() {
            this.queue = [];
        }

        return queue;
    }

    return CommandQueue;
})
