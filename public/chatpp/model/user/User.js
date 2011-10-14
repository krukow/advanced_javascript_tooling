goog.provide('chatpp.model.user.User');

goog.require('goog.events');
goog.require('goog.events.EventTarget');

/**
 * @param {string} name of user.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
chatpp.model.user.User = function(name) {
    goog.base(this);
    this.name_ = name;
};
goog.inherits(chatpp.model.user.User, goog.events.EventTarget);

/**
 * @return {string} username of this user.
 */
chatpp.model.user.User.prototype.getUsername = function() {
    return this.name_;
};

if (goog.DEBUG) {
    /**
     * @inheritDoc
     */
    chatpp.model.user.User.prototype.toString = function() {
        return 'model.user.User{name:' + this.getUsername() + '}';
    };
}
