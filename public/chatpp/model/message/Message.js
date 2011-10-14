goog.provide('chatpp.model.message.Message');

goog.require('chatpp.model.user.User');
goog.require('goog.events');
goog.require('goog.events.EventTarget');


/**
 * @param {!chatpp.model.user.User} speaker the user saying the message.
 * @param {!chatpp.model.user.User} channel user representing channel which
 *  is destination of message.
 * @param {string} message the actual message.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.model.message.Message = function(speaker, channel, message) {
    goog.base(this);
    this.speaker_ = speaker;
    this.channel_ = channel;
    this.message_ = message;
};
goog.inherits(chatpp.model.message.Message, goog.events.EventTarget);

/**
 * @return {!chatpp.model.user.User} the user saying the message.
 */
chatpp.model.message.Message.prototype.getSpeaker = function() {
    return this.speaker_;
};

/**
 * @return {!chatpp.model.user.User} the user saying the message.
 */
chatpp.model.message.Message.prototype.getChannel = function() {
    return this.channel_;
};

/**
 * @return {string} the user saying the message.
 */
chatpp.model.message.Message.prototype.getMessage = function() {
    return this.message_;
};

/**
 * Give an object representation of this message for storage.
 * @return {!Object} data rep.
 */
chatpp.model.message.Message.prototype.toObject = function() {
    return {channel: this.getChannel().getUsername(),
            speaker: this.getSpeaker().getUsername(),
            message: this.getMessage()};
};

if (goog.DEBUG) {
    /**
     * @inheritDoc
     */
    chatpp.model.message.Message.prototype.toString = function() {
        return 'model.message.Message{channel:' + this.getChannel() +
             ', speaker:' + this.getSpeaker() +
             ', message: ' + this.getMessage() + '}';
    };
}
