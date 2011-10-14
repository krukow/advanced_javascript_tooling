goog.provide('chatpp.events');
goog.provide('chatpp.events.AppEvent');
goog.provide('chatpp.events.AppEventType');

goog.require('goog.events');
goog.require('goog.events.EventTarget');

/**
 *  All logical application events.
 *  @enum {string}
 */
chatpp.events.AppEventType = {
    LOGIN: goog.events.getUniqueId('login'),
    LOGOUT: goog.events.getUniqueId('logout'),
    ENTER_USER: goog.events.getUniqueId('enter_user'),
    EXIT_USER: goog.events.getUniqueId('exit_user'),
    USERLIST_INITIALIZED: goog.events.getUniqueId('userlist_initialized'),
    MESSAGE: goog.events.getUniqueId('message'),
    SELECT_USER: goog.events.getUniqueId('select_user'),
    USER_SELECTED: goog.events.getUniqueId('user_selected'),
    ROSTER_SYNCH: goog.events.getUniqueId('roster_synch'),
    LOAD_STORAGE: goog.events.getUniqueId('load_storage')
};

/**
 * @param {chatpp.events.AppEventType} event_type type of event.
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {*=} opt_data optional data parameter.
 * @constructor
 * @extends {goog.events.Event}
 */
chatpp.events.AppEvent = function(event_type, opt_target, opt_data) {
    goog.base(this, event_type, opt_target);

    /**
     * @private
     */
    this.data_ = opt_data || null;

};
goog.inherits(chatpp.events.AppEvent, goog.events.Event);


/**
 * @return {*} Event data.
 */
chatpp.events.AppEvent.prototype.getEventData = function() {
    return this.data_;
};
